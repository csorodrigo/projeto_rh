/**
 * Workflow Utilities - Funções auxiliares para workflows
 */

import type {
  WorkflowType,
  WorkflowStatus,
  WorkflowInstance,
  WorkflowApproval,
} from '@/types/database';

/**
 * Retorna o label amigável de um tipo de workflow
 */
export function getWorkflowTypeLabel(type: WorkflowType): string {
  const labels: Record<WorkflowType, string> = {
    absence: 'Ausência',
    overtime: 'Hora Extra',
    time_adjustment: 'Ajuste de Ponto',
    document_approval: 'Aprovação de Documento',
    data_change: 'Alteração de Dados',
  };

  return labels[type] || type;
}

/**
 * Retorna a cor do badge de status
 */
export function getWorkflowStatusColor(status: WorkflowStatus): string {
  const colors: Record<WorkflowStatus, string> = {
    pending: 'blue',
    approved: 'green',
    rejected: 'red',
    cancelled: 'gray',
  };

  return colors[status] || 'gray';
}

/**
 * Calcula o progresso do workflow em porcentagem
 */
export function calculateWorkflowProgress(instance: WorkflowInstance): number {
  if (instance.status === 'approved') {
    return 100;
  }

  if (instance.status === 'rejected' || instance.status === 'cancelled') {
    return 0;
  }

  // Progresso baseado no step atual
  return Math.round((instance.current_step / instance.total_steps) * 100);
}

/**
 * Calcula tempo médio de aprovação de um aprovador
 */
export function calculateAverageApprovalTime(approvals: WorkflowApproval[]): number {
  const decidedApprovals = approvals.filter(
    (a) => a.decided_at && a.created_at
  );

  if (decidedApprovals.length === 0) {
    return 0;
  }

  const totalTime = decidedApprovals.reduce((acc, approval) => {
    const created = new Date(approval.created_at).getTime();
    const decided = new Date(approval.decided_at!).getTime();
    return acc + (decided - created);
  }, 0);

  // Retorna em horas
  return totalTime / decidedApprovals.length / (1000 * 60 * 60);
}

/**
 * Verifica se um workflow está atrasado
 */
export function isWorkflowOverdue(instance: WorkflowInstance): boolean {
  if (!instance.sla_due_at || instance.status !== 'pending') {
    return false;
  }

  return new Date(instance.sla_due_at) < new Date();
}

/**
 * Calcula horas restantes até o SLA
 */
export function getHoursUntilSLA(slaDueAt: string): number {
  const due = new Date(slaDueAt);
  const now = new Date();
  const diff = due.getTime() - now.getTime();

  return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Formata tempo de aprovação
 */
export function formatApprovalTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  if (hours < 24) {
    return `${Math.round(hours)} hora${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  return `${days} dia${days !== 1 ? 's' : ''}`;
}

/**
 * Agrupa workflows por status
 */
export function groupWorkflowsByStatus(
  instances: WorkflowInstance[]
): Record<WorkflowStatus, WorkflowInstance[]> {
  return instances.reduce(
    (acc, instance) => {
      if (!acc[instance.status]) {
        acc[instance.status] = [];
      }
      acc[instance.status].push(instance);
      return acc;
    },
    {} as Record<WorkflowStatus, WorkflowInstance[]>
  );
}

/**
 * Filtra workflows por tipo
 */
export function filterWorkflowsByType(
  instances: WorkflowInstance[],
  type: WorkflowType | 'all'
): WorkflowInstance[] {
  if (type === 'all') {
    return instances;
  }

  return instances.filter((i) => i.workflow_type === type);
}

/**
 * Ordena workflows por SLA (mais urgentes primeiro)
 */
export function sortWorkflowsBySLA(
  instances: WorkflowInstance[]
): WorkflowInstance[] {
  return [...instances].sort((a, b) => {
    if (!a.sla_due_at) return 1;
    if (!b.sla_due_at) return -1;

    return new Date(a.sla_due_at).getTime() - new Date(b.sla_due_at).getTime();
  });
}

/**
 * Retorna emoji para tipo de workflow
 */
export function getWorkflowTypeEmoji(type: WorkflowType): string {
  const emojis: Record<WorkflowType, string> = {
    absence: '🏖️',
    overtime: '⏰',
    time_adjustment: '🕐',
    document_approval: '📄',
    data_change: '✏️',
  };

  return emojis[type] || '📋';
}

/**
 * Retorna ícone para status de workflow
 */
export function getWorkflowStatusIcon(status: WorkflowStatus): string {
  const icons: Record<WorkflowStatus, string> = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    cancelled: '🚫',
  };

  return icons[status] || '❓';
}

/**
 * Calcula taxa de aprovação de um aprovador
 */
export function calculateApprovalRate(approvals: WorkflowApproval[]): {
  approved: number;
  rejected: number;
  total: number;
  rate: number;
} {
  const decided = approvals.filter((a) => a.decision !== null);

  const approved = decided.filter((a) => a.decision === 'approved').length;
  const rejected = decided.filter((a) => a.decision === 'rejected').length;
  const total = decided.length;

  return {
    approved,
    rejected,
    total,
    rate: total > 0 ? (approved / total) * 100 : 0,
  };
}

/**
 * Verifica se um usuário pode aprovar um workflow
 */
export function canUserApprove(
  userId: string,
  instance: WorkflowInstance,
  approvals: WorkflowApproval[]
): boolean {
  // Verificar se há aprovação pendente para este usuário no step atual
  return approvals.some(
    (a) =>
      a.step_level === instance.current_step &&
      a.approver_id === userId &&
      a.decision === null
  );
}

/**
 * Retorna próximos aprovadores de um workflow
 */
export function getNextApprovers(
  instance: WorkflowInstance,
  approvals: WorkflowApproval[]
): string[] {
  if (instance.status !== 'pending') {
    return [];
  }

  return approvals
    .filter(
      (a) => a.step_level === instance.current_step && a.decision === null
    )
    .map((a) => a.approver_id);
}

/**
 * Gera mensagem de notificação para aprovação
 */
export function generateApprovalNotificationMessage(
  type: WorkflowType,
  requesterName: string,
  metadata: Record<string, unknown>
): string {
  const templates: Record<WorkflowType, (name: string, meta: Record<string, unknown>) => string> = {
    absence: (name, meta) =>
      `${name} solicitou ${meta.days || 0} dias de ausência`,
    overtime: (name, meta) =>
      `${name} solicitou ${meta.hours || 0}h de hora extra`,
    time_adjustment: (name, meta) =>
      `${name} solicitou ajuste de ponto`,
    document_approval: (name, meta) =>
      `${name} enviou um documento para aprovação`,
    data_change: (name, meta) =>
      `${name} solicitou alteração de dados cadastrais`,
  };

  const generator = templates[type];
  return generator ? generator(requesterName, metadata) : `${requesterName} criou uma solicitação`;
}
