/**
 * Central Type Exports
 * Re-exports all types for convenient importing
 */

// Database types
export type {
  Database,
  Company,
  Profile,
  Employee,
  EmployeeDocument,
  TimeEntry,
  WorkSchedule,
  Absence,
  ASO,
  MedicalCertificate,
  EvaluationCycle,
  Evaluation,
  PDI,
  PDICheckIn,
  Payroll,
  // Enums
  UserRole,
  EmployeeStatus,
  ContractType,
  AbsenceType,
  EvaluationStatus,
  PDIStatus,
  // JSON types
  Address,
  Benefit,
  ScheduleData,
  PDIGoal,
  PDICompetency,
  EvaluationTemplate,
  EvaluationSection,
  EvaluationQuestion,
  PayrollEarning,
  PayrollDeduction,
} from './database';

// Query result types
export type {
  QueryError,
  QueryResult,
  QueryResultArray,
} from '@/lib/supabase/queries';

// Auth types
export type {
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
} from '@/lib/supabase/auth';
