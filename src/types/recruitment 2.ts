/**
 * Recruitment System Types
 * Tipos para o sistema de recrutamento e seleção
 */

// =====================================================
// ENUMS
// =====================================================

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed' | 'cancelled';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ApplicationStatus = 'active' | 'rejected' | 'hired' | 'withdrawn';
export type InterviewType = 'video' | 'phone' | 'in_person' | 'technical_test';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type InterviewRecommendation = 'hire' | 'maybe' | 'no_hire';
export type CandidateSource = 'linkedin' | 'indicacao' | 'portal' | 'site' | 'evento' | 'outro';

// =====================================================
// PIPELINE STAGES
// =====================================================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'triagem', name: 'Triagem', order: 1, color: '#64748b' },
  { id: 'entrevista_rh', name: 'Entrevista RH', order: 2, color: '#3b82f6' },
  { id: 'teste_tecnico', name: 'Teste Técnico', order: 3, color: '#8b5cf6' },
  { id: 'entrevista_gestor', name: 'Entrevista Gestor', order: 4, color: '#f59e0b' },
  { id: 'proposta', name: 'Proposta', order: 5, color: '#10b981' },
  { id: 'contratado', name: 'Contratado', order: 6, color: '#22c55e' },
];

// =====================================================
// LANGUAGE
// =====================================================

export interface Language {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'fluent' | 'native';
}

// =====================================================
// JOB (Vaga)
// =====================================================

export interface Job {
  id: string;
  company_id: string;

  // Informações da vaga
  title: string;
  code: string | null;
  description: string | null;
  department: string | null;
  location: string | null;
  employment_type: EmploymentType;
  contract_type: string;

  // Requisitos
  required_skills: string[];
  nice_to_have_skills: string[];
  education_level: string | null;
  experience_years: number | null;
  languages: Language[];

  // Compensação
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  benefits: string[];

  // Configurações
  positions_available: number;
  positions_filled: number;
  hiring_manager_id: string | null;
  recruiters: string[];

  // Pipeline
  pipeline_stages: PipelineStage[];

  // Status
  status: JobStatus;
  published_at: string | null;
  closed_at: string | null;
  expires_at: string | null;

  // SEO
  slug: string | null;
  is_remote: boolean;
  is_public: boolean;

  // Metadados
  metadata: Record<string, unknown>;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// =====================================================
// CANDIDATE (Candidato)
// =====================================================

export interface Candidate {
  id: string;
  company_id: string;

  // Informações pessoais
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;

  // Perfil profissional
  current_position: string | null;
  current_company: string | null;
  experience_years: number | null;
  education_level: string | null;
  skills: string[];
  languages: Language[];

  // Currículo
  resume_url: string | null;
  resume_filename: string | null;
  cover_letter: string | null;

  // Expectativas
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  available_from: string | null;
  notice_period_days: number | null;

  // Tags e classificação
  tags: string[];
  rating: number | null; // 1-5

  // Origem
  source: CandidateSource | null;
  source_details: string | null;
  referred_by: string | null;

  // LGPD
  consent_data_processing: boolean;
  consent_given_at: string | null;
  data_retention_until: string | null;

  // Status
  is_blacklisted: boolean;
  blacklist_reason: string | null;

  // Metadados
  metadata: Record<string, unknown>;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// =====================================================
// JOB APPLICATION (Candidatura)
// =====================================================

export interface JobApplication {
  id: string;
  company_id: string;
  job_id: string;
  candidate_id: string;

  // Estágio atual
  current_stage: string;
  previous_stage: string | null;

  // Rating
  rating: number | null; // 1-5

  // Status
  status: ApplicationStatus;
  rejection_reason: string | null;
  rejection_stage: string | null;
  rejected_at: string | null;
  rejected_by: string | null;

  // Contratação
  hired_at: string | null;
  hired_by: string | null;
  employee_id: string | null;

  // Retirada
  withdrawn_at: string | null;
  withdrawn_reason: string | null;

  // Timeline
  applied_at: string;
  stage_changed_at: string;
  last_activity_at: string;

  // Responsável
  recruiter_id: string | null;

  // Metadados
  metadata: Record<string, unknown>;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// =====================================================
// APPLICATION WITH DETAILS
// =====================================================

export interface ApplicationWithDetails extends JobApplication {
  // Dados do candidato
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  candidate_location: string | null;
  candidate_resume_url: string | null;
  candidate_skills: string[];
  candidate_global_rating: number | null;
  candidate_tags: string[];

  // Dados da vaga
  job_title: string;
  job_code: string | null;
  job_department: string | null;
  job_status: JobStatus;

  // Dados do recrutador
  recruiter_name: string | null;
  recruiter_email: string | null;
}

// =====================================================
// APPLICATION ACTIVITY
// =====================================================

export interface ApplicationActivity {
  id: string;
  company_id: string;
  application_id: string;

  // Tipo
  activity_type: string; // stage_change, comment, email_sent, interview_scheduled, etc

  // Detalhes
  title: string | null;
  description: string | null;

  // Mudança de estágio
  from_stage: string | null;
  to_stage: string | null;

  // Dados adicionais
  data: Record<string, unknown>;

  // Autor
  performed_by: string | null;
  performed_at: string;

  // Auditoria
  created_at: string;
}

// =====================================================
// APPLICATION COMMENT
// =====================================================

export interface ApplicationComment {
  id: string;
  company_id: string;
  application_id: string;

  // Conteúdo
  comment: string;

  // Avaliação
  rating: number | null; // 1-5

  // Tipo
  is_internal: boolean;

  // Anexos
  attachments: Array<{
    url: string;
    name: string;
  }>;

  // Autor
  author_id: string;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// =====================================================
// INTERVIEW
// =====================================================

export interface Interview {
  id: string;
  company_id: string;
  application_id: string;

  // Informações
  title: string;
  description: string | null;
  interview_type: InterviewType;

  // Agendamento
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;

  // Participantes
  interviewers: string[];

  // Local/Link
  location: string | null;
  meeting_link: string | null;

  // Status
  status: InterviewStatus;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  // Feedback
  feedback: string | null;
  rating: number | null; // 1-5
  recommendation: InterviewRecommendation | null;

  // Metadados
  metadata: Record<string, unknown>;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================
// OFFER LETTER
// =====================================================

export interface OfferLetter {
  id: string;
  company_id: string;
  application_id: string;

  // Detalhes
  position: string;
  department: string | null;
  start_date: string | null;

  // Compensação
  salary: number;
  salary_currency: string;
  salary_type: string;
  benefits: string[];

  // Contrato
  contract_type: string;
  employment_type: EmploymentType;

  // Carta
  offer_letter_url: string | null;
  custom_message: string | null;

  // Status
  status: OfferStatus;
  sent_at: string | null;
  expires_at: string | null;

  // Resposta
  response_at: string | null;
  response_message: string | null;

  // Metadados
  metadata: Record<string, unknown>;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================
// KANBAN SPECIFIC TYPES
// =====================================================

export interface KanbanCandidate {
  id: string;
  application_id: string;
  candidate_id: string;

  // Dados do candidato
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;

  // Dados profissionais
  current_position: string | null;
  location: string | null;
  skills: string[];

  // Candidatura
  current_stage: string;
  rating: number | null;
  tags: string[];

  // Currículo
  resume_url: string | null;

  // Timeline
  applied_at: string;
  time_in_stage: number; // dias no estágio atual
  last_activity_at: string;
}

export interface KanbanStageColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  candidates: KanbanCandidate[];
  count: number;
}

export interface KanbanFilters {
  search?: string;
  tags?: string[];
  rating?: number;
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;
}
