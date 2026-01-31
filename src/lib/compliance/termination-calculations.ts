/**
 * Termination Calculations - Calculos de Rescisao Trabalhista conforme CLT
 *
 * Implementa calculos de:
 * - Saldo de salario
 * - Ferias vencidas e proporcionais + 1/3 constitucional
 * - 13o salario proporcional
 * - Aviso previo (trabalhado ou indenizado)
 * - Multa FGTS (40% ou 20% acordo)
 * - Descontos (INSS, IRRF)
 */

import { calculateHourlyRate, CLT_CONSTANTS } from './clt-calculations'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipos de rescisao conforme CLT
 */
export type TerminationType =
  | 'sem_justa_causa'   // Demissao sem justa causa (Art. 477 CLT)
  | 'justa_causa'       // Demissao por justa causa (Art. 482 CLT)
  | 'pedido_demissao'   // Pedido de demissao pelo funcionario
  | 'acordo_mutuo'      // Acordo mutuo (Art. 484-A CLT - Reforma Trabalhista)

/**
 * Entrada para calculo de rescisao
 */
export interface TerminationInput {
  /** Salario base do funcionario */
  baseSalary: number
  /** Data de admissao */
  hireDate: string | Date
  /** Data de saida/rescisao */
  terminationDate: string | Date
  /** Tipo de rescisao */
  terminationType: TerminationType
  /** Aviso previo trabalhado? (se aplicavel) */
  noticeWorked: boolean
  /** Saldo FGTS (informado pelo usuario) */
  fgtsBalance: number
  /** Numero de dependentes (para IRRF) */
  dependents: number
  /** Dias trabalhados no mes da rescisao (para saldo de salario) */
  workedDaysInMonth?: number
  /** Ultimo periodo de ferias gozado (formato: YYYY-MM-DD) */
  lastVacationPeriodEnd?: string | Date
  /** Meses de ferias ja gozados no periodo aquisitivo atual */
  vacationMonthsTaken?: number
}

/**
 * Resultado do calculo de rescisao
 */
export interface TerminationResult {
  // Dados de entrada processados
  workedMonths: number
  workedYears: number
  noticeDays: number
  terminationType: TerminationType

  // Verbas rescisorias
  salaryBalance: number           // Saldo de salario
  vacationVested: number          // Ferias vencidas
  vacationProportional: number    // Ferias proporcionais
  vacationBonus: number           // 1/3 constitucional
  thirteenthProportional: number  // 13o proporcional
  noticePeriodValue: number       // Aviso previo (se indenizado)
  fgtsFine: number                // Multa FGTS (40% ou 20%)

  // Totais brutos
  totalGross: number

  // Descontos
  inssDeduction: number
  irrfDeduction: number
  noticePenalty: number           // Desconto se nao cumpriu aviso (pedido demissao)
  otherDeductions: number

  // Total liquido
  totalDeductions: number
  totalNet: number

  // Detalhes adicionais
  hasVestedVacation: boolean
  vestedVacationPeriods: number
  fgtsWithdrawable: number        // FGTS que pode sacar (saldo + multa se aplicavel)

  // Direitos adicionais
  hasUnemploymentInsurance: boolean // Direito a seguro-desemprego
  canWithdrawFgts: boolean          // Pode sacar FGTS
}

/**
 * Regras por tipo de rescisao
 */
interface TerminationRules {
  hasNoticePeriod: boolean
  noticePercentage: number       // 100% normal, 50% acordo
  hasFgtsFine: boolean
  fgtsFinePercentage: number     // 40% normal, 20% acordo
  hasProportionalThirteenth: boolean
  hasProportionalVacation: boolean
  hasVestedVacation: boolean
  hasUnemploymentInsurance: boolean
  canWithdrawFgts: boolean
  penaltyIfNoNotice: boolean     // Desconta aviso se nao trabalhar
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Regras por tipo de rescisao
 */
const TERMINATION_RULES: Record<TerminationType, TerminationRules> = {
  sem_justa_causa: {
    hasNoticePeriod: true,
    noticePercentage: 100,
    hasFgtsFine: true,
    fgtsFinePercentage: 40,
    hasProportionalThirteenth: true,
    hasProportionalVacation: true,
    hasVestedVacation: true,
    hasUnemploymentInsurance: true,
    canWithdrawFgts: true,
    penaltyIfNoNotice: false,
  },
  justa_causa: {
    hasNoticePeriod: false,
    noticePercentage: 0,
    hasFgtsFine: false,
    fgtsFinePercentage: 0,
    hasProportionalThirteenth: true, // 13o proporcional sempre devido
    hasProportionalVacation: false,  // Perde ferias proporcionais
    hasVestedVacation: true,         // Ferias vencidas sempre devidas
    hasUnemploymentInsurance: false,
    canWithdrawFgts: false,
    penaltyIfNoNotice: false,
  },
  pedido_demissao: {
    hasNoticePeriod: true,
    noticePercentage: 100,
    hasFgtsFine: false,
    fgtsFinePercentage: 0,
    hasProportionalThirteenth: true,
    hasProportionalVacation: true,
    hasVestedVacation: true,
    hasUnemploymentInsurance: false,
    canWithdrawFgts: false,
    penaltyIfNoNotice: true,         // Desconta se nao cumprir aviso
  },
  acordo_mutuo: {
    hasNoticePeriod: true,
    noticePercentage: 50,            // 50% do aviso previo
    hasFgtsFine: true,
    fgtsFinePercentage: 20,          // 20% da multa FGTS
    hasProportionalThirteenth: true,
    hasProportionalVacation: true,
    hasVestedVacation: true,
    hasUnemploymentInsurance: false,
    canWithdrawFgts: true,           // Saca 80% do FGTS
    penaltyIfNoNotice: false,
  },
}

/**
 * Dias de aviso previo por ano trabalhado (Art. 1o Lei 12.506/2011)
 * Minimo: 30 dias
 * Adicional: 3 dias por ano trabalhado
 * Maximo: 90 dias
 */
const NOTICE_BASE_DAYS = 30
const NOTICE_ADDITIONAL_DAYS_PER_YEAR = 3
const NOTICE_MAX_DAYS = 90

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcula a diferenca em meses entre duas datas
 */
export function getMonthsDiff(startDate: Date, endDate: Date): number {
  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()
  const days = endDate.getDate() - startDate.getDate()

  let totalMonths = years * 12 + months

  // Se trabalhou mais de 14 dias no mes, conta como mes completo
  if (days >= 15) {
    totalMonths += 1
  }

  return Math.max(0, totalMonths)
}

/**
 * Calcula a diferenca em anos completos entre duas datas
 */
export function getYearsDiff(startDate: Date, endDate: Date): number {
  return Math.floor(getMonthsDiff(startDate, endDate) / 12)
}

/**
 * Calcula os dias de aviso previo conforme Lei 12.506/2011
 * Base: 30 dias + 3 dias por ano trabalhado (max 90 dias)
 */
export function calculateNoticeDays(yearsWorked: number): number {
  const additionalDays = yearsWorked * NOTICE_ADDITIONAL_DAYS_PER_YEAR
  return Math.min(NOTICE_BASE_DAYS + additionalDays, NOTICE_MAX_DAYS)
}

/**
 * Converte string para Date
 */
function toDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date
}

/**
 * Calcula os meses trabalhados no ano atual (para 13o proporcional)
 */
function getMonthsWorkedInYear(hireDate: Date, terminationDate: Date): number {
  const yearStart = new Date(terminationDate.getFullYear(), 0, 1)
  const effectiveStart = hireDate > yearStart ? hireDate : yearStart

  return getMonthsDiff(effectiveStart, terminationDate)
}

/**
 * Calcula os meses de ferias proporcionais
 * Considera o periodo aquisitivo (12 meses a partir da admissao ou ultimo periodo)
 */
function getVacationProportionalMonths(
  hireDate: Date,
  terminationDate: Date,
  lastVacationPeriodEnd?: Date
): number {
  // Se tem periodo de ferias gozado, calcula a partir dele
  const referenceDate = lastVacationPeriodEnd || hireDate

  // Calcula meses desde a ultima referencia
  const monthsSinceReference = getMonthsDiff(referenceDate, terminationDate)

  // Retorna apenas os meses do periodo aquisitivo atual (0-12)
  return monthsSinceReference % 12
}

/**
 * Calcula periodos de ferias vencidas
 * Ferias vencem apos 12 meses do periodo aquisitivo
 */
function getVestedVacationPeriods(
  hireDate: Date,
  terminationDate: Date,
  lastVacationPeriodEnd?: Date,
  vacationMonthsTaken: number = 0
): number {
  const referenceDate = lastVacationPeriodEnd || hireDate
  const monthsSinceReference = getMonthsDiff(referenceDate, terminationDate)

  // Cada 12 meses completos gera direito a ferias
  const totalPeriods = Math.floor(monthsSinceReference / 12)

  // Subtrai periodos ja gozados
  return Math.max(0, totalPeriods - Math.floor(vacationMonthsTaken / 12))
}

// ============================================================================
// INSS CALCULATION (Tabela 2024)
// ============================================================================

interface INSSBracket {
  min: number
  max: number
  rate: number
}

const INSS_BRACKETS_2024: INSSBracket[] = [
  { min: 0, max: 1412.00, rate: 7.5 },
  { min: 1412.01, max: 2666.68, rate: 9 },
  { min: 2666.69, max: 4000.03, rate: 12 },
  { min: 4000.04, max: 7786.02, rate: 14 },
]

const INSS_CEILING_2024 = 7786.02

/**
 * Calcula INSS progressivo
 */
export function calculateINSS(grossSalary: number): number {
  let inss = 0
  let previousMax = 0

  for (const bracket of INSS_BRACKETS_2024) {
    if (grossSalary <= 0) break

    const taxableInBracket = Math.min(
      Math.max(0, grossSalary - previousMax),
      bracket.max - previousMax
    )

    if (taxableInBracket > 0) {
      inss += taxableInBracket * (bracket.rate / 100)
    }

    previousMax = bracket.max

    if (grossSalary <= bracket.max) break
  }

  // Aplica teto
  const ceiling = INSS_BRACKETS_2024.reduce((acc, b) => {
    const range = b.max - (acc.prev || 0)
    return {
      total: acc.total + range * (b.rate / 100),
      prev: b.max,
    }
  }, { total: 0, prev: 0 })

  return Math.round(Math.min(inss, ceiling.total) * 100) / 100
}

// ============================================================================
// IRRF CALCULATION (Tabela 2024)
// ============================================================================

interface IRRFBracket {
  min: number
  max: number | null
  rate: number
  deduction: number
}

const IRRF_BRACKETS_2024: IRRFBracket[] = [
  { min: 0, max: 2259.20, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 7.5, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 662.77 },
  { min: 4664.69, max: null, rate: 27.5, deduction: 896.00 },
]

const IRRF_DEPENDENT_DEDUCTION_2024 = 189.59

/**
 * Calcula IRRF
 * Base = Salario Bruto - INSS - (Dependentes x Deducao)
 */
export function calculateIRRF(
  grossSalary: number,
  inssValue: number,
  dependents: number = 0
): number {
  // Base de calculo
  const taxableBase = grossSalary - inssValue - (dependents * IRRF_DEPENDENT_DEDUCTION_2024)

  if (taxableBase <= 0) return 0

  // Encontra a faixa
  for (let i = IRRF_BRACKETS_2024.length - 1; i >= 0; i--) {
    const bracket = IRRF_BRACKETS_2024[i]
    if (taxableBase >= bracket.min) {
      const irrf = (taxableBase * bracket.rate / 100) - bracket.deduction
      return Math.max(0, Math.round(irrf * 100) / 100)
    }
  }

  return 0
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calcula todos os valores de rescisao trabalhista
 */
export function calculateTermination(input: TerminationInput): TerminationResult {
  const hireDate = toDate(input.hireDate)
  const terminationDate = toDate(input.terminationDate)
  const lastVacationEnd = input.lastVacationPeriodEnd
    ? toDate(input.lastVacationPeriodEnd)
    : undefined

  const rules = TERMINATION_RULES[input.terminationType]

  // Calculos de tempo
  const totalMonths = getMonthsDiff(hireDate, terminationDate)
  const totalYears = getYearsDiff(hireDate, terminationDate)
  const noticeDays = rules.hasNoticePeriod ? calculateNoticeDays(totalYears) : 0

  // ==========================================
  // 1. SALDO DE SALARIO
  // ==========================================
  const daysInMonth = input.workedDaysInMonth ?? terminationDate.getDate()
  const salaryBalance = Math.round((input.baseSalary / 30) * daysInMonth * 100) / 100

  // ==========================================
  // 2. FERIAS VENCIDAS
  // ==========================================
  const vestedPeriods = rules.hasVestedVacation
    ? getVestedVacationPeriods(hireDate, terminationDate, lastVacationEnd, input.vacationMonthsTaken)
    : 0
  const vacationVested = vestedPeriods * input.baseSalary

  // ==========================================
  // 3. FERIAS PROPORCIONAIS
  // ==========================================
  const proportionalMonths = rules.hasProportionalVacation
    ? getVacationProportionalMonths(hireDate, terminationDate, lastVacationEnd)
    : 0
  const vacationProportional = Math.round(
    (input.baseSalary / 12) * proportionalMonths * 100
  ) / 100

  // ==========================================
  // 4. 1/3 CONSTITUCIONAL (sobre ferias)
  // ==========================================
  const totalVacation = vacationVested + vacationProportional
  const vacationBonus = Math.round((totalVacation / 3) * 100) / 100

  // ==========================================
  // 5. 13o SALARIO PROPORCIONAL
  // ==========================================
  const monthsInYear = rules.hasProportionalThirteenth
    ? getMonthsWorkedInYear(hireDate, terminationDate)
    : 0
  const thirteenthProportional = Math.round(
    (input.baseSalary / 12) * monthsInYear * 100
  ) / 100

  // ==========================================
  // 6. AVISO PREVIO
  // ==========================================
  let noticePeriodValue = 0
  let noticePenalty = 0

  if (rules.hasNoticePeriod && !input.noticeWorked) {
    // Aviso previo indenizado
    const noticeValue = Math.round(
      (input.baseSalary / 30) * noticeDays * 100
    ) / 100

    if (input.terminationType === 'pedido_demissao' && rules.penaltyIfNoNotice) {
      // Funcionario nao cumpriu aviso = desconto
      noticePenalty = noticeValue
    } else {
      // Empresa paga aviso indenizado
      noticePeriodValue = Math.round(noticeValue * (rules.noticePercentage / 100) * 100) / 100
    }
  }

  // ==========================================
  // 7. MULTA FGTS
  // ==========================================
  const fgtsFine = rules.hasFgtsFine
    ? Math.round(input.fgtsBalance * (rules.fgtsFinePercentage / 100) * 100) / 100
    : 0

  // ==========================================
  // 8. TOTAL BRUTO
  // ==========================================
  const totalGross = Math.round((
    salaryBalance +
    vacationVested +
    vacationProportional +
    vacationBonus +
    thirteenthProportional +
    noticePeriodValue
  ) * 100) / 100

  // ==========================================
  // 9. DESCONTOS
  // ==========================================

  // Base para INSS: salario proporcional + 13o
  // Ferias e 1/3 sao isentos de INSS
  const inssBase = salaryBalance + thirteenthProportional + noticePeriodValue
  const inssDeduction = calculateINSS(inssBase)

  // Base para IRRF: bruto - INSS
  // Nota: ferias indenizadas tem tributacao especial, simplificando aqui
  const irrfBase = inssBase - inssDeduction
  const irrfDeduction = calculateIRRF(irrfBase, 0, input.dependents)

  const totalDeductions = Math.round((
    inssDeduction +
    irrfDeduction +
    noticePenalty
  ) * 100) / 100

  // ==========================================
  // 10. TOTAL LIQUIDO
  // ==========================================
  const totalNet = Math.round((totalGross - totalDeductions + fgtsFine) * 100) / 100

  // ==========================================
  // 11. FGTS SACAVEL
  // ==========================================
  let fgtsWithdrawable = 0
  if (rules.canWithdrawFgts) {
    if (input.terminationType === 'acordo_mutuo') {
      // Acordo mutuo: saca 80% do saldo
      fgtsWithdrawable = Math.round(input.fgtsBalance * 0.8 * 100) / 100
    } else {
      // Demissao sem justa causa: saca 100%
      fgtsWithdrawable = input.fgtsBalance
    }
    fgtsWithdrawable += fgtsFine
  }

  return {
    // Dados de entrada processados
    workedMonths: totalMonths,
    workedYears: totalYears,
    noticeDays,
    terminationType: input.terminationType,

    // Verbas rescisorias
    salaryBalance,
    vacationVested,
    vacationProportional,
    vacationBonus,
    thirteenthProportional,
    noticePeriodValue,
    fgtsFine,

    // Totais brutos
    totalGross,

    // Descontos
    inssDeduction,
    irrfDeduction,
    noticePenalty,
    otherDeductions: 0,

    // Total liquido
    totalDeductions,
    totalNet,

    // Detalhes adicionais
    hasVestedVacation: vestedPeriods > 0,
    vestedVacationPeriods: vestedPeriods,
    fgtsWithdrawable,

    // Direitos adicionais
    hasUnemploymentInsurance: rules.hasUnemploymentInsurance,
    canWithdrawFgts: rules.canWithdrawFgts,
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR UI
// ============================================================================

/**
 * Retorna a descricao do tipo de rescisao
 */
export function getTerminationTypeLabel(type: TerminationType): string {
  const labels: Record<TerminationType, string> = {
    sem_justa_causa: 'Demissao sem Justa Causa',
    justa_causa: 'Demissao por Justa Causa',
    pedido_demissao: 'Pedido de Demissao',
    acordo_mutuo: 'Acordo Mutuo (Art. 484-A)',
  }
  return labels[type]
}

/**
 * Retorna a descricao resumida dos direitos por tipo
 */
export function getTerminationRightsSummary(type: TerminationType): string[] {
  const rules = TERMINATION_RULES[type]
  const rights: string[] = []

  if (rules.hasNoticePeriod) {
    rights.push(`Aviso previo (${rules.noticePercentage}%)`)
  }
  if (rules.hasFgtsFine) {
    rights.push(`Multa FGTS ${rules.fgtsFinePercentage}%`)
  }
  if (rules.hasProportionalThirteenth) {
    rights.push('13o proporcional')
  }
  if (rules.hasProportionalVacation) {
    rights.push('Ferias proporcionais + 1/3')
  }
  if (rules.hasVestedVacation) {
    rights.push('Ferias vencidas')
  }
  if (rules.hasUnemploymentInsurance) {
    rights.push('Seguro-desemprego')
  }
  if (rules.canWithdrawFgts) {
    rights.push(type === 'acordo_mutuo' ? 'Saque FGTS (80%)' : 'Saque FGTS (100%)')
  }

  return rights
}

/**
 * Formata valor monetario em BRL
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
