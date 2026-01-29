/**
 * Turnover Prediction Service
 * Predição de risco de saída de funcionários usando IA/ML
 */

import type { TurnoverPrediction, TurnoverFactor } from '@/types/ai'

// ============================================================================
// Type Definitions
// ============================================================================

interface EmployeeTurnoverData {
  id: string
  name: string
  department: string
  position: string
  hireDate: Date
  salary: number
  lastPromotion?: Date
  lastRaise?: Date
  absenceDays: number
  overtimeHours: number
  performanceScore?: number
  engagementScore?: number
  benefitsValue: number
}

interface MarketData {
  averageSalaryForPosition: number
  industryTurnoverRate: number
}

// ============================================================================
// Factor Calculations
// ============================================================================

function calculateTenureFactor(hireDate: Date): TurnoverFactor {
  const monthsEmployed =
    (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)

  let impact = 0
  let description = ''

  if (monthsEmployed < 6) {
    impact = 50 // High risk in first 6 months
    description = 'Funcionário em período de adaptação (menos de 6 meses)'
  } else if (monthsEmployed < 12) {
    impact = 30 // Moderate risk in first year
    description = 'Primeiro ano de empresa (6-12 meses)'
  } else if (monthsEmployed < 24) {
    impact = 10 // Lower risk after first year
    description = 'Entre 1-2 anos de empresa'
  } else if (monthsEmployed < 60) {
    impact = -20 // Negative = protective factor
    description = 'Funcionário estabelecido (2-5 anos)'
  } else {
    impact = -40 // Strong retention
    description = `${(monthsEmployed / 12).toFixed(1)} anos de empresa - alta estabilidade`
  }

  return {
    name: 'Tempo de Casa',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculateSalaryFactor(
  salary: number,
  marketData: MarketData
): TurnoverFactor {
  const salaryRatio = salary / marketData.averageSalaryForPosition
  let impact = 0
  let description = ''

  if (salaryRatio < 0.7) {
    impact = 60
    description = `Salário 30%+ abaixo do mercado (R$ ${salary.toLocaleString('pt-BR')})`
  } else if (salaryRatio < 0.85) {
    impact = 40
    description = `Salário 15-30% abaixo do mercado`
  } else if (salaryRatio < 0.95) {
    impact = 20
    description = `Salário 5-15% abaixo do mercado`
  } else if (salaryRatio <= 1.05) {
    impact = -10
    description = `Salário compatível com o mercado`
  } else if (salaryRatio <= 1.20) {
    impact = -30
    description = `Salário acima do mercado (${((salaryRatio - 1) * 100).toFixed(0)}%)`
  } else {
    impact = -50
    description = `Salário muito acima do mercado (${((salaryRatio - 1) * 100).toFixed(0)}%)`
  }

  return {
    name: 'Competitividade Salarial',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculateCareerProgressionFactor(
  lastPromotion?: Date,
  lastRaise?: Date
): TurnoverFactor {
  const now = new Date()
  let impact = 0
  let description = ''

  const monthsSincePromotion = lastPromotion
    ? (now.getTime() - lastPromotion.getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 999

  const monthsSinceRaise = lastRaise
    ? (now.getTime() - lastRaise.getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 999

  if (!lastPromotion && !lastRaise) {
    impact = 40
    description = 'Nunca recebeu promoção ou aumento'
  } else if (monthsSincePromotion > 36 || monthsSinceRaise > 24) {
    impact = 35
    description = 'Sem progressão de carreira há mais de 2 anos'
  } else if (monthsSincePromotion > 24 || monthsSinceRaise > 18) {
    impact = 25
    description = 'Sem progressão de carreira há 1,5-2 anos'
  } else if (monthsSincePromotion <= 12 || monthsSinceRaise <= 12) {
    impact = -30
    description = 'Promoção/aumento recente (último ano)'
  } else {
    impact = 10
    description = 'Progressão moderada'
  }

  return {
    name: 'Progressão de Carreira',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculateAbsenceFactor(absenceDays: number): TurnoverFactor {
  let impact = 0
  let description = ''

  if (absenceDays >= 15) {
    impact = 40
    description = `${absenceDays} dias de ausência - possível desengajamento`
  } else if (absenceDays >= 10) {
    impact = 25
    description = `${absenceDays} dias de ausência - acima da média`
  } else if (absenceDays >= 5) {
    impact = 10
    description = `${absenceDays} dias de ausência - dentro da média`
  } else {
    impact = -15
    description = `${absenceDays} dias de ausência - baixo absenteísmo`
  }

  return {
    name: 'Absenteísmo',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculateOvertimeFactor(overtimeHours: number): TurnoverFactor {
  let impact = 0
  let description = ''

  if (overtimeHours >= 60) {
    impact = 45
    description = `${overtimeHours}h extras/mês - alto risco de burnout`
  } else if (overtimeHours >= 40) {
    impact = 30
    description = `${overtimeHours}h extras/mês - sobrecarga de trabalho`
  } else if (overtimeHours >= 20) {
    impact = 15
    description = `${overtimeHours}h extras/mês - horas extras moderadas`
  } else if (overtimeHours >= 10) {
    impact = 5
    description = `${overtimeHours}h extras/mês - poucas horas extras`
  } else {
    impact = -10
    description = 'Carga de trabalho equilibrada'
  }

  return {
    name: 'Horas Extras',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculatePerformanceFactor(performanceScore?: number): TurnoverFactor {
  if (!performanceScore) {
    return {
      name: 'Performance',
      impact: 0,
      description: 'Sem avaliação de desempenho',
      category: 'neutral',
    }
  }

  let impact = 0
  let description = ''

  if (performanceScore < 50) {
    impact = 35
    description = `Performance baixa (${performanceScore}) - possível frustração`
  } else if (performanceScore < 70) {
    impact = 15
    description: `Performance abaixo da média (${performanceScore})`
  } else if (performanceScore < 85) {
    impact = -10
    description: `Performance adequada (${performanceScore})`
  } else if (performanceScore < 95) {
    impact = -20
    description: `Alta performance (${performanceScore})`
  } else {
    impact = 25 // High performers are often recruited by competitors
    description: `Performance excepcional (${performanceScore}) - alvo de headhunters`
  }

  return {
    name: 'Desempenho',
    impact,
    description,
    category: performanceScore >= 85 && performanceScore < 95 ? 'positive' : 'negative',
  }
}

function calculateEngagementFactor(engagementScore?: number): TurnoverFactor {
  if (!engagementScore) {
    return {
      name: 'Engajamento',
      impact: 0,
      description: 'Sem pesquisa de engajamento',
      category: 'neutral',
    }
  }

  let impact = 0
  let description = ''

  if (engagementScore < 40) {
    impact = 50
    description = `Engajamento muito baixo (${engagementScore}) - alto risco`
  } else if (engagementScore < 60) {
    impact = 30
    description = `Baixo engajamento (${engagementScore})`
  } else if (engagementScore < 75) {
    impact = 10
    description = `Engajamento moderado (${engagementScore})`
  } else if (engagementScore < 90) {
    impact = -25
    description = `Bom engajamento (${engagementScore})`
  } else {
    impact = -45
    description = `Engajamento excepcional (${engagementScore})`
  }

  return {
    name: 'Engajamento',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'positive',
  }
}

function calculateBenefitsFactor(
  benefitsValue: number,
  salary: number
): TurnoverFactor {
  const benefitsRatio = benefitsValue / salary

  let impact = 0
  let description = ''

  if (benefitsRatio < 0.1) {
    impact = 20
    description = 'Pacote de benefícios básico'
  } else if (benefitsRatio < 0.2) {
    impact = 0
    description = 'Benefícios padrão de mercado'
  } else if (benefitsRatio < 0.3) {
    impact = -15
    description = 'Bom pacote de benefícios'
  } else {
    impact = -25
    description = 'Excelente pacote de benefícios'
  }

  return {
    name: 'Benefícios',
    impact,
    description,
    category: impact > 0 ? 'negative' : 'neutral',
  }
}

// ============================================================================
// Main Prediction Function
// ============================================================================

export async function predictTurnover(
  employee: EmployeeTurnoverData,
  marketData: MarketData
): Promise<TurnoverPrediction> {
  // Calculate all factors
  const factors: TurnoverFactor[] = [
    calculateTenureFactor(employee.hireDate),
    calculateSalaryFactor(employee.salary, marketData),
    calculateCareerProgressionFactor(employee.lastPromotion, employee.lastRaise),
    calculateAbsenceFactor(employee.absenceDays),
    calculateOvertimeFactor(employee.overtimeHours),
    calculatePerformanceFactor(employee.performanceScore),
    calculateEngagementFactor(employee.engagementScore),
    calculateBenefitsFactor(employee.benefitsValue, employee.salary),
  ]

  // Calculate overall risk score
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0)

  // Normalize to 0-100 scale
  // Base risk is 30%, then adjusted by factors
  const baseRisk = 30
  const adjustedRisk = baseRisk + totalImpact * 0.5

  const risk = Math.max(0, Math.min(100, adjustedRisk))

  // Determine risk level
  let riskLevel: TurnoverPrediction['riskLevel']
  if (risk >= 75) riskLevel = 'critical'
  else if (risk >= 50) riskLevel = 'high'
  else if (risk >= 30) riskLevel = 'medium'
  else riskLevel = 'low'

  // Generate suggestions
  const suggestions = generateSuggestions(factors, riskLevel)

  // Calculate confidence based on data availability
  let confidence = 70 // Base confidence

  if (employee.performanceScore) confidence += 10
  if (employee.engagementScore) confidence += 10
  if (employee.lastPromotion || employee.lastRaise) confidence += 5
  if (employee.absenceDays > 0) confidence += 5

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    risk: Math.round(risk),
    riskLevel,
    factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    confidence: Math.min(100, confidence),
    suggestions,
    predictedAt: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  }
}

// ============================================================================
// Suggestions Generator
// ============================================================================

function generateSuggestions(
  factors: TurnoverFactor[],
  riskLevel: TurnoverPrediction['riskLevel']
): string[] {
  const suggestions: string[] = []

  // Get negative factors (risk indicators)
  const negativeFactors = factors
    .filter(f => f.impact > 20)
    .sort((a, b) => b.impact - a.impact)

  // Generate targeted suggestions
  for (const factor of negativeFactors) {
    switch (factor.name) {
      case 'Competitividade Salarial':
        suggestions.push(
          'Revisar salário: considere ajuste para alinhar com o mercado',
          'Avaliar promoção ou bonificação por desempenho'
        )
        break

      case 'Progressão de Carreira':
        suggestions.push(
          'Criar plano de desenvolvimento individual (PDI)',
          'Discutir oportunidades de crescimento na próxima 1:1',
          'Considerar promoção ou mudança de responsabilidades'
        )
        break

      case 'Absenteísmo':
        suggestions.push(
          'Investigar causas das ausências em conversa privada',
          'Avaliar possível problema de saúde ou pessoal',
          'Oferecer suporte (benefícios, flexibilidade, apoio psicológico)'
        )
        break

      case 'Horas Extras':
        suggestions.push(
          'Revisar distribuição de trabalho na equipe',
          'Avaliar contratação de suporte adicional',
          'Implementar melhorias de processo para reduzir sobrecarga',
          'Garantir respeito ao direito de desconexão'
        )
        break

      case 'Desempenho':
        if (factor.impact > 0) {
          suggestions.push(
            'Fornecer feedback construtivo e apoio ao desenvolvimento',
            'Criar plano de melhoria de performance',
            'Avaliar realocação para função mais adequada ao perfil'
          )
        } else {
          // High performer - risk of poaching
          suggestions.push(
            'Reconhecer e recompensar alto desempenho',
            'Oferecer desafios e projetos estratégicos',
            'Discutir plano de carreira de longo prazo'
          )
        }
        break

      case 'Engajamento':
        suggestions.push(
          'Realizar 1:1 para entender insatisfações',
          'Avaliar fit cultural e oportunidades de realocação',
          'Reconhecer contribuições e dar mais autonomia',
          'Envolver em projetos alinhados aos interesses pessoais'
        )
        break

      case 'Tempo de Casa':
        if (factor.impact > 0) {
          suggestions.push(
            'Intensificar onboarding e integração',
            'Designar mentor/buddy para acompanhamento',
            'Fazer check-ins frequentes nos primeiros meses'
          )
        }
        break
    }
  }

  // Add general suggestions based on risk level
  if (riskLevel === 'critical' || riskLevel === 'high') {
    suggestions.unshift(
      'ATENÇÃO: Agendar conversa individual URGENTE com gestor e RH',
      'Preparar proposta de retenção se funcionário for crítico'
    )
  }

  // Remove duplicates and limit
  return [...new Set(suggestions)].slice(0, 8)
}

// ============================================================================
// Batch Prediction
// ============================================================================

export async function predictTurnoverForDepartment(
  employees: EmployeeTurnoverData[],
  marketData: MarketData
): Promise<TurnoverPrediction[]> {
  const predictions = await Promise.all(
    employees.map(emp => predictTurnover(emp, marketData))
  )

  // Sort by risk (highest first)
  return predictions.sort((a, b) => b.risk - a.risk)
}

// ============================================================================
// Analytics
// ============================================================================

export function calculateDepartmentTurnoverRisk(
  predictions: TurnoverPrediction[]
): {
  averageRisk: number
  criticalCount: number
  highCount: number
  atRiskEmployees: string[]
} {
  const avgRisk =
    predictions.reduce((sum, p) => sum + p.risk, 0) / predictions.length

  const criticalCount = predictions.filter(p => p.riskLevel === 'critical').length
  const highCount = predictions.filter(p => p.riskLevel === 'high').length

  const atRisk = predictions
    .filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high')
    .map(p => p.employeeName)

  return {
    averageRisk: Math.round(avgRisk),
    criticalCount,
    highCount,
    atRiskEmployees: atRisk,
  }
}
