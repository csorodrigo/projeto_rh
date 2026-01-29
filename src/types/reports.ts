// Tipos para o sistema de templates de relatórios

export type ReportType =
  | 'employees'
  | 'time_records'
  | 'absences'
  | 'payroll'
  | 'evaluations'
  | 'health'
  | 'documents'
  | 'pdi'
  | 'custom';

export type ReportFormat = 'csv' | 'pdf' | 'xlsx';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export type DatePeriod =
  | 'today'
  | 'yesterday'
  | 'last_week'
  | 'last_month'
  | 'current_week'
  | 'current_month'
  | 'last_quarter'
  | 'current_quarter'
  | 'last_year'
  | 'current_year'
  | 'custom';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'is_null'
  | 'is_not_null';

export type FilterLogic = 'AND' | 'OR';

export interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  logic?: FilterLogic;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  visible: boolean;
  width?: number;
  format?: string; // Para formatação customizada
}

export interface ReportConfig {
  columns: ReportColumn[];
  filters: ReportFilter[];
  sort?: ReportSort;
  groupBy?: string[];
  limit?: number;
  includeHeaders?: boolean;
  customFields?: Record<string, any>; // Campos customizados por tipo
}

export interface ReportTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: ReportType;
  config: ReportConfig;
  format: ReportFormat;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_user?: {
    name: string;
    email: string;
  };
  schedule?: ReportSchedule;
  categories?: ReportCategory[];
  is_favorite?: boolean;
  shared_with_me?: boolean;
}

export interface ReportSchedule {
  id: string;
  template_id: string;
  frequency: ReportFrequency;
  cron_expression?: string;
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  date_period: DatePeriod;
  recipients: string[];
  next_run?: string;
  last_run?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportHistory {
  id: string;
  template_id: string;
  schedule_id?: string;
  generated_by?: string;
  generated_at: string;
  format: ReportFormat;
  file_url?: string;
  file_size?: number;
  record_count?: number;
  date_range_start?: string;
  date_range_end?: string;
  status: 'success' | 'error' | 'processing';
  error_message?: string;
  processing_time_ms?: number;
  // Relations
  template?: ReportTemplate;
  generated_by_user?: {
    name: string;
    email: string;
  };
}

export interface ReportFavorite {
  user_id: string;
  template_id: string;
  created_at: string;
}

export interface ReportTemplateShare {
  id: string;
  template_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit' | 'execute';
  created_at: string;
  // Relations
  shared_by_user?: {
    name: string;
    email: string;
  };
  shared_with_user?: {
    name: string;
    email: string;
  };
}

export interface ReportCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface ReportResult {
  data: any[];
  columns: ReportColumn[];
  recordCount: number;
  generatedAt: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportConfig extends ReportConfig {
  filename: string;
  title?: string;
  subtitle?: string;
  showSummary?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter';
}

// Field definitions por tipo de relatório
export interface FieldDefinition {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  options?: { value: any; label: string }[]; // Para enums
  filterable: boolean;
  sortable: boolean;
  groupable: boolean;
}

export const REPORT_TYPE_FIELDS: Record<ReportType, FieldDefinition[]> = {
  employees: [
    { field: 'name', label: 'Nome', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'cpf', label: 'CPF', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'email', label: 'Email', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'phone', label: 'Telefone', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'position', label: 'Cargo', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'hire_date', label: 'Data de Admissão', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'base_salary', label: 'Salário Base', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'active', label: 'Ativo' },
      { value: 'inactive', label: 'Inativo' },
      { value: 'on_leave', label: 'Afastado' },
      { value: 'terminated', label: 'Desligado' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'birth_date', label: 'Data de Nascimento', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'address', label: 'Endereço', type: 'string', filterable: true, sortable: false, groupable: false },
    { field: 'city', label: 'Cidade', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'state', label: 'Estado', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  time_records: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'date', label: 'Data', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'clock_in', label: 'Entrada', type: 'string', filterable: false, sortable: true, groupable: false },
    { field: 'clock_out', label: 'Saída', type: 'string', filterable: false, sortable: true, groupable: false },
    { field: 'hours_worked', label: 'Horas Trabalhadas', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'overtime_hours', label: 'Horas Extras', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'present', label: 'Presente' },
      { value: 'absent', label: 'Ausente' },
      { value: 'late', label: 'Atrasado' },
      { value: 'half_day', label: 'Meio Período' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  absences: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'type', label: 'Tipo', type: 'enum', options: [
      { value: 'vacation', label: 'Férias' },
      { value: 'sick_leave', label: 'Atestado Médico' },
      { value: 'personal', label: 'Pessoal' },
      { value: 'unpaid', label: 'Não Remunerado' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'start_date', label: 'Data Início', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'end_date', label: 'Data Fim', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'days', label: 'Dias', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'rejected', label: 'Rejeitado' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'reason', label: 'Motivo', type: 'string', filterable: true, sortable: false, groupable: false },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  payroll: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'period', label: 'Período', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'base_salary', label: 'Salário Base', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'overtime_pay', label: 'Horas Extras', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'bonuses', label: 'Bônus', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'deductions', label: 'Descontos', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'net_salary', label: 'Salário Líquido', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'paid', label: 'Pago' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  evaluations: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'evaluator_name', label: 'Avaliador', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'date', label: 'Data', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'type', label: 'Tipo', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'score', label: 'Nota', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  health: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'exam_type', label: 'Tipo de Exame', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'date', label: 'Data', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'result', label: 'Resultado', type: 'enum', options: [
      { value: 'apt', label: 'Apto' },
      { value: 'inapt', label: 'Inapto' },
      { value: 'pending', label: 'Pendente' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'expiry_date', label: 'Validade', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'valid', label: 'Válido' },
      { value: 'expired', label: 'Vencido' },
      { value: 'expiring_soon', label: 'Vencendo' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  documents: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'document_type', label: 'Tipo de Documento', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'name', label: 'Nome do Documento', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'upload_date', label: 'Data de Upload', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'expiry_date', label: 'Validade', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'valid', label: 'Válido' },
      { value: 'expired', label: 'Vencido' },
      { value: 'expiring_soon', label: 'Vencendo' },
      { value: 'pending', label: 'Pendente' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  pdi: [
    { field: 'employee_name', label: 'Funcionário', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'goal_title', label: 'Meta', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'category', label: 'Categoria', type: 'string', filterable: true, sortable: true, groupable: true },
    { field: 'start_date', label: 'Data Início', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'target_date', label: 'Data Alvo', type: 'date', filterable: true, sortable: true, groupable: false },
    { field: 'progress', label: 'Progresso (%)', type: 'number', filterable: true, sortable: true, groupable: false },
    { field: 'status', label: 'Status', type: 'enum', options: [
      { value: 'not_started', label: 'Não Iniciado' },
      { value: 'in_progress', label: 'Em Andamento' },
      { value: 'completed', label: 'Concluído' },
      { value: 'cancelled', label: 'Cancelado' }
    ], filterable: true, sortable: true, groupable: true },
    { field: 'department', label: 'Departamento', type: 'string', filterable: true, sortable: true, groupable: true },
  ],
  custom: [],
};

// Template de configuração inicial por tipo
export const DEFAULT_CONFIGS: Record<ReportType, Partial<ReportConfig>> = {
  employees: {
    columns: REPORT_TYPE_FIELDS.employees.slice(0, 7).map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  time_records: {
    columns: REPORT_TYPE_FIELDS.time_records.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  absences: {
    columns: REPORT_TYPE_FIELDS.absences.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  payroll: {
    columns: REPORT_TYPE_FIELDS.payroll.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  evaluations: {
    columns: REPORT_TYPE_FIELDS.evaluations.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  health: {
    columns: REPORT_TYPE_FIELDS.health.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  documents: {
    columns: REPORT_TYPE_FIELDS.documents.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  pdi: {
    columns: REPORT_TYPE_FIELDS.pdi.map((field, index) => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
  custom: {
    columns: [],
    filters: [],
  },
};
