/**
 * Pattern Detection Service
 * Detecta padrões comportamentais e riscos
 */

import type { Pattern, PatternDetectionResult, PatternType } from '@/types/ai'

// ============================================================================
// Type Definitions
// ============================================================================

interface EmployeeData {
  id: string
  name: string
  department: string
  hireDate: Date
  absences: Array<{
    date: Date
    type: string
    justified: boolean
  }>
  timeEntries: Array<{
    date: Date
    checkIn?: Date
    checkOut?: Date
    overtimeMinutes: number
  }>
  performance?: {
    lastReview: Date
    score: number
    trend: 'improving' | 'stable' | 'declining'
  }
}

// ============================================================================
// Absenteeism Pattern Detection
// ============================================================================

export async function detectAbsenteeismPattern(
  employee: EmployeeData
): Promise<Pattern | null> {
  const { absences } = employee
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Filter recent absences
  const recentAbsences = absences.filter(a => a.date >= threeMonthsAgo)

  if (recentAbsences.length === 0) return null

  // Calculate metrics
  const totalAbsences = recentAbsences.length
  const unjustifiedAbsences = recentAbsences.filter(a => !a.justified).length
  const mondayFridayAbsences = recentAbsences.filter(a => {
    const day = a.date.getDay()
    return day === 1 || day === 5 // Monday or Friday
  }).length

  // Pattern indicators
  let confidence = 0
  const evidence: Pattern['evidence'] = []

  // High frequency
  if (totalAbsences >= 6) {
    confidence += 30
    evidence.push({
      date: now,
      description: `${totalAbsences} faltas nos últimos 3 meses`,
      severity: totalAbsences >= 10 ? 'high' : 'medium',
    })
  }

  // Unjustified absences
  if (unjustifiedAbsences >= 3) {
    confidence += 25
    evidence.push({
      date: now,
      description: `${unjustifiedAbsences} faltas não justificadas`,
      severity: 'medium',
    })
  }

  // Monday/Friday pattern
  if (mondayFridayAbsences >= 4) {
    confidence += 20
    evidence.push({
      date: now,
      description: `${mondayFridayAbsences} faltas em segundas ou sextas-feiras`,
      severity: 'medium',
    })
  }

  // Sequential absences (same day of week)
  const dayOfWeekCount: Record<number, number> = {}
  recentAbsences.forEach(a => {
    const day = a.date.getDay()
    dayOfWeekCount[day] = (dayOfWeekCount[day] || 0) + 1
  })

  const maxSameDayAbsences = Math.max(...Object.values(dayOfWeekCount))
  if (maxSameDayAbsences >= 3) {
    confidence += 15
    evidence.push({
      date: now,
      description: 'Padrão recorrente no mesmo dia da semana',
      severity: 'low',
    })
  }

  // Monthly pattern (first/last week)
  const firstWeekAbsences = recentAbsences.filter(a => {
    const date = a.date.getDate()
    return date <= 7 || date >= 24
  }).length

  if (firstWeekAbsences >= totalAbsences * 0.6) {
    confidence += 10
    evidence.push({
      date: now,
      description: 'Faltas concentradas no início/fim do mês',
      severity: 'low',
    })
  }

  // No pattern detected
  if (confidence < 30) return null

  return {
    type: 'absenteeism',
    confidence: Math.min(confidence, 100),
    evidence,
    impact: 'Produtividade reduzida, impacto na equipe, possível insatisfação',
    recommendation: 'Agendar conversa individual para entender as causas e oferecer suporte',
  }
}

// ============================================================================
// Overtime Pattern Detection
// ============================================================================

export async function detectOvertimePattern(
  employee: EmployeeData
): Promise<Pattern | null> {
  const { timeEntries } = employee
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentEntries = timeEntries.filter(e => e.date >= oneMonthAgo)

  if (recentEntries.length === 0) return null

  const totalOvertimeHours = recentEntries.reduce(
    (sum, e) => sum + e.overtimeMinutes / 60,
    0
  )
  const avgOvertimePerDay = totalOvertimeHours / recentEntries.length
  const daysWithOvertime = recentEntries.filter(e => e.overtimeMinutes > 0).length

  let confidence = 0
  const evidence: Pattern['evidence'] = []

  // Excessive total overtime
  if (totalOvertimeHours >= 40) {
    confidence += 40
    evidence.push({
      date: now,
      description: `${totalOvertimeHours.toFixed(1)} horas extras no último mês`,
      severity: totalOvertimeHours >= 60 ? 'high' : 'medium',
    })
  }

  // High frequency
  const overtimeFrequency = daysWithOvertime / recentEntries.length
  if (overtimeFrequency >= 0.5) {
    confidence += 30
    evidence.push({
      date: now,
      description: `${(overtimeFrequency * 100).toFixed(0)}% dos dias com hora extra`,
      severity: overtimeFrequency >= 0.7 ? 'high' : 'medium',
    })
  }

  // Consecutive days with overtime
  let maxConsecutive = 0
  let currentConsecutive = 0

  recentEntries.forEach(entry => {
    if (entry.overtimeMinutes > 0) {
      currentConsecutive++
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
    } else {
      currentConsecutive = 0
    }
  })

  if (maxConsecutive >= 5) {
    confidence += 20
    evidence.push({
      date: now,
      description: `${maxConsecutive} dias consecutivos com hora extra`,
      severity: maxConsecutive >= 10 ? 'high' : 'medium',
    })
  }

  // Late hours (after 8 PM)
  const lateNights = recentEntries.filter(e => {
    if (!e.checkOut) return false
    const hour = e.checkOut.getHours()
    return hour >= 20 || hour <= 2
  }).length

  if (lateNights >= 5) {
    confidence += 10
    evidence.push({
      date: now,
      description: `${lateNights} saídas após 20h`,
      severity: 'medium',
    })
  }

  if (confidence < 30) return null

  return {
    type: 'overtime',
    confidence: Math.min(confidence, 100),
    evidence,
    impact: 'Risco de burnout, baixa qualidade de vida, possível ineficiência',
    recommendation: 'Avaliar carga de trabalho, redistribuir tarefas, revisar processos',
  }
}

// ============================================================================
// Late Arrival Pattern Detection
// ============================================================================

export async function detectLateArrivalPattern(
  employee: EmployeeData
): Promise<Pattern | null> {
  const { timeEntries } = employee
  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentEntries = timeEntries.filter(e => e.date >= oneMonthAgo && e.checkIn)

  if (recentEntries.length === 0) return null

  // Assuming standard start time is 9:00 AM
  const standardStartHour = 9
  const standardStartMinute = 0

  const lateArrivals = recentEntries.filter(e => {
    if (!e.checkIn) return false
    const hour = e.checkIn.getHours()
    const minute = e.checkIn.getMinutes()
    return (
      hour > standardStartHour ||
      (hour === standardStartHour && minute > standardStartMinute + 15)
    )
  })

  const lateCount = lateArrivals.length
  const lateFrequency = lateCount / recentEntries.length

  let confidence = 0
  const evidence: Pattern['evidence'] = []

  if (lateCount >= 8) {
    confidence += 40
    evidence.push({
      date: now,
      description: `${lateCount} atrasos no último mês`,
      severity: lateCount >= 15 ? 'high' : 'medium',
    })
  }

  if (lateFrequency >= 0.3) {
    confidence += 30
    evidence.push({
      date: now,
      description: `${(lateFrequency * 100).toFixed(0)}% dos dias com atraso`,
      severity: 'medium',
    })
  }

  // Consistent pattern (same day of week)
  const dayOfWeekCount: Record<number, number> = {}
  lateArrivals.forEach(e => {
    if (e.checkIn) {
      const day = e.checkIn.getDay()
      dayOfWeekCount[day] = (dayOfWeekCount[day] || 0) + 1
    }
  })

  const maxSameDayLates = Math.max(...Object.values(dayOfWeekCount), 0)
  if (maxSameDayLates >= 4) {
    confidence += 20
    evidence.push({
      date: now,
      description: 'Atrasos recorrentes no mesmo dia da semana',
      severity: 'low',
    })
  }

  if (confidence < 30) return null

  return {
    type: 'late_arrival',
    confidence: Math.min(confidence, 100),
    evidence,
    impact: 'Impacto na pontualidade da equipe, possível problema pessoal',
    recommendation: 'Conversar para entender causas, avaliar flexibilização de horário se necessário',
  }
}

// ============================================================================
// Burnout Risk Detection
// ============================================================================

export async function detectBurnoutRisk(
  employee: EmployeeData
): Promise<Pattern | null> {
  const overtimePattern = await detectOvertimePattern(employee)
  const absencePattern = await detectAbsenteeismPattern(employee)

  let confidence = 0
  const evidence: Pattern['evidence'] = []

  // High overtime
  if (overtimePattern && overtimePattern.confidence >= 60) {
    confidence += 30
    evidence.push({
      date: new Date(),
      description: 'Excesso de horas extras consistente',
      severity: 'high',
    })
  }

  // Increasing absences
  if (absencePattern && absencePattern.confidence >= 50) {
    confidence += 25
    evidence.push({
      date: new Date(),
      description: 'Aumento no padrão de ausências',
      severity: 'medium',
    })
  }

  // Declining performance
  if (employee.performance?.trend === 'declining') {
    confidence += 25
    evidence.push({
      date: new Date(),
      description: 'Queda no desempenho recente',
      severity: 'high',
    })
  }

  // Low performance score
  if (employee.performance && employee.performance.score < 70) {
    confidence += 20
    evidence.push({
      date: new Date(),
      description: `Score de desempenho baixo (${employee.performance.score})`,
      severity: 'medium',
    })
  }

  if (confidence < 40) return null

  return {
    type: 'burnout_risk',
    confidence: Math.min(confidence, 100),
    evidence,
    impact: 'Risco de afastamento, queda drástica de produtividade, saída da empresa',
    recommendation: 'Atenção urgente: conversa com RH e gestor, possível redistribuição de trabalho, suporte psicológico',
  }
}

// ============================================================================
// Main Pattern Detection Function
// ============================================================================

export async function detectAllPatterns(
  employee: EmployeeData
): Promise<PatternDetectionResult> {
  const patterns: Pattern[] = []

  // Run all detectors
  const [absenteeism, overtime, lateArrival, burnout] = await Promise.all([
    detectAbsenteeismPattern(employee),
    detectOvertimePattern(employee),
    detectLateArrivalPattern(employee),
    detectBurnoutRisk(employee),
  ])

  if (absenteeism) patterns.push(absenteeism)
  if (overtime) patterns.push(overtime)
  if (lateArrival) patterns.push(lateArrival)
  if (burnout) patterns.push(burnout)

  // Calculate overall risk
  let overallRisk: PatternDetectionResult['overallRisk'] = 'low'

  if (patterns.some(p => p.type === 'burnout_risk' && p.confidence >= 70)) {
    overallRisk = 'critical'
  } else if (patterns.some(p => p.confidence >= 80)) {
    overallRisk = 'high'
  } else if (patterns.some(p => p.confidence >= 60)) {
    overallRisk = 'medium'
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    patterns,
    overallRisk,
    detectedAt: new Date(),
  }
}

// ============================================================================
// Team Pattern Detection
// ============================================================================

export async function detectTeamIssues(
  departmentData: {
    id: string
    name: string
    employees: EmployeeData[]
  }
): Promise<Pattern | null> {
  const { employees } = departmentData

  if (employees.length === 0) return null

  let confidence = 0
  const evidence: Pattern['evidence'] = []

  // High turnover (simplified check)
  const recentHires = employees.filter(e => {
    const monthsSinceHire =
      (Date.now() - e.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return monthsSinceHire <= 6
  })

  const turnoverRate = recentHires.length / employees.length

  if (turnoverRate >= 0.3) {
    confidence += 40
    evidence.push({
      date: new Date(),
      description: `${(turnoverRate * 100).toFixed(0)}% de rotatividade recente`,
      severity: turnoverRate >= 0.5 ? 'high' : 'medium',
    })
  }

  // Team-wide overtime
  const employeesWithOvertime = await Promise.all(
    employees.map(e => detectOvertimePattern(e))
  )
  const overtimeCount = employeesWithOvertime.filter(p => p !== null).length
  const overtimeRate = overtimeCount / employees.length

  if (overtimeRate >= 0.5) {
    confidence += 30
    evidence.push({
      date: new Date(),
      description: `${(overtimeRate * 100).toFixed(0)}% da equipe com excesso de horas extras`,
      severity: 'high',
    })
  }

  // Team-wide performance issues
  const lowPerformers = employees.filter(
    e => e.performance && e.performance.score < 70
  )
  const lowPerfRate = lowPerformers.length / employees.length

  if (lowPerfRate >= 0.4) {
    confidence += 30
    evidence.push({
      date: new Date(),
      description: `${(lowPerfRate * 100).toFixed(0)}% da equipe com baixo desempenho`,
      severity: 'high',
    })
  }

  if (confidence < 40) return null

  return {
    type: 'team_issues',
    confidence: Math.min(confidence, 100),
    evidence,
    impact: 'Problemas estruturais no departamento, possível gestão inadequada',
    recommendation: 'Revisão de processos, avaliação da liderança, pesquisa de clima',
  }
}
