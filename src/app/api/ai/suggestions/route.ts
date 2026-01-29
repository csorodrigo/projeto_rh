/**
 * AI Suggestions API Route
 * Endpoint para obter sugestões inteligentes
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SuggestionsRequest, SuggestionsResponse, SmartSuggestion, Insight } from '@/types/ai'

// Mock data - replace with actual AI-generated suggestions
function generateMockSuggestions(context: string, entityId?: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = []

  // Employee context suggestions
  if (context === 'employee') {
    suggestions.push({
      id: 'sug_001',
      category: 'employee_management',
      title: 'Padrão de atrasos detectado',
      description: 'João Silva apresenta atrasos recorrentes às segundas-feiras. Sugerimos conversa individual.',
      reasoning: 'Detectamos 6 atrasos às segundas nas últimas 4 semanas, indicando possível problema pessoal ou de transporte.',
      impact: {
        type: 'quality',
        value: 15,
        unit: '% melhoria esperada',
      },
      actions: [
        {
          label: 'Agendar 1:1',
          type: 'primary',
          action: 'schedule_meeting',
          params: { employeeId: entityId, type: 'one_on_one' },
        },
        {
          label: 'Ver Histórico',
          type: 'secondary',
          action: 'view_history',
        },
      ],
      priority: 'medium',
      status: 'pending',
      createdAt: new Date(),
    })
  }

  // Department context suggestions
  if (context === 'department') {
    suggestions.push({
      id: 'sug_002',
      category: 'cost_saving',
      title: 'Otimização de horas extras',
      description: 'Departamento de TI com R$ 15.000 em horas extras este mês. Considere redistribuição ou contratação.',
      reasoning: 'Análise de 3 meses mostra padrão consistente de horas extras. Pode ser mais econômico contratar um assistente.',
      impact: {
        type: 'cost',
        value: -8000,
        unit: 'R$/mês',
      },
      actions: [
        {
          label: 'Analisar Carga',
          type: 'primary',
          action: 'analyze_workload',
        },
        {
          label: 'Ver Relatório',
          type: 'secondary',
          action: 'view_report',
        },
      ],
      priority: 'high',
      status: 'pending',
      createdAt: new Date(),
    })

    suggestions.push({
      id: 'sug_003',
      category: 'performance',
      title: 'Alta rotatividade no setor',
      description: '3 saídas nos últimos 6 meses. Recomenda-se pesquisa de clima e revisão salarial.',
      reasoning: 'Taxa de turnover 40% acima da média da empresa. Feedback de exit interviews indica insatisfação com salário e gestão.',
      impact: {
        type: 'cost',
        value: -50000,
        unit: 'R$ em custos de reposição',
      },
      actions: [
        {
          label: 'Criar Pesquisa',
          type: 'primary',
          action: 'create_survey',
        },
        {
          label: 'Revisar Salários',
          type: 'secondary',
          action: 'review_salaries',
        },
      ],
      priority: 'high',
      status: 'pending',
      createdAt: new Date(),
    })
  }

  // Recruitment context suggestions
  if (context === 'recruitment') {
    suggestions.push({
      id: 'sug_004',
      category: 'recruitment',
      title: 'Processo seletivo lento',
      description: 'Tempo médio de contratação: 45 dias. Meta: 30 dias. Sugestões para acelerar.',
      reasoning: 'Análise mostra gargalos nas etapas de triagem (12 dias) e entrevistas (18 dias).',
      impact: {
        type: 'time',
        value: -15,
        unit: 'dias',
      },
      actions: [
        {
          label: 'Otimizar Processo',
          type: 'primary',
          action: 'optimize_process',
        },
        {
          label: 'Ver Funil',
          type: 'secondary',
          action: 'view_funnel',
        },
      ],
      priority: 'medium',
      status: 'pending',
      createdAt: new Date(),
    })
  }

  // Dashboard context - general suggestions
  if (context === 'dashboard') {
    suggestions.push({
      id: 'sug_005',
      category: 'compliance',
      title: 'ASOs vencendo em breve',
      description: '8 funcionários com ASO vencendo nos próximos 30 dias.',
      reasoning: 'Manter ASOs atualizados é obrigatório por lei. Evite multas e problemas trabalhistas.',
      impact: {
        type: 'risk',
        value: -100,
        unit: '% redução de risco',
      },
      actions: [
        {
          label: 'Agendar Exames',
          type: 'primary',
          action: 'schedule_exams',
        },
        {
          label: 'Ver Lista',
          type: 'secondary',
          action: 'view_list',
        },
      ],
      priority: 'high',
      status: 'pending',
      createdAt: new Date(),
    })

    suggestions.push({
      id: 'sug_006',
      category: 'process_improvement',
      title: 'Automatize aprovações de férias',
      description: 'Configure regras automáticas para aprovar férias dentro de critérios pré-definidos.',
      reasoning: '68% das solicitações de férias são aprovadas sem alterações. Automatizar economizaria 5h/semana.',
      impact: {
        type: 'time',
        value: 20,
        unit: 'horas/mês',
      },
      actions: [
        {
          label: 'Configurar Regras',
          type: 'primary',
          action: 'configure_automation',
        },
        {
          label: 'Saiba Mais',
          type: 'secondary',
          action: 'learn_more',
        },
      ],
      priority: 'low',
      status: 'pending',
      createdAt: new Date(),
    })
  }

  return suggestions
}

function generateMockInsights(context: string): Insight[] {
  const insights: Insight[] = []

  insights.push({
    id: 'insight_001',
    type: 'pattern_detected',
    severity: 'medium',
    title: 'Padrão de ausências nas segundas-feiras',
    description: 'Aumento de 35% nas ausências às segundas-feiras comparado aos outros dias.',
    data: {
      dayOfWeek: 'Monday',
      avgAbsences: 12,
      increase: 35,
    },
    suggestions: [
      'Investigar causas com pesquisa anônima',
      'Avaliar flexibilização de horário às segundas',
      'Verificar se há problemas com transporte público',
    ],
    createdAt: new Date(),
    status: 'new',
    tags: ['attendance', 'pattern'],
  })

  if (context === 'dashboard') {
    insights.push({
      id: 'insight_002',
      type: 'turnover_risk',
      severity: 'high',
      title: '5 funcionários com alto risco de saída',
      description: 'Modelo de IA identifica 5 funcionários com mais de 70% de probabilidade de desligamento nos próximos 6 meses.',
      data: {
        employeeCount: 5,
        avgRisk: 78,
        departments: ['TI', 'Vendas'],
      },
      suggestions: [
        'Revisar salários e benefícios',
        'Agendar conversas individuais',
        'Criar planos de retenção personalizados',
      ],
      affectedEntities: [
        { type: 'employee', id: 'emp_123', name: 'João Silva' },
        { type: 'employee', id: 'emp_456', name: 'Maria Santos' },
      ],
      createdAt: new Date(),
      status: 'new',
      tags: ['turnover', 'retention', 'critical'],
    })
  }

  return insights
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SuggestionsRequest
    const { context, entityId, limit = 10 } = body

    // Validate context
    const validContexts = ['dashboard', 'employee', 'department', 'recruitment']
    if (!validContexts.includes(context)) {
      return NextResponse.json(
        { error: 'Invalid context' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual AI service calls
    const suggestions = generateMockSuggestions(context, entityId).slice(0, limit)
    const insights = generateMockInsights(context).slice(0, Math.ceil(limit / 2))

    const response: SuggestionsResponse = {
      suggestions,
      insights,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in suggestions API:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const context = searchParams.get('context') || 'dashboard'
  const entityId = searchParams.get('entityId') || undefined
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const suggestions = generateMockSuggestions(context, entityId).slice(0, limit)
    const insights = generateMockInsights(context).slice(0, Math.ceil(limit / 2))

    const response: SuggestionsResponse = {
      suggestions,
      insights,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in suggestions API:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
