/**
 * Onboarding Utilities
 * Funções para gerenciamento de onboarding de novos funcionários
 */

// =====================================================
// TYPES
// =====================================================

export type TaskCategory = 'documents' | 'systems' | 'equipment' | 'training' | 'administrative' | 'team';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface OnboardingTask {
  id: string;
  task: string;
  category: TaskCategory;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  assigned_to: string; // 'hr', 'it', 'manager', or user_id
  due_date?: string;
  due_days?: number; // Dias relativos ao first_day (negativo = antes, positivo = depois)
  notes?: string;
  priority: TaskPriority;
}

// =====================================================
// DEFAULT CHECKLIST
// =====================================================

/**
 * Retorna checklist padrão de onboarding
 */
export function getDefaultChecklistItems(): Omit<OnboardingTask, 'completed' | 'completed_by' | 'completed_at'>[] {
  return [
    {
      id: 'doc-rg-cpf',
      task: 'Coletar RG e CPF',
      category: 'documents',
      assigned_to: 'hr',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'doc-ctps',
      task: 'Coletar CTPS',
      category: 'documents',
      assigned_to: 'hr',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'doc-comprovante',
      task: 'Coletar comprovante de residência',
      category: 'documents',
      assigned_to: 'hr',
      priority: 'medium',
      due_days: 3
    },
    {
      id: 'doc-conta-bancaria',
      task: 'Coletar dados bancários',
      category: 'documents',
      assigned_to: 'hr',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'doc-foto',
      task: 'Coletar foto 3x4',
      category: 'documents',
      assigned_to: 'hr',
      priority: 'medium',
      due_days: 0
    },
    {
      id: 'sys-email',
      task: 'Criar conta de e-mail corporativo',
      category: 'systems',
      assigned_to: 'it',
      priority: 'high',
      due_days: -2
    },
    {
      id: 'sys-erp',
      task: 'Criar acesso ao sistema ERP',
      category: 'systems',
      assigned_to: 'it',
      priority: 'medium',
      due_days: 0
    },
    {
      id: 'sys-ponto',
      task: 'Criar acesso ao sistema de ponto',
      category: 'systems',
      assigned_to: 'it',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'equip-notebook',
      task: 'Solicitar notebook',
      category: 'equipment',
      assigned_to: 'it',
      priority: 'high',
      due_days: -5
    },
    {
      id: 'equip-monitor',
      task: 'Solicitar monitor',
      category: 'equipment',
      assigned_to: 'it',
      priority: 'medium',
      due_days: -5
    },
    {
      id: 'equip-celular',
      task: 'Solicitar celular corporativo (se aplicável)',
      category: 'equipment',
      assigned_to: 'it',
      priority: 'low',
      due_days: 0
    },
    {
      id: 'train-integracao',
      task: 'Agendar treinamento de integração',
      category: 'training',
      assigned_to: 'hr',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'train-sistema',
      task: 'Agendar treinamento nos sistemas',
      category: 'training',
      assigned_to: 'manager',
      priority: 'medium',
      due_days: 1
    },
    {
      id: 'train-processos',
      task: 'Treinamento de processos da área',
      category: 'training',
      assigned_to: 'manager',
      priority: 'medium',
      due_days: 3
    },
    {
      id: 'admin-cracha',
      task: 'Providenciar crachá',
      category: 'administrative',
      assigned_to: 'hr',
      priority: 'medium',
      due_days: 0
    },
    {
      id: 'admin-welcome',
      task: 'Enviar e-mail de boas-vindas',
      category: 'administrative',
      assigned_to: 'hr',
      priority: 'high',
      due_days: -1
    },
    {
      id: 'admin-workspace',
      task: 'Preparar estação de trabalho',
      category: 'administrative',
      assigned_to: 'it',
      priority: 'high',
      due_days: -1
    },
    {
      id: 'team-apresentacao',
      task: 'Apresentar à equipe',
      category: 'team',
      assigned_to: 'manager',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'team-buddy',
      task: 'Designar padrinho/madrinha',
      category: 'team',
      assigned_to: 'manager',
      priority: 'high',
      due_days: 0
    },
    {
      id: 'team-tour',
      task: 'Tour pelas instalações',
      category: 'team',
      assigned_to: 'hr',
      priority: 'medium',
      due_days: 0
    }
  ];
}

// =====================================================
// CHECKLIST OPERATIONS
// =====================================================

/**
 * Cria checklist completo com status inicial
 */
export function createOnboardingChecklist(
  firstDay: Date,
  template?: Omit<OnboardingTask, 'completed' | 'completed_by' | 'completed_at'>[]
): OnboardingTask[] {
  const items = template || getDefaultChecklistItems();

  return items.map(item => {
    // Calcular due_date baseado em due_days
    let dueDate: string | undefined;
    if (item.due_days !== undefined) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + item.due_days);
      dueDate = date.toISOString().split('T')[0];
    }

    return {
      ...item,
      due_date: dueDate,
      completed: false,
      completed_by: null,
      completed_at: null
    };
  });
}

/**
 * Atualiza item do checklist
 */
export function updateChecklistItem(
  checklist: OnboardingTask[],
  itemId: string,
  completed: boolean,
  userId: string
): OnboardingTask[] {
  return checklist.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        completed,
        completed_by: completed ? userId : null,
        completed_at: completed ? new Date().toISOString() : null
      };
    }
    return item;
  });
}

/**
 * Calcula progresso do onboarding
 */
export function getOnboardingProgress(checklist: OnboardingTask[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = checklist.length;
  const completed = checklist.filter(item => item.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

/**
 * Agrupa tarefas por categoria
 */
export function groupTasksByCategory(
  checklist: OnboardingTask[]
): Record<TaskCategory, OnboardingTask[]> {
  const grouped: Record<TaskCategory, OnboardingTask[]> = {
    documents: [],
    systems: [],
    equipment: [],
    training: [],
    administrative: [],
    team: []
  };

  checklist.forEach(task => {
    grouped[task.category].push(task);
  });

  return grouped;
}

/**
 * Agrupa tarefas por responsável
 */
export function groupTasksByAssignee(
  checklist: OnboardingTask[]
): Record<string, OnboardingTask[]> {
  const grouped: Record<string, OnboardingTask[]> = {};

  checklist.forEach(task => {
    if (!grouped[task.assigned_to]) {
      grouped[task.assigned_to] = [];
    }
    grouped[task.assigned_to].push(task);
  });

  return grouped;
}

/**
 * Retorna tarefas pendentes
 */
export function getPendingTasks(checklist: OnboardingTask[]): OnboardingTask[] {
  return checklist.filter(task => !task.completed);
}

/**
 * Retorna tarefas vencidas
 */
export function getOverdueTasks(checklist: OnboardingTask[]): OnboardingTask[] {
  const today = new Date().toISOString().split('T')[0];

  return checklist.filter(task => {
    if (task.completed || !task.due_date) return false;
    return task.due_date < today;
  });
}

/**
 * Retorna tarefas urgentes (vencendo em até 3 dias)
 */
export function getUrgentTasks(checklist: OnboardingTask[]): OnboardingTask[] {
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = threeDaysFromNow.toISOString().split('T')[0];

  return checklist.filter(task => {
    if (task.completed || !task.due_date) return false;
    return task.due_date >= todayStr && task.due_date <= futureStr;
  });
}

// =====================================================
// TASK PRIORITY
// =====================================================

/**
 * Ordena tarefas por prioridade e data
 */
export function sortTasksByPriority(tasks: OnboardingTask[]): OnboardingTask[] {
  const priorityOrder: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2
  };

  return [...tasks].sort((a, b) => {
    // Primeiro por prioridade
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Depois por data de vencimento
    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }

    // Tarefas com data vêm primeiro
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return 0;
  });
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Retorna estatísticas do onboarding
 */
export function getOnboardingStatistics(checklist: OnboardingTask[]): {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byCategory: Record<TaskCategory, { total: number; completed: number }>;
  byPriority: Record<TaskPriority, { total: number; completed: number }>;
} {
  const total = checklist.length;
  const completed = checklist.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = getOverdueTasks(checklist).length;

  // Por categoria
  const byCategory: Record<TaskCategory, { total: number; completed: number }> = {
    documents: { total: 0, completed: 0 },
    systems: { total: 0, completed: 0 },
    equipment: { total: 0, completed: 0 },
    training: { total: 0, completed: 0 },
    administrative: { total: 0, completed: 0 },
    team: { total: 0, completed: 0 }
  };

  // Por prioridade
  const byPriority: Record<TaskPriority, { total: number; completed: number }> = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 }
  };

  checklist.forEach(task => {
    byCategory[task.category].total++;
    byPriority[task.priority].total++;

    if (task.completed) {
      byCategory[task.category].completed++;
      byPriority[task.priority].completed++;
    }
  });

  return {
    total,
    completed,
    pending,
    overdue,
    byCategory,
    byPriority
  };
}

// =====================================================
// LABELS AND COLORS
// =====================================================

/**
 * Retorna cor da categoria
 */
export function getCategoryColor(category: TaskCategory): string {
  const colors: Record<TaskCategory, string> = {
    documents: '#3b82f6', // blue
    systems: '#8b5cf6', // purple
    equipment: '#f59e0b', // amber
    training: '#10b981', // emerald
    administrative: '#6366f1', // indigo
    team: '#ec4899' // pink
  };

  return colors[category];
}

/**
 * Retorna ícone da categoria
 */
export function getCategoryIcon(category: TaskCategory): string {
  const icons: Record<TaskCategory, string> = {
    documents: 'FileText',
    systems: 'Monitor',
    equipment: 'Package',
    training: 'GraduationCap',
    administrative: 'Briefcase',
    team: 'Users'
  };

  return icons[category];
}

/**
 * Retorna label amigável da categoria
 */
export function getCategoryLabel(category: TaskCategory): string {
  const labels: Record<TaskCategory, string> = {
    documents: 'Documentos',
    systems: 'Sistemas',
    equipment: 'Equipamentos',
    training: 'Treinamentos',
    administrative: 'Administrativo',
    team: 'Equipe'
  };

  return labels[category];
}

/**
 * Retorna cor da prioridade
 */
export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    high: '#ef4444', // red
    medium: '#f59e0b', // amber
    low: '#22c55e' // green
  };

  return colors[priority];
}

/**
 * Retorna label da prioridade
 */
export function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  return labels[priority];
}

// =====================================================
// ASSIGNEE HELPERS
// =====================================================

/**
 * Retorna label do responsável
 */
export function getAssigneeLabel(assignee: string): string {
  const labels: Record<string, string> = {
    hr: 'RH',
    it: 'TI',
    manager: 'Gestor'
  };

  return labels[assignee] || assignee;
}

/**
 * Verifica se é responsável padrão (não é user_id)
 */
export function isDefaultAssignee(assignee: string): boolean {
  return ['hr', 'it', 'manager'].includes(assignee);
}
