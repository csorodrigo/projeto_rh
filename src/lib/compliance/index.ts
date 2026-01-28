/**
 * Compliance Module - Conformidade com legislacao trabalhista brasileira
 *
 * Este modulo implementa:
 * - AFD (Arquivo Fonte de Dados) conforme Portaria 671 MTE
 * - AEJ (Arquivo Eletronico de Jornada) conforme Portaria 671 MTE
 * - Calculos CLT (horas extras, adicional noturno, DSR, banco de horas)
 * - Validacao de integridade de arquivos
 * - Geracao de relatorios (Espelho de Ponto, Horas Extras, Faltas)
 */

// ============================================================================
// Types - Tipos centralizados
// ============================================================================
export type {
  // AFD Types
  AFDRecordType,
  EmployerIdentifierType,
  REPType,
  FileEncoding,
  BaseGeneratorConfig,
  AFDHeaderRecord,
  AFDREPRecord,
  AFDClockRecord,
  AFDAdjustmentRecord,
  AFDInclusionRecord,
  AFDTrailerRecord,
  AFDRecord,
  // AEJ Types
  AEJOutputFormat,
  JourneySummary,
  FinancialSummary,
  EmployeeJourneyData,
  DailyJourneyDetail,
  // Report Types
  ReportFormat,
  ReportType,
  BaseReportConfig,
  TimeMirrorReportConfig,
  OvertimeReportConfig,
  AbsencesReportConfig,
  TimeMirrorReportData,
  OvertimeReportData,
  AbsencesReportData,
  ReportResult,
  // Validation Types
  ValidationSeverity,
  ValidationErrorCode,
  ValidationIssue,
  ValidationResult,
  // Utility Types
  PeriodOptions,
  DigitalSignature,
  GeneratedFileMetadata,
  ComplianceOperationResult,
} from './types'

// ============================================================================
// CLT Calculations - Calculos trabalhistas
// ============================================================================
export {
  CLT_CONSTANTS,
  type DailyTimeRecord,
  type DailyJourneyResult,
  type MonthlyJourneyResult,
  type MonetaryValues,
  timeToMinutes,
  minutesToTime,
  minutesToDecimalHours,
  isNightTime,
  calculateNightMinutes,
  applyNightReduction,
  getMinutesDiff,
  getExpectedMinutes,
  applyTolerance,
  calculateDailyJourney,
  calculateMonthlyJourney,
  calculateHourlyRate,
  calculateDSR,
  calculateMonetaryValues,
  calculateTimeBankBalance,
  formatCurrency,
  formatMinutesAsTime,
  isNationalHoliday,
  countSundaysAndHolidays,
} from './clt-calculations'

// ============================================================================
// AFD Generator - Arquivo Fonte de Dados
// ============================================================================
export {
  type AFDEncoding,
  type AFDConfig,
  type AFDData,
  type TimeAdjustment,
  type TimeInclusion,
  type AFDResult,
  AFDGenerator,
  generateAFD,
  validatePIS,
  formatPIS,
} from './afd-generator'

// ============================================================================
// AEJ Generator - Arquivo Eletronico de Jornada
// ============================================================================
export {
  type AEJEncoding,
  type AEJConfig,
  type AEJData,
  type EmployeeJourneyRecord,
  type AEJResult,
  AEJGenerator,
  generateAEJ,
} from './aej-generator'

// ============================================================================
// Validators - Validacao de integridade
// ============================================================================
export {
  // Document validators
  validateCNPJ,
  validateCPF,
  validatePIS as validatePISDigit,
  validateDateDDMMAAAA,
  validateTimeHHMM,
  // AFD validators
  validateAFDIntegrity,
  validateClockSequence,
  validateDailyLimit,
  validateBreakDuration,
  // Utilities
  calculateChecksum,
  formatValidationResult,
  createValidationIssue,
} from './validators'

// ============================================================================
// Report Generator - Geracao de relatorios
// ============================================================================
export {
  // Time Mirror (Espelho de Ponto)
  generateTimeMirrorReport,
  // Overtime Report (Horas Extras)
  generateOvertimeReport,
  // Absences Report (Faltas/Atrasos)
  generateAbsencesReport,
  // Payroll Report (Folha de Pagamento)
  generatePayrollReport,
  // Utilities
  convertReportToCSV,
} from './report-generator'
