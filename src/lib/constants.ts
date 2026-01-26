// App constants
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RH SaaS'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Roles
export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Employee Status
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
} as const

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS]

// Contract Types
export const CONTRACT_TYPES = {
  CLT: 'clt',
  PJ: 'pj',
  INTERN: 'intern',
  TEMPORARY: 'temporary',
} as const

export type ContractType = (typeof CONTRACT_TYPES)[keyof typeof CONTRACT_TYPES]

// Absence Types - Todos os tipos conforme migration 007_absences.sql
export const ABSENCE_TYPES = {
  // Férias
  VACATION: 'vacation',
  VACATION_ADVANCE: 'vacation_advance',
  VACATION_SOLD: 'vacation_sold',

  // Licenças legais
  SICK_LEAVE: 'sick_leave',
  MATERNITY_LEAVE: 'maternity_leave',
  PATERNITY_LEAVE: 'paternity_leave',
  ADOPTION_LEAVE: 'adoption_leave',
  BEREAVEMENT: 'bereavement',
  MARRIAGE_LEAVE: 'marriage_leave',
  JURY_DUTY: 'jury_duty',
  MILITARY_SERVICE: 'military_service',
  ELECTION_DUTY: 'election_duty',
  BLOOD_DONATION: 'blood_donation',
  UNION_LEAVE: 'union_leave',

  // Ausências justificadas
  MEDICAL_APPOINTMENT: 'medical_appointment',
  PRENATAL: 'prenatal',
  CHILD_SICK: 'child_sick',
  LEGAL_OBLIGATION: 'legal_obligation',
  STUDY_LEAVE: 'study_leave',

  // Ausências não justificadas
  UNJUSTIFIED: 'unjustified',

  // Outros
  TIME_BANK: 'time_bank',
  COMPENSATORY: 'compensatory',
  OTHER: 'other',
} as const

export type AbsenceType = (typeof ABSENCE_TYPES)[keyof typeof ABSENCE_TYPES]

// Absence Status
export const ABSENCE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type AbsenceStatusType = (typeof ABSENCE_STATUS)[keyof typeof ABSENCE_STATUS]

// Labels para tipos de ausência (PT-BR)
export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Férias',
  vacation_advance: 'Férias Antecipadas',
  vacation_sold: 'Abono Pecuniário',
  sick_leave: 'Licença Médica',
  maternity_leave: 'Licença Maternidade',
  paternity_leave: 'Licença Paternidade',
  adoption_leave: 'Licença Adoção',
  bereavement: 'Licença Nojo',
  marriage_leave: 'Licença Casamento',
  jury_duty: 'Júri',
  military_service: 'Serviço Militar',
  election_duty: 'Mesário',
  blood_donation: 'Doação de Sangue',
  union_leave: 'Licença Sindical',
  medical_appointment: 'Consulta Médica',
  prenatal: 'Pré-natal',
  child_sick: 'Filho Doente',
  legal_obligation: 'Obrigação Legal',
  study_leave: 'Licença Estudos',
  unjustified: 'Falta Injustificada',
  time_bank: 'Banco de Horas',
  compensatory: 'Folga Compensatória',
  other: 'Outros',
}

// Labels para status de ausência (PT-BR)
export const ABSENCE_STATUS_LABELS: Record<AbsenceStatusType, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
}

// Cores para tipos de ausência
export const ABSENCE_TYPE_COLORS: Record<AbsenceType, string> = {
  vacation: 'bg-blue-500',
  vacation_advance: 'bg-blue-400',
  vacation_sold: 'bg-blue-300',
  sick_leave: 'bg-red-500',
  maternity_leave: 'bg-pink-500',
  paternity_leave: 'bg-pink-400',
  adoption_leave: 'bg-pink-300',
  bereavement: 'bg-gray-500',
  marriage_leave: 'bg-rose-400',
  jury_duty: 'bg-amber-500',
  military_service: 'bg-amber-600',
  election_duty: 'bg-amber-400',
  blood_donation: 'bg-red-400',
  union_leave: 'bg-orange-500',
  medical_appointment: 'bg-emerald-500',
  prenatal: 'bg-emerald-400',
  child_sick: 'bg-emerald-300',
  legal_obligation: 'bg-slate-500',
  study_leave: 'bg-indigo-500',
  unjustified: 'bg-red-600',
  time_bank: 'bg-purple-500',
  compensatory: 'bg-purple-400',
  other: 'bg-gray-400',
}

// Grupos de tipos de ausência para filtros
export const ABSENCE_TYPE_GROUPS = {
  vacation: ['vacation', 'vacation_advance', 'vacation_sold'],
  medical: ['sick_leave', 'medical_appointment', 'prenatal', 'child_sick'],
  legal_leave: ['maternity_leave', 'paternity_leave', 'adoption_leave', 'bereavement', 'marriage_leave', 'jury_duty', 'military_service', 'election_duty', 'blood_donation', 'union_leave'],
  justified: ['legal_obligation', 'study_leave', 'time_bank', 'compensatory'],
  unjustified: ['unjustified'],
  other: ['other'],
} as const

// ASO Types
export const ASO_TYPES = {
  ADMISSION: 'admission',
  PERIODIC: 'periodic',
  RETURN: 'return',
  CHANGE: 'change',
  DISMISSAL: 'dismissal',
} as const

export type ASOType = (typeof ASO_TYPES)[keyof typeof ASO_TYPES]

// Time Entry Status
export const TIME_ENTRY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type TimeEntryStatus = (typeof TIME_ENTRY_STATUS)[keyof typeof TIME_ENTRY_STATUS]

// Plan Types
export const PLAN_TYPES = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES]

// Plan Limits
export const PLAN_LIMITS = {
  free: {
    maxEmployees: 5,
    maxUsers: 1,
    features: ['basic_employees', 'web_clock'],
  },
  premium: {
    maxEmployees: Infinity,
    maxUsers: Infinity,
    features: [
      'basic_employees',
      'web_clock',
      'mobile_clock',
      'facial_recognition',
      'pdi_ai',
      'health_management',
      'payroll',
      'esocial',
      'advanced_reports',
    ],
  },
} as const

// Navigation Items
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Funcionários',
    href: '/funcionarios',
    icon: 'Users',
  },
  {
    title: 'Ponto',
    href: '/ponto',
    icon: 'Clock',
  },
  {
    title: 'Ausências',
    href: '/ausencias',
    icon: 'Calendar',
  },
  {
    title: 'PDI',
    href: '/pdi',
    icon: 'Target',
  },
  {
    title: 'Saúde',
    href: '/saude',
    icon: 'Heart',
  },
  {
    title: 'Folha',
    href: '/folha',
    icon: 'DollarSign',
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: 'BarChart3',
  },
  {
    title: 'Configurações',
    href: '/config',
    icon: 'Settings',
  },
] as const

// Gender options
export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const

// Marital status
export const MARITAL_STATUS = {
  SINGLE: 'single',
  MARRIED: 'married',
  DIVORCED: 'divorced',
  WIDOWED: 'widowed',
  SEPARATED: 'separated',
} as const

// Document types
export const DOCUMENT_TYPES = {
  RG: 'rg',
  CPF: 'cpf',
  CTPS: 'ctps',
  CONTRACT: 'contract',
  AMENDMENT: 'amendment',
  CERTIFICATE: 'certificate',
  OTHER: 'other',
} as const
