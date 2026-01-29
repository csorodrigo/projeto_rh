/**
 * Automation Rules Engine
 * Sistema de regras e automações inteligentes
 */

import type {
  AutomationRule,
  AutomationExecution,
  AutomationCondition,
  AutomationAction,
} from '@/types/ai'

// ============================================================================
// Predefined Rules
// ============================================================================

export const DEFAULT_AUTOMATION_RULES: Omit<
  AutomationRule,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'executionCount' | 'successCount' | 'failureCount'
>[] = [
  {
    name: 'Pesquisa de Satisfação - 90 Dias',
    description: 'Enviar pesquisa de satisfação quando funcionário completar 90 dias',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * *', // Daily at 9 AM
        timezone: 'America/Sao_Paulo',
      },
    },
    conditions: [
      {
        field: 'days_since_hire',
        operator: 'eq',
        value: 90,
      },
    ],
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'satisfaction_survey_90_days',
          subject: 'Como está sendo sua experiência conosco?',
          priority: 'normal',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Acompanhar pesquisa de 90 dias',
          description: 'Verificar resposta da pesquisa e agendar 1:1 se necessário',
          assignTo: 'hr_team',
          dueDate: '+7',
        },
      },
    ],
    priority: 2,
  },
  {
    name: 'Alerta de Ausências Consecutivas',
    description: 'Notificar RH quando funcionário tiver 3+ dias consecutivos de ausência',
    enabled: true,
    trigger: {
      type: 'event',
      config: {
        eventType: 'absence.created',
      },
    },
    conditions: [
      {
        field: 'consecutive_absence_days',
        operator: 'gte',
        value: 3,
      },
    ],
    actions: [
      {
        type: 'notify_user',
        config: {
          userId: 'hr_manager',
          message: 'Funcionário com 3+ dias consecutivos de ausência',
          channel: 'app',
          priority: 'high',
        },
      },
      {
        type: 'send_email',
        config: {
          to: 'rh@empresa.com',
          subject: 'Alerta: Ausência prolongada',
          template: 'prolonged_absence_alert',
        },
      },
    ],
    priority: 1,
  },
  {
    name: 'Alerta de Horas Extras Excessivas',
    description: 'Alertar gestor quando funcionário ultrapassar 20h extras no mês',
    enabled: true,
    trigger: {
      type: 'condition',
      config: {
        checkFrequency: 'daily',
      },
    },
    conditions: [
      {
        field: 'monthly_overtime_hours',
        operator: 'gt',
        value: 20,
      },
    ],
    actions: [
      {
        type: 'notify_user',
        config: {
          userId: 'employee.manager_id',
          message: 'Funcionário com excesso de horas extras este mês',
          channel: 'email',
          priority: 'medium',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Revisar carga de trabalho',
          description: 'Avaliar redistribuição de tarefas ou necessidade de suporte adicional',
          assignTo: 'employee.manager_id',
          dueDate: '+3',
        },
      },
    ],
    priority: 2,
  },
  {
    name: 'Parabéns por Aniversário de Empresa',
    description: 'Enviar mensagem de parabéns no aniversário de empresa',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * *', // Daily at 9 AM
        timezone: 'America/Sao_Paulo',
      },
    },
    conditions: [
      {
        field: 'is_work_anniversary',
        operator: 'eq',
        value: true,
      },
    ],
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'work_anniversary',
          subject: 'Parabéns pelo seu aniversário de empresa!',
          from: 'rh@empresa.com',
        },
      },
      {
        type: 'notify_user',
        config: {
          userId: 'employee.manager_id',
          message: 'Hoje é aniversário de empresa do seu time member',
          channel: 'app',
        },
      },
    ],
    priority: 3,
  },
  {
    name: 'Lembrete de Avaliação de Desempenho',
    description: 'Lembrar gestor 7 dias antes do prazo de avaliação',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * *',
        timezone: 'America/Sao_Paulo',
      },
    },
    conditions: [
      {
        field: 'days_until_evaluation_due',
        operator: 'eq',
        value: 7,
      },
      {
        field: 'evaluation_status',
        operator: 'neq',
        value: 'completed',
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'evaluation_reminder',
          subject: 'Lembrete: Avaliação de desempenho pendente',
          priority: 'high',
        },
      },
    ],
    priority: 2,
  },
  {
    name: 'Onboarding Automático',
    description: 'Criar tarefas de onboarding quando novo funcionário for cadastrado',
    enabled: true,
    trigger: {
      type: 'event',
      config: {
        eventType: 'employee.created',
      },
    },
    conditions: [],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Preparar estação de trabalho',
          description: 'Setup de computador, acessos e materiais',
          assignTo: 'it_team',
          dueDate: 'employee.start_date',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Enviar documentos admissionais',
          description: 'Preparar e enviar contrato e documentos para assinatura',
          assignTo: 'hr_team',
          dueDate: 'employee.start_date - 7',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Agendar integração',
          description: 'Organizar programa de integração e apresentações',
          assignTo: 'hr_team',
          dueDate: 'employee.start_date',
        },
      },
      {
        type: 'send_email',
        config: {
          template: 'welcome_new_employee',
          subject: 'Bem-vindo à empresa!',
          to: 'employee.email',
        },
      },
    ],
    priority: 1,
  },
  {
    name: 'Renovação de ASO',
    description: 'Alertar 30 dias antes do vencimento do ASO',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * *',
        timezone: 'America/Sao_Paulo',
      },
    },
    conditions: [
      {
        field: 'days_until_aso_expiry',
        operator: 'eq',
        value: 30,
      },
    ],
    actions: [
      {
        type: 'create_task',
        config: {
          title: 'Agendar renovação de ASO',
          description: 'Contatar funcionário para agendar exame médico',
          assignTo: 'sesmt_team',
          dueDate: '+7',
        },
      },
      {
        type: 'send_email',
        config: {
          template: 'aso_renewal_reminder',
          subject: 'Renovação do seu Atestado de Saúde Ocupacional',
          to: 'employee.email',
        },
      },
    ],
    priority: 2,
  },
  {
    name: 'Alerta de Férias Vencendo',
    description: 'Alertar funcionário e gestor sobre férias vencendo em 30 dias',
    enabled: true,
    trigger: {
      type: 'schedule',
      config: {
        cron: '0 9 * * MON', // Every Monday at 9 AM
        timezone: 'America/Sao_Paulo',
      },
    },
    conditions: [
      {
        field: 'days_until_vacation_expires',
        operator: 'lte',
        value: 30,
      },
      {
        field: 'has_scheduled_vacation',
        operator: 'eq',
        value: false,
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        type: 'notify_user',
        config: {
          userId: 'employee.id',
          message: 'Suas férias vencem em breve. Agende agora!',
          channel: 'app',
          priority: 'high',
        },
      },
      {
        type: 'notify_user',
        config: {
          userId: 'employee.manager_id',
          message: 'Funcionário com férias vencendo em breve',
          channel: 'email',
        },
      },
    ],
    priority: 2,
  },
]

// ============================================================================
// Rule Execution Engine
// ============================================================================

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map()

  constructor(rules: AutomationRule[] = []) {
    rules.forEach(rule => this.rules.set(rule.id, rule))
  }

  /**
   * Add or update a rule
   */
  addRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId)
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId)
  }

  /**
   * Get all rules
   */
  getAllRules(): AutomationRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): AutomationRule[] {
    return this.getAllRules().filter(rule => rule.enabled)
  }

  /**
   * Evaluate conditions
   */
  evaluateConditions(
    conditions: AutomationCondition[],
    context: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const value = this.getValueFromContext(context, condition.field)
      const result = this.evaluateCondition(value, condition.operator, condition.value)

      if (i === 0) {
        if (!result) return false
      } else {
        const logicalOp = condition.logicalOperator || 'AND'
        if (logicalOp === 'AND' && !result) return false
        if (logicalOp === 'OR' && result) return true
      }
    }

    return true
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    actualValue: any,
    operator: AutomationCondition['operator'],
    expectedValue: any
  ): boolean {
    switch (operator) {
      case 'eq':
        return actualValue === expectedValue
      case 'neq':
        return actualValue !== expectedValue
      case 'gt':
        return actualValue > expectedValue
      case 'gte':
        return actualValue >= expectedValue
      case 'lt':
        return actualValue < expectedValue
      case 'lte':
        return actualValue <= expectedValue
      case 'contains':
        return String(actualValue).includes(String(expectedValue))
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue)
      default:
        return false
    }
  }

  /**
   * Get value from context using dot notation
   */
  private getValueFromContext(context: Record<string, any>, path: string): any {
    const keys = path.split('.')
    let value: any = context

    for (const key of keys) {
      if (value === null || value === undefined) return undefined
      value = value[key]
    }

    return value
  }

  /**
   * Execute a rule
   */
  async executeRule(
    ruleId: string,
    triggerData: Record<string, any>
  ): Promise<AutomationExecution> {
    const rule = this.getRule(ruleId)

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`)
    }

    const execution: AutomationExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'running',
      startedAt: new Date(),
      triggerData,
      actionsExecuted: [],
      logs: [],
    }

    try {
      execution.logs.push(`Starting execution of rule: ${rule.name}`)

      // Check if rule is enabled
      if (!rule.enabled) {
        execution.status = 'cancelled'
        execution.logs.push('Rule is disabled')
        execution.completedAt = new Date()
        return execution
      }

      // Evaluate conditions
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(rule.conditions, triggerData)

        if (!conditionsMet) {
          execution.status = 'cancelled'
          execution.logs.push('Conditions not met')
          execution.completedAt = new Date()
          return execution
        }

        execution.logs.push('All conditions met')
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          execution.logs.push(`Executing action: ${action.type}`)
          const result = await this.executeAction(action, triggerData)

          execution.actionsExecuted.push({
            action: action.type,
            status: 'success',
            result,
          })

          execution.logs.push(`Action ${action.type} completed successfully`)
        } catch (error) {
          execution.actionsExecuted.push({
            action: action.type,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })

          execution.logs.push(
            `Action ${action.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      // Determine overall status
      const failedActions = execution.actionsExecuted.filter(a => a.status === 'failed')
      execution.status = failedActions.length === 0 ? 'success' : 'failed'

      execution.completedAt = new Date()
      execution.duration =
        execution.completedAt.getTime() - execution.startedAt.getTime()

      execution.logs.push(`Execution completed with status: ${execution.status}`)

      // Update rule statistics
      rule.executionCount++
      if (execution.status === 'success') {
        rule.successCount++
      } else {
        rule.failureCount++
      }
      rule.lastTriggeredAt = new Date()

      return execution
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.completedAt = new Date()
      execution.logs.push(`Fatal error: ${execution.error}`)

      rule.executionCount++
      rule.failureCount++
      rule.lastTriggeredAt = new Date()

      return execution
    }
  }

  /**
   * Execute an action (to be implemented with actual integrations)
   */
  private async executeAction(
    action: AutomationAction,
    context: Record<string, any>
  ): Promise<any> {
    // This is a placeholder - actual implementation would integrate with
    // email service, task management, notifications, etc.

    const interpolatedConfig = this.interpolateConfig(action.config, context)

    switch (action.type) {
      case 'send_email':
        return this.sendEmail(interpolatedConfig)

      case 'create_task':
        return this.createTask(interpolatedConfig)

      case 'notify_user':
        return this.notifyUser(interpolatedConfig)

      case 'update_field':
        return this.updateField(interpolatedConfig)

      case 'create_document':
        return this.createDocument(interpolatedConfig)

      case 'webhook':
        return this.callWebhook(interpolatedConfig)

      case 'escalate':
        return this.escalate(interpolatedConfig)

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Interpolate config values with context data
   */
  private interpolateConfig(
    config: Record<string, any>,
    context: Record<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.includes('.')) {
        // Try to resolve from context
        result[key] = this.getValueFromContext(context, value) || value
      } else {
        result[key] = value
      }
    }

    return result
  }

  // Action implementations (placeholders)
  private async sendEmail(config: Record<string, any>): Promise<any> {
    console.log('Sending email:', config)
    // TODO: Implement actual email sending
    return { sent: true, messageId: 'mock_' + Date.now() }
  }

  private async createTask(config: Record<string, any>): Promise<any> {
    console.log('Creating task:', config)
    // TODO: Implement actual task creation
    return { created: true, taskId: 'task_' + Date.now() }
  }

  private async notifyUser(config: Record<string, any>): Promise<any> {
    console.log('Notifying user:', config)
    // TODO: Implement actual notification
    return { notified: true, notificationId: 'notif_' + Date.now() }
  }

  private async updateField(config: Record<string, any>): Promise<any> {
    console.log('Updating field:', config)
    // TODO: Implement actual field update
    return { updated: true }
  }

  private async createDocument(config: Record<string, any>): Promise<any> {
    console.log('Creating document:', config)
    // TODO: Implement actual document creation
    return { created: true, documentId: 'doc_' + Date.now() }
  }

  private async callWebhook(config: Record<string, any>): Promise<any> {
    console.log('Calling webhook:', config)
    // TODO: Implement actual webhook call
    return { called: true }
  }

  private async escalate(config: Record<string, any>): Promise<any> {
    console.log('Escalating:', config)
    // TODO: Implement actual escalation
    return { escalated: true }
  }
}

// ============================================================================
// Exports
// ============================================================================

export function createAutomationEngine(rules?: AutomationRule[]): AutomationEngine {
  return new AutomationEngine(rules)
}

export function createDefaultRules(): AutomationRule[] {
  return DEFAULT_AUTOMATION_RULES.map((rule, index) => ({
    ...rule,
    id: `rule_${index + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
  }))
}
