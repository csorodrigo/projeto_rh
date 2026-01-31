/**
 * Types para o modulo de Recrutamento
 * Fase 7 - Sistema de Recrutamento e Selecao
 */

// =====================================================
// Enums
// =====================================================

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed';

export type EmploymentType = 'clt' | 'pj' | 'intern' | 'temporary' | 'apprentice';

export type LocationType = 'on_site' | 'remote' | 'hybrid';

export type CandidateSource = 'portal' | 'linkedin' | 'referral' | 'agency' | 'direct' | 'other' | 'careers_page';

// Alias for backwards compatibility
export type ApplicationSource = CandidateSource;

export type CandidateRating = 1 | 2 | 3 | 4 | 5;

export type ApplicationStatus = 'active' | 'rejected' | 'hired' | 'withdrawn';

export type ActivityType =
  | 'stage_change'
  | 'comment'
  | 'rating'
  | 'interview_scheduled'
  | 'status_change'
  | 'document_uploaded';

// =====================================================
// Job Types
// =====================================================

/**
 * Vaga de emprego
 */
export interface Job {
  id: string;
  company_id: string;

  // Informacoes basicas
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];

  // Localizacao e tipo
  department: string | null;
  location: string;
  location_type: LocationType;
  employment_type: EmploymentType;

  // Faixa salarial
  salary_range_min: number | null;
  salary_range_max: number | null;
  show_salary: boolean;

  // Status e publicacao
  status: JobStatus;
  publish_internally: boolean;
  publish_externally: boolean;
  openings_count: number;

  // Responsaveis
  hiring_manager_id: string | null;
  created_by: string | null;

  // Datas
  created_at: string;
  updated_at: string;
  published_at: string | null;
  closed_at: string | null;

  // Metadados
  custom_fields: Record<string, any>;
}

/**
 * Vaga com estatisticas
 */
export interface JobWithStats extends Job {
  total_applications: number;
  active_applications: number;
  hired_count: number;
  rejected_count: number;
  avg_rating: number | null;
  applications_by_stage?: Record<string, number>;
}

/**
 * Filtros para listagem de vagas
 */
export interface JobFilters {
  search?: string;
  department?: string;
  status?: JobStatus;
  employment_type?: EmploymentType;
  location_type?: LocationType;
  hiring_manager_id?: string;
  publish_externally?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Dados para criar/atualizar vaga
 */
export interface JobFormData {
  title: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  department?: string;
  location: string;
  location_type: LocationType;
  employment_type: EmploymentType;
  salary_range_min?: number;
  salary_range_max?: number;
  show_salary?: boolean;
  publish_internally?: boolean;
  publish_externally?: boolean;
  openings_count?: number;
  hiring_manager_id?: string;
  custom_fields?: Record<string, any>;
}

// =====================================================
// Candidate Types
// =====================================================

/**
 * Candidato
 */
export interface Candidate {
  id: string;
  company_id: string;

  // Dados pessoais
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;

  // Curriculo e documentos
  resume_url: string | null;
  resume_text: string | null;
  resume_filename: string | null;
  portfolio_url: string | null;

  // Origem
  source: CandidateSource;
  source_details: string | null;

  // Informacoes adicionais
  current_position: string | null;
  current_company: string | null;
  expected_salary: number | null;
  available_from: string | null;
  location: string | null;
  years_of_experience: number | null;

  // Avaliacao
  rating: CandidateRating | null;

  // Tags e classificacao
  tags: string[];
  notes: string | null;

  // Metadados
  custom_fields: Record<string, any>;

  // GDPR / LGPD
  consent_given: boolean;
  consent_date: string;
  gdpr_data_retention_until: string | null;

  // Auditoria
  created_at: string;
  updated_at: string;
}

/**
 * Candidato com candidaturas
 */
export interface CandidateWithApplications extends Candidate {
  applications: Application[];
  applications_count: number;
  last_application_date: string | null;
}

/**
 * Filtros para listagem de candidatos
 */
export interface CandidateFilters {
  search?: string;
  source?: CandidateSource;
  tags?: string[];
  location?: string;
  available_from?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dados para criar/atualizar candidato
 */
export interface CandidateFormData {
  name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  resume_url?: string;
  portfolio_url?: string;
  source?: CandidateSource;
  source_details?: string;
  current_position?: string;
  current_company?: string;
  expected_salary?: number;
  available_from?: string;
  location?: string;
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, any>;
  consent_given?: boolean;
}

// =====================================================
// Pipeline Stage Types
// =====================================================

/**
 * Estagio do pipeline de recrutamento
 */
export interface PipelineStage {
  id: string;
  company_id: string;

  // Informacoes do estagio
  name: string;
  description: string | null;
  color: string;

  // Ordenacao
  order_index: number;

  // Configuracao
  is_default: boolean;
  is_final: boolean;

  // Automacao
  auto_reject_after_days: number | null;
  email_template_id: string | null;

  // Auditoria
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar/atualizar estagio
 */
export interface PipelineStageFormData {
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
  is_default?: boolean;
  is_final?: boolean;
  auto_reject_after_days?: number;
  email_template_id?: string;
}

// =====================================================
// Application Types
// =====================================================

/**
 * Candidatura
 */
export interface Application {
  id: string;

  // Referencias
  job_id: string;
  candidate_id: string;
  stage_id: string;

  // Status
  status: ApplicationStatus;

  // Candidatura
  applied_at: string;
  cover_letter: string | null;

  // Avaliacao
  rating: number | null;
  tags: string[];

  // Entrevistas
  interview_scheduled_at: string | null;
  interview_completed_at: string | null;
  interview_feedback: string | null;

  // Decisao final
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;

  hired_at: string | null;
  hired_by: string | null;
  employee_id: string | null;

  withdrawn_at: string | null;
  withdrawn_reason: string | null;

  // Metadados
  custom_fields: Record<string, any>;

  // Auditoria
  created_at: string;
  updated_at: string;
}

/**
 * Candidatura com detalhes completos
 */
export interface ApplicationWithDetails extends Application {
  // Dados do candidato
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  candidate_linkedin: string | null;
  candidate_resume: string | null;
  candidate_current_position: string | null;
  candidate_current_company: string | null;

  // Dados da vaga
  job_title: string;
  job_department: string | null;

  // Dados do estagio
  stage_name: string;
  stage_color: string;
  stage_order: number;

  // Atividades e historico
  activities?: ApplicationActivity[];
  timeline?: ActivityTimeline[];
}

/**
 * Filtros para listagem de candidaturas
 */
export interface ApplicationFilters {
  job_id?: string;
  candidate_id?: string;
  stage_id?: string;
  status?: ApplicationStatus;
  rating?: number;
  tags?: string[];
  applied_after?: string;
  applied_before?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dados para criar candidatura
 */
export interface ApplicationFormData {
  job_id: string;
  candidate_id: string;
  stage_id?: string;
  cover_letter?: string;
  custom_fields?: Record<string, any>;
}

/**
 * Dados para atualizar candidatura
 */
export interface ApplicationUpdateData {
  stage_id?: string;
  status?: ApplicationStatus;
  rating?: number;
  tags?: string[];
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  interview_feedback?: string;
  rejection_reason?: string;
  withdrawn_reason?: string;
  custom_fields?: Record<string, any>;
}

// =====================================================
// Activity Types
// =====================================================

/**
 * Atividade de candidatura
 */
export interface ApplicationActivity {
  id: string;

  // Referencia
  application_id: string;

  // Tipo de atividade
  type: ActivityType;

  // Mudanca de estagio
  from_stage_id: string | null;
  to_stage_id: string | null;

  // Comentario
  comment: string | null;

  // Avaliacao
  rating: number | null;

  // Metadados adicionais
  metadata: Record<string, any>;

  // Auditoria
  created_by: string;
  created_at: string;
}

/**
 * Item da timeline de atividades (para visualizacao)
 */
export interface ActivityTimeline {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  timestamp: string;
  user_id: string;
  user_name: string;

  // Detalhes especificos por tipo
  from_stage?: string;
  to_stage?: string;
  rating?: number;
  metadata?: Record<string, any>;
}

/**
 * Dados para adicionar comentario
 */
export interface AddCommentData {
  application_id: string;
  comment: string;
}

/**
 * Dados para avaliar candidato
 */
export interface RateApplicationData {
  application_id: string;
  rating: number;
  comment?: string;
}

/**
 * Dados para agendar entrevista
 */
export interface ScheduleInterviewData {
  application_id: string;
  interview_type: string;
  interviewer_id: string;
  scheduled_date: string;
  location?: string;
  video_link?: string;
  notes?: string;
}

// =====================================================
// Result Types
// =====================================================

/**
 * Resultado de listagem paginada de vagas
 */
export interface JobListResult {
  jobs: JobWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Resultado de listagem paginada de candidatos
 */
export interface CandidateListResult {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Resultado de listagem paginada de candidaturas
 */
export interface ApplicationListResult {
  applications: ApplicationWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Estatisticas de uma vaga
 */
export interface JobStats {
  total_applications: number;
  active_applications: number;
  hired_count: number;
  rejected_count: number;
  avg_rating: number | null;
  applications_by_stage: Record<string, number>;
}

/**
 * Dados do Kanban (candidaturas por estagio)
 */
export interface KanbanData {
  stages: PipelineStage[];
  applications_by_stage: Record<string, ApplicationWithDetails[]>;
}

/**
 * Estatisticas do pipeline de recrutamento
 */
export interface PipelineStats {
  total_jobs: number;
  open_jobs: number;
  total_candidates: number;
  active_applications: number;
  avg_time_to_hire: number | null;
  conversion_rate: number | null;
  applications_by_source: Record<CandidateSource, number>;
}

/**
 * Resultado de busca de candidatos
 */
export interface CandidateSearchResult {
  id: string;
  name: string;
  email: string;
  current_position: string | null;
  resume_text: string | null;
  rank: number;
}

/**
 * Candidatura com dados da vaga
 */
export interface ApplicationWithJob extends Application {
  job: Job;
}

/**
 * Atividade com dados do usuario
 */
export interface ActivityWithUser extends ApplicationActivity {
  user_name: string;
  user_avatar: string | null;
}

/**
 * Candidato no Kanban (visualização simplificada)
 */
export interface KanbanCandidate {
  id: string;
  application_id: string;
  name: string;
  email: string;
  phone: string | null;
  current_stage: string;
  rating: number | null;
  tags: string[];
  applied_at: string;
  job_id: string;
  job_title: string;
  avatar_url: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  source: CandidateSource;
  days_in_stage: number;
}

/**
 * Filtros para o Kanban
 */
export interface KanbanFilters {
  search?: string;
  job_id?: string;
  minRating?: number;
  maxRating?: number;
  tags?: string[];
  source?: CandidateSource;
  appliedAfter?: string;
  appliedBefore?: string;
}
