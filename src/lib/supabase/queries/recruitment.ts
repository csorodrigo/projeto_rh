/**
 * Queries para gerenciar o modulo de Recrutamento
 * Fase 7 - Sistema de Recrutamento e Selecao
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Job,
  JobWithStats,
  JobFilters,
  JobFormData,
  JobListResult,
  JobStats,
  Candidate,
  CandidateWithApplications,
  CandidateFilters,
  CandidateFormData,
  CandidateListResult,
  CandidateSearchResult,
  Application,
  ApplicationWithDetails,
  ApplicationFilters,
  ApplicationFormData,
  ApplicationUpdateData,
  ApplicationListResult,
  PipelineStage,
  PipelineStageFormData,
  ApplicationActivity,
  ActivityTimeline,
  AddCommentData,
  RateApplicationData,
  ScheduleInterviewData,
  KanbanData,
} from '@/types/recruitment';

// =====================================================
// Jobs (Vagas)
// =====================================================

/**
 * Lista vagas com filtros e paginacao
 */
export async function getJobs(
  companyId: string,
  filters: JobFilters = {}
): Promise<JobListResult> {
  const supabase = createClient();

  const {
    search = '',
    department,
    status,
    employment_type,
    location_type,
    hiring_manager_id,
    publish_externally,
    page = 1,
    pageSize = 10,
  } = filters;

  try {
    // Base query com estatisticas
    let query = supabase
      .from('v_jobs_with_stats')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Filtro de busca
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Filtros especificos
    if (department) {
      query = query.eq('department', department);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (employment_type) {
      query = query.eq('employment_type', employment_type);
    }

    if (location_type) {
      query = query.eq('location_type', location_type);
    }

    if (hiring_manager_id) {
      query = query.eq('hiring_manager_id', hiring_manager_id);
    }

    if (publish_externally !== undefined) {
      query = query.eq('publish_externally', publish_externally);
    }

    // Ordenacao
    query = query.order('created_at', { ascending: false });

    // Paginacao
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const result = await query;

    if (result.error) {
      console.error('Erro ao listar vagas:', result.error);
      return { jobs: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = result.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      jobs: (result.data as JobWithStats[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar vagas:', error);
    return { jobs: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Busca vaga por ID
 */
export async function getJobById(id: string): Promise<Job | null> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) {
      console.error('Erro ao buscar vaga:', result.error);
      return null;
    }

    return result.data as Job;
  } catch (error) {
    console.error('Erro ao buscar vaga:', error);
    return null;
  }
}

/**
 * Cria nova vaga
 */
export async function createJob(
  companyId: string,
  data: JobFormData
): Promise<{ job: Job | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        ...data,
      })
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao criar vaga:', result.error);
      return { job: null, error: result.error.message };
    }

    return { job: result.data as Job, error: null };
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    return {
      job: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza vaga existente
 */
export async function updateJob(
  id: string,
  data: Partial<JobFormData>
): Promise<{ job: Job | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('jobs')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao atualizar vaga:', result.error);
      return { job: null, error: result.error.message };
    }

    return { job: result.data as Job, error: null };
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    return {
      job: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta vaga
 */
export async function deleteJob(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase.from('jobs').delete().eq('id', id);

    if (result.error) {
      console.error('Erro ao deletar vaga:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao deletar vaga:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Publica vaga (muda status para 'open')
 */
export async function publishJob(
  id: string
): Promise<{ job: Job | null; error: string | null }> {
  return updateJob(id, { status: 'open' });
}

/**
 * Fecha vaga (muda status para 'closed')
 */
export async function closeJob(
  id: string
): Promise<{ job: Job | null; error: string | null }> {
  return updateJob(id, { status: 'closed' });
}

/**
 * Lista vagas publicas (para portal de carreiras)
 */
export async function getPublicJobs(
  companyId?: string
): Promise<JobWithStats[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('v_jobs_with_stats')
      .select('*')
      .eq('status', 'open')
      .eq('publish_externally', true)
      .order('published_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const result = await query;

    if (result.error) {
      console.error('Erro ao listar vagas publicas:', result.error);
      return [];
    }

    return (result.data as JobWithStats[]) || [];
  } catch (error) {
    console.error('Erro ao listar vagas publicas:', error);
    return [];
  }
}

/**
 * Obtem estatisticas de uma vaga
 */
export async function getJobStats(jobId: string): Promise<JobStats | null> {
  const supabase = createClient();

  try {
    const result = await supabase.rpc('get_job_stats', { p_job_id: jobId });

    if (result.error) {
      console.error('Erro ao buscar estatisticas da vaga:', result.error);
      return null;
    }

    return result.data as JobStats;
  } catch (error) {
    console.error('Erro ao buscar estatisticas da vaga:', error);
    return null;
  }
}

// =====================================================
// Candidates (Candidatos)
// =====================================================

/**
 * Lista candidatos com filtros e paginacao
 */
export async function getCandidates(
  companyId: string,
  filters: CandidateFilters = {}
): Promise<CandidateListResult> {
  const supabase = createClient();

  const {
    search = '',
    source,
    tags,
    location,
    available_from,
    page = 1,
    pageSize = 10,
  } = filters;

  try {
    let query = supabase
      .from('candidates')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Filtro de busca
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Filtros especificos
    if (source) {
      query = query.eq('source', source);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (available_from) {
      query = query.gte('available_from', available_from);
    }

    // Ordenacao
    query = query.order('created_at', { ascending: false });

    // Paginacao
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const result = await query;

    if (result.error) {
      console.error('Erro ao listar candidatos:', result.error);
      return { candidates: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = result.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      candidates: (result.data as Candidate[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar candidatos:', error);
    return { candidates: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Busca candidato por ID
 */
export async function getCandidateById(id: string): Promise<Candidate | null> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) {
      console.error('Erro ao buscar candidato:', result.error);
      return null;
    }

    return result.data as Candidate;
  } catch (error) {
    console.error('Erro ao buscar candidato:', error);
    return null;
  }
}

/**
 * Cria novo candidato
 */
export async function createCandidate(
  companyId: string,
  data: CandidateFormData
): Promise<{ candidate: Candidate | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('candidates')
      .insert({
        company_id: companyId,
        ...data,
      })
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao criar candidato:', result.error);
      return { candidate: null, error: result.error.message };
    }

    return { candidate: result.data as Candidate, error: null };
  } catch (error) {
    console.error('Erro ao criar candidato:', error);
    return {
      candidate: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza candidato existente
 */
export async function updateCandidate(
  id: string,
  data: Partial<CandidateFormData>
): Promise<{ candidate: Candidate | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('candidates')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao atualizar candidato:', result.error);
      return { candidate: null, error: result.error.message };
    }

    return { candidate: result.data as Candidate, error: null };
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error);
    return {
      candidate: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Mescla candidatos duplicados
 */
export async function mergeCandidates(
  keepId: string,
  mergeId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase.rpc('merge_candidates', {
      p_keep_id: keepId,
      p_merge_id: mergeId,
    });

    if (result.error) {
      console.error('Erro ao mesclar candidatos:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao mesclar candidatos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca candidatos por keywords (full-text search)
 */
export async function searchCandidates(
  companyId: string,
  searchQuery: string
): Promise<CandidateSearchResult[]> {
  const supabase = createClient();

  try {
    const result = await supabase.rpc('search_candidates', {
      p_company_id: companyId,
      p_search_query: searchQuery,
    });

    if (result.error) {
      console.error('Erro ao buscar candidatos:', result.error);
      return [];
    }

    return (result.data as CandidateSearchResult[]) || [];
  } catch (error) {
    console.error('Erro ao buscar candidatos:', error);
    return [];
  }
}

// =====================================================
// Applications (Candidaturas)
// =====================================================

/**
 * Lista candidaturas com filtros
 */
export async function getApplications(
  filters: ApplicationFilters = {}
): Promise<ApplicationListResult> {
  const supabase = createClient();

  const {
    job_id,
    candidate_id,
    stage_id,
    status,
    rating,
    tags,
    applied_after,
    applied_before,
    page = 1,
    pageSize = 10,
  } = filters;

  try {
    let query = supabase
      .from('v_applications_with_details')
      .select('*', { count: 'exact' });

    // Filtros
    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    if (candidate_id) {
      query = query.eq('candidate_id', candidate_id);
    }

    if (stage_id) {
      query = query.eq('stage_id', stage_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (rating) {
      query = query.eq('rating', rating);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (applied_after) {
      query = query.gte('applied_at', applied_after);
    }

    if (applied_before) {
      query = query.lte('applied_at', applied_before);
    }

    // Ordenacao
    query = query.order('applied_at', { ascending: false });

    // Paginacao
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const result = await query;

    if (result.error) {
      console.error('Erro ao listar candidaturas:', result.error);
      return { applications: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = result.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      applications: (result.data as ApplicationWithDetails[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar candidaturas:', error);
    return { applications: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Busca candidatura por ID com detalhes completos
 */
export async function getApplicationById(
  id: string
): Promise<ApplicationWithDetails | null> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('v_applications_with_details')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) {
      console.error('Erro ao buscar candidatura:', result.error);
      return null;
    }

    return result.data as ApplicationWithDetails;
  } catch (error) {
    console.error('Erro ao buscar candidatura:', error);
    return null;
  }
}

/**
 * Cria nova candidatura
 */
export async function createApplication(
  data: ApplicationFormData
): Promise<{ application: Application | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Se nao forneceu stage_id, buscar o estagio padrao
    let stageId = data.stage_id;
    if (!stageId) {
      const jobResult = await supabase
        .from('jobs')
        .select('company_id')
        .eq('id', data.job_id)
        .single();

      if (jobResult.data) {
        const stageResult = await supabase
          .from('pipeline_stages')
          .select('id')
          .eq('company_id', jobResult.data.company_id)
          .eq('is_default', true)
          .single();

        if (stageResult.data) {
          stageId = stageResult.data.id;
        }
      }
    }

    const result = await supabase
      .from('applications')
      .insert({
        ...data,
        stage_id: stageId,
      })
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao criar candidatura:', result.error);
      return { application: null, error: result.error.message };
    }

    return { application: result.data as Application, error: null };
  } catch (error) {
    console.error('Erro ao criar candidatura:', error);
    return {
      application: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Move candidatura para novo estagio
 */
export async function updateApplicationStage(
  id: string,
  newStageId: string,
  comment?: string
): Promise<{ application: Application | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Atualizar estagio
    const result = await supabase
      .from('applications')
      .update({ stage_id: newStageId })
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao atualizar estagio:', result.error);
      return { application: null, error: result.error.message };
    }

    // Adicionar comentario se fornecido
    if (comment) {
      await addApplicationComment(id, comment);
    }

    return { application: result.data as Application, error: null };
  } catch (error) {
    console.error('Erro ao atualizar estagio:', error);
    return {
      application: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza status da candidatura
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  comment?: string
): Promise<{ application: Application | null; error: string | null }> {
  const supabase = createClient();

  try {
    const updateData: any = { status };

    // Adicionar campos especificos por status
    if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
      if (comment) {
        updateData.rejection_reason = comment;
      }
    } else if (status === 'hired') {
      updateData.hired_at = new Date().toISOString();
    } else if (status === 'withdrawn') {
      updateData.withdrawn_at = new Date().toISOString();
      if (comment) {
        updateData.withdrawn_reason = comment;
      }
    }

    const result = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao atualizar status:', result.error);
      return { application: null, error: result.error.message };
    }

    return { application: result.data as Application, error: null };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return {
      application: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Avalia candidato
 */
export async function rateApplication(
  id: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    // Atualizar rating na application
    const appResult = await supabase
      .from('applications')
      .update({ rating })
      .eq('id', id);

    if (appResult.error) {
      console.error('Erro ao avaliar candidato:', appResult.error);
      return { success: false, error: appResult.error.message };
    }

    // Registrar atividade
    const activityResult = await supabase
      .from('application_activities')
      .insert({
        application_id: id,
        type: 'rating',
        rating,
        comment,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

    if (activityResult.error) {
      console.error('Erro ao registrar atividade:', activityResult.error);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao avaliar candidato:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Lista candidaturas por estagio (para Kanban)
 */
export async function getApplicationsByStage(
  jobId: string
): Promise<KanbanData> {
  const supabase = createClient();

  try {
    // Buscar a empresa da vaga
    const jobResult = await supabase
      .from('jobs')
      .select('company_id')
      .eq('id', jobId)
      .single();

    if (jobResult.error || !jobResult.data) {
      return { stages: [], applications_by_stage: {} };
    }

    // Buscar estagios
    const stagesResult = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('company_id', jobResult.data.company_id)
      .order('order_index');

    const stages = (stagesResult.data as PipelineStage[]) || [];

    // Buscar candidaturas
    const appsResult = await supabase
      .from('v_applications_with_details')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'active')
      .order('applied_at', { ascending: false });

    const applications = (appsResult.data as ApplicationWithDetails[]) || [];

    // Agrupar por estagio
    const applications_by_stage: Record<string, ApplicationWithDetails[]> = {};
    stages.forEach((stage) => {
      applications_by_stage[stage.id] = applications.filter(
        (app) => app.stage_id === stage.id
      );
    });

    return { stages, applications_by_stage };
  } catch (error) {
    console.error('Erro ao buscar candidaturas por estagio:', error);
    return { stages: [], applications_by_stage: {} };
  }
}

// =====================================================
// Pipeline Stages (Estagios)
// =====================================================

/**
 * Lista estagios do pipeline
 */
export async function getStages(companyId: string): Promise<PipelineStage[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('company_id', companyId)
      .order('order_index');

    if (result.error) {
      console.error('Erro ao listar estagios:', result.error);
      return [];
    }

    return (result.data as PipelineStage[]) || [];
  } catch (error) {
    console.error('Erro ao listar estagios:', error);
    return [];
  }
}

/**
 * Cria novo estagio
 */
export async function createStage(
  companyId: string,
  data: PipelineStageFormData
): Promise<{ stage: PipelineStage | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Se nao forneceu order_index, usar o proximo disponivel
    let orderIndex = data.order_index;
    if (orderIndex === undefined) {
      const maxResult = await supabase
        .from('pipeline_stages')
        .select('order_index')
        .eq('company_id', companyId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      orderIndex = (maxResult.data?.order_index || 0) + 1;
    }

    const result = await supabase
      .from('pipeline_stages')
      .insert({
        company_id: companyId,
        ...data,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao criar estagio:', result.error);
      return { stage: null, error: result.error.message };
    }

    return { stage: result.data as PipelineStage, error: null };
  } catch (error) {
    console.error('Erro ao criar estagio:', error);
    return {
      stage: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza estagio existente
 */
export async function updateStage(
  id: string,
  data: Partial<PipelineStageFormData>
): Promise<{ stage: PipelineStage | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('pipeline_stages')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Erro ao atualizar estagio:', result.error);
      return { stage: null, error: result.error.message };
    }

    return { stage: result.data as PipelineStage, error: null };
  } catch (error) {
    console.error('Erro ao atualizar estagio:', error);
    return {
      stage: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta estagio
 */
export async function deleteStage(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase.from('pipeline_stages').delete().eq('id', id);

    if (result.error) {
      console.error('Erro ao deletar estagio:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao deletar estagio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Reordena estagios
 */
export async function reorderStages(
  companyId: string,
  stageIds: string[]
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    // Atualizar order_index de cada estagio
    for (let i = 0; i < stageIds.length; i++) {
      const result = await supabase
        .from('pipeline_stages')
        .update({ order_index: i + 1 })
        .eq('id', stageIds[i])
        .eq('company_id', companyId);

      if (result.error) {
        console.error('Erro ao reordenar estagios:', result.error);
        return { success: false, error: result.error.message };
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao reordenar estagios:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// =====================================================
// Activities (Atividades)
// =====================================================

/**
 * Lista atividades de uma candidatura
 */
export async function getApplicationActivities(
  applicationId: string
): Promise<ApplicationActivity[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('application_activities')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (result.error) {
      console.error('Erro ao listar atividades:', result.error);
      return [];
    }

    return (result.data as ApplicationActivity[]) || [];
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    return [];
  }
}

/**
 * Adiciona comentario a uma candidatura
 */
export async function addApplicationComment(
  applicationId: string,
  comment: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const user = (await supabase.auth.getUser()).data.user;

    const result = await supabase.from('application_activities').insert({
      application_id: applicationId,
      type: 'comment',
      comment,
      created_by: user?.id,
    });

    if (result.error) {
      console.error('Erro ao adicionar comentario:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao adicionar comentario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Obtem timeline de atividades formatada
 */
export async function getApplicationTimeline(
  applicationId: string
): Promise<ActivityTimeline[]> {
  const supabase = createClient();

  try {
    const activities = await getApplicationActivities(applicationId);

    // Buscar nomes dos usuarios
    const userIds = [...new Set(activities.map((a) => a.created_by))];
    const usersResult = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const usersMap = new Map(
      (usersResult.data || []).map((u: any) => [u.id, u.name])
    );

    // Buscar nomes dos estagios
    const stageIds = [
      ...new Set(
        activities.flatMap((a) => [a.from_stage_id, a.to_stage_id]).filter(Boolean)
      ),
    ];
    const stagesResult = await supabase
      .from('pipeline_stages')
      .select('id, name')
      .in('id', stageIds as string[]);

    const stagesMap = new Map(
      (stagesResult.data || []).map((s: any) => [s.id, s.name])
    );

    // Converter para timeline
    const timeline: ActivityTimeline[] = activities.map((activity) => {
      let title = '';
      let description = activity.comment;

      switch (activity.type) {
        case 'stage_change':
          title = 'Mudou de estagio';
          description = `De "${stagesMap.get(activity.from_stage_id!)}" para "${stagesMap.get(activity.to_stage_id!)}"`;
          break;
        case 'comment':
          title = 'Adicionou comentario';
          break;
        case 'rating':
          title = 'Avaliou o candidato';
          description = `Nota: ${activity.rating}/5`;
          break;
        case 'interview_scheduled':
          title = 'Agendou entrevista';
          break;
        case 'status_change':
          title = 'Alterou o status';
          break;
        case 'document_uploaded':
          title = 'Enviou documento';
          break;
      }

      return {
        id: activity.id,
        type: activity.type,
        title,
        description,
        timestamp: activity.created_at,
        user_id: activity.created_by,
        user_name: usersMap.get(activity.created_by) || 'Usuario desconhecido',
        from_stage: activity.from_stage_id
          ? stagesMap.get(activity.from_stage_id)
          : undefined,
        to_stage: activity.to_stage_id
          ? stagesMap.get(activity.to_stage_id)
          : undefined,
        rating: activity.rating || undefined,
        metadata: activity.metadata,
      };
    });

    return timeline;
  } catch (error) {
    console.error('Erro ao obter timeline:', error);
    return [];
  }
}
