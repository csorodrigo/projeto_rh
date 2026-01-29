/**
 * Insights Engine - Geração Automática de Insights
 * Fase 8 - Diferenciação
 *
 * Analisa métricas e gera insights acionáveis
 */

import type {
  Insight,
  TurnoverMetrics,
  AbsenteeismMetrics,
  RecruitmentMetrics,
  ProductivityMetrics,
  EngagementMetrics,
  DiversityMetrics,
} from '@/types/analytics';
import {
  TURNOVER_BENCHMARKS,
  ABSENTEEISM_BENCHMARKS,
  TIME_TO_HIRE_BENCHMARKS,
  EARLY_TURNOVER_BENCHMARKS,
  OVERTIME_BENCHMARKS,
  PROMOTION_RATE_BENCHMARKS,
  getBenchmarkStatus,
} from './benchmarks';
import { detectAnomaly, calculateStdDev, calculateAverage } from './metrics';

/**
 * Gera todos os insights baseado nas métricas
 */
export function generateInsights(metrics: {
  turnover?: TurnoverMetrics;
  absenteeism?: AbsenteeismMetrics;
  recruitment?: RecruitmentMetrics;
  productivity?: ProductivityMetrics;
  engagement?: EngagementMetrics;
  diversity?: DiversityMetrics;
}): Insight[] {
  const insights: Insight[] = [];

  if (metrics.turnover) {
    insights.push(...analyzeTurnover(metrics.turnover));
  }

  if (metrics.absenteeism) {
    insights.push(...analyzeAbsenteeism(metrics.absenteeism));
  }

  if (metrics.recruitment) {
    insights.push(...analyzeRecruitment(metrics.recruitment));
  }

  if (metrics.productivity) {
    insights.push(...analyzeProductivity(metrics.productivity));
  }

  if (metrics.engagement) {
    insights.push(...analyzeEngagement(metrics.engagement));
  }

  if (metrics.diversity) {
    insights.push(...analyzeDiversity(metrics.diversity));
  }

  // Ordenar por impacto (high > medium > low)
  return insights.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
}

/**
 * Analisa métricas de turnover
 */
function analyzeTurnover(metrics: TurnoverMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Turnover geral acima do benchmark
  const turnoverStatus = getBenchmarkStatus(
    metrics.rate,
    TURNOVER_BENCHMARKS,
    false
  );

  if (turnoverStatus === 'poor' || turnoverStatus === 'average') {
    const benchmark = TURNOVER_BENCHMARKS.good;
    const difference = metrics.rate - benchmark;
    const percentageAbove = (difference / benchmark) * 100;

    insights.push({
      id: `turnover-high-${Date.now()}`,
      type: turnoverStatus === 'poor' ? 'alert' : 'warning',
      category: 'turnover',
      title: `Turnover ${percentageAbove.toFixed(0)}% acima do ideal`,
      description: `Taxa de turnover atual é ${metrics.rate.toFixed(1)}%, enquanto o ideal seria até ${benchmark}%. Isso representa ${metrics.terminations} desligamentos no período.`,
      impact: turnoverStatus === 'poor' ? 'high' : 'medium',
      recommendation:
        'Realize entrevistas de desligamento, revise políticas de retenção e benefícios, e implemente programas de engajamento.',
      metric: {
        value: metrics.rate,
        benchmark,
        difference,
      },
      createdAt: now,
    });
  }

  // 2. Turnover alto em departamento específico
  const avgTurnover = metrics.rate;
  metrics.byDepartment.forEach((dept) => {
    if (dept.value > avgTurnover * 1.5) {
      // 50% acima da média
      insights.push({
        id: `turnover-dept-${dept.department}-${Date.now()}`,
        type: 'alert',
        category: 'turnover',
        title: `Turnover crítico em ${dept.department}`,
        description: `O departamento de ${dept.department} tem turnover de ${dept.value.toFixed(1)}%, ${((dept.value / avgTurnover - 1) * 100).toFixed(0)}% acima da média da empresa.`,
        impact: 'high',
        recommendation: `Investigar causas específicas no departamento de ${dept.department}. Considere: revisão de liderança, clima organizacional, carga de trabalho e compensação.`,
        metric: {
          value: dept.value,
          benchmark: avgTurnover,
          difference: dept.value - avgTurnover,
        },
        createdAt: now,
      });
    }
  });

  // 3. Tendência de crescimento
  if (metrics.trend.length >= 3) {
    const recent = metrics.trend.slice(-3).map((t) => t.value);
    const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];
    const increase = recent[2] - recent[0];

    if (isIncreasing && increase > 2) {
      insights.push({
        id: `turnover-trend-${Date.now()}`,
        type: 'warning',
        category: 'turnover',
        title: 'Turnover em tendência de alta',
        description: `O turnover aumentou ${increase.toFixed(1)} pontos percentuais nos últimos 3 meses, indicando uma tendência preocupante.`,
        impact: 'high',
        recommendation:
          'Ação imediata necessária. Agende reuniões com liderança para identificar causas e implementar plano de retenção.',
        createdAt: now,
      });
    }
  }

  // 4. Custo elevado de turnover
  if (metrics.cost > 100000) {
    // Custo > R$ 100k
    insights.push({
      id: `turnover-cost-${Date.now()}`,
      type: 'warning',
      category: 'turnover',
      title: 'Custo elevado de turnover',
      description: `O turnover gerou um custo estimado de R$ ${(metrics.cost / 1000).toFixed(0)}k no período, considerando recrutamento, treinamento e perda de produtividade.`,
      impact: 'high',
      recommendation:
        'Invista em programas de retenção. Mesmo investimentos significativos podem ter ROI positivo se reduzirem o turnover.',
      metric: {
        value: metrics.cost,
        benchmark: 50000,
        difference: metrics.cost - 50000,
      },
      createdAt: now,
    });
  }

  // 5. Turnover voluntário vs involuntário
  if (metrics.voluntary > metrics.involuntary * 2) {
    insights.push({
      id: `turnover-voluntary-${Date.now()}`,
      type: 'warning',
      category: 'turnover',
      title: 'Predominância de desligamentos voluntários',
      description: `${((metrics.voluntary / metrics.rate) * 100).toFixed(0)}% dos desligamentos são voluntários, indicando possíveis problemas de satisfação e engajamento.`,
      impact: 'high',
      recommendation:
        'Realize pesquisa de clima, revise pacote de benefícios e oportunidades de crescimento. Considere entrevistas de permanência com talentos-chave.',
      createdAt: now,
    });
  }

  return insights;
}

/**
 * Analisa métricas de absenteísmo
 */
function analyzeAbsenteeism(metrics: AbsenteeismMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Absenteísmo acima do benchmark
  const status = getBenchmarkStatus(
    metrics.rate,
    ABSENTEEISM_BENCHMARKS,
    false
  );

  if (status === 'poor' || status === 'average') {
    const benchmark = ABSENTEEISM_BENCHMARKS.good;
    insights.push({
      id: `absenteeism-high-${Date.now()}`,
      type: status === 'poor' ? 'alert' : 'warning',
      category: 'absenteeism',
      title: 'Taxa de absenteísmo elevada',
      description: `Taxa de absenteísmo de ${metrics.rate.toFixed(1)}% está acima do ideal de ${benchmark}%, representando ${metrics.totalAbsences} dias de ausência.`,
      impact: status === 'poor' ? 'high' : 'medium',
      recommendation:
        'Investigue causas principais. Considere programas de qualidade de vida, saúde ocupacional e gestão de estresse.',
      metric: {
        value: metrics.rate,
        benchmark,
        difference: metrics.rate - benchmark,
      },
      createdAt: now,
    });
  }

  // 2. Tipo de ausência predominante
  if (metrics.byType.length > 0) {
    const topType = metrics.byType.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );

    if (topType.percentage && topType.percentage > 50) {
      let recommendation = '';
      if (topType.type.toLowerCase().includes('doença')) {
        recommendation =
          'Alta incidência de atestados médicos. Considere programas de saúde preventiva, ergonomia e apoio psicológico.';
      } else if (topType.type.toLowerCase().includes('falta')) {
        recommendation =
          'Alto índice de faltas. Revise política de presença, investigue causas e considere ações disciplinares se necessário.';
      }

      insights.push({
        id: `absenteeism-type-${Date.now()}`,
        type: 'info',
        category: 'absenteeism',
        title: `${topType.percentage.toFixed(0)}% das ausências são por ${topType.type}`,
        description: `O tipo "${topType.type}" representa a maioria das ausências, totalizando ${topType.value} dias.`,
        impact: 'medium',
        recommendation,
        createdAt: now,
      });
    }
  }

  // 3. Departamento com alto absenteísmo
  if (metrics.byDepartment.length > 0) {
    const avgDays =
      metrics.byDepartment.reduce((sum, d) => sum + d.value, 0) /
      metrics.byDepartment.length;

    metrics.byDepartment.forEach((dept) => {
      if (dept.value > avgDays * 1.5) {
        insights.push({
          id: `absenteeism-dept-${dept.department}-${Date.now()}`,
          type: 'warning',
          category: 'absenteeism',
          title: `Absenteísmo alto em ${dept.department}`,
          description: `${dept.department} tem ${dept.value.toFixed(0)} dias de ausência, ${((dept.value / avgDays - 1) * 100).toFixed(0)}% acima da média.`,
          impact: 'high',
          recommendation: `Investigar causas específicas em ${dept.department}. Avaliar carga de trabalho, clima e condições de trabalho.`,
          createdAt: now,
        });
      }
    });
  }

  // 4. Tendência de crescimento
  if (metrics.trend.length >= 3) {
    const recent = metrics.trend.slice(-3).map((t) => t.value);
    const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];

    if (isIncreasing) {
      insights.push({
        id: `absenteeism-trend-${Date.now()}`,
        type: 'warning',
        category: 'absenteeism',
        title: 'Absenteísmo em tendência de alta',
        description: 'O absenteísmo tem aumentado consistentemente nos últimos 3 meses.',
        impact: 'medium',
        recommendation:
          'Ação preventiva necessária. Realize pesquisa de clima e avalie condições de trabalho antes que o problema se agrave.',
        createdAt: now,
      });
    }
  }

  // 5. Custo de absenteísmo
  if (metrics.cost > 50000) {
    insights.push({
      id: `absenteeism-cost-${Date.now()}`,
      type: 'info',
      category: 'absenteeism',
      title: 'Impacto financeiro significativo',
      description: `O absenteísmo gerou um custo estimado de R$ ${(metrics.cost / 1000).toFixed(0)}k, considerando perda de produtividade.`,
      impact: 'medium',
      recommendation:
        'O investimento em programas de saúde e bem-estar pode ter ROI positivo ao reduzir o absenteísmo.',
      createdAt: now,
    });
  }

  return insights;
}

/**
 * Analisa métricas de recrutamento
 */
function analyzeRecruitment(metrics: RecruitmentMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Time to hire acima do benchmark
  const status = getBenchmarkStatus(
    metrics.timeToHire,
    TIME_TO_HIRE_BENCHMARKS,
    false
  );

  if (status === 'poor' || status === 'average') {
    insights.push({
      id: `recruitment-time-${Date.now()}`,
      type: status === 'poor' ? 'alert' : 'warning',
      category: 'recruitment',
      title: 'Tempo de contratação elevado',
      description: `Tempo médio de ${metrics.timeToHire} dias para contratação está acima do ideal. Isso pode resultar em perda de candidatos qualificados.`,
      impact: status === 'poor' ? 'high' : 'medium',
      recommendation:
        'Revise processo de recrutamento. Considere: automatização de triagem, redução de etapas e agilização de aprovações.',
      metric: {
        value: metrics.timeToHire,
        benchmark: TIME_TO_HIRE_BENCHMARKS.good,
        difference: metrics.timeToHire - TIME_TO_HIRE_BENCHMARKS.good,
      },
      createdAt: now,
    });
  }

  // 2. Taxa de aceitação baixa
  if (metrics.offerAcceptanceRate < 70) {
    insights.push({
      id: `recruitment-acceptance-${Date.now()}`,
      type: 'warning',
      category: 'recruitment',
      title: 'Taxa de aceitação abaixo do esperado',
      description: `Apenas ${metrics.offerAcceptanceRate.toFixed(0)}% das ofertas são aceitas. Isso indica possíveis problemas de proposta de valor.`,
      impact: 'high',
      recommendation:
        'Revise pacote de compensação e benefícios. Realize pesquisa de mercado e colete feedback de candidatos que recusaram ofertas.',
      metric: {
        value: metrics.offerAcceptanceRate,
        benchmark: 80,
        difference: metrics.offerAcceptanceRate - 80,
      },
      createdAt: now,
    });
  }

  // 3. Fonte mais efetiva
  if (metrics.sourceEffectiveness.length > 0) {
    const topSource = metrics.sourceEffectiveness.reduce((prev, current) =>
      prev.effectiveness > current.effectiveness ? prev : current
    );

    if (topSource.effectiveness > 10) {
      insights.push({
        id: `recruitment-source-${Date.now()}`,
        type: 'success',
        category: 'recruitment',
        title: `${topSource.source} é a fonte mais efetiva`,
        description: `${topSource.source} tem ${topSource.effectiveness.toFixed(1)}% de efetividade, gerando ${topSource.hires} contratações de ${topSource.applications} candidaturas.`,
        impact: 'medium',
        recommendation: `Otimize investimento priorizando ${topSource.source}. Analise por que essa fonte é mais efetiva e replique estratégias.`,
        createdAt: now,
      });
    }
  }

  // 4. Custo por contratação alto
  if (metrics.costPerHire > 8000) {
    insights.push({
      id: `recruitment-cost-${Date.now()}`,
      type: 'warning',
      category: 'recruitment',
      title: 'Custo por contratação elevado',
      description: `Custo médio de R$ ${metrics.costPerHire.toFixed(0)} por contratação está acima da média do mercado.`,
      impact: 'medium',
      recommendation:
        'Otimize processo de recrutamento. Considere: divulgação orgânica, programa de indicações e ferramentas de automação.',
      metric: {
        value: metrics.costPerHire,
        benchmark: 5000,
        difference: metrics.costPerHire - 5000,
      },
      createdAt: now,
    });
  }

  // 5. Funil de conversão
  if (metrics.applications > 0) {
    const conversionRate = (metrics.hires / metrics.applications) * 100;
    if (conversionRate < 2) {
      insights.push({
        id: `recruitment-funnel-${Date.now()}`,
        type: 'info',
        category: 'recruitment',
        title: 'Taxa de conversão baixa no funil',
        description: `Apenas ${conversionRate.toFixed(1)}% dos candidatos são contratados. Isso pode indicar processo muito seletivo ou descrições de vaga imprecisas.`,
        impact: 'low',
        recommendation:
          'Revise descrições de vagas para atrair candidatos mais qualificados. Considere pré-qualificação mais rigorosa.',
        createdAt: now,
      });
    }
  }

  return insights;
}

/**
 * Analisa métricas de produtividade
 */
function analyzeProductivity(metrics: ProductivityMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Taxa de horas extras elevada
  const overtimeStatus = getBenchmarkStatus(
    metrics.overtimeRate,
    OVERTIME_BENCHMARKS,
    false
  );

  if (overtimeStatus === 'poor' || overtimeStatus === 'average') {
    insights.push({
      id: `productivity-overtime-${Date.now()}`,
      type: 'warning',
      category: 'productivity',
      title: 'Taxa de horas extras elevada',
      description: `${metrics.overtimeRate.toFixed(1)}% de horas extras indica possível sobrecarga de trabalho ou má distribuição de recursos.`,
      impact: 'high',
      recommendation:
        'Avalie distribuição de carga de trabalho. Considere contratações adicionais ou redistribuição de tarefas para evitar burnout.',
      metric: {
        value: metrics.overtimeRate,
        benchmark: OVERTIME_BENCHMARKS.good,
        difference: metrics.overtimeRate - OVERTIME_BENCHMARKS.good,
      },
      createdAt: now,
    });
  }

  // 2. Índice de produtividade baixo
  if (metrics.productivityIndex < 70) {
    insights.push({
      id: `productivity-index-${Date.now()}`,
      type: 'alert',
      category: 'productivity',
      title: 'Índice de produtividade abaixo do esperado',
      description: `Índice de produtividade de ${metrics.productivityIndex.toFixed(0)} pontos indica oportunidades de melhoria significativas.`,
      impact: 'high',
      recommendation:
        'Identifique gargalos e distrações. Considere: ferramentas de produtividade, treinamentos e revisão de processos.',
      createdAt: now,
    });
  }

  // 3. Taxa de utilização
  if (metrics.utilizationRate < 70) {
    insights.push({
      id: `productivity-utilization-${Date.now()}`,
      type: 'info',
      category: 'productivity',
      title: 'Taxa de utilização pode ser melhorada',
      description: `Taxa de utilização de ${metrics.utilizationRate.toFixed(0)}% indica capacidade ociosa que poderia ser melhor aproveitada.`,
      impact: 'medium',
      recommendation:
        'Otimize alocação de recursos. Avalie se há necessidade de ajustar headcount ou redistribuir projetos.',
      createdAt: now,
    });
  } else if (metrics.utilizationRate > 90) {
    insights.push({
      id: `productivity-overutilization-${Date.now()}`,
      type: 'warning',
      category: 'productivity',
      title: 'Utilização muito alta pode causar burnout',
      description: `Taxa de utilização de ${metrics.utilizationRate.toFixed(0)}% está muito próxima do limite, aumentando risco de burnout.`,
      impact: 'high',
      recommendation:
        'Mantenha buffer de capacidade para imprevistos. Considere contratações para aliviar carga.',
      createdAt: now,
    });
  }

  return insights;
}

/**
 * Analisa métricas de engajamento
 */
function analyzeEngagement(metrics: EngagementMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Tempo médio de casa
  if (metrics.avgTenure < 24) {
    // Menos de 2 anos
    insights.push({
      id: `engagement-tenure-${Date.now()}`,
      type: 'warning',
      category: 'productivity',
      title: 'Tempo médio de casa abaixo do ideal',
      description: `Tempo médio de ${metrics.avgTenure} meses indica possíveis problemas de retenção de talentos.`,
      impact: 'high',
      recommendation:
        'Implemente programas de desenvolvimento de carreira, mentoria e reconhecimento para aumentar engajamento.',
      createdAt: now,
    });
  }

  // 2. Taxa de promoção
  const promotionStatus = getBenchmarkStatus(
    metrics.promotionRate,
    PROMOTION_RATE_BENCHMARKS,
    true
  );

  if (promotionStatus === 'poor') {
    insights.push({
      id: `engagement-promotion-${Date.now()}`,
      type: 'warning',
      category: 'productivity',
      title: 'Taxa de promoção baixa',
      description: `Taxa de promoção de ${metrics.promotionRate.toFixed(1)}% pode indicar falta de oportunidades de crescimento.`,
      impact: 'high',
      recommendation:
        'Estabeleça planos de carreira claros e processos de promoção transparentes. Ofereça oportunidades de desenvolvimento.',
      createdAt: now,
    });
  }

  // 3. Early turnover
  const earlyStatus = getBenchmarkStatus(
    metrics.earlyTurnover,
    EARLY_TURNOVER_BENCHMARKS,
    false
  );

  if (earlyStatus === 'poor' || earlyStatus === 'average') {
    insights.push({
      id: `engagement-early-turnover-${Date.now()}`,
      type: 'alert',
      category: 'turnover',
      title: 'Alto turnover nos primeiros 90 dias',
      description: `${metrics.earlyTurnover.toFixed(0)}% de turnover nos primeiros 90 dias indica problemas no onboarding ou fit cultural.`,
      impact: 'high',
      recommendation:
        'Revise processo de onboarding e seleção. Melhore alinhamento de expectativas e suporte aos novos colaboradores.',
      metric: {
        value: metrics.earlyTurnover,
        benchmark: EARLY_TURNOVER_BENCHMARKS.good,
        difference: metrics.earlyTurnover - EARLY_TURNOVER_BENCHMARKS.good,
      },
      createdAt: now,
    });
  }

  return insights;
}

/**
 * Analisa métricas de diversidade
 */
function analyzeDiversity(metrics: DiversityMetrics): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // 1. Índice de diversidade
  if (metrics.diversityIndex < 50) {
    insights.push({
      id: `diversity-index-${Date.now()}`,
      type: 'warning',
      category: 'diversity',
      title: 'Índice de diversidade pode melhorar',
      description: `Índice de diversidade de ${metrics.diversityIndex.toFixed(0)} pontos indica oportunidades para aumentar representatividade.`,
      impact: 'medium',
      recommendation:
        'Estabeleça metas de diversidade, revise processos de recrutamento para reduzir vieses e crie programas de inclusão.',
      createdAt: now,
    });
  }

  // 2. Equidade salarial
  metrics.salaryEquity.forEach((equity) => {
    if (Math.abs(equity.gap) > 15) {
      // Gap > 15%
      insights.push({
        id: `diversity-equity-${equity.category}-${Date.now()}`,
        type: 'alert',
        category: 'diversity',
        title: `Gap salarial significativo em ${equity.category}`,
        description: `Diferença de ${equity.gap > 0 ? '+' : ''}${equity.gap.toFixed(1)}% em relação à média pode indicar inequidade salarial.`,
        impact: 'high',
        recommendation:
          'Realize auditoria salarial detalhada. Estabeleça faixas salariais transparentes e revise critérios de compensação.',
        metric: {
          value: equity.avgSalary,
          benchmark: equity.avgSalary - (equity.avgSalary * equity.gap) / 100,
          difference: (equity.avgSalary * equity.gap) / 100,
        },
        createdAt: now,
      });
    }
  });

  // 3. Concentração etária
  const maxAgeGroup = metrics.ageDistribution.reduce((prev, current) =>
    prev.percentage > current.percentage ? prev : current
  );

  if (maxAgeGroup.percentage > 60) {
    insights.push({
      id: `diversity-age-${Date.now()}`,
      type: 'info',
      category: 'diversity',
      title: 'Concentração em faixa etária específica',
      description: `${maxAgeGroup.percentage.toFixed(0)}% dos funcionários estão na faixa ${maxAgeGroup.range}, indicando baixa diversidade etária.`,
      impact: 'low',
      recommendation:
        'Busque diversidade etária no recrutamento para enriquecer perspectivas e promover transferência de conhecimento.',
      createdAt: now,
    });
  }

  return insights;
}
