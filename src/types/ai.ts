/**
 * AI and Automation Types
 * Tipos para chatbot, automações e insights de IA
 */

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: string
    confidence?: number
    context?: Record<string, any>
  }
}

export interface ChatSession {
  id: string
  userId: string
  companyId: string
  messages: ChatMessage[]
  context: {
    userProfile?: any
    currentPage?: string
    recentActions?: string[]
  }
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'archived' | 'escalated'
}

export interface QuickReply {
  id: string
  text: string
  category: 'faq' | 'action' | 'navigation'
  action?: string
  intent?: string
}

// ============================================================================
// Intent Types
// ============================================================================

export type IntentType =
  | 'request_vacation'
  | 'check_balance'
  | 'ask_policy'
  | 'report_issue'
  | 'update_info'
  | 'check_payroll'
  | 'request_document'
  | 'schedule_meeting'
  | 'ask_benefits'
  | 'general_question'
  | 'unknown'

export interface Intent {
  type: IntentType
  confidence: number
  entities?: Record<string, any>
  suggestedAction?: {
    type: string
    description: string
    route?: string
  }
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface KnowledgeEntry {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
  relatedQuestions?: string[]
  source?: string
  lastUpdated: Date
}

export interface CompanyPolicy {
  id: string
  title: string
  category: string
  content: string
  effectiveDate: Date
  version: string
  attachments?: string[]
}

// ============================================================================
// Pattern Detection Types
// ============================================================================

export type PatternType =
  | 'absenteeism'
  | 'overtime'
  | 'late_arrival'
  | 'team_issues'
  | 'burnout_risk'
  | 'performance_decline'
  | 'engagement_drop'

export interface Pattern {
  type: PatternType
  confidence: number // 0-100
  evidence: Array<{
    date: Date
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
  impact: string
  recommendation?: string
}

export interface PatternDetectionResult {
  employeeId: string
  employeeName: string
  patterns: Pattern[]
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: Date
}

// ============================================================================
// Turnover Prediction Types
// ============================================================================

export interface TurnoverFactor {
  name: string
  impact: number // -100 a +100
  description: string
  category: 'positive' | 'negative' | 'neutral'
}

export interface TurnoverPrediction {
  employeeId: string
  employeeName: string
  department: string
  risk: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: TurnoverFactor[]
  confidence: number
  suggestions: string[]
  predictedAt: Date
  validUntil: Date
}

// ============================================================================
// Insight Types
// ============================================================================

export type InsightType =
  | 'pattern_detected'
  | 'turnover_risk'
  | 'process_improvement'
  | 'cost_optimization'
  | 'compliance_alert'
  | 'team_performance'
  | 'recruitment_efficiency'

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Insight {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
  data: Record<string, any>
  suggestions: string[]
  affectedEntities?: Array<{
    type: 'employee' | 'department' | 'team' | 'process'
    id: string
    name: string
  }>
  createdAt: Date
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed'
  assignedTo?: string
  resolvedAt?: Date
  tags?: string[]
}

// ============================================================================
// Automation Types
// ============================================================================

export type TriggerType = 'event' | 'schedule' | 'condition'

export interface AutomationTrigger {
  type: TriggerType
  config: Record<string, any>
  // Event: { eventType: 'employee.created', filters: {} }
  // Schedule: { cron: '0 9 * * 1', timezone: 'America/Sao_Paulo' }
  // Condition: { field: 'absence_days', operator: '>', value: 3 }
}

export interface AutomationCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export type ActionType =
  | 'send_email'
  | 'create_task'
  | 'notify_user'
  | 'update_field'
  | 'create_document'
  | 'webhook'
  | 'escalate'

export interface AutomationAction {
  type: ActionType
  config: Record<string, any>
  // send_email: { to: '', subject: '', template: '' }
  // create_task: { title: '', assignTo: '', dueDate: '' }
  // notify_user: { userId: '', message: '', channel: 'app' | 'email' }
  // update_field: { entity: '', field: '', value: '' }
}

export interface AutomationRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  trigger: AutomationTrigger
  conditions?: AutomationCondition[]
  actions: AutomationAction[]
  priority?: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastTriggeredAt?: Date
  executionCount: number
  successCount: number
  failureCount: number
}

export interface AutomationExecution {
  id: string
  ruleId: string
  ruleName: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  duration?: number
  triggerData: Record<string, any>
  actionsExecuted: Array<{
    action: string
    status: 'success' | 'failed'
    result?: any
    error?: string
  }>
  error?: string
  logs: string[]
}

// ============================================================================
// Suggestion Types
// ============================================================================

export type SuggestionCategory =
  | 'employee_management'
  | 'recruitment'
  | 'performance'
  | 'compliance'
  | 'cost_saving'
  | 'process_improvement'

export interface SmartSuggestion {
  id: string
  category: SuggestionCategory
  title: string
  description: string
  reasoning: string
  impact: {
    type: 'cost' | 'time' | 'quality' | 'risk' | 'efficiency'
    value: number
    unit: string
  }
  actions: Array<{
    label: string
    type: 'primary' | 'secondary'
    action: string
    params?: Record<string, any>
  }>
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'applied' | 'ignored' | 'dismissed'
  createdAt: Date
  validUntil?: Date
  appliedAt?: Date
  appliedBy?: string
}

// ============================================================================
// Training Types
// ============================================================================

export interface TrainingDocument {
  id: string
  name: string
  type: 'policy' | 'faq' | 'procedure' | 'manual' | 'other'
  content: string
  category: string
  tags: string[]
  status: 'pending' | 'processed' | 'active' | 'archived'
  uploadedAt: Date
  uploadedBy: string
  processedAt?: Date
  vectorized: boolean
  metadata?: Record<string, any>
}

export interface ChatFeedback {
  id: string
  sessionId: string
  messageId: string
  userId: string
  rating: 'positive' | 'negative'
  comment?: string
  createdAt: Date
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ChatbotAnalytics {
  totalSessions: number
  totalMessages: number
  avgMessagesPerSession: number
  avgResponseTime: number
  resolutionRate: number
  escalationRate: number
  topIntents: Array<{
    intent: IntentType
    count: number
    percentage: number
  }>
  userSatisfaction: {
    positive: number
    negative: number
    score: number
  }
  peakHours: Array<{
    hour: number
    messageCount: number
  }>
  period: {
    start: Date
    end: Date
  }
}

export interface AutomationAnalytics {
  totalRules: number
  activeRules: number
  totalExecutions: number
  successRate: number
  avgExecutionTime: number
  topRules: Array<{
    ruleId: string
    name: string
    executionCount: number
    successRate: number
  }>
  errorRate: number
  timesSaved: number
  costsSaved: number
  period: {
    start: Date
    end: Date
  }
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ChatRequest {
  message: string
  sessionId?: string
  context?: Record<string, any>
}

export interface ChatResponse {
  message: string
  sessionId: string
  intent?: Intent
  suggestions?: QuickReply[]
  metadata?: Record<string, any>
}

export interface SuggestionsRequest {
  context: 'dashboard' | 'employee' | 'department' | 'recruitment'
  entityId?: string
  limit?: number
}

export interface SuggestionsResponse {
  suggestions: SmartSuggestion[]
  insights: Insight[]
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AIConfig {
  chatbot: {
    enabled: boolean
    provider: 'openai' | 'anthropic' | 'local'
    model: string
    temperature: number
    maxTokens: number
    streamingEnabled: boolean
    rateLimitPerUser: number
    rateLimitWindow: number
  }
  automation: {
    enabled: boolean
    maxConcurrentExecutions: number
    retryAttempts: number
    retryDelay: number
  }
  insights: {
    enabled: boolean
    updateFrequency: 'realtime' | 'hourly' | 'daily'
    confidenceThreshold: number
  }
  training: {
    allowCustomDocuments: boolean
    autoProcessing: boolean
    requireApproval: boolean
  }
}
