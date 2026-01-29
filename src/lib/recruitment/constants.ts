/**
 * Recruitment Module Constants
 *
 * Defines all constants used across the recruitment module including
 * statuses, types, sources, and default configurations.
 */

// Job statuses
export const JOB_STATUSES = ['draft', 'open', 'paused', 'closed'] as const
export type JobStatus = typeof JOB_STATUSES[number]

// Application/Candidacy statuses
export const APPLICATION_STATUSES = ['active', 'rejected', 'hired', 'withdrawn'] as const
export type ApplicationStatus = typeof APPLICATION_STATUSES[number]

// Candidate sources
export const CANDIDATE_SOURCES = ['portal', 'linkedin', 'indicacao', 'outro'] as const
export type CandidateSource = typeof CANDIDATE_SOURCES[number]

// Employment types
export const EMPLOYMENT_TYPES = ['clt', 'pj', 'estagio', 'temporario'] as const
export type EmploymentType = typeof EMPLOYMENT_TYPES[number]

// Location types
export const LOCATION_TYPES = ['presencial', 'remoto', 'hibrido'] as const
export type LocationType = typeof LOCATION_TYPES[number]

// Activity types for application timeline
export const ACTIVITY_TYPES = {
  STAGE_CHANGE: 'stage_change',
  COMMENT: 'comment',
  RATING: 'rating',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  DOCUMENT_UPLOADED: 'document_uploaded',
  EMAIL_SENT: 'email_sent',
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

// Default pipeline stages configuration
export const DEFAULT_PIPELINE_STAGES = [
  { name: 'Triagem', color: '#6B7280', order: 1 },
  { name: 'Entrevista RH', color: '#3B82F6', order: 2 },
  { name: 'Entrevista Técnica', color: '#8B5CF6', order: 3 },
  { name: 'Proposta', color: '#F59E0B', order: 4 },
  { name: 'Contratado', color: '#10B981', order: 5 },
] as const

// Job status labels and colors
export const JOB_STATUS_CONFIG = {
  draft: {
    label: 'Rascunho',
    color: 'blue',
    variant: 'outline' as const,
  },
  open: {
    label: 'Aberta',
    color: 'green',
    variant: 'default' as const,
  },
  paused: {
    label: 'Pausada',
    color: 'yellow',
    variant: 'secondary' as const,
  },
  closed: {
    label: 'Fechada',
    color: 'gray',
    variant: 'outline' as const,
  },
} as const

// Application status labels and colors
export const APPLICATION_STATUS_CONFIG = {
  active: {
    label: 'Ativo',
    color: 'blue',
    variant: 'default' as const,
  },
  rejected: {
    label: 'Rejeitado',
    color: 'red',
    variant: 'destructive' as const,
  },
  hired: {
    label: 'Contratado',
    color: 'green',
    variant: 'default' as const,
  },
  withdrawn: {
    label: 'Desistiu',
    color: 'gray',
    variant: 'outline' as const,
  },
} as const

// Candidate source labels and colors
export const CANDIDATE_SOURCE_CONFIG = {
  portal: {
    label: 'Portal de Vagas',
    color: 'blue',
    variant: 'default' as const,
  },
  linkedin: {
    label: 'LinkedIn',
    color: 'blue',
    variant: 'secondary' as const,
  },
  indicacao: {
    label: 'Indicação',
    color: 'green',
    variant: 'default' as const,
  },
  outro: {
    label: 'Outro',
    color: 'gray',
    variant: 'outline' as const,
  },
} as const

// Employment type labels and colors
export const EMPLOYMENT_TYPE_CONFIG = {
  clt: {
    label: 'CLT',
    color: 'blue',
    variant: 'default' as const,
  },
  pj: {
    label: 'PJ',
    color: 'purple',
    variant: 'secondary' as const,
  },
  estagio: {
    label: 'Estágio',
    color: 'green',
    variant: 'outline' as const,
  },
  temporario: {
    label: 'Temporário',
    color: 'orange',
    variant: 'outline' as const,
  },
} as const

// Location type labels and colors
export const LOCATION_TYPE_CONFIG = {
  presencial: {
    label: 'Presencial',
    color: 'blue',
    variant: 'default' as const,
  },
  remoto: {
    label: 'Remoto',
    color: 'green',
    variant: 'default' as const,
  },
  hibrido: {
    label: 'Híbrido',
    color: 'purple',
    variant: 'secondary' as const,
  },
} as const
