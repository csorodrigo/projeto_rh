/**
 * Queries para configurações de produtividade
 */

import { createClient } from '@/lib/supabase/client'

// Types para configurações
export interface ImportSettings {
  columnMappings: ColumnMapping[]
  validationRules: ValidationRules
  autoApprove: AutoApproveConfig
}

export interface ColumnMapping {
  field: string
  label: string
  alternativeNames: string[]
}

export interface ValidationRules {
  cpfRequired: boolean
  emailRequired: boolean
  blockDuplicates: boolean
}

export interface AutoApproveConfig {
  enabled: boolean
  threshold: number
}

export interface NotificationPreferences {
  userId: string
  preferences: Record<string, NotificationChannels>
  doNotDisturb: DoNotDisturbConfig
  digest: DigestConfig
}

export interface NotificationChannels {
  inApp: boolean
  email: boolean
}

export interface DoNotDisturbConfig {
  enabled: boolean
  start: string
  end: string
}

export interface DigestConfig {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
}

export interface WorkflowRules {
  companyId: string
  rules: Record<string, DepartmentRule>
  sla: SLAConfig
}

export interface DepartmentRule {
  level1?: string
  level2?: string
  sla: number
}

export interface SLAConfig {
  alertsEnabled: boolean
  escalateEnabled: boolean
  escalateAfter: number
}

export interface ReportDefaults {
  userId: string
  destination: 'download' | 'email' | 'storage'
  format: 'csv' | 'xlsx' | 'pdf'
}

/**
 * Buscar configurações de importação
 */
export async function getImportSettings(companyId: string): Promise<ImportSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('company_settings')
    .select('import_settings')
    .eq('company_id', companyId)
    .single()

  if (error) {
    console.error('Error fetching import settings:', error)
    // Retornar configurações padrão
    return {
      columnMappings: [
        { field: 'nome', label: 'Nome', alternativeNames: ['nome_completo', 'full_name', 'name'] },
        { field: 'cpf', label: 'CPF', alternativeNames: ['documento', 'doc'] },
        { field: 'email', label: 'Email', alternativeNames: ['e-mail', 'email_address'] },
        { field: 'data_admissao', label: 'Data de Admissão', alternativeNames: ['admissao', 'hire_date', 'data_contratacao'] },
        { field: 'cargo', label: 'Cargo', alternativeNames: ['funcao', 'position', 'job_title'] },
        { field: 'departamento', label: 'Departamento', alternativeNames: ['dept', 'department', 'setor'] },
      ],
      validationRules: {
        cpfRequired: true,
        emailRequired: true,
        blockDuplicates: true,
      },
      autoApprove: {
        enabled: false,
        threshold: 10,
      },
    }
  }

  return data.import_settings
}

/**
 * Salvar configurações de importação
 */
export async function saveImportSettings(
  companyId: string,
  settings: ImportSettings
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('company_settings')
    .upsert({
      company_id: companyId,
      import_settings: settings,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error saving import settings:', error)
    throw error
  }
}

/**
 * Buscar preferências de notificação do usuário
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('notification_preferences')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching notification preferences:', error)
    // Retornar preferências padrão
    return {
      userId,
      preferences: {
        import_complete: { inApp: true, email: false },
        approval_needed: { inApp: true, email: true },
        approval_approved: { inApp: true, email: false },
        approval_rejected: { inApp: true, email: true },
        workflow_assigned: { inApp: true, email: true },
        sla_warning: { inApp: true, email: true },
        report_ready: { inApp: true, email: false },
      },
      doNotDisturb: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      digest: {
        frequency: 'realtime',
      },
    }
  }

  return data.notification_preferences
}

/**
 * Salvar preferências de notificação
 */
export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error saving notification preferences:', error)
    throw error
  }
}

/**
 * Buscar regras de workflow
 */
export async function getWorkflowRules(companyId: string): Promise<WorkflowRules> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('company_settings')
    .select('workflow_rules')
    .eq('company_id', companyId)
    .single()

  if (error) {
    console.error('Error fetching workflow rules:', error)
    // Retornar regras padrão
    return {
      companyId,
      rules: {},
      sla: {
        alertsEnabled: true,
        escalateEnabled: false,
        escalateAfter: 24,
      },
    }
  }

  return data.workflow_rules
}

/**
 * Salvar regras de workflow
 */
export async function saveWorkflowRules(
  companyId: string,
  rules: WorkflowRules
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('company_settings')
    .upsert({
      company_id: companyId,
      workflow_rules: rules,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error saving workflow rules:', error)
    throw error
  }
}

/**
 * Buscar configurações padrão de relatórios
 */
export async function getReportDefaults(userId: string): Promise<ReportDefaults> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('report_defaults')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching report defaults:', error)
    // Retornar padrões
    return {
      userId,
      destination: 'download',
      format: 'xlsx',
    }
  }

  return data.report_defaults
}

/**
 * Salvar configurações padrão de relatórios
 */
export async function saveReportDefaults(
  userId: string,
  defaults: ReportDefaults
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      report_defaults: defaults,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error saving report defaults:', error)
    throw error
  }
}

/**
 * Buscar delegações ativas
 */
export async function getActiveDelegations(companyId: string) {
  const supabase = createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('workflow_delegations')
    .select(`
      *,
      from_user:usuarios!workflow_delegations_from_user_id_fkey(id, nome, avatar_url),
      to_user:usuarios!workflow_delegations_to_user_id_fkey(id, nome, avatar_url)
    `)
    .eq('company_id', companyId)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching active delegations:', error)
    return []
  }

  return data
}

/**
 * Revogar delegação
 */
export async function revokeDelegation(delegationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('workflow_delegations')
    .update({ end_date: new Date().toISOString() })
    .eq('id', delegationId)

  if (error) {
    console.error('Error revoking delegation:', error)
    throw error
  }
}

/**
 * Buscar templates favoritos
 */
export async function getFavoriteTemplates(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .contains('favorite_by_users', [userId])
    .order('name')

  if (error) {
    console.error('Error fetching favorite templates:', error)
    return []
  }

  return data
}

/**
 * Buscar agendamentos ativos
 */
export async function getActiveSchedules(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('report_schedules')
    .select(`
      *,
      template:report_templates(id, name, type)
    `)
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('next_run')

  if (error) {
    console.error('Error fetching active schedules:', error)
    return []
  }

  return data
}

/**
 * Desabilitar agendamento
 */
export async function disableSchedule(scheduleId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('report_schedules')
    .update({ enabled: false })
    .eq('id', scheduleId)

  if (error) {
    console.error('Error disabling schedule:', error)
    throw error
  }
}
