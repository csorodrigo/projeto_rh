/**
 * Workflow Queries - Queries do Supabase para workflows
 */

import { createClient } from '@/lib/supabase/client';
import type {
  WorkflowInstance,
  WorkflowApproval,
  WorkflowDelegation,
  WorkflowInstanceWithDetails,
  PendingApproval,
  WorkflowType,
} from '@/types/database';

/**
 * Busca aprovações pendentes do usuário
 */
export async function getPendingApprovals(
  userId: string
): Promise<PendingApproval[]> {
  const supabase = createClient();

  // Buscar aprovações onde:
  // 1. O usuário é o aprovador e a decisão está pendente
  // 2. OU existe delegação ativa para o usuário
  const { data, error } = await supabase
    .from('workflow_approvals')
    .select(
      `
      *,
      instance:workflow_instances!inner(
        *,
        requester:profiles!workflow_instances_requester_id_fkey(
          id,
          name,
          email,
          avatar_url,
          employee_id,
          employee:employees(department)
        )
      )
    `
    )
    .is('decision', null)
    .or(`approver_id.eq.${userId},delegated_from.in.(select from_user_id from workflow_delegations where to_user_id=${userId} and active=true and current_date between start_date and end_date)`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }

  return data as unknown as PendingApproval[];
}

/**
 * Busca histórico de aprovações (aprovadas/rejeitadas)
 */
export async function getApprovalHistory(
  userId: string,
  status: 'approved' | 'rejected'
): Promise<PendingApproval[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_approvals')
    .select(
      `
      *,
      instance:workflow_instances!inner(
        *,
        requester:profiles!workflow_instances_requester_id_fkey(
          id,
          name,
          email,
          avatar_url,
          employee_id,
          employee:employees(department)
        )
      )
    `
    )
    .eq('approver_id', userId)
    .eq('decision', status)
    .order('decided_at', { ascending: false });

  if (error) {
    console.error('Error fetching approval history:', error);
    throw error;
  }

  return data as unknown as PendingApproval[];
}

/**
 * Busca aprovações com SLA vencido
 */
export async function getOverdueApprovals(userId: string): Promise<PendingApproval[]> {
  const supabase = createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('workflow_approvals')
    .select(
      `
      *,
      instance:workflow_instances!inner(
        *,
        requester:profiles!workflow_instances_requester_id_fkey(
          id,
          name,
          email,
          avatar_url,
          employee_id,
          employee:employees(department)
        )
      )
    `
    )
    .eq('approver_id', userId)
    .is('decision', null)
    .lt('sla_due_at', now)
    .order('sla_due_at', { ascending: true });

  if (error) {
    console.error('Error fetching overdue approvals:', error);
    throw error;
  }

  return data as unknown as PendingApproval[];
}

/**
 * Busca detalhes completos de uma instância de workflow
 */
export async function getWorkflowInstance(
  instanceId: string
): Promise<WorkflowInstanceWithDetails> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_instances')
    .select(
      `
      *,
      definition:workflow_definitions!inner(*),
      requester:profiles!workflow_instances_requester_id_fkey(
        id,
        name,
        email,
        avatar_url,
        employee_id,
        employee:employees(department, photo_url)
      ),
      approvals:workflow_approvals(
        *,
        approver:profiles!workflow_approvals_approver_id_fkey(
          id,
          name,
          email,
          avatar_url,
          role
        )
      )
    `
    )
    .eq('id', instanceId)
    .single();

  if (error) {
    console.error('Error fetching workflow instance:', error);
    throw error;
  }

  return data as unknown as WorkflowInstanceWithDetails;
}

/**
 * Busca instâncias de workflow por entidade
 */
export async function getWorkflowsByEntity(
  entityType: string,
  entityId: string
): Promise<WorkflowInstance[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workflows by entity:', error);
    throw error;
  }

  return data as WorkflowInstance[];
}

/**
 * Busca a última instância de workflow de uma entidade
 */
export async function getLatestWorkflowForEntity(
  entityType: string,
  entityId: string
): Promise<WorkflowInstance | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest workflow:', error);
    return null;
  }

  return data as WorkflowInstance;
}

/**
 * Busca delegações do usuário
 */
export async function getMyDelegations(userId: string): Promise<WorkflowDelegation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_delegations')
    .select('*')
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching delegations:', error);
    throw error;
  }

  return data as WorkflowDelegation[];
}

/**
 * Busca delegação ativa do usuário para uma data
 */
export async function getActiveDelegation(
  userId: string,
  date: Date = new Date()
): Promise<WorkflowDelegation | null> {
  const supabase = createClient();

  const dateStr = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('workflow_delegations')
    .select('*')
    .eq('from_user_id', userId)
    .eq('active', true)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching active delegation:', error);
    throw error;
  }

  return data as WorkflowDelegation;
}

/**
 * Desativa uma delegação
 */
export async function deactivateDelegation(delegationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('workflow_delegations')
    .update({ active: false })
    .eq('id', delegationId);

  if (error) {
    console.error('Error deactivating delegation:', error);
    throw error;
  }
}

/**
 * Busca instâncias com SLA vencido (para verificação automática)
 */
export async function getOverdueInstances(companyId: string): Promise<WorkflowInstance[]> {
  const supabase = createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .lt('sla_due_at', now)
    .order('sla_due_at', { ascending: true });

  if (error) {
    console.error('Error fetching overdue instances:', error);
    throw error;
  }

  return data as WorkflowInstance[];
}

/**
 * Busca estatísticas de aprovação do usuário
 */
export async function getApprovalStats(userId: string) {
  const supabase = createClient();

  const [pending, approved, rejected, overdue] = await Promise.all([
    // Pendentes
    supabase
      .from('workflow_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('approver_id', userId)
      .is('decision', null),

    // Aprovadas
    supabase
      .from('workflow_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('approver_id', userId)
      .eq('decision', 'approved'),

    // Rejeitadas
    supabase
      .from('workflow_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('approver_id', userId)
      .eq('decision', 'rejected'),

    // Atrasadas
    supabase
      .from('workflow_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('approver_id', userId)
      .is('decision', null)
      .lt('sla_due_at', new Date().toISOString()),
  ]);

  return {
    pending: pending.count || 0,
    approved: approved.count || 0,
    rejected: rejected.count || 0,
    overdue: overdue.count || 0,
  };
}

/**
 * Busca aprovações por tipo de workflow
 */
export async function getApprovalsByType(
  userId: string,
  workflowType: WorkflowType
): Promise<PendingApproval[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_approvals')
    .select(
      `
      *,
      instance:workflow_instances!inner(
        *,
        requester:profiles!workflow_instances_requester_id_fkey(
          id,
          name,
          email,
          avatar_url,
          employee_id,
          employee:employees(department)
        )
      )
    `
    )
    .eq('approver_id', userId)
    .is('decision', null)
    .eq('instance.workflow_type', workflowType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approvals by type:', error);
    throw error;
  }

  return data as unknown as PendingApproval[];
}

/**
 * Busca aprovações em massa (para bulk actions)
 */
export async function getApprovalsByIds(
  approvalIds: string[]
): Promise<WorkflowApproval[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_approvals')
    .select('*')
    .in('id', approvalIds);

  if (error) {
    console.error('Error fetching approvals by ids:', error);
    throw error;
  }

  return data as WorkflowApproval[];
}

/**
 * Busca histórico de um workflow
 */
export async function getWorkflowHistory(instanceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workflow_history')
    .select(
      `
      *,
      performer:profiles(id, name, email, avatar_url)
    `
    )
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching workflow history:', error);
    throw error;
  }

  return data;
}

/**
 * Busca dados da entidade associada ao workflow
 */
export async function getWorkflowEntityData(
  entityType: string,
  entityId: string
): Promise<Record<string, unknown> | null> {
  const supabase = createClient();

  let table = '';
  switch (entityType) {
    case 'absence':
      table = 'absences';
      break;
    case 'time_adjustment':
      table = 'time_tracking_daily';
      break;
    case 'document':
      table = 'employee_documents';
      break;
    default:
      return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', entityId)
    .single();

  if (error) {
    console.error('Error fetching entity data:', error);
    return null;
  }

  return data as Record<string, unknown>;
}
