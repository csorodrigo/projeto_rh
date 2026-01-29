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
  PayrollPeriod,
  EmployeePayroll,
  // Enums
  UserRole,
  EmployeeStatus,
  ContractType,
  AbsenceType,
  EvaluationStatus,
  PDIStatus,
  PayrollStatus,
  PayrollPeriodType,
  PayrollEventType,
  EventRecurrence,
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

// Recruitment types
export type {
  // Enums
  JobStatus,
  JobType,
  JobLocation,
  ExperienceLevel,
  ApplicationStatus,
  ApplicationSource,
  ActivityType,
  InterviewType,
  InterviewStatus,
  CandidateRating,
  // Interfaces
  Job,
  PipelineStage,
  Candidate,
  Application,
  Rating,
  Activity,
  Interview,
  InterviewerInfo,
  CandidateDocument,
  // Extended types
  CandidateWithApplications,
  ApplicationWithJob,
  ApplicationWithCandidate,
  ApplicationWithDetails,
  ActivityWithUser,
  // Utility types
  CandidateDuplicate,
  MergeCandidateRequest,
  // Statistics
  JobStatistics,
  RecruitmentMetrics,
  // Form types
  CreateCandidateFormData,
  CreateApplicationFormData,
  AddActivityFormData,
  ScheduleInterviewFormData,
} from './recruitment';

// Organogram types
export type {
  OrgNode,
  OrgPosition,
  OrgConnection,
  OrgLayout,
  LayoutType,
  OrgChartFilters,
  OrgChartSettings,
  HierarchyChange,
  OrgExportOptions,
  OrgFlowNode,
  OrgFlowEdge,
  OrgStatistics,
  ValidationResult,
} from './organogram';

// AI types
export type {
  // Chat types
  ChatMessage,
  ChatSession,
  QuickReply,
  // Intent types
  IntentType,
  Intent,
  // Knowledge base types
  KnowledgeEntry,
  CompanyPolicy,
  // Pattern detection types
  PatternType,
  Pattern,
  PatternDetectionResult,
  // Turnover prediction types
  TurnoverFactor,
  TurnoverPrediction,
  // Insight types
  InsightType,
  InsightSeverity,
  Insight,
  // Automation types
  TriggerType,
  AutomationTrigger,
  AutomationCondition,
  ActionType,
  AutomationAction,
  AutomationRule,
  AutomationExecution,
  // Suggestion types
  SuggestionCategory,
  SmartSuggestion,
  // Training types
  TrainingDocument,
  ChatFeedback,
  // Analytics types
  ChatbotAnalytics,
  AutomationAnalytics,
  // API types
  ChatRequest,
  ChatResponse,
  SuggestionsRequest,
  SuggestionsResponse,
  // Config types
  AIConfig,
} from './ai';
