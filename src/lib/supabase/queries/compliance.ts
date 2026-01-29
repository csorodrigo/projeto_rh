/**
 * Queries para Compliance e Relatórios Legais
 * Atende requisitos da legislação trabalhista brasileira
 */

import { createClient } from '@/lib/supabase/client'
import type { Company, Employee, TimeRecord } from '@/types/database'

/**
 * Resultado da query de dados para AFD
 */
export interface AFDQueryResult {
  company: Company
  employees: Employee[]
  timeRecords: TimeRecord[]
  dailyRecords: TimeTrackingDaily[]
}

/**
 * Registro diário consolidado
 */
export interface TimeTrackingDaily {
  id: string
  company_id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_worked_minutes: number
  total_break_minutes: number
  overtime_minutes: number
  status: string
  created_at: string
  updated_at: string
}

/**
 * Busca todos os dados necessários para gerar AFD
 *
 * @param companyId - ID da empresa
 * @param startDate - Data inicial (formato: YYYY-MM-DD)
 * @param endDate - Data final (formato: YYYY-MM-DD)
 * @returns Dados completos para geração do AFD
 */
export async function getTimeRecordsForAFD(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<AFDQueryResult | null> {
  const supabase = createClient()

  try {
    // Busca dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('Erro ao buscar empresa:', companyError)
      return null
    }

    // Valida se a empresa tem CNPJ
    if (!company.cnpj) {
      console.error('Empresa sem CNPJ cadastrado')
      return null
    }

    // Busca funcionários ativos com PIS
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('pis', 'is', null)

    if (employeesError) {
      console.error('Erro ao buscar funcionários:', employeesError)
      return null
    }

    if (!employees || employees.length === 0) {
      console.error('Nenhum funcionário ativo com PIS cadastrado')
      return null
    }

    // Busca registros de ponto do período
    const startDateTime = new Date(startDate)
    startDateTime.setHours(0, 0, 0, 0)

    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999)

    const { data: timeRecords, error: timeRecordsError } = await supabase
      .from('time_records')
      .select('*')
      .in('employee_id', employees.map(e => e.id))
      .gte('recorded_at', startDateTime.toISOString())
      .lte('recorded_at', endDateTime.toISOString())
      .order('recorded_at', { ascending: true })

    if (timeRecordsError) {
      console.error('Erro ao buscar registros de ponto:', timeRecordsError)
      return null
    }

    // Busca registros diários consolidados (se existirem)
    const { data: dailyRecords, error: dailyError } = await supabase
      .from('time_tracking_daily')
      .select('*')
      .in('employee_id', employees.map(e => e.id))
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    // Registros diários são opcionais, não retorna erro se não existir
    if (dailyError && dailyError.code !== 'PGRST116') {
      console.warn('Aviso ao buscar registros diários:', dailyError)
    }

    return {
      company,
      employees,
      timeRecords: timeRecords || [],
      dailyRecords: dailyRecords || [],
    }
  } catch (error) {
    console.error('Erro ao buscar dados para AFD:', error)
    return null
  }
}

/**
 * Busca registros de ponto de um funcionário específico
 *
 * @param employeeId - ID do funcionário
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Registros de ponto do funcionário no período
 */
export async function getEmployeeTimeRecordsForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimeRecord[]> {
  const supabase = createClient()

  try {
    const startDateTime = new Date(startDate)
    startDateTime.setHours(0, 0, 0, 0)

    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', startDateTime.toISOString())
      .lte('recorded_at', endDateTime.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar registros de ponto do funcionário:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar registros de ponto do funcionário:', error)
    return []
  }
}

/**
 * Valida se a empresa está pronta para gerar AFD
 * Verifica se tem CNPJ, funcionários ativos com PIS e registros de ponto
 *
 * @param companyId - ID da empresa
 * @returns Objeto com status de validação e mensagens de erro
 */
export async function validateCompanyForAFD(
  companyId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []

  try {
    // Valida empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, cnpj')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      errors.push('Empresa não encontrada')
      return { valid: false, errors }
    }

    if (!company.cnpj || company.cnpj.replace(/\D/g, '').length !== 14) {
      errors.push('CNPJ inválido ou não cadastrado')
    }

    // Valida funcionários
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, pis')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (employeesError) {
      errors.push('Erro ao buscar funcionários')
      return { valid: false, errors }
    }

    if (!employees || employees.length === 0) {
      errors.push('Nenhum funcionário ativo cadastrado')
    }

    const employeesWithoutPIS = employees?.filter(e => !e.pis) || []
    if (employeesWithoutPIS.length > 0) {
      errors.push(
        `${employeesWithoutPIS.length} funcionário(s) sem PIS cadastrado: ${employeesWithoutPIS.map(e => e.name).join(', ')}`
      )
    }

    // Valida se existem registros de ponto nos últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentRecords, error: recordsError } = await supabase
      .from('time_records')
      .select('id', { count: 'exact', head: true })
      .in('employee_id', employees?.map(e => e.id) || [])
      .gte('recorded_at', thirtyDaysAgo.toISOString())
      .limit(1)

    if (recordsError) {
      errors.push('Erro ao verificar registros de ponto')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  } catch (error) {
    console.error('Erro ao validar empresa para AFD:', error)
    return {
      valid: false,
      errors: ['Erro interno ao validar empresa'],
    }
  }
}

/**
 * Busca estatísticas de registros de ponto para um período
 * Útil para exibir resumo antes de gerar o AFD
 *
 * @param companyId - ID da empresa
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Estatísticas do período
 */
export async function getAFDStatistics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalEmployees: number
  totalRecords: number
  employeesWithRecords: number
  dateRange: { start: string; end: string }
} | null> {
  const supabase = createClient()

  try {
    // Busca funcionários ativos
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('pis', 'is', null)

    if (employeesError || !employees) {
      return null
    }

    if (employees.length === 0) {
      return {
        totalEmployees: 0,
        totalRecords: 0,
        employeesWithRecords: 0,
        dateRange: { start: startDate, end: endDate },
      }
    }

    const employeeIds = employees.map(e => e.id)

    // Busca total de registros
    const startDateTime = new Date(startDate)
    startDateTime.setHours(0, 0, 0, 0)

    const endDateTime = new Date(endDate)
    endDateTime.setHours(23, 59, 59, 999)

    const { count: totalRecords, error: countError } = await supabase
      .from('time_records')
      .select('id', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .gte('recorded_at', startDateTime.toISOString())
      .lte('recorded_at', endDateTime.toISOString())

    if (countError) {
      console.error('Erro ao contar registros:', countError)
      return null
    }

    // Busca funcionários com pelo menos 1 registro
    const { data: recordsData, error: recordsError } = await supabase
      .from('time_records')
      .select('employee_id')
      .in('employee_id', employeeIds)
      .gte('recorded_at', startDateTime.toISOString())
      .lte('recorded_at', endDateTime.toISOString())

    if (recordsError) {
      console.error('Erro ao buscar registros:', recordsError)
      return null
    }

    const uniqueEmployees = new Set(recordsData?.map(r => r.employee_id) || [])

    return {
      totalEmployees: employees.length,
      totalRecords: totalRecords || 0,
      employeesWithRecords: uniqueEmployees.size,
      dateRange: { start: startDate, end: endDate },
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return null
  }
}

/**
 * Valida se um PIS é válido segundo o algoritmo do MTE
 *
 * @param pis - Número do PIS (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function validatePIS(pis: string): boolean {
  const cleanPis = pis.replace(/\D/g, '')

  if (cleanPis.length !== 11) {
    return false
  }

  // Multiplica cada dígito por seu peso
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanPis[i], 10) * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder

  return checkDigit === parseInt(cleanPis[10], 10)
}

/**
 * Valida se um CNPJ é válido
 *
 * @param cnpj - Número do CNPJ (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '')

  if (cleanCnpj.length !== 14) {
    return false
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCnpj)) {
    return false
  }

  // Validação do primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i], 10) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCnpj[12], 10)) {
    return false
  }

  // Validação do segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i], 10) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return digit === parseInt(cleanCnpj[13], 10)
}

/**
 * Busca registros de ponto para geração de AEJ (Arquivo Eletrônico de Jornada)
 * Retorna dados consolidados necessários para o e-Social
 *
 * @param companyId - ID da empresa
 * @param startDate - Data inicial (formato: YYYY-MM-DD)
 * @param endDate - Data final (formato: YYYY-MM-DD)
 * @returns Dados completos para geração do AEJ XML
 */
export async function getTimeRecordsForAEJ(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<{
  company: Company | null
  employees: Employee[]
  dailyRecords: TimeTrackingDaily[]
  workSchedules: any[]
  holidays: Date[]
}> {
  const supabase = createClient()

  try {
    // Busca dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('Erro ao buscar empresa:', companyError)
      return {
        company: null,
        employees: [],
        dailyRecords: [],
        workSchedules: [],
        holidays: [],
      }
    }

    // Busca funcionários ativos
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (employeesError) {
      console.error('Erro ao buscar funcionários:', employeesError)
      return {
        company,
        employees: [],
        dailyRecords: [],
        workSchedules: [],
        holidays: [],
      }
    }

    if (!employees || employees.length === 0) {
      return {
        company,
        employees: [],
        dailyRecords: [],
        workSchedules: [],
        holidays: [],
      }
    }

    const employeeIds = employees.map(e => e.id)

    // Busca registros diários consolidados
    const { data: dailyRecords, error: dailyError } = await supabase
      .from('time_tracking_daily')
      .select('*')
      .in('employee_id', employeeIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (dailyError && dailyError.code !== 'PGRST116') {
      console.warn('Aviso ao buscar registros diários:', dailyError)
    }

    // Busca escalas de trabalho
    const { data: workSchedules, error: schedError } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)

    if (schedError && schedError.code !== 'PGRST116') {
      console.warn('Aviso ao buscar escalas:', schedError)
    }

    // Busca feriados
    const { data: holidaysData, error: holidaysError } = await supabase
      .from('holidays')
      .select('date')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)

    const holidays = holidaysData?.map(h => new Date(h.date)) || []

    if (holidaysError && holidaysError.code !== 'PGRST116') {
      console.warn('Aviso ao buscar feriados:', holidaysError)
    }

    return {
      company,
      employees: employees || [],
      dailyRecords: (dailyRecords as TimeTrackingDaily[]) || [],
      workSchedules: workSchedules || [],
      holidays,
    }
  } catch (error) {
    console.error('Erro ao buscar dados para AEJ:', error)
    return {
      company: null,
      employees: [],
      dailyRecords: [],
      workSchedules: [],
      holidays: [],
    }
  }
}

/**
 * Busca feriados da empresa em um período
 *
 * @param companyId - ID da empresa
 * @param startDate - Data inicial (formato: YYYY-MM-DD)
 * @param endDate - Data final (formato: YYYY-MM-DD)
 * @returns Lista de feriados
 */
export async function getCompanyHolidays(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<Date[]> {
  const supabase = createClient()

  try {
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('date')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar feriados:', error)
      return []
    }

    return holidays?.map(h => new Date(h.date)) || []
  } catch (error) {
    console.error('Erro ao buscar feriados:', error)
    return []
  }
}

/**
 * Valida se a empresa está pronta para gerar AEJ
 *
 * @param companyId - ID da empresa
 * @returns Objeto com status de validação e mensagens de erro
 */
export async function validateCompanyForAEJ(
  companyId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const supabase = createClient()
  const errors: string[] = []

  try {
    // Valida empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, cnpj')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      errors.push('Empresa não encontrada')
      return { valid: false, errors }
    }

    if (!company.cnpj || company.cnpj.replace(/\D/g, '').length !== 14) {
      errors.push('CNPJ inválido ou não cadastrado')
    }

    // Valida funcionários
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, cpf')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (employeesError) {
      errors.push('Erro ao buscar funcionários')
      return { valid: false, errors }
    }

    if (!employees || employees.length === 0) {
      errors.push('Nenhum funcionário ativo cadastrado')
    }

    const employeesWithoutCPF = employees?.filter(e => !e.cpf) || []
    if (employeesWithoutCPF.length > 0) {
      errors.push(
        `${employeesWithoutCPF.length} funcionário(s) sem CPF cadastrado`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  } catch (error) {
    console.error('Erro ao validar empresa para AEJ:', error)
    return {
      valid: false,
      errors: ['Erro interno ao validar empresa'],
    }
  }
}
