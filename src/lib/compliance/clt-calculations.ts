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

// ============================================================================
// NOVAS FUNCIONALIDADES - EXPANSAO CLT
// ============================================================================

/**
 * Resultado do calculo de hora extra regular (50%)
 */
export interface OvertimeRegularResult {
  /** Minutos de hora extra trabalhados */
  overtimeMinutes: number
  /** Valor monetario da hora extra */
  overtimeValue: number
  /** Valor da hora normal */
  hourlyRate: number
  /** Indica se excedeu limite de 2h/dia */
  exceedsLimit: boolean
  /** Minutos que excedem o limite legal */
  excessMinutes: number
}

/**
 * Calcula hora extra 50% (dias uteis)
 * CLT Art. 59 - Maximo 2h extras por dia
 *
 * @param workedMinutes - Minutos trabalhados no dia
 * @param expectedMinutes - Minutos esperados para o dia (normalmente 480 = 8h)
 * @param hourlyRate - Valor da hora normal
 * @returns Resultado com minutos de HE, valor e alertas
 */
export function calculateOvertimeRegular(
  workedMinutes: number,
  expectedMinutes: number,
  hourlyRate: number
): OvertimeRegularResult {
  const MAX_OVERTIME_MINUTES = 120 // 2 horas (CLT Art. 59)

  // Calcula minutos acima da jornada esperada
  const overtimeMinutes = Math.max(0, workedMinutes - expectedMinutes)

  // Verifica se excede limite de 2h/dia
  const exceedsLimit = overtimeMinutes > MAX_OVERTIME_MINUTES
  const excessMinutes = Math.max(0, overtimeMinutes - MAX_OVERTIME_MINUTES)

  // Calcula valor: hora normal * 1.5
  const overtimeHours = minutesToDecimalHours(overtimeMinutes)
  const overtimeValue = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100

  return {
    overtimeMinutes,
    overtimeValue,
    hourlyRate,
    exceedsLimit,
    excessMinutes,
  }
}

/**
 * Calcula hora extra 100% (domingos/feriados)
 * Trabalho em domingo/feriado e 100% a mais
 *
 * @param workedMinutes - Minutos trabalhados
 * @param hourlyRate - Valor da hora normal
 * @returns Valor monetario da hora extra 100%
 */
export function calculateOvertimeWeekend(
  workedMinutes: number,
  hourlyRate: number
): number {
  const hours = minutesToDecimalHours(workedMinutes)
  return Math.round(hours * hourlyRate * 2 * 100) / 100
}

/**
 * Resultado do calculo de adicional noturno
 */
export interface NightShiftResult {
  /** Minutos trabalhados no periodo noturno (22h-5h) */
  nightMinutes: number
  /** Minutos ajustados com reducao noturna */
  adjustedNightMinutes: number
  /** Valor do adicional noturno (20%) */
  nightBonus: number
  /** Valor da hora com adicional */
  nightHourlyRate: number
  /** Horario de inicio do turno */
  startTime: string
  /** Horario de fim do turno */
  endTime: string
}

/**
 * Calcula adicional noturno (22h-5h)
 * CLT Art. 73 - Adicional noturno de 20%
 * Hora noturna reduzida: 52min30s = 1h para calculo
 *
 * @param startTime - Horario de inicio (formato ISO ou Date)
 * @param endTime - Horario de fim (formato ISO ou Date)
 * @param hourlyRate - Valor da hora normal
 * @returns Resultado com minutos noturnos e adicional
 */
export function calculateNightShift(
  startTime: string | Date,
  endTime: string | Date,
  hourlyRate: number
): NightShiftResult {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime

  // Calcula minutos no periodo noturno
  const nightMinutes = calculateNightMinutes(start, end)

  // Aplica reducao da hora noturna (52min30s = 1h)
  const adjustedNightMinutes = applyNightReduction(nightMinutes)

  // Calcula adicional de 20%
  const nightHours = minutesToDecimalHours(adjustedNightMinutes)
  const nightBonus = Math.round(nightHours * hourlyRate * 0.20 * 100) / 100
  const nightHourlyRate = Math.round(hourlyRate * 1.20 * 100) / 100

  return {
    nightMinutes,
    adjustedNightMinutes,
    nightBonus,
    nightHourlyRate,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}

/**
 * Resultado do calculo de banco de horas
 */
export interface TimeBankResult {
  /** Saldo atual em minutos (positivo = credito, negativo = debito) */
  balance: number
  /** Minutos a compensar (credito que pode ser usado) */
  toCompensate: number
  /** Minutos a pagar (excedeu limite ou prazo) */
  toPay: number
  /** Indica se esta dentro do limite */
  withinLimit: boolean
  /** Data de expiracao mais proxima */
  nextExpiration?: Date
  /** Movimentos que expiraram */
  expiredMovements: number
}

/**
 * Calcula banco de horas
 * CLT Art. 59 paragrafo 2 - Compensacao em ate 6 meses
 * Limite: 10h/dia (8h normais + 2h extras)
 *
 * @param overtimeMinutes - Minutos de hora extra acumulados
 * @param compensatedMinutes - Minutos ja compensados
 * @param maxBalanceMinutes - Limite maximo do banco (padrao: 120h)
 * @param referenceDate - Data de referencia para calculo de expiracao
 * @returns Resultado com saldos e alertas
 */
export function calculateTimeBank(
  overtimeMinutes: number,
  compensatedMinutes: number,
  maxBalanceMinutes: number = 120 * 60, // 120 horas
  referenceDate: Date = new Date()
): TimeBankResult {
  const COMPENSATION_PERIOD_MONTHS = 6
  const balance = overtimeMinutes - compensatedMinutes

  // Verifica se esta dentro do limite
  const withinLimit = Math.abs(balance) <= maxBalanceMinutes

  // Calcula o que pode ser compensado vs o que deve ser pago
  let toCompensate = 0
  let toPay = 0

  if (balance > 0) {
    // Credito: pode compensar ate o limite
    if (withinLimit) {
      toCompensate = balance
      toPay = 0
    } else {
      toCompensate = maxBalanceMinutes
      toPay = balance - maxBalanceMinutes
    }
  } else {
    // Debito: funcionario deve horas
    toCompensate = Math.abs(balance)
    toPay = 0
  }

  // Calcula data de expiracao (6 meses a partir da referencia)
  const nextExpiration = new Date(referenceDate)
  nextExpiration.setMonth(nextExpiration.getMonth() + COMPENSATION_PERIOD_MONTHS)

  // Simula movimentos expirados (simplificado)
  const expiredMovements = toPay

  return {
    balance,
    toCompensate,
    toPay,
    withinLimit,
    nextExpiration,
    expiredMovements,
  }
}

/**
 * Calcula DSR sobre horas extras
 * DSR = Descanso Semanal Remunerado
 * Formula: (total HE do mes / dias uteis) * domingos e feriados
 *
 * @param overtimeValue - Valor total de horas extras no mes
 * @param workedDays - Dias uteis trabalhados no mes
 * @param month - Mes de referencia (1-12)
 * @param year - Ano de referencia
 * @param customHolidays - Feriados customizados
 * @returns Valor do DSR
 */
export function calculateDSREnhanced(
  overtimeValue: number,
  workedDays: number,
  month: number,
  year: number,
  customHolidays: Date[] = []
): number {
  if (workedDays === 0 || overtimeValue === 0) return 0

  // Calcula primeiro e ultimo dia do mes
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Conta domingos e feriados do mes
  const sundaysAndHolidays = countSundaysAndHolidays(firstDay, lastDay, customHolidays)

  // Formula: (HE / dias uteis) * domingos e feriados
  return Math.round((overtimeValue / workedDays) * sundaysAndHolidays * 100) / 100
}

/**
 * Resultado da validacao de interjornada
 */
export interface InterjornadaResult {
  /** Se cumpre o minimo de 11h entre jornadas */
  valid: boolean
  /** Horas de descanso entre jornadas */
  hoursRest: number
  /** Horas faltantes para cumprir as 11h */
  missingHours: number
  /** Data/hora de saida da jornada anterior */
  exitTime: Date
  /** Data/hora de entrada da proxima jornada */
  nextEntryTime: Date
  /** Se viola CLT, proxima jornada conta como extra */
  countsAsOvertime: boolean
}

/**
 * Valida interjornada (intervalo entre jornadas)
 * CLT Art. 66 - Minimo 11h de descanso entre jornadas
 * Se violar, a proxima jornada pode contar como hora extra
 *
 * @param exitTime - Horario de saida da jornada anterior
 * @param nextEntryTime - Horario de entrada da proxima jornada
 * @returns Resultado da validacao
 */
export function validateInterjornada(
  exitTime: Date,
  nextEntryTime: Date
): InterjornadaResult {
  const MIN_REST_HOURS = 11

  // Calcula diferenca em minutos
  const restMinutes = getMinutesDiff(exitTime, nextEntryTime)
  const hoursRest = restMinutes / 60

  // Valida se cumpre o minimo
  const valid = hoursRest >= MIN_REST_HOURS
  const missingHours = Math.max(0, MIN_REST_HOURS - hoursRest)

  // Se violar, a proxima jornada pode contar como extra
  const countsAsOvertime = !valid

  return {
    valid,
    hoursRest: Math.round(hoursRest * 100) / 100,
    missingHours: Math.round(missingHours * 100) / 100,
    exitTime,
    nextEntryTime,
    countsAsOvertime,
  }
}

/**
 * Resultado da validacao de limite diario
 */
export interface DailyLimitResult {
  /** Se cumpre limite de 10h/dia (8h + 2h extras) */
  valid: boolean
  /** Total de horas trabalhadas */
  totalHours: number
  /** Horas que excedem o limite */
  excessHours: number
  /** Limite aplicavel */
  limitHours: number
}

/**
 * Valida limite de jornada diaria
 * CLT Art. 59 - Maximo 2h extras por dia (total 10h)
 *
 * @param workedMinutes - Minutos trabalhados no dia
 * @param normalJourneyMinutes - Jornada normal (padrao: 480 = 8h)
 * @returns Resultado da validacao
 */
export function validateDailyLimit(
  workedMinutes: number,
  normalJourneyMinutes: number = 480
): DailyLimitResult {
  const MAX_OVERTIME_MINUTES = 120 // 2h extras
  const limitMinutes = normalJourneyMinutes + MAX_OVERTIME_MINUTES

  const valid = workedMinutes <= limitMinutes
  const excessMinutes = Math.max(0, workedMinutes - limitMinutes)

  return {
    valid,
    totalHours: minutesToDecimalHours(workedMinutes),
    excessHours: minutesToDecimalHours(excessMinutes),
    limitHours: minutesToDecimalHours(limitMinutes),
  }
}

/**
 * Resultado da validacao de intervalo
 */
export interface BreakValidationResult {
  /** Se o intervalo esta conforme a CLT */
  valid: boolean
  /** Minutos de intervalo realizados */
  breakMinutes: number
  /** Minutos minimos exigidos */
  requiredMinutes: number
  /** Minutos faltantes */
  missingMinutes: number
  /** Tipo de violacao */
  violation?: 'insufficient' | 'excessive' | 'none'
}

/**
 * Valida intervalo intrajornada
 * CLT Art. 71:
 * - Jornada > 6h: 1h a 2h de intervalo
 * - Jornada 4h a 6h: 15min de intervalo
 * - Jornada < 4h: sem intervalo obrigatorio
 *
 * @param workedMinutes - Minutos trabalhados
 * @param breakMinutes - Minutos de intervalo
 * @returns Resultado da validacao
 */
export function validateBreak(
  workedMinutes: number,
  breakMinutes: number
): BreakValidationResult {
  let requiredMinutes = 0
  let maxMinutes = 0

  if (workedMinutes > 360) {
    // Mais de 6h
    requiredMinutes = CLT_CONSTANTS.MIN_BREAK_OVER_6H // 60min
    maxMinutes = CLT_CONSTANTS.MAX_BREAK_OVER_6H // 120min
  } else if (workedMinutes >= 240) {
    // 4h a 6h
    requiredMinutes = CLT_CONSTANTS.MIN_BREAK_4_TO_6H // 15min
    maxMinutes = 30 // razoavel
  }

  const valid = breakMinutes >= requiredMinutes && breakMinutes <= maxMinutes
  const missingMinutes = Math.max(0, requiredMinutes - breakMinutes)

  let violation: 'insufficient' | 'excessive' | 'none' = 'none'
  if (breakMinutes < requiredMinutes) {
    violation = 'insufficient'
  } else if (breakMinutes > maxMinutes && maxMinutes > 0) {
    violation = 'excessive'
  }

  return {
    valid,
    breakMinutes,
    requiredMinutes,
    missingMinutes,
    violation,
  }
}

/**
 * Resultado consolidado de violacoes CLT
 */
export interface ComplianceViolations {
  /** Violacoes de interjornada */
  interjornada: InterjornadaResult[]
  /** Violacoes de limite diario */
  dailyLimit: DailyLimitResult[]
  /** Violacoes de intervalo */
  breaks: BreakValidationResult[]
  /** Dias com hora extra acima de 2h */
  excessiveOvertime: Date[]
  /** Total de violacoes */
  totalViolations: number
  /** Se ha violacoes criticas */
  hasCriticalViolations: boolean
}

/**
 * Detecta violacoes trabalhistas em um conjunto de registros
 *
 * @param records - Registros de ponto do periodo
 * @returns Consolidado de violacoes
 */
export function detectViolations(
  records: DailyTimeRecord[]
): ComplianceViolations {
  const violations: ComplianceViolations = {
    interjornada: [],
    dailyLimit: [],
    breaks: [],
    excessiveOvertime: [],
    totalViolations: 0,
    hasCriticalViolations: false,
  }

  // Ordena por data
  const sorted = [...records].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i]

    if (!record.clockIn || !record.clockOut) continue

    // Valida interjornada
    if (i > 0 && sorted[i - 1].clockOut) {
      const interjornada = validateInterjornada(
        sorted[i - 1].clockOut!,
        record.clockIn
      )

      if (!interjornada.valid) {
        violations.interjornada.push(interjornada)
        violations.totalViolations++
        violations.hasCriticalViolations = true
      }
    }

    // Valida limite diario
    const workedMinutes = getMinutesDiff(record.clockIn, record.clockOut)
    const dailyLimit = validateDailyLimit(workedMinutes)

    if (!dailyLimit.valid) {
      violations.dailyLimit.push(dailyLimit)
      violations.totalViolations++
    }

    // Valida intervalo
    if (record.breakStart && record.breakEnd) {
      const breakMinutes = getMinutesDiff(record.breakStart, record.breakEnd)
      const breakValidation = validateBreak(workedMinutes, breakMinutes)

      if (!breakValidation.valid) {
        violations.breaks.push(breakValidation)
        violations.totalViolations++

        if (breakValidation.violation === 'insufficient') {
          violations.hasCriticalViolations = true
        }
      }
    }

    // Verifica hora extra excessiva
    const daily = calculateDailyJourney(record)
    if (daily.overtime50Minutes > 120 || daily.overtime100Minutes > 120) {
      violations.excessiveOvertime.push(record.date)
      violations.totalViolations++
    }
  }

  return violations
}
