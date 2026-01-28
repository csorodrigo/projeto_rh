/**
 * CLT Calculations - Calculos trabalhistas conforme CLT brasileira
 *
 * Implementa calculos de:
 * - Jornada de trabalho (44h semanais - 8h/dia + 4h sabado)
 * - Adicional noturno (22h-5h, reducao noturna: 1h = 52min30s)
 * - Hora extra (50% dias uteis, 100% domingos/feriados)
 * - DSR (Descanso Semanal Remunerado)
 * - Banco de horas
 */

// Constantes CLT
export const CLT_CONSTANTS = {
  /** Jornada semanal padrao em horas */
  WEEKLY_HOURS: 44,
  /** Jornada diaria padrao em horas (segunda a sexta) */
  DAILY_HOURS: 8,
  /** Jornada sabado em horas */
  SATURDAY_HOURS: 4,
  /** Inicio do periodo noturno (HH:mm) */
  NIGHT_START: '22:00',
  /** Fim do periodo noturno (HH:mm) */
  NIGHT_END: '05:00',
  /** Duracao da hora noturna em minutos (52min30s) */
  NIGHT_HOUR_MINUTES: 52.5,
  /** Adicional noturno percentual */
  NIGHT_SHIFT_PERCENTAGE: 20,
  /** Hora extra 50% (dias uteis) */
  OVERTIME_50_PERCENTAGE: 50,
  /** Hora extra 100% (domingos e feriados) */
  OVERTIME_100_PERCENTAGE: 100,
  /** Tolerancia de marcacao em minutos (art. 58 CLT) */
  TOLERANCE_MINUTES: 10,
  /** Intervalo minimo para jornada > 6h */
  MIN_BREAK_OVER_6H: 60,
  /** Intervalo maximo para jornada > 6h */
  MAX_BREAK_OVER_6H: 120,
  /** Intervalo minimo para jornada 4h-6h */
  MIN_BREAK_4_TO_6H: 15,
} as const

/**
 * Representa um registro de ponto diario
 */
export interface DailyTimeRecord {
  date: Date
  clockIn: Date | null
  clockOut: Date | null
  breakStart: Date | null
  breakEnd: Date | null
  additionalBreaks?: Array<{ start: Date; end: Date }>
  isWorkday: boolean
  isHoliday: boolean
  isSunday: boolean
}

/**
 * Resultado do calculo de jornada diaria
 */
export interface DailyJourneyResult {
  date: Date
  /** Minutos trabalhados brutos */
  workedMinutes: number
  /** Minutos de intervalo */
  breakMinutes: number
  /** Minutos trabalhados liquidos */
  netWorkedMinutes: number
  /** Minutos de hora extra 50% */
  overtime50Minutes: number
  /** Minutos de hora extra 100% */
  overtime100Minutes: number
  /** Minutos noturnos */
  nightMinutes: number
  /** Minutos faltantes */
  missingMinutes: number
  /** Minutos para banco de horas (positivo = credito, negativo = debito) */
  timeBankMinutes: number
  /** Se ultrapassou tolerancia */
  exceedsTolerance: boolean
  /** Erros ou avisos */
  warnings: string[]
}

/**
 * Resultado do calculo mensal consolidado
 */
export interface MonthlyJourneyResult {
  /** Periodo de referencia */
  referenceMonth: string
  /** Total de dias uteis */
  totalWorkdays: number
  /** Total de dias trabalhados */
  totalWorkedDays: number
  /** Total de minutos trabalhados */
  totalWorkedMinutes: number
  /** Total de horas trabalhadas (decimal) */
  totalWorkedHours: number
  /** Total de minutos HE 50% */
  totalOvertime50Minutes: number
  /** Total de minutos HE 100% */
  totalOvertime100Minutes: number
  /** Total de minutos noturnos */
  totalNightMinutes: number
  /** Total de minutos faltantes */
  totalMissingMinutes: number
  /** Saldo banco de horas (minutos) */
  timeBankBalance: number
  /** Total de faltas (dias) */
  absenceDays: number
  /** Detalhes por dia */
  dailyDetails: DailyJourneyResult[]
}

/**
 * Valores monetarios calculados
 */
export interface MonetaryValues {
  /** Salario base */
  baseSalary: number
  /** Valor hora normal */
  hourlyRate: number
  /** Valor HE 50% */
  overtime50Value: number
  /** Valor HE 100% */
  overtime100Value: number
  /** Valor adicional noturno */
  nightShiftValue: number
  /** Valor DSR */
  dsrValue: number
  /** Total de proventos */
  totalEarnings: number
  /** Desconto por faltas */
  absenceDeduction: number
}

/**
 * Converte uma string de hora (HH:mm) para minutos desde meia-noite
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converte minutos para string de hora (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Converte minutos para formato decimal de horas (ex: 90min = 1.5h)
 */
export function minutesToDecimalHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

/**
 * Verifica se um horario esta no periodo noturno (22h-5h)
 */
export function isNightTime(date: Date): boolean {
  const hours = date.getHours()
  return hours >= 22 || hours < 5
}

/**
 * Calcula os minutos noturnos em um intervalo
 * Considera a reducao da hora noturna (52min30s = 1h)
 */
export function calculateNightMinutes(start: Date, end: Date): number {
  let nightMinutes = 0
  const current = new Date(start)

  while (current < end) {
    if (isNightTime(current)) {
      nightMinutes++
    }
    current.setMinutes(current.getMinutes() + 1)
  }

  return nightMinutes
}

/**
 * Aplica a reducao da hora noturna
 * 52min30s trabalhados = 60min para calculo
 */
export function applyNightReduction(nightMinutes: number): number {
  // Cada 52.5 minutos noturnos equivale a 60 minutos
  return Math.round((nightMinutes / CLT_CONSTANTS.NIGHT_HOUR_MINUTES) * 60)
}

/**
 * Calcula a diferenca em minutos entre duas datas
 */
export function getMinutesDiff(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

/**
 * Determina a jornada esperada para um dia da semana
 * Segunda a Sexta: 8h, Sabado: 4h, Domingo: 0h
 */
export function getExpectedMinutes(
  dayOfWeek: number,
  customWeeklyHours?: number
): number {
  // 0 = Domingo, 6 = Sabado
  if (dayOfWeek === 0) return 0 // Domingo

  const weeklyHours = customWeeklyHours || CLT_CONSTANTS.WEEKLY_HOURS

  if (dayOfWeek === 6) {
    // Sabado - proporcional
    return (weeklyHours / CLT_CONSTANTS.WEEKLY_HOURS) * CLT_CONSTANTS.SATURDAY_HOURS * 60
  }

  // Segunda a Sexta
  return (weeklyHours / CLT_CONSTANTS.WEEKLY_HOURS) * CLT_CONSTANTS.DAILY_HOURS * 60
}

/**
 * Aplica a tolerancia de 10 minutos conforme art. 58 CLT
 * Variacoes de ate 10 minutos nao sao descontadas nem computadas como extra
 */
export function applyTolerance(
  workedMinutes: number,
  expectedMinutes: number
): { adjusted: number; exceedsTolerance: boolean } {
  const diff = workedMinutes - expectedMinutes

  if (Math.abs(diff) <= CLT_CONSTANTS.TOLERANCE_MINUTES) {
    return { adjusted: expectedMinutes, exceedsTolerance: false }
  }

  return { adjusted: workedMinutes, exceedsTolerance: true }
}

/**
 * Calcula a jornada diaria completa
 */
export function calculateDailyJourney(
  record: DailyTimeRecord,
  expectedMinutes?: number
): DailyJourneyResult {
  const warnings: string[] = []
  const dayOfWeek = record.date.getDay()
  const expected = expectedMinutes ?? getExpectedMinutes(dayOfWeek)

  // Inicializa resultado
  const result: DailyJourneyResult = {
    date: record.date,
    workedMinutes: 0,
    breakMinutes: 0,
    netWorkedMinutes: 0,
    overtime50Minutes: 0,
    overtime100Minutes: 0,
    nightMinutes: 0,
    missingMinutes: 0,
    timeBankMinutes: 0,
    exceedsTolerance: false,
    warnings,
  }

  // Se nao ha registro de entrada/saida
  if (!record.clockIn || !record.clockOut) {
    if (record.isWorkday && !record.isHoliday) {
      result.missingMinutes = expected
      warnings.push('Sem registro de ponto')
    }
    return result
  }

  // Calcula tempo bruto trabalhado
  result.workedMinutes = getMinutesDiff(record.clockIn, record.clockOut)

  // Calcula tempo de intervalo
  if (record.breakStart && record.breakEnd) {
    result.breakMinutes = getMinutesDiff(record.breakStart, record.breakEnd)

    // Valida intervalo minimo
    if (result.workedMinutes > 360 && result.breakMinutes < CLT_CONSTANTS.MIN_BREAK_OVER_6H) {
      warnings.push('Intervalo inferior ao minimo legal (60 min)')
    }
  }

  // Intervalos adicionais
  if (record.additionalBreaks) {
    for (const b of record.additionalBreaks) {
      result.breakMinutes += getMinutesDiff(b.start, b.end)
    }
  }

  // Calcula tempo liquido
  result.netWorkedMinutes = result.workedMinutes - result.breakMinutes

  // Calcula minutos noturnos
  result.nightMinutes = calculateNightMinutes(record.clockIn, record.clockOut)
  if (record.breakStart && record.breakEnd) {
    result.nightMinutes -= calculateNightMinutes(record.breakStart, record.breakEnd)
  }

  // Aplica reducao noturna ao calculo
  const adjustedNightMinutes = applyNightReduction(result.nightMinutes)
  const nightBonus = adjustedNightMinutes - result.nightMinutes
  result.netWorkedMinutes += nightBonus

  // Aplica tolerancia
  const toleranceResult = applyTolerance(result.netWorkedMinutes, expected)
  result.exceedsTolerance = toleranceResult.exceedsTolerance

  // Calcula hora extra ou falta
  const diff = toleranceResult.adjusted - expected

  if (diff > 0) {
    // Hora extra
    if (record.isHoliday || record.isSunday) {
      result.overtime100Minutes = diff
    } else {
      result.overtime50Minutes = diff
    }
    result.timeBankMinutes = diff
  } else if (diff < 0) {
    // Falta
    result.missingMinutes = Math.abs(diff)
    result.timeBankMinutes = diff
  }

  return result
}

/**
 * Calcula a jornada mensal consolidada
 */
export function calculateMonthlyJourney(
  records: DailyTimeRecord[],
  weeklyHours?: number
): MonthlyJourneyResult {
  const dailyDetails: DailyJourneyResult[] = []
  let totalWorkdays = 0
  let totalWorkedDays = 0

  for (const record of records) {
    const dayOfWeek = record.date.getDay()
    const expectedMinutes = getExpectedMinutes(dayOfWeek, weeklyHours)

    if (expectedMinutes > 0 && record.isWorkday && !record.isHoliday) {
      totalWorkdays++
    }

    const daily = calculateDailyJourney(record, expectedMinutes)
    dailyDetails.push(daily)

    if (daily.netWorkedMinutes > 0) {
      totalWorkedDays++
    }
  }

  // Consolida totais
  const totals = dailyDetails.reduce(
    (acc, d) => ({
      workedMinutes: acc.workedMinutes + d.netWorkedMinutes,
      overtime50: acc.overtime50 + d.overtime50Minutes,
      overtime100: acc.overtime100 + d.overtime100Minutes,
      nightMinutes: acc.nightMinutes + d.nightMinutes,
      missingMinutes: acc.missingMinutes + d.missingMinutes,
      timeBankMinutes: acc.timeBankMinutes + d.timeBankMinutes,
    }),
    { workedMinutes: 0, overtime50: 0, overtime100: 0, nightMinutes: 0, missingMinutes: 0, timeBankMinutes: 0 }
  )

  // Calcula faltas em dias
  const absenceDays = dailyDetails.filter(
    d => d.missingMinutes >= getExpectedMinutes(d.date.getDay(), weeklyHours) * 0.5
  ).length

  // Determina mes de referencia
  const firstDate = records[0]?.date || new Date()
  const referenceMonth = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`

  return {
    referenceMonth,
    totalWorkdays,
    totalWorkedDays,
    totalWorkedMinutes: totals.workedMinutes,
    totalWorkedHours: minutesToDecimalHours(totals.workedMinutes),
    totalOvertime50Minutes: totals.overtime50,
    totalOvertime100Minutes: totals.overtime100,
    totalNightMinutes: totals.nightMinutes,
    totalMissingMinutes: totals.missingMinutes,
    timeBankBalance: totals.timeBankMinutes,
    absenceDays,
    dailyDetails,
  }
}

/**
 * Calcula o valor da hora trabalhada
 * Salario / (Jornada mensal em horas)
 * Jornada mensal = 220h para 44h semanais
 */
export function calculateHourlyRate(
  baseSalary: number,
  weeklyHours: number = CLT_CONSTANTS.WEEKLY_HOURS
): number {
  // Formula: Salario / (jornada semanal * 5)
  // Para 44h: 220h mensais
  const monthlyHours = weeklyHours * 5
  return Math.round((baseSalary / monthlyHours) * 100) / 100
}

/**
 * Calcula o DSR (Descanso Semanal Remunerado) sobre horas extras
 * DSR = (Total HE do mes / Dias uteis) * Domingos e feriados
 */
export function calculateDSR(
  overtimeValue: number,
  workdays: number,
  sundaysAndHolidays: number
): number {
  if (workdays === 0) return 0
  return Math.round((overtimeValue / workdays) * sundaysAndHolidays * 100) / 100
}

/**
 * Calcula todos os valores monetarios do mes
 */
export function calculateMonetaryValues(
  baseSalary: number,
  monthlyResult: MonthlyJourneyResult,
  sundaysAndHolidays: number = 5,
  weeklyHours: number = CLT_CONSTANTS.WEEKLY_HOURS
): MonetaryValues {
  const hourlyRate = calculateHourlyRate(baseSalary, weeklyHours)

  // Hora extra 50%
  const overtime50Hours = minutesToDecimalHours(monthlyResult.totalOvertime50Minutes)
  const overtime50Value = Math.round(overtime50Hours * hourlyRate * 1.5 * 100) / 100

  // Hora extra 100%
  const overtime100Hours = minutesToDecimalHours(monthlyResult.totalOvertime100Minutes)
  const overtime100Value = Math.round(overtime100Hours * hourlyRate * 2 * 100) / 100

  // Adicional noturno (20% sobre hora noturna)
  const nightHours = minutesToDecimalHours(monthlyResult.totalNightMinutes)
  const nightShiftValue = Math.round(nightHours * hourlyRate * (CLT_CONSTANTS.NIGHT_SHIFT_PERCENTAGE / 100) * 100) / 100

  // DSR sobre horas extras
  const totalOvertimeValue = overtime50Value + overtime100Value
  const dsrValue = calculateDSR(
    totalOvertimeValue + nightShiftValue,
    monthlyResult.totalWorkdays,
    sundaysAndHolidays
  )

  // Desconto por faltas
  const missingHours = minutesToDecimalHours(monthlyResult.totalMissingMinutes)
  const absenceDeduction = Math.round(missingHours * hourlyRate * 100) / 100

  // Total de proventos adicionais
  const totalEarnings = overtime50Value + overtime100Value + nightShiftValue + dsrValue

  return {
    baseSalary,
    hourlyRate,
    overtime50Value,
    overtime100Value,
    nightShiftValue,
    dsrValue,
    totalEarnings,
    absenceDeduction,
  }
}

/**
 * Calcula o saldo de banco de horas com limite e expiracao
 */
export function calculateTimeBankBalance(
  currentBalance: number,
  newMovement: number,
  maxBalance: number = 10 * 60, // 10 horas default
  expirationMonths: number = 6
): {
  newBalance: number
  expired: number
  withinLimit: boolean
} {
  const potentialBalance = currentBalance + newMovement
  const expired = Math.max(0, potentialBalance - maxBalance)
  const newBalance = Math.min(potentialBalance, maxBalance)

  return {
    newBalance,
    expired,
    withinLimit: potentialBalance <= maxBalance,
  }
}

/**
 * Formata um valor monetario em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata minutos como HH:mm
 */
export function formatMinutesAsTime(minutes: number): string {
  const sign = minutes < 0 ? '-' : ''
  const absMinutes = Math.abs(minutes)
  const hours = Math.floor(absMinutes / 60)
  const mins = absMinutes % 60
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Verifica se uma data e feriado
 * Feriados nacionais brasileiros fixos
 */
export function isNationalHoliday(date: Date): boolean {
  const day = date.getDate()
  const month = date.getMonth() + 1 // getMonth() retorna 0-11

  // Feriados nacionais fixos
  const holidays = [
    { day: 1, month: 1 },   // Confraternizacao Universal
    { day: 21, month: 4 },  // Tiradentes
    { day: 1, month: 5 },   // Dia do Trabalho
    { day: 7, month: 9 },   // Independencia
    { day: 12, month: 10 }, // Nossa Senhora Aparecida
    { day: 2, month: 11 },  // Finados
    { day: 15, month: 11 }, // Proclamacao da Republica
    { day: 25, month: 12 }, // Natal
  ]

  return holidays.some(h => h.day === day && h.month === month)
}

/**
 * Conta domingos e feriados em um periodo
 */
export function countSundaysAndHolidays(
  startDate: Date,
  endDate: Date,
  customHolidays: Date[] = []
): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    if (
      current.getDay() === 0 || // Domingo
      isNationalHoliday(current) ||
      customHolidays.some(h => h.toDateString() === current.toDateString())
    ) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}
