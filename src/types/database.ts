/**
 * Database Types - Generated from Supabase Schema
 * Comprehensive type definitions for HR SaaS system
 */

// Enums
export type UserRole = 'super_admin' | 'company_admin' | 'hr_manager' | 'hr_analyst' | 'employee';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type ContractType = 'clt' | 'pj' | 'internship' | 'temporary';
// Todos os tipos de ausência conforme migration 007_absences.sql
export type AbsenceType =
  // Férias
  | 'vacation'           // Férias regulares
  | 'vacation_advance'   // Férias antecipadas
  | 'vacation_sold'      // Abono pecuniário (vender dias)

  // Licenças legais
  | 'sick_leave'         // Licença médica
  | 'maternity_leave'    // Licença maternidade
  | 'paternity_leave'    // Licença paternidade
  | 'adoption_leave'     // Licença adoção
  | 'bereavement'        // Licença nojo (falecimento)
  | 'marriage_leave'     // Licença casamento (gala)
  | 'jury_duty'          // Serviço do júri
  | 'military_service'   // Serviço militar
  | 'election_duty'      // Mesário
  | 'blood_donation'     // Doação de sangue
  | 'union_leave'        // Licença sindical

  // Ausências justificadas
  | 'medical_appointment' // Consulta médica
  | 'prenatal'            // Pré-natal
  | 'child_sick'          // Filho doente
  | 'legal_obligation'    // Obrigação legal
  | 'study_leave'         // Licença para estudos

  // Ausências não justificadas
  | 'unjustified'         // Falta não justificada

  // Outros
  | 'time_bank'           // Compensação de banco de horas
  | 'compensatory'        // Folga compensatória
  | 'other';              // Outros

// Status de ausência conforme migration
export type AbsenceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_progress' | 'completed';
export type EvaluationStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type PDIStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Time Tracking Types
export type TimeRecordStatus = 'pending' | 'approved' | 'rejected' | 'adjusted';
export type ClockType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
export type RecordSource = 'mobile_app' | 'web' | 'biometric' | 'manual' | 'import';
export type TimeBankMovementType = 'credit' | 'debit' | 'adjustment' | 'expiry';

// Payroll Types
export type PayrollStatus = 'draft' | 'calculating' | 'calculated' | 'review' | 'approved' | 'processing' | 'paid' | 'exported' | 'cancelled';
export type PayrollPeriodType = 'monthly' | 'advance' | '13th_1' | '13th_2' | 'vacation' | 'severance';
export type PayrollEventType = 'earning' | 'deduction' | 'information';
export type EventRecurrence = 'fixed' | 'variable' | 'one_time' | 'temporary';

// JSON Types
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface Benefit {
  id: string;
  name: string;
  value: number;
  description?: string;
}

export interface ScheduleData {
  monday?: { start: string; end: string; break_start?: string; break_end?: string };
  tuesday?: { start: string; end: string; break_start?: string; break_end?: string };
  wednesday?: { start: string; end: string; break_start?: string; break_end?: string };
  thursday?: { start: string; end: string; break_start?: string; break_end?: string };
  friday?: { start: string; end: string; break_start?: string; break_end?: string };
  saturday?: { start: string; end: string; break_start?: string; break_end?: string };
  sunday?: { start: string; end: string; break_start?: string; break_end?: string };
}

export interface PDIGoal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  progress: number;
}

export interface PDICompetency {
  id: string;
  name: string;
  current_level: number;
  target_level: number;
  description?: string;
}

export interface EvaluationTemplate {
  sections: EvaluationSection[];
}

export interface EvaluationSection {
  id: string;
  title: string;
  description?: string;
  questions: EvaluationQuestion[];
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple_choice';
  required: boolean;
  options?: string[];
  weight?: number;
}

export interface PayrollEarning {
  id: string;
  description: string;
  amount: number;
  type: string;
}

export interface PayrollDeduction {
  id: string;
  description: string;
  amount: number;
  type: string;
}

// Table Types
export type CompanyStatus = 'active' | 'inactive' | 'suspended' | 'trial';

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: Address | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  owner_id: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountType = 'checking' | 'savings' | 'salary';

export interface Employee {
  id: string;
  company_id: string;

  // Personal Info
  name: string;
  full_name: string; // Alias for name
  social_name: string | null;
  cpf: string;
  rg: string | null;
  rg_issuer: string | null;
  rg_state: string | null;
  rg_issue_date: string | null;
  birth_date: string;
  birth_city: string | null;
  birth_state: string | null;
  nationality: string | null;
  gender: string | null;
  marital_status: string | null;
  spouse_name: string | null;
  children_count: number;

  // Contact
  email: string;
  personal_email: string | null;
  phone: string | null;
  personal_phone: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  address: Address | null;

  // Education
  education_level: string | null;
  education_institution: string | null;
  education_course: string | null;

  // Employment Info
  employee_number: string;
  registration_number: string | null;
  department: string | null;
  position: string;
  cost_center: string | null;
  manager_id: string | null;
  hire_date: string;
  trial_period_end: string | null;
  contract_type: ContractType;
  work_schedule_id: string | null;
  weekly_hours: number | null;

  // Compensation
  salary: number;
  base_salary: number | null;
  salary_type: string | null;

  // Work Documents
  pis: string | null;
  ctps_number: string | null;
  ctps_series: string | null;
  ctps_state: string | null;
  ctps_issue_date: string | null;
  professional_category: string | null;
  cbo: string | null;

  // CNH
  cnh_number: string | null;
  cnh_category: string | null;
  cnh_expiry: string | null;

  // Other Documents
  voter_title: string | null;
  voter_zone: string | null;
  voter_section: string | null;
  military_certificate: string | null;

  // Bank Info
  bank_code: string | null;
  bank_name: string | null;
  agency: string | null;
  agency_digit: string | null;
  account: string | null;
  account_digit: string | null;
  account_type: AccountType | null;
  pix_key: string | null;
  pix_key_type: string | null;

  // Benefits and Dependents
  benefits: Benefit[] | Record<string, unknown>;
  dependents: unknown[];

  // Status
  status: EmployeeStatus;
  termination_date: string | null;
  termination_reason: string | null;
  termination_type: string | null;

  // Other
  photo_url: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type DocumentType =
  | 'rg'
  | 'cpf'
  | 'cnh'
  | 'titulo_eleitor'
  | 'reservista'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'comprovante_residencia'
  | 'foto_3x4'
  | 'ctps'
  | 'pis'
  | 'contrato_trabalho'
  | 'aditivo_contrato'
  | 'termo_rescisao'
  | 'aviso_previo'
  | 'aso_admissional'
  | 'ficha_registro'
  | 'declaracao_dependentes'
  | 'opcao_vale_transporte'
  | 'diploma'
  | 'certificado'
  | 'historico_escolar'
  | 'atestado_medico'
  | 'laudo_medico'
  | 'aso_periodico'
  | 'aso_demissional'
  | 'outros';

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  company_id: string;
  type: DocumentType;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  document_number: string | null;
  issue_date: string | null;
  expires_at: string | null;
  issuing_authority: string | null;
  status: DocumentStatus;
  rejection_reason: string | null;
  validated_by: string | null;
  validated_at: string | null;
  is_sensitive: boolean;
  visible_to_employee: boolean;
  version: number;
  previous_version_id: string | null;
  is_current: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  company_id: string;
  entry_date: string;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  overtime_hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkSchedule {
  id: string;
  company_id: string;
  employee_id: string | null;
  name: string;
  description: string | null;
  schedule_data: ScheduleData;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Interface completa de ausência conforme migration 007_absences.sql
export interface Absence {
  id: string;
  company_id: string;
  employee_id: string;

  // Tipo e período
  type: AbsenceType;
  start_date: string;
  end_date: string;
  total_days: number; // Campo gerado no banco

  // Para férias fracionadas
  vacation_balance_id: string | null;
  is_vacation_split: boolean;
  split_number: number | null; // 1, 2 ou 3

  // Para abono pecuniário
  is_vacation_sold: boolean;
  sold_days: number;

  // Descrição
  reason: string | null;
  notes: string | null;

  // Documentação
  document_url: string | null;
  document_type: string | null;

  // Para licença médica
  cid_code: string | null;
  issuing_doctor: string | null;
  crm: string | null;

  // Status e workflow
  status: AbsenceStatus;

  // Solicitação
  requested_at: string | null;
  requested_by: string | null;

  // Aprovação
  approved_at: string | null;
  approved_by: string | null;

  // Rejeição
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;

  // Cancelamento
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;

  // Impacto financeiro
  affects_salary: boolean;
  salary_deduction_days: number;

  // Integração com ponto
  auto_justify_time_records: boolean;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// Saldo de férias por período aquisitivo
export interface VacationBalance {
  id: string;
  company_id: string;
  employee_id: string;

  // Período aquisitivo
  period_start: string;
  period_end: string;

  // Saldo
  accrued_days: number;
  used_days: number;
  sold_days: number;
  available_days: number; // Campo gerado

  // Validade
  expires_at: string | null;
  is_expired: boolean;

  // Status
  status: 'active' | 'used' | 'expired';

  // Auditoria
  created_at: string;
  updated_at: string;
}

// Política de férias da empresa
export interface VacationPolicy {
  id: string;
  company_id: string;

  // Identificação
  name: string;
  description: string | null;

  // Regras de acumulação
  accrual_days_per_month: number;
  max_accrued_days: number;
  vesting_period_months: number;

  // Regras de utilização
  min_days_per_request: number;
  max_days_per_request: number;
  advance_notice_days: number;

  // Abono pecuniário
  allow_sell_days: boolean;
  max_sell_days: number;

  // Fracionamento
  allow_split: boolean;
  max_splits: number;
  min_first_period_days: number;
  min_other_periods_days: number;

  // Períodos bloqueados
  blackout_periods: Array<{
    start_month: number;
    start_day: number;
    end_month: number;
    end_day: number;
    reason: string;
  }>;

  // Status
  is_active: boolean;
  is_default: boolean;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// Histórico de ausência para auditoria
export interface AbsenceHistory {
  id: string;
  absence_id: string;

  // Mudança
  action: 'created' | 'approved' | 'rejected' | 'cancelled' | 'updated';
  old_status: AbsenceStatus | null;
  new_status: AbsenceStatus | null;

  // Detalhes
  changes: Record<string, unknown> | null;
  notes: string | null;

  // Quem e quando
  performed_by: string | null;
  performed_at: string;
}

// Interface de ausência com dados do funcionário para listagem
export interface AbsenceWithEmployee extends Absence {
  employee_name: string;
  employee_department: string | null;
  employee_photo_url: string | null;
}

export interface ASO {
  id: string;
  employee_id: string;
  company_id: string;
  exam_type: string;
  exam_date: string;
  expiration_date: string;
  result: string;
  doctor_name: string;
  doctor_crm: string;
  clinic_name: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCertificate {
  id: string;
  employee_id: string;
  company_id: string;
  certificate_date: string;
  days_off: number;
  start_date: string;
  end_date: string;
  doctor_name: string;
  doctor_crm: string;
  diagnosis: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationCycle {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: EvaluationStatus;
  template: EvaluationTemplate;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  cycle_id: string;
  employee_id: string;
  evaluator_id: string;
  company_id: string;
  status: EvaluationStatus;
  responses: Record<string, unknown>;
  overall_score: number | null;
  comments: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PDI {
  id: string;
  employee_id: string;
  company_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: PDIStatus;
  goals: PDIGoal[];
  competencies: PDICompetency[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PDICheckIn {
  id: string;
  pdi_id: string;
  checkin_date: string;
  progress: number;
  achievements: string | null;
  challenges: string | null;
  next_steps: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  company_id: string;
  employee_id: string;
  reference_month: string;
  base_salary: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  earnings: PayrollEarning[];
  deductions_detail: PayrollDeduction[];
  generated_at: string;
  paid_at: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

// Payroll Period (migration 011)
export interface PayrollPeriod {
  id: string;
  company_id: string;
  year: number;
  month: number;
  reference_date: string;
  period_type: PayrollPeriodType;
  calculation_date: string | null;
  payment_date: string | null;
  cutoff_date: string | null;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_costs: number;
  total_employees: number;
  total_processed: number;
  total_errors: number;
  status: PayrollStatus;
  approved_by: string | null;
  approved_at: string | null;
  exported_at: string | null;
  export_file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Employee Payroll (folha individual)
export interface EmployeePayroll {
  id: string;
  company_id: string;
  period_id: string;
  employee_id: string;
  employee_data: {
    name: string;
    cpf: string;
    position: string;
    department: string;
    hire_date?: string;
    base_salary?: number;
  };
  base_salary: number;
  worked_days: number;
  worked_hours: number | null;
  missing_days: number;
  missing_hours: number;
  overtime_50_hours: number;
  overtime_50_value: number;
  overtime_100_hours: number;
  overtime_100_value: number;
  night_shift_hours: number;
  night_shift_value: number;
  dsr_value: number;
  earnings: PayrollEarning[];
  deductions: PayrollDeduction[];
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  employer_inss: number;
  employer_fgts: number;
  employer_other: number;
  total_employer_cost: number;
  inss_base: number;
  inss_value: number;
  inss_rate: number | null;
  irrf_base: number;
  irrf_deductions: number;
  irrf_value: number;
  irrf_rate: number | null;
  fgts_base: number;
  fgts_value: number;
  bank_data: {
    bank?: string;
    agency?: string;
    account?: string;
    pix?: string;
  };
  status: PayrollStatus;
  has_errors: boolean;
  error_messages: string[] | null;
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Time Tracking Interfaces
export interface TimeRecord {
  id: string;
  company_id: string;
  employee_id: string;
  record_type: ClockType;
  recorded_at: string;
  location_address: string | null;
  location_accuracy: number | null;
  is_within_geofence: boolean | null;
  device_info: Record<string, unknown>;
  source: RecordSource;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TimeTrackingDaily {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  additional_breaks: { start: string; end: string; type: string }[];
  worked_minutes: number;
  break_minutes: number;
  overtime_minutes: number;
  night_shift_minutes: number;
  missing_minutes: number;
  is_workday: boolean;
  is_holiday: boolean;
  is_compensated: boolean;
  absence_type: string | null;
  absence_id: string | null;
  justification: string | null;
  justification_file_url: string | null;
  status: TimeRecordStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  is_manually_adjusted: boolean;
  adjustment_reason: string | null;
  adjusted_by: string | null;
  adjusted_at: string | null;
  original_values: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TimeBank {
  id: string;
  company_id: string;
  employee_id: string;
  reference_date: string;
  movement_type: TimeBankMovementType;
  minutes: number;
  balance_before: number;
  balance_after: number;
  time_tracking_id: string | null;
  description: string | null;
  expires_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TimeBankBalance {
  employee_id: string;
  balance_minutes: number;
  last_updated: string | null;
}

export interface PresenceStatus {
  employee_id: string;
  employee_name: string;
  department: string | null;
  photo_url: string | null;
  status: 'working' | 'break' | 'remote' | 'absent';
  clock_in: string | null;
  last_action: ClockType | null;
  last_action_time: string | null;
}

// Database type definition
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: {
          name: string;
          status: CompanyStatus;
          id?: string;
          cnpj?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: Address | null;
          logo_url?: string | null;
          settings?: Record<string, unknown>;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Company, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Employee, 'id' | 'created_at'>>;
      };
      employee_documents: {
        Row: EmployeeDocument;
        Insert: Omit<EmployeeDocument, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<EmployeeDocument, 'id' | 'created_at'>>;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TimeEntry, 'id' | 'created_at'>>;
      };
      work_schedules: {
        Row: WorkSchedule;
        Insert: Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WorkSchedule, 'id' | 'created_at'>>;
      };
      absences: {
        Row: Absence;
        Insert: Omit<Absence, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Absence, 'id' | 'created_at'>>;
      };
      asos: {
        Row: ASO;
        Insert: Omit<ASO, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ASO, 'id' | 'created_at'>>;
      };
      medical_certificates: {
        Row: MedicalCertificate;
        Insert: Omit<MedicalCertificate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<MedicalCertificate, 'id' | 'created_at'>>;
      };
      evaluation_cycles: {
        Row: EvaluationCycle;
        Insert: Omit<EvaluationCycle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<EvaluationCycle, 'id' | 'created_at'>>;
      };
      evaluations: {
        Row: Evaluation;
        Insert: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Evaluation, 'id' | 'created_at'>>;
      };
      pdis: {
        Row: PDI;
        Insert: Omit<PDI, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PDI, 'id' | 'created_at'>>;
      };
      pdi_checkins: {
        Row: PDICheckIn;
        Insert: Omit<PDICheckIn, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PDICheckIn, 'id' | 'created_at'>>;
      };
      payrolls: {
        Row: Payroll;
        Insert: Omit<Payroll, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Payroll, 'id' | 'created_at'>>;
      };
      time_records: {
        Row: TimeRecord;
        Insert: Omit<TimeRecord, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TimeRecord, 'id' | 'created_at'>>;
      };
      time_tracking_daily: {
        Row: TimeTrackingDaily;
        Insert: Omit<TimeTrackingDaily, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TimeTrackingDaily, 'id' | 'created_at'>>;
      };
      time_bank: {
        Row: TimeBank;
        Insert: Omit<TimeBank, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TimeBank, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      employee_status: EmployeeStatus;
      contract_type: ContractType;
      absence_type: AbsenceType;
      evaluation_status: EvaluationStatus;
      pdi_status: PDIStatus;
      time_record_status: TimeRecordStatus;
      clock_type: ClockType;
      record_source: RecordSource;
    };
  };
}
