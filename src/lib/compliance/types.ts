/**
 * Compliance Types - Tipos centralizados para modulo de conformidade
 * Portaria 671 MTE
 */

import type {
  Company,
  Employee,
  TimeRecord,
  TimeTrackingDaily,
  WorkSchedule,
} from '@/types/database'

// ============================================================================
// AFD Types - Arquivo Fonte de Dados
// ============================================================================

/**
 * Tipo de registro AFD conforme Portaria 671
 */
export type AFDRecordType = 1 | 2 | 3 | 4 | 5 | 9

/**
 * Tipo de identificador do empregador
 */
export type EmployerIdentifierType = 1 | 2 // 1 = CNPJ, 2 = CPF

/**
 * Tipo de REP (Registrador Eletronico de Ponto)
 */
export type REPType = 1 | 2 | 3 // 1 = REP-C, 2 = REP-A, 3 = REP-P

/**
 * Encoding suportado para arquivos AFD/AEJ
 */
export type FileEncoding = 'ISO-8859-1' | 'UTF-8'

/**
 * Configuracao base para geradores de arquivo
 */
export interface BaseGeneratorConfig {
  /** Encoding do arquivo */
  encoding?: FileEncoding
}

/**
 * Registro de cabecalho AFD (Tipo 1)
 * Posicoes: 99 caracteres fixos
 */
export interface AFDHeaderRecord {
  /** Tipo de registro (sempre 1) */
  recordType: 1
  /** NSR - Numero Sequencial do Registro */
  nsr: number
  /** Tipo do identificador (1=CNPJ, 2=CPF) */
  identifierType: EmployerIdentifierType
  /** CNPJ ou CPF do empregador (14 ou 11 digitos) */
  employerDocument: string
  /** CEI do empregador (opcional, 12 digitos) */
  cei: string | null
  /** Razao social do empregador (150 caracteres) */
  companyName: string
  /** Numero de fabricacao do REP (17 caracteres) */
  repNumber: string
  /** Data inicio do periodo (DDMMAAAA) */
  startDate: string
  /** Data fim do periodo (DDMMAAAA) */
  endDate: string
  /** Data/hora de geracao do arquivo (DDMMAAAAHHMI) */
  generatedAt: string
}

/**
 * Registro de identificacao do REP (Tipo 2)
 */
export interface AFDREPRecord {
  /** Tipo de registro (sempre 2) */
  recordType: 2
  /** NSR - Numero Sequencial do Registro */
  nsr: number
  /** Numero de fabricacao do REP */
  repNumber: string
  /** Tipo do REP (1=REP-C, 2=REP-A, 3=REP-P) */
  repType: REPType
  /** Marca/Modelo do REP */
  brandModel: string
  /** Versao do firmware/software */
  version: string
}

/**
 * Registro de marcacao de ponto (Tipo 3)
 */
export interface AFDClockRecord {
  /** Tipo de registro (sempre 3) */
  recordType: 3
  /** NSR - Numero Sequencial do Registro */
  nsr: number
  /** PIS do trabalhador (12 digitos) */
  pis: string
  /** Data da marcacao (DDMMAAAA) */
  date: string
  /** Hora da marcacao (HHMM) */
  time: string
}

/**
 * Registro de ajuste de marcacao (Tipo 4)
 */
export interface AFDAdjustmentRecord {
  /** Tipo de registro (sempre 4) */
  recordType: 4
  /** NSR - Numero Sequencial do Registro */
  nsr: number
  /** Data original (DDMMAAAA) */
  originalDate: string
  /** Hora original (HHMM) */
  originalTime: string
  /** Data ajustada (DDMMAAAA) */
  adjustedDate: string
  /** Hora ajustada (HHMM) */
  adjustedTime: string
  /** PIS do trabalhador (12 digitos) */
  pis: string
}

/**
 * Registro de inclusao de marcacao (Tipo 5)
 */
export interface AFDInclusionRecord {
  /** Tipo de registro (sempre 5) */
  recordType: 5
  /** NSR - Numero Sequencial do Registro */
  nsr: number
  /** Data da inclusao (DDMMAAAA) */
  date: string
  /** Hora da inclusao (HHMM) */
  time: string
  /** PIS do trabalhador (12 digitos) */
  pis: string
}

/**
 * Registro de trailer/rodape (Tipo 9)
 */
export interface AFDTrailerRecord {
  /** Tipo de registro (sempre 9) */
  recordType: 9
  /** Quantidade total de registros no arquivo */
  totalRecords: number
}

/**
 * Uniao de todos os tipos de registro AFD
 */
export type AFDRecord =
  | AFDHeaderRecord
  | AFDREPRecord
  | AFDClockRecord
  | AFDAdjustmentRecord
  | AFDInclusionRecord
  | AFDTrailerRecord

// ============================================================================
// AEJ Types - Arquivo Eletronico de Jornada
// ============================================================================

/**
 * Formato de saida do AEJ
 */
export type AEJOutputFormat = 'txt' | 'csv'

/**
 * Resumo de jornada por periodo
 */
export interface JourneySummary {
  /** Total de dias uteis no periodo */
  totalWorkdays: number
  /** Total de dias trabalhados */
  totalWorkedDays: number
  /** Total de dias de falta */
  absenceDays: number
  /** Horas trabalhadas (minutos) */
  workedMinutes: number
  /** Horas extras 50% (minutos) */
  overtime50Minutes: number
  /** Horas extras 100% (minutos) */
  overtime100Minutes: number
  /** Horas noturnas (minutos) */
  nightMinutes: number
  /** Horas faltantes (minutos) */
  missingMinutes: number
  /** Saldo banco de horas (minutos) */
  timeBankBalance: number
}

/**
 * Valores financeiros calculados
 */
export interface FinancialSummary {
  /** Salario base */
  baseSalary: number
  /** Valor da hora normal */
  hourlyRate: number
  /** Valor total HE 50% */
  overtime50Value: number
  /** Valor total HE 100% */
  overtime100Value: number
  /** Valor adicional noturno */
  nightShiftValue: number
  /** Valor DSR sobre HE */
  dsrValue: number
  /** Total de adicionais */
  totalAdditionals: number
  /** Desconto por faltas */
  absenceDeduction: number
  /** Liquido (adicionais - descontos) */
  netValue: number
}

/**
 * Registro de jornada de um funcionario para AEJ
 */
export interface EmployeeJourneyData {
  /** Dados do funcionario */
  employee: Employee
  /** Escala de trabalho */
  schedule?: WorkSchedule
  /** Resumo da jornada */
  journey: JourneySummary
  /** Valores financeiros (opcional) */
  financial?: FinancialSummary
  /** Detalhes diarios (opcional) */
  dailyDetails?: DailyJourneyDetail[]
}

/**
 * Detalhe de jornada por dia
 */
export interface DailyJourneyDetail {
  /** Data */
  date: Date
  /** Horario de entrada */
  clockIn: string | null
  /** Horario de saida */
  clockOut: string | null
  /** Inicio do intervalo */
  breakStart: string | null
  /** Fim do intervalo */
  breakEnd: string | null
  /** Minutos trabalhados */
  workedMinutes: number
  /** Minutos de intervalo */
  breakMinutes: number
  /** HE 50% (minutos) */
  overtime50Minutes: number
  /** HE 100% (minutos) */
  overtime100Minutes: number
  /** Horas noturnas (minutos) */
  nightMinutes: number
  /** Minutos faltantes */
  missingMinutes: number
  /** E dia util? */
  isWorkday: boolean
  /** E feriado? */
  isHoliday: boolean
  /** Observacoes/avisos */
  notes: string[]
}

// ============================================================================
// Report Types - Relatorios
// ============================================================================

/**
 * Formato de saida do relatorio
 */
export type ReportFormat = 'pdf' | 'html' | 'csv'

/**
 * Tipo de relatorio disponivel
 */
export type ReportType =
  | 'time_mirror'        // Espelho de ponto
  | 'overtime'           // Relatorio de horas extras
  | 'absences'           // Relatorio de faltas/atrasos
  | 'time_bank'          // Extrato de banco de horas
  | 'monthly_summary'    // Resumo mensal

/**
 * Configuracao base para relatorios
 */
export interface BaseReportConfig {
  /** Formato de saida */
  format?: ReportFormat
  /** Incluir cabecalho com logo */
  includeHeader?: boolean
  /** Incluir rodape com paginacao */
  includeFooter?: boolean
  /** Titulo customizado */
  title?: string
  /** Observacoes adicionais */
  notes?: string
}

/**
 * Configuracao para espelho de ponto
 */
export interface TimeMirrorReportConfig extends BaseReportConfig {
  /** Incluir assinatura do funcionario */
  includeSignature?: boolean
  /** Incluir assinatura do gestor */
  includeManagerSignature?: boolean
  /** Mostrar detalhes de localizacao */
  showLocation?: boolean
  /** Mostrar dispositivo usado */
  showDevice?: boolean
}

/**
 * Configuracao para relatorio de horas extras
 */
export interface OvertimeReportConfig extends BaseReportConfig {
  /** Agrupar por departamento */
  groupByDepartment?: boolean
  /** Incluir valores monetarios */
  includeMonetary?: boolean
  /** Filtrar tipo de HE (50%, 100%, ou ambos) */
  overtimeType?: '50' | '100' | 'all'
}

/**
 * Configuracao para relatorio de faltas
 */
export interface AbsencesReportConfig extends BaseReportConfig {
  /** Agrupar por departamento */
  groupByDepartment?: boolean
  /** Incluir valores de desconto */
  includeDeductions?: boolean
  /** Filtrar por tipo (justificada, nao justificada, todas) */
  absenceType?: 'justified' | 'unjustified' | 'all'
}

/**
 * Dados para geracao de espelho de ponto
 */
export interface TimeMirrorReportData {
  /** Dados da empresa */
  company: Company
  /** Dados do funcionario */
  employee: Employee
  /** Registros diarios */
  dailyRecords: TimeTrackingDaily[]
  /** Periodo inicio */
  startDate: Date
  /** Periodo fim */
  endDate: Date
  /** Feriados no periodo */
  holidays: Date[]
  /** Escala de trabalho */
  schedule?: WorkSchedule
}

/**
 * Dados para relatorio de horas extras
 */
export interface OvertimeReportData {
  /** Dados da empresa */
  company: Company
  /** Lista de funcionarios com HE */
  employees: Array<{
    employee: Employee
    overtime50Hours: number
    overtime50Value: number
    overtime100Hours: number
    overtime100Value: number
    dsrValue: number
    totalValue: number
  }>
  /** Periodo inicio */
  startDate: Date
  /** Periodo fim */
  endDate: Date
}

/**
 * Dados para relatorio de faltas
 */
export interface AbsencesReportData {
  /** Dados da empresa */
  company: Company
  /** Lista de funcionarios com faltas */
  employees: Array<{
    employee: Employee
    absenceDays: number
    lateDays: number
    earlyLeaveDays: number
    totalMissingMinutes: number
    deductionValue: number
    details: Array<{
      date: Date
      type: 'absence' | 'late' | 'early_leave'
      missingMinutes: number
      justification?: string
    }>
  }>
  /** Periodo inicio */
  startDate: Date
  /** Periodo fim */
  endDate: Date
}

/**
 * Resultado da geracao de relatorio
 */
export interface ReportResult {
  /** Conteudo do relatorio */
  content: string | Buffer
  /** Nome do arquivo */
  filename: string
  /** Tipo MIME */
  mimeType: string
  /** Tamanho em bytes */
  size: number
  /** Formato */
  format: ReportFormat
  /** Metadados adicionais */
  metadata: {
    generatedAt: Date
    totalPages?: number
    totalRecords?: number
  }
}

// ============================================================================
// Validation Types - Validacao
// ============================================================================

/**
 * Severidade de um problema de validacao
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Codigo de erro de validacao
 */
export type ValidationErrorCode =
  // Erros de estrutura
  | 'INVALID_RECORD_LENGTH'
  | 'INVALID_RECORD_TYPE'
  | 'INVALID_NSR_SEQUENCE'
  | 'MISSING_HEADER'
  | 'MISSING_TRAILER'
  | 'DUPLICATE_NSR'
  // Erros de dados
  | 'INVALID_CNPJ'
  | 'INVALID_CPF'
  | 'INVALID_PIS'
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'INVALID_CHECK_DIGIT'
  // Erros de negocio
  | 'OVERLAPPING_RECORDS'
  | 'INVALID_CLOCK_SEQUENCE'
  | 'EXCEEDS_DAILY_LIMIT'
  | 'MISSING_BREAK'
  // Avisos
  | 'EMPTY_PERIOD'
  | 'MISSING_PIS'
  | 'INCONSISTENT_TOTALS'

/**
 * Problema encontrado na validacao
 */
export interface ValidationIssue {
  /** Codigo do erro */
  code: ValidationErrorCode
  /** Severidade */
  severity: ValidationSeverity
  /** Mensagem descritiva */
  message: string
  /** Linha do arquivo (se aplicavel) */
  line?: number
  /** NSR do registro (se aplicavel) */
  nsr?: number
  /** Campo com problema (se aplicavel) */
  field?: string
  /** Valor encontrado (se aplicavel) */
  foundValue?: string
  /** Valor esperado (se aplicavel) */
  expectedValue?: string
  /** Contexto adicional */
  context?: Record<string, unknown>
}

/**
 * Resultado da validacao
 */
export interface ValidationResult {
  /** Validacao passou? */
  isValid: boolean
  /** Lista de problemas encontrados */
  issues: ValidationIssue[]
  /** Contagem por severidade */
  summary: {
    errors: number
    warnings: number
    info: number
  }
  /** Estatisticas do arquivo */
  stats?: {
    totalRecords: number
    recordsByType: Record<number, number>
    uniqueEmployees: number
    dateRange: {
      start: Date | null
      end: Date | null
    }
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Opcoes de periodo para relatorios
 */
export interface PeriodOptions {
  /** Data de inicio */
  startDate: Date
  /** Data de fim */
  endDate: Date
  /** Feriados customizados */
  holidays?: Date[]
}

/**
 * Dados de assinatura digital
 */
export interface DigitalSignature {
  /** Hash SHA-256 do conteudo */
  hash: string
  /** Timestamp da assinatura */
  timestamp: Date
  /** Identificador do assinante */
  signerId: string
  /** Nome do assinante */
  signerName: string
  /** Cargo do assinante */
  signerRole?: string
}

/**
 * Metadados de arquivo gerado
 */
export interface GeneratedFileMetadata {
  /** Nome do arquivo */
  filename: string
  /** Tipo MIME */
  mimeType: string
  /** Tamanho em bytes */
  size: number
  /** Data de geracao */
  generatedAt: Date
  /** Versao do gerador */
  generatorVersion: string
  /** Checksum SHA-256 */
  checksum: string
  /** Assinatura digital (opcional) */
  signature?: DigitalSignature
}

/**
 * Resposta padrao para operacoes de compliance
 */
export interface ComplianceOperationResult<T = unknown> {
  /** Operacao bem sucedida? */
  success: boolean
  /** Dados retornados */
  data?: T
  /** Mensagem de erro (se houver) */
  error?: string
  /** Detalhes do erro (se houver) */
  errorDetails?: ValidationIssue[]
  /** Metadados da operacao */
  metadata?: {
    executionTime: number
    timestamp: Date
  }
}
