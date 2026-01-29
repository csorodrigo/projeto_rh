/**
 * Workflow Engine - Motor de workflows de aprovação
 * Gerencia criação, progressão e conclusão de workflows
 */

import { createClient } from '@/lib/supabase/client';
import type {
  WorkflowInstance,
  WorkflowApproval,
  WorkflowType,
  WorkflowDefinition,
  Profile,
  WorkflowInstanceWithDetails,
} from '@/types/database';

export interface CreateWorkflowOptions {
  entityType: string;
  entityId: string;
  requesterId: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalDecisionOptions {
  comments?: string;
  skipNotifications?: boolean;
}

export interface OverdueInstance {
  id: string;
  workflow_type: WorkflowType;
  entity_type: string;
  entity_id: string;
  requester_id: string;
  current_step: number;
  sla_due_at: string;
  hours_overdue: number;
  current_approvers: Profile[];
}

export class WorkflowEngine {
  private supabase;
  private companyId: string;

  constructor(companyId: string) {
    this.supabase = createClient();
    this.companyId = companyId;
  }

  /**
   * Cria uma nova instância de workflow
   */
  async createWorkflowInstance(
    workflowType: WorkflowType,
    options: CreateWorkflowOptions
  ): Promise<WorkflowInstance> {
    const { entityType, entityId, requesterId, metadata = {} } = options;

    // 1. Buscar definição do workflow
    const { data: definition, error: defError } = await this.supabase
      .from('workflow_definitions')
      .select('*')
      .eq('type', workflowType)
      .eq('active', true)
      .single();

    if (defError || !definition) {
      throw new Error(`Workflow definition not found: ${workflowType}`);
    }

    const workflowDef = definition as WorkflowDefinition;

    // 2. Verificar auto-aprovação
    if (await this.shouldAutoApprove(workflowDef, metadata)) {
      return this.createAutoApprovedInstance(
        workflowType,
        entityType,
        entityId,
        requesterId,
        metadata
      );
    }

    // 3. Calcular SLA do primeiro step
    const slaDueAt = this.calculateSLA(workflowDef.steps[0].sla);

    // 4. Criar instância
    const { data: instance, error: instanceError } = await this.supabase
      .from('workflow_instances')
      .insert({
        company_id: this.companyId,
        workflow_type: workflowType,
        entity_type: entityType,
        entity_id: entityId,
        requester_id: requesterId,
        current_step: 1,
        total_steps: workflowDef.steps.length,
        status: 'pending',
        sla_due_at: slaDueAt,
        metadata,
      })
      .select()
      .single();

    if (instanceError || !instance) {
      throw new Error(`Failed to create workflow instance: ${instanceError?.message}`);
    }

    // 5. Criar aprovações do primeiro step
    await this.createStepApprovals(instance.id, 1, workflowDef, requesterId);

    // 6. Registrar no histórico
    await this.addHistory(instance.id, 'created', requesterId, null, 'pending');

    return instance as WorkflowInstance;
  }

  /**
   * Busca os próximos aprovadores do workflow
   */
  async getNextApprovers(instanceId: string): Promise<Profile[]> {
    // 1. Buscar instância
    const { data: instance } = await this.supabase
      .from('workflow_instances')
      .select('*, workflow_approvals(*)')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    // 2. Buscar aprovações pendentes do step atual
    const { data: approvals } = await this.supabase
      .from('workflow_approvals')
      .select('approver_id, profiles(*)')
      .eq('instance_id', instanceId)
      .eq('step_level', instance.current_step)
      .is('decision', null);

    if (!approvals || approvals.length === 0) {
      return [];
    }

    return approvals
      .map((a) => a.profiles)
      .filter((p): p is Profile => p !== null);
  }

  /**
   * Aprova um step do workflow
   */
  async approveStep(
    instanceId: string,
    approverId: string,
    options: ApprovalDecisionOptions = {}
  ): Promise<WorkflowInstance> {
    const { comments } = options;

    // 1. Buscar instância e definição
    const instance = await this.getInstanceWithDefinition(instanceId);

    // 2. Atualizar aprovação
    const { error: approvalError } = await this.supabase
      .from('workflow_approvals')
      .update({
        decision: 'approved',
        comments,
        decided_at: new Date().toISOString(),
      })
      .eq('instance_id', instanceId)
      .eq('approver_id', approverId)
      .eq('step_level', instance.current_step)
      .is('decision', null);

    if (approvalError) {
      throw new Error(`Failed to approve: ${approvalError.message}`);
    }

    // 3. Registrar no histórico
    await this.addHistory(
      instanceId,
      'step_approved',
      approverId,
      'pending',
      'pending',
      instance.current_step,
      comments
    );

    // 4. Verificar se o step está completo
    const isStepComplete = await this.isStepComplete(
      instanceId,
      instance.current_step,
      instance.definition
    );

    if (!isStepComplete) {
      // Ainda há aprovadores pendentes neste step
      return instance;
    }

    // 5. Step completo - avançar ou finalizar
    if (instance.current_step >= instance.total_steps) {
      // Workflow completo
      return this.completeWorkflow(instanceId, approverId);
    } else {
      // Avançar para próximo step
      return this.advanceToNextStep(instanceId, instance.definition);
    }
  }

  /**
   * Rejeita um step do workflow
   */
  async rejectStep(
    instanceId: string,
    approverId: string,
    reason: string
  ): Promise<WorkflowInstance> {
    // 1. Atualizar aprovação
    const { error: approvalError } = await this.supabase
      .from('workflow_approvals')
      .update({
        decision: 'rejected',
        comments: reason,
        decided_at: new Date().toISOString(),
      })
      .eq('instance_id', instanceId)
      .eq('approver_id', approverId)
      .is('decision', null);

    if (approvalError) {
      throw new Error(`Failed to reject: ${approvalError.message}`);
    }

    // 2. Atualizar instância
    const { data: instance, error: instanceError } = await this.supabase
      .from('workflow_instances')
      .update({
        status: 'rejected',
        completed_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (instanceError || !instance) {
      throw new Error(`Failed to update instance: ${instanceError?.message}`);
    }

    // 3. Registrar no histórico
    await this.addHistory(
      instanceId,
      'rejected',
      approverId,
      'pending',
      'rejected',
      undefined,
      reason
    );

    return instance as WorkflowInstance;
  }

  /**
   * Delega aprovações de um usuário para outro
   */
  async delegateApproval(
    fromUserId: string,
    toUserId: string,
    startDate: Date,
    endDate: Date,
    reason?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('workflow_delegations').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      active: true,
      reason,
    });

    if (error) {
      throw new Error(`Failed to create delegation: ${error.message}`);
    }
  }

  /**
   * Verifica instâncias com SLA vencido
   */
  async checkSLA(): Promise<OverdueInstance[]> {
    const now = new Date().toISOString();

    const { data: instances } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('status', 'pending')
      .lt('sla_due_at', now);

    if (!instances || instances.length === 0) {
      return [];
    }

    const overdueInstances: OverdueInstance[] = [];

    for (const instance of instances) {
      const slaDue = new Date(instance.sla_due_at!);
      const nowDate = new Date();
      const hoursOverdue = Math.floor(
        (nowDate.getTime() - slaDue.getTime()) / (1000 * 60 * 60)
      );

      const approvers = await this.getNextApprovers(instance.id);

      overdueInstances.push({
        id: instance.id,
        workflow_type: instance.workflow_type as WorkflowType,
        entity_type: instance.entity_type,
        entity_id: instance.entity_id,
        requester_id: instance.requester_id,
        current_step: instance.current_step,
        sla_due_at: instance.sla_due_at!,
        hours_overdue: hoursOverdue,
        current_approvers: approvers,
      });
    }

    return overdueInstances;
  }

  /**
   * Escalona um workflow atrasado
   */
  async escalate(instanceId: string): Promise<void> {
    // TODO: Implementar lógica de escalonamento
    // Por exemplo, notificar gerente superior ou HR manager
    await this.addHistory(instanceId, 'escalated', null, null, null);
  }

  /**
   * Cancela um workflow
   */
  async cancelWorkflow(
    instanceId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<WorkflowInstance> {
    const { data: instance, error } = await this.supabase
      .from('workflow_instances')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error || !instance) {
      throw new Error(`Failed to cancel workflow: ${error?.message}`);
    }

    await this.addHistory(
      instanceId,
      'cancelled',
      cancelledBy,
      'pending',
      'cancelled',
      undefined,
      reason
    );

    return instance as WorkflowInstance;
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async shouldAutoApprove(
    definition: WorkflowDefinition,
    metadata: Record<string, unknown>
  ): Promise<boolean> {
    const { autoApprove } = definition.rules;

    if (!autoApprove) {
      return false;
    }

    const value = metadata[autoApprove.field] as number;
    if (value === undefined) {
      return false;
    }

    return this.evaluateCondition(value, autoApprove.operator, autoApprove.value);
  }

  private async createAutoApprovedInstance(
    workflowType: WorkflowType,
    entityType: string,
    entityId: string,
    requesterId: string,
    metadata: Record<string, unknown>
  ): Promise<WorkflowInstance> {
    const { data: instance, error } = await this.supabase
      .from('workflow_instances')
      .insert({
        company_id: this.companyId,
        workflow_type: workflowType,
        entity_type: entityType,
        entity_id: entityId,
        requester_id: requesterId,
        current_step: 1,
        total_steps: 1,
        status: 'approved',
        completed_at: new Date().toISOString(),
        metadata,
      })
      .select()
      .single();

    if (error || !instance) {
      throw new Error(`Failed to create auto-approved instance: ${error?.message}`);
    }

    await this.addHistory(instance.id, 'auto_approved', requesterId, null, 'approved');

    return instance as WorkflowInstance;
  }

  private async createStepApprovals(
    instanceId: string,
    stepLevel: number,
    definition: WorkflowDefinition,
    requesterId: string
  ): Promise<void> {
    const step = definition.steps[stepLevel - 1];
    if (!step) {
      throw new Error(`Step ${stepLevel} not found in workflow definition`);
    }

    // Buscar aprovadores baseado no role do step
    const approvers = await this.getApproversForRole(step.role, requesterId);

    if (approvers.length === 0) {
      throw new Error(`No approvers found for role: ${step.role}`);
    }

    const slaDueAt = this.calculateSLA(step.sla);

    const approvals = approvers.map((approver) => ({
      instance_id: instanceId,
      step_level: stepLevel,
      approver_id: approver.id,
      sla_due_at: slaDueAt,
    }));

    const { error } = await this.supabase
      .from('workflow_approvals')
      .insert(approvals);

    if (error) {
      throw new Error(`Failed to create approvals: ${error.message}`);
    }
  }

  private async getApproversForRole(
    role: string,
    requesterId: string
  ): Promise<Profile[]> {
    if (role === 'manager') {
      // Buscar o manager do solicitante
      const { data: requester } = await this.supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', requesterId)
        .single();

      if (!requester?.employee_id) {
        return [];
      }

      const { data: employee } = await this.supabase
        .from('employees')
        .select('manager_id, profiles!employees_manager_id_fkey(*)')
        .eq('id', requester.employee_id)
        .single();

      if (!employee || !employee.manager_id) {
        return [];
      }

      return employee.profiles ? [employee.profiles as unknown as Profile] : [];
    } else {
      // Buscar por role
      const { data: approvers } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('role', role);

      return (approvers || []) as Profile[];
    }
  }

  private async isStepComplete(
    instanceId: string,
    stepLevel: number,
    definition: WorkflowDefinition
  ): Promise<boolean> {
    const { data: approvals } = await this.supabase
      .from('workflow_approvals')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('step_level', stepLevel);

    if (!approvals || approvals.length === 0) {
      return false;
    }

    const { requireAll } = definition.rules;

    if (requireAll) {
      // Todos devem aprovar
      return approvals.every((a) => a.decision === 'approved');
    } else {
      // Apenas um precisa aprovar
      return approvals.some((a) => a.decision === 'approved');
    }
  }

  private async advanceToNextStep(
    instanceId: string,
    definition: WorkflowDefinition
  ): Promise<WorkflowInstance> {
    const { data: instance } = await this.supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Instance not found');
    }

    const nextStep = instance.current_step + 1;
    const slaDueAt = this.calculateSLA(definition.steps[nextStep - 1].sla);

    // Atualizar instância
    const { data: updated, error } = await this.supabase
      .from('workflow_instances')
      .update({
        current_step: nextStep,
        sla_due_at: slaDueAt,
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to advance step: ${error?.message}`);
    }

    // Criar aprovações do próximo step
    await this.createStepApprovals(
      instanceId,
      nextStep,
      definition,
      instance.requester_id
    );

    await this.addHistory(instanceId, 'step_advanced', null, null, null, nextStep);

    return updated as WorkflowInstance;
  }

  private async completeWorkflow(
    instanceId: string,
    completedBy: string
  ): Promise<WorkflowInstance> {
    const { data: instance, error } = await this.supabase
      .from('workflow_instances')
      .update({
        status: 'approved',
        completed_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error || !instance) {
      throw new Error(`Failed to complete workflow: ${error?.message}`);
    }

    await this.addHistory(
      instanceId,
      'completed',
      completedBy,
      'pending',
      'approved'
    );

    return instance as WorkflowInstance;
  }

  private async getInstanceWithDefinition(
    instanceId: string
  ): Promise<WorkflowInstanceWithDetails> {
    const { data: instance } = await this.supabase
      .from('workflow_instances')
      .select('*, workflow_definitions(*), profiles(*), workflow_approvals(*)')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    return instance as unknown as WorkflowInstanceWithDetails;
  }

  private async addHistory(
    instanceId: string,
    action: string,
    performedBy: string | null,
    oldStatus: string | null,
    newStatus: string | null,
    stepLevel?: number,
    comments?: string
  ): Promise<void> {
    await this.supabase.from('workflow_history').insert({
      instance_id: instanceId,
      action,
      performed_by: performedBy,
      old_status: oldStatus,
      new_status: newStatus,
      step_level: stepLevel,
      comments,
    });
  }

  private calculateSLA(hours: number): string {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  }

  private evaluateCondition(
    value: number,
    operator: '<' | '>' | '<=' | '>=' | '=' | '!=',
    compareValue: number
  ): boolean {
    switch (operator) {
      case '<':
        return value < compareValue;
      case '>':
        return value > compareValue;
      case '<=':
        return value <= compareValue;
      case '>=':
        return value >= compareValue;
      case '=':
        return value === compareValue;
      case '!=':
        return value !== compareValue;
      default:
        return false;
    }
  }
}
