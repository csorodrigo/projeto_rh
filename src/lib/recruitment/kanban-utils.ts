/**
 * Kanban Utilities
 * Funções helper para o board Kanban de recrutamento
 */

import { differenceInDays } from 'date-fns';
import type { KanbanCandidate, PipelineStage } from '@/types/recruitment';
import type { JobApplication, ApplicationWithDetails } from '@/types/recruitment';

// =====================================================
// STAGE HELPERS
// =====================================================

/**
 * Retorna a cor do estágio
 */
export function getStageColor(stageId: string, stages: PipelineStage[]): string {
  const stage = stages.find((s) => s.id === stageId);
  return stage?.color || '#64748b';
}

/**
 * Retorna o nome do estágio
 */
export function getStageName(stageId: string, stages: PipelineStage[]): string {
  const stage = stages.find((s) => s.id === stageId);
  return stage?.name || stageId;
}

/**
 * Ordena estágios por ordem
 */
export function sortStages(stages: PipelineStage[]): PipelineStage[] {
  return [...stages].sort((a, b) => a.order - b.order);
}

// =====================================================
// APPLICATION HELPERS
// =====================================================

/**
 * Filtra candidatos por estágio
 */
export function getApplicationsByStage(
  applications: JobApplication[],
  stageId: string
): JobApplication[] {
  return applications.filter((app) => app.current_stage === stageId);
}

/**
 * Agrupa candidatos por estágio
 */
export function groupApplicationsByStage(
  applications: JobApplication[]
): Record<string, JobApplication[]> {
  const grouped: Record<string, JobApplication[]> = {};

  applications.forEach((app) => {
    if (!grouped[app.current_stage]) {
      grouped[app.current_stage] = [];
    }
    grouped[app.current_stage].push(app);
  });

  return grouped;
}

/**
 * Calcula o tempo no estágio atual (em dias)
 */
export function calculateTimeInStage(application: JobApplication): number {
  const stageChangedAt = new Date(application.stage_changed_at);
  const now = new Date();
  return differenceInDays(now, stageChangedAt);
}

/**
 * Calcula o tempo total no processo (em dias)
 */
export function calculateTotalTime(application: JobApplication): number {
  const appliedAt = new Date(application.applied_at);
  const now = new Date();
  return differenceInDays(now, appliedAt);
}

// =====================================================
// KANBAN CARD HELPERS
// =====================================================

/**
 * Converte ApplicationWithDetails para KanbanCandidate
 */
export function applicationToKanbanCard(
  application: ApplicationWithDetails
): KanbanCandidate {
  return {
    id: application.id,
    application_id: application.id,
    candidate_id: application.candidate_id,
    name: application.candidate_name,
    email: application.candidate_email,
    phone: application.candidate_phone,
    avatar_url: null, // TODO: adicionar campo de avatar no candidato
    current_position: null, // TODO: adicionar ao ApplicationWithDetails
    location: application.candidate_location,
    skills: application.candidate_skills,
    current_stage: application.current_stage,
    rating: application.rating || application.candidate_global_rating,
    tags: application.candidate_tags,
    resume_url: application.candidate_resume_url,
    applied_at: application.applied_at,
    time_in_stage: calculateTimeInStage(application),
    last_activity_at: application.last_activity_at,
  };
}

// =====================================================
// DRAG & DROP HANDLERS
// =====================================================

/**
 * Handler de drag end para @dnd-kit
 */
export interface DragEndEvent {
  active: {
    id: string;
    data?: {
      current?: {
        stageId?: string;
      };
    };
  };
  over: {
    id: string;
  } | null;
}

export function handleDragEnd(
  event: DragEndEvent,
  applications: JobApplication[],
  onMove: (applicationId: string, fromStage: string, toStage: string) => void
): void {
  const { active, over } = event;

  if (!over) return;

  const applicationId = active.id as string;
  const fromStage = active.data?.current?.stageId;
  const toStage = over.id as string;

  // Não fazer nada se soltar no mesmo estágio
  if (fromStage === toStage) return;

  // Encontrar a candidatura
  const application = applications.find((app) => app.id === applicationId);
  if (!application) return;

  // Executar callback de movimentação
  if (fromStage && toStage) {
    onMove(applicationId, fromStage, toStage);
  }
}

// =====================================================
// FILTROS
// =====================================================

export interface KanbanFilters {
  search?: string;
  tags?: string[];
  rating?: number;
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filtra candidatos com base nos filtros
 */
export function filterApplications(
  applications: JobApplication[],
  filters: KanbanFilters
): JobApplication[] {
  let filtered = [...applications];

  // Filtro de busca (apenas para ApplicationWithDetails)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((app) => {
      if ('candidate_name' in app) {
        const appWithDetails = app as ApplicationWithDetails;
        return (
          appWithDetails.candidate_name.toLowerCase().includes(searchLower) ||
          appWithDetails.candidate_email.toLowerCase().includes(searchLower)
        );
      }
      return false;
    });
  }

  // Filtro de tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((app) => {
      if ('candidate_tags' in app) {
        const appWithDetails = app as ApplicationWithDetails;
        return filters.tags!.some((tag) => appWithDetails.candidate_tags.includes(tag));
      }
      return false;
    });
  }

  // Filtro de rating exato
  if (filters.rating) {
    filtered = filtered.filter((app) => app.rating === filters.rating);
  }

  // Filtro de rating mínimo
  if (filters.minRating) {
    filtered = filtered.filter((app) => app.rating && app.rating >= filters.minRating!);
  }

  // Filtro de data inicial
  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);
    filtered = filtered.filter((app) => new Date(app.applied_at) >= dateFrom);
  }

  // Filtro de data final
  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    filtered = filtered.filter((app) => new Date(app.applied_at) <= dateTo);
  }

  return filtered;
}

// =====================================================
// ESTATÍSTICAS
// =====================================================

export interface KanbanStats {
  total: number;
  byStage: Record<string, number>;
  averageTimeInStage: Record<string, number>;
  conversionRate: Record<string, number>;
}

/**
 * Calcula estatísticas do Kanban
 */
export function calculateKanbanStats(
  applications: JobApplication[],
  stages: PipelineStage[]
): KanbanStats {
  const stats: KanbanStats = {
    total: applications.length,
    byStage: {},
    averageTimeInStage: {},
    conversionRate: {},
  };

  // Contagem por estágio
  stages.forEach((stage) => {
    const appsInStage = getApplicationsByStage(applications, stage.id);
    stats.byStage[stage.id] = appsInStage.length;

    // Tempo médio no estágio
    if (appsInStage.length > 0) {
      const totalTime = appsInStage.reduce(
        (acc, app) => acc + calculateTimeInStage(app),
        0
      );
      stats.averageTimeInStage[stage.id] = Math.round(totalTime / appsInStage.length);
    } else {
      stats.averageTimeInStage[stage.id] = 0;
    }

    // Taxa de conversão (% que passou para próximo estágio)
    // TODO: Implementar lógica de conversão baseado no histórico
    stats.conversionRate[stage.id] = 0;
  });

  return stats;
}

// =====================================================
// FORMATAÇÃO
// =====================================================

/**
 * Formata tempo em dias para string amigável
 */
export function formatTimeInStage(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  if (days < 7) return `${days} dias`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 semana';
  if (weeks < 4) return `${weeks} semanas`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 mês';
  return `${months} meses`;
}

/**
 * Retorna cor de alerta baseado no tempo no estágio
 */
export function getTimeAlertColor(days: number): string {
  if (days <= 7) return 'text-gray-600';
  if (days <= 14) return 'text-yellow-600';
  if (days <= 30) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Gera iniciais do nome
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
