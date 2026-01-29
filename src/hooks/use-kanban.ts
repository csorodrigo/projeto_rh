/**
 * useKanban Hook
 * Hook customizado para gerenciar o Kanban de recrutamento
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
  Job,
  JobApplication,
  ApplicationWithDetails,
  PipelineStage,
  KanbanFilters,
} from '@/types/recruitment';
import {
  groupApplicationsByStage,
  filterApplications,
  calculateKanbanStats,
  sortStages,
} from '@/lib/recruitment/kanban-utils';

export interface UseKanbanOptions {
  jobId?: string;
  initialFilters?: KanbanFilters;
  enableRealtime?: boolean;
}

export interface UseKanbanReturn {
  // Dados
  job: Job | null;
  stages: PipelineStage[];
  applications: ApplicationWithDetails[];
  applicationsByStage: Record<string, ApplicationWithDetails[]>;

  // Filtros
  filters: KanbanFilters;
  setFilters: (filters: KanbanFilters) => void;
  filteredApplications: ApplicationWithDetails[];

  // Estatísticas
  stats: ReturnType<typeof calculateKanbanStats>;

  // Ações
  moveApplication: (applicationId: string, fromStage: string, toStage: string) => Promise<void>;
  updateRating: (applicationId: string, rating: number) => Promise<void>;
  rejectApplication: (applicationId: string, reason: string, stage: string) => Promise<void>;
  hireApplication: (applicationId: string) => Promise<void>;

  // Estados
  isLoading: boolean;
  isMoving: boolean;
  error: Error | null;

  // Refresh
  refetch: () => void;
}

export function useKanban(options: UseKanbanOptions = {}): UseKanbanReturn {
  const { jobId, initialFilters = {}, enableRealtime = true } = options;

  const supabase = createClient();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<KanbanFilters>(initialFilters);
  const [isMoving, setIsMoving] = useState(false);

  // =====================================================
  // QUERIES
  // =====================================================

  // Buscar vaga
  const {
    data: job = null,
    isLoading: isLoadingJob,
    error: jobError,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!jobId,
  });

  // Buscar todas as candidaturas (ou de uma vaga específica)
  const {
    data: applications = [],
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch,
  } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: async () => {
      let query = supabase.from('application_details').select('*');

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      // Apenas candidaturas ativas
      query = query.eq('status', 'active');

      // Ordenar por última atividade
      query = query.order('last_activity_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as ApplicationWithDetails[];
    },
  });

  // =====================================================
  // DERIVED STATE
  // =====================================================

  // Estágios do pipeline
  const stages = useMemo(() => {
    if (job?.pipeline_stages) {
      return sortStages(job.pipeline_stages as PipelineStage[]);
    }
    // Estágios padrão se não houver vaga
    return sortStages([
      { id: 'triagem', name: 'Triagem', order: 1, color: '#64748b' },
      { id: 'entrevista_rh', name: 'Entrevista RH', order: 2, color: '#3b82f6' },
      { id: 'teste_tecnico', name: 'Teste Técnico', order: 3, color: '#8b5cf6' },
      { id: 'entrevista_gestor', name: 'Entrevista Gestor', order: 4, color: '#f59e0b' },
      { id: 'proposta', name: 'Proposta', order: 5, color: '#10b981' },
      { id: 'contratado', name: 'Contratado', order: 6, color: '#22c55e' },
    ]);
  }, [job]);

  // Aplicar filtros
  const filteredApplications = useMemo(() => {
    return filterApplications(applications, filters);
  }, [applications, filters]);

  // Agrupar por estágio
  const applicationsByStage = useMemo(() => {
    return groupApplicationsByStage(filteredApplications);
  }, [filteredApplications]);

  // Estatísticas
  const stats = useMemo(() => {
    return calculateKanbanStats(filteredApplications, stages);
  }, [filteredApplications, stages]);

  // =====================================================
  // MUTATIONS
  // =====================================================

  // Mover candidatura para outro estágio
  const moveApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      toStage,
    }: {
      applicationId: string;
      fromStage: string;
      toStage: string;
    }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({
          current_stage: toStage,
          stage_changed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onMutate: async ({ applicationId, toStage }) => {
      setIsMoving(true);

      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['applications', jobId] });

      // Snapshot do estado anterior
      const previousApplications = queryClient.getQueryData<ApplicationWithDetails[]>([
        'applications',
        jobId,
      ]);

      // Atualização otimista
      queryClient.setQueryData<ApplicationWithDetails[]>(
        ['applications', jobId],
        (old = []) => {
          return old.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  current_stage: toStage,
                  stage_changed_at: new Date().toISOString(),
                  last_activity_at: new Date().toISOString(),
                }
              : app
          );
        }
      );

      return { previousApplications };
    },
    onError: (error, _variables, context) => {
      // Reverter em caso de erro
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications', jobId], context.previousApplications);
      }
      toast.error('Erro ao mover candidato', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
    onSuccess: () => {
      toast.success('Candidato movido com sucesso');
    },
    onSettled: () => {
      setIsMoving(false);
      // Refetch para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
    },
  });

  // Atualizar rating
  const updateRatingMutation = useMutation({
    mutationFn: async ({
      applicationId,
      rating,
    }: {
      applicationId: string;
      rating: number;
    }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ rating })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Avaliação atualizada');
      queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar avaliação', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // Rejeitar candidatura
  const rejectApplicationMutation = useMutation({
    mutationFn: async ({
      applicationId,
      reason,
      stage,
    }: {
      applicationId: string;
      reason: string;
      stage: string;
    }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejection_stage: stage,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Candidato rejeitado');
      queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
    },
    onError: (error) => {
      toast.error('Erro ao rejeitar candidato', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // Contratar candidato
  const hireApplicationMutation = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'hired',
          hired_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Candidato contratado!');
      queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
    },
    onError: (error) => {
      toast.error('Erro ao contratar candidato', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  // =====================================================
  // CALLBACKS
  // =====================================================

  const moveApplication = useCallback(
    async (applicationId: string, fromStage: string, toStage: string) => {
      await moveApplicationMutation.mutateAsync({ applicationId, fromStage, toStage });
    },
    [moveApplicationMutation]
  );

  const updateRating = useCallback(
    async (applicationId: string, rating: number) => {
      await updateRatingMutation.mutateAsync({ applicationId, rating });
    },
    [updateRatingMutation]
  );

  const rejectApplication = useCallback(
    async (applicationId: string, reason: string, stage: string) => {
      await rejectApplicationMutation.mutateAsync({ applicationId, reason, stage });
    },
    [rejectApplicationMutation]
  );

  const hireApplication = useCallback(
    async (applicationId: string) => {
      await hireApplicationMutation.mutateAsync({ applicationId });
    },
    [hireApplicationMutation]
  );

  // =====================================================
  // REALTIME (opcional)
  // =====================================================

  // TODO: Implementar subscriptions do Supabase para atualizações em tempo real

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Dados
    job,
    stages,
    applications: filteredApplications,
    applicationsByStage,

    // Filtros
    filters,
    setFilters,
    filteredApplications,

    // Estatísticas
    stats,

    // Ações
    moveApplication,
    updateRating,
    rejectApplication,
    hireApplication,

    // Estados
    isLoading: isLoadingJob || isLoadingApplications,
    isMoving,
    error: (jobError || applicationsError) as Error | null,

    // Refresh
    refetch,
  };
}
