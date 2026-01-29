/**
 * Queries para relatorios CLT e calculos trabalhistas
 * Integracao com banco de dados Supabase
 */

import { createClient } from '@/lib/supabase/client'
import {
  calculateMonthlyJourney,
  calculateMonetaryValues,
  calculateTimeBank,
  detectViolations,
  countSundaysAndHolidays,
  type DailyTimeRecord,
  type MonthlyJourneyResult,
  type MonetaryValues,
  type TimeBankResult,
  type ComplianceViolations,
} from '@/lib/compliance/clt-calculations'

/**
 * Interface para registro de ponto do banco
 */
interface TimeRecordDB {
  id: string
  employee_id: string
  record_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  recorded_at: string
  location_address: string | null
  source: string
  notes: string | null
  created_at: string
}

/**
 * Interface para funcionario do banco
 */
interface EmployeeDB {
  id: string
  name: string
  base_salary: number
  weekly_hours: number
  hire_date: string
}

/**
 * Converte registros do banco para formato de calculo
 */
function convertToTimeRecords(
  records: TimeRecordDB[],
  year: number,
  month: number
): DailyTimeRecord[] {
  // Agrupa por dia
  const recordsByDay = new Map<string, TimeRecordDB[]>()

  for (const record of records) {
    const date = new Date(record.recorded_at)
    const dateKey = date.toISOString().split('T')[0]

    if (!recordsByDay.has(dateKey)) {
      recordsByDay.set(dateKey, [])
    }
    recordsByDay.get(dateKey)!.push(record)
  }

  // Converte para DailyTimeRecord
  const dailyRecords: DailyTimeRecord[] = []

  // Percorre todos os dias do mes
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateKey = date.toISOString().split('T')[0]
    const dayRecords = recordsByDay.get(dateKey) || []

    // Encontra cada tipo de registro
    const clockIn = dayRecords.find(r => r.record_type === 'clock_in')
    const clockOut = dayRecords.find(r => r.record_type === 'clock_out')
    const breakStart = dayRecords.find(r => r.record_type === 'break_start')
    const breakEnd = dayRecords.find(r => r.record_type === 'break_end')

    const dayOfWeek = date.getDay()
    const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 6 // Segunda a Sabado
    const isSunday = dayOfWeek === 0
    const isHoliday = false // TODO: integrar com tabela de feriados

    dailyRecords.push({
      date,
      clockIn: clockIn ? new Date(clockIn.recorded_at) : null,
      clockOut: clockOut ? new Date(clockOut.recorded_at) : null,
      breakStart: breakStart ? new Date(breakStart.recorded_at) : null,
      breakEnd: breakEnd ? new Date(breakEnd.recorded_at) : null,
      isWorkday,
      isHoliday,
      isSunday,
    })
  }

  return dailyRecords
}

/**
 * Calcula horas extras do mes para um funcionario
 */
export async function calculateMonthlyOvertime(
  employeeId: string,
  year: number,
  month: number
): Promise<{
  journey: MonthlyJourneyResult
  monetary: MonetaryValues
  employee: EmployeeDB
} | null> {
  const supabase = createClient()

  try {
    // Busca dados do funcionario
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, base_salary, weekly_hours, hire_date')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employee) {
      console.error('Erro ao buscar funcionario:', employeeError)
      return null
    }

    // Busca registros de ponto do mes
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: records, error: recordsError } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true })

    if (recordsError) {
      console.error('Erro ao buscar registros:', recordsError)
      return null
    }

    // Converte registros
    const dailyRecords = convertToTimeRecords(records || [], year, month)

    // Calcula jornada mensal
    const journey = calculateMonthlyJourney(dailyRecords, employee.weekly_hours || 44)

    // Conta domingos e feriados
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const sundaysAndHolidays = countSundaysAndHolidays(firstDay, lastDay)

    // Calcula valores monetarios
    const monetary = calculateMonetaryValues(
      employee.base_salary || 0,
      journey,
      sundaysAndHolidays,
      employee.weekly_hours || 44
    )

    return {
      journey,
      monetary,
      employee: employee as EmployeeDB,
    }
  } catch (error) {
    console.error('Erro ao calcular horas extras:', error)
    return null
  }
}

/**
 * Calcula banco de horas de um funcionario
 */
export async function calculateEmployeeTimeBank(
  employeeId: string,
  year: number,
  month: number
): Promise<TimeBankResult | null> {
  const supabase = createClient()

  try {
    // Busca dados do funcionario
    const { data: employee } = await supabase
      .from('employees')
      .select('id, weekly_hours')
      .eq('id', employeeId)
      .single()

    if (!employee) return null

    // Busca registros de ponto do mes
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: records } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true })

    // Converte e calcula
    const dailyRecords = convertToTimeRecords(records || [], year, month)
    const journey = calculateMonthlyJourney(dailyRecords, employee.weekly_hours || 44)

    // TODO: Buscar saldo anterior e compensacoes do banco de dados
    const previousBalance = 0 // Deveria vir do mes anterior
    const compensatedMinutes = 0 // Compensacoes realizadas

    const totalOvertime = journey.totalOvertime50Minutes + journey.totalOvertime100Minutes
    const timeBank = calculateTimeBank(
      previousBalance + totalOvertime,
      compensatedMinutes,
      120 * 60, // 120 horas de limite
      new Date(year, month - 1, 1)
    )

    return timeBank
  } catch (error) {
    console.error('Erro ao calcular banco de horas:', error)
    return null
  }
}

/**
 * Detecta violacoes trabalhistas de um funcionario no mes
 */
export async function detectMonthlyViolations(
  employeeId: string,
  year: number,
  month: number
): Promise<ComplianceViolations | null> {
  const supabase = createClient()

  try {
    // Busca registros de ponto do mes
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: records } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true })

    // Converte e detecta violacoes
    const dailyRecords = convertToTimeRecords(records || [], year, month)
    const violations = detectViolations(dailyRecords)

    return violations
  } catch (error) {
    console.error('Erro ao detectar violacoes:', error)
    return null
  }
}

/**
 * Busca relatorio consolidado de todos os funcionarios
 */
export async function getCompanyMonthlyReport(
  companyId: string,
  year: number,
  month: number
): Promise<{
  employees: Array<{
    id: string
    name: string
    journey: MonthlyJourneyResult
    monetary: MonetaryValues
    violations: ComplianceViolations
  }>
  totals: {
    totalOvertime50Value: number
    totalOvertime100Value: number
    totalNightShiftValue: number
    totalDSRValue: number
    totalEarnings: number
    totalViolations: number
  }
} | null> {
  const supabase = createClient()

  try {
    // Busca todos os funcionarios ativos da empresa
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, base_salary, weekly_hours')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (!employees || employees.length === 0) {
      return {
        employees: [],
        totals: {
          totalOvertime50Value: 0,
          totalOvertime100Value: 0,
          totalNightShiftValue: 0,
          totalDSRValue: 0,
          totalEarnings: 0,
          totalViolations: 0,
        },
      }
    }

    // Calcula para cada funcionario
    const employeeReports = []
    const totals = {
      totalOvertime50Value: 0,
      totalOvertime100Value: 0,
      totalNightShiftValue: 0,
      totalDSRValue: 0,
      totalEarnings: 0,
      totalViolations: 0,
    }

    for (const employee of employees) {
      const overtime = await calculateMonthlyOvertime(employee.id, year, month)
      const violations = await detectMonthlyViolations(employee.id, year, month)

      if (overtime && violations) {
        employeeReports.push({
          id: employee.id,
          name: employee.name,
          journey: overtime.journey,
          monetary: overtime.monetary,
          violations,
        })

        // Acumula totais
        totals.totalOvertime50Value += overtime.monetary.overtime50Value
        totals.totalOvertime100Value += overtime.monetary.overtime100Value
        totals.totalNightShiftValue += overtime.monetary.nightShiftValue
        totals.totalDSRValue += overtime.monetary.dsrValue
        totals.totalEarnings += overtime.monetary.totalEarnings
        totals.totalViolations += violations.totalViolations
      }
    }

    return {
      employees: employeeReports,
      totals,
    }
  } catch (error) {
    console.error('Erro ao gerar relatorio da empresa:', error)
    return null
  }
}

/**
 * Busca funcionarios com violacoes criticas
 */
export async function getEmployeesWithViolations(
  companyId: string,
  year: number,
  month: number
): Promise<Array<{
  id: string
  name: string
  violations: ComplianceViolations
}> | null> {
  const supabase = createClient()

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (!employees) return null

    const employeesWithViolations = []

    for (const employee of employees) {
      const violations = await detectMonthlyViolations(employee.id, year, month)

      if (violations && violations.hasCriticalViolations) {
        employeesWithViolations.push({
          id: employee.id,
          name: employee.name,
          violations,
        })
      }
    }

    return employeesWithViolations
  } catch (error) {
    console.error('Erro ao buscar funcionarios com violacoes:', error)
    return null
  }
}

/**
 * Salva ou atualiza saldo de banco de horas
 * TODO: Criar tabela time_bank no Supabase
 */
export async function saveTimeBankBalance(
  employeeId: string,
  year: number,
  month: number,
  balance: number
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('time_bank')
      .upsert({
        employee_id: employeeId,
        reference_month: `${year}-${String(month).padStart(2, '0')}`,
        balance_minutes: balance,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Erro ao salvar banco de horas:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao salvar banco de horas:', error)
    return false
  }
}

/**
 * Busca historico de banco de horas
 */
export async function getTimeBankHistory(
  employeeId: string,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<Array<{
  month: string
  balance: number
}> | null> {
  const supabase = createClient()

  try {
    const startRef = `${startYear}-${String(startMonth).padStart(2, '0')}`
    const endRef = `${endYear}-${String(endMonth).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('time_bank')
      .select('reference_month, balance_minutes')
      .eq('employee_id', employeeId)
      .gte('reference_month', startRef)
      .lte('reference_month', endRef)
      .order('reference_month', { ascending: true })

    if (error) {
      console.error('Erro ao buscar historico:', error)
      return null
    }

    return data?.map(d => ({
      month: d.reference_month,
      balance: d.balance_minutes,
    })) || []
  } catch (error) {
    console.error('Erro ao buscar historico:', error)
    return null
  }
}
