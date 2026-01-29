/**
 * Intent Detection Service
 * Detecta a intenção do usuário baseado na mensagem
 */

import type { Intent, IntentType } from '@/types/ai'

// ============================================================================
// Intent Patterns
// ============================================================================

const INTENT_PATTERNS: Record<IntentType, string[]> = {
  request_vacation: [
    'férias',
    'tirar férias',
    'solicitar férias',
    'pedir férias',
    'quero férias',
    'agendar férias',
    'programar férias',
  ],
  check_balance: [
    'saldo',
    'banco de horas',
    'horas extras',
    'saldo de férias',
    'quanto tenho',
    'meu saldo',
    'consultar saldo',
    'ver saldo',
  ],
  ask_policy: [
    'política',
    'regra',
    'procedimento',
    'como funciona',
    'qual o processo',
    'regulamento',
    'norma',
    'diretrizes',
  ],
  report_issue: [
    'problema',
    'erro',
    'não funciona',
    'bug',
    'reportar',
    'reclamar',
    'denunciar',
    'não consigo',
  ],
  update_info: [
    'atualizar',
    'alterar',
    'mudar',
    'modificar',
    'trocar',
    'dados pessoais',
    'informações',
    'cadastro',
  ],
  check_payroll: [
    'holerite',
    'contracheque',
    'salário',
    'pagamento',
    'folha',
    'remuneração',
    'quanto recebo',
    'quanto ganho',
  ],
  request_document: [
    'documento',
    'declaração',
    'comprovante',
    'certidão',
    'atestado',
    'solicitar documento',
    'preciso de documento',
  ],
  schedule_meeting: [
    'agendar',
    'marcar reunião',
    'conversar',
    'encontro',
    'meeting',
    'horário',
    'disponibilidade',
  ],
  ask_benefits: [
    'benefício',
    'vr',
    'va',
    'vale refeição',
    'vale alimentação',
    'vale transporte',
    'plano de saúde',
    'plano odontológico',
    'seguro',
  ],
  general_question: [
    'como',
    'quando',
    'onde',
    'porque',
    'qual',
    'quem',
    'o que é',
  ],
  unknown: [],
}

// ============================================================================
// Action Suggestions
// ============================================================================

const INTENT_ACTIONS: Record<IntentType, { type: string; description: string; route?: string } | undefined> = {
  request_vacation: {
    type: 'navigate',
    description: 'Ir para a página de solicitação de férias',
    route: '/ausencias/nova?type=vacation',
  },
  check_balance: {
    type: 'navigate',
    description: 'Ver seus saldos e banco de horas',
    route: '/ponto/banco-horas',
  },
  ask_policy: {
    type: 'search',
    description: 'Buscar na base de conhecimento',
  },
  report_issue: {
    type: 'escalate',
    description: 'Abrir chamado para o suporte',
    route: '/suporte/novo',
  },
  update_info: {
    type: 'navigate',
    description: 'Ir para seus dados pessoais',
    route: '/perfil',
  },
  check_payroll: {
    type: 'navigate',
    description: 'Ver seus holerites',
    route: '/folha/holerites',
  },
  request_document: {
    type: 'navigate',
    description: 'Solicitar documento',
    route: '/documentos/solicitar',
  },
  schedule_meeting: {
    type: 'action',
    description: 'Agendar reunião com RH',
  },
  ask_benefits: {
    type: 'navigate',
    description: 'Ver seus benefícios',
    route: '/perfil/beneficios',
  },
  general_question: {
    type: 'search',
    description: 'Buscar informação',
  },
  unknown: undefined,
}

// ============================================================================
// Detection Functions
// ============================================================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

function calculatePatternMatch(text: string, patterns: string[]): number {
  const normalizedText = normalizeText(text)
  let matches = 0
  let maxMatches = 0

  for (const pattern of patterns) {
    const normalizedPattern = normalizeText(pattern)

    // Exact match
    if (normalizedText.includes(normalizedPattern)) {
      matches += 10
    }

    // Word match
    const textWords = normalizedText.split(/\s+/)
    const patternWords = normalizedPattern.split(/\s+/)

    for (const patternWord of patternWords) {
      if (textWords.some(word => word.includes(patternWord) || patternWord.includes(word))) {
        matches += 5
      }
    }

    maxMatches += 10
  }

  return maxMatches > 0 ? (matches / maxMatches) * 100 : 0
}

// ============================================================================
// Main Detection Function
// ============================================================================

export async function detectIntent(message: string): Promise<Intent> {
  const scores: Record<IntentType, number> = {} as any

  // Calcular score para cada intent
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue
    scores[intent as IntentType] = calculatePatternMatch(message, patterns)
  }

  // Encontrar intent com maior score
  let bestIntent: IntentType = 'unknown'
  let bestScore = 0

  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent as IntentType
    }
  }

  // Se score muito baixo, classificar como general_question ou unknown
  if (bestScore < 30) {
    const hasQuestionWord = /^(como|quando|onde|porque|qual|quem|o que)/i.test(message)
    bestIntent = hasQuestionWord ? 'general_question' : 'unknown'
    bestScore = hasQuestionWord ? 50 : 0
  }

  // Extrair entidades básicas
  const entities = extractEntities(message, bestIntent)

  return {
    type: bestIntent,
    confidence: Math.min(bestScore, 100),
    entities,
    suggestedAction: INTENT_ACTIONS[bestIntent],
  }
}

// ============================================================================
// Entity Extraction
// ============================================================================

function extractEntities(message: string, intent: IntentType): Record<string, any> {
  const entities: Record<string, any> = {}

  // Datas
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})/g, // DD/MM
    /(próxim[oa]s?\s+)?(\d+)\s+(dias?|semanas?|meses?)/gi, // próximo 15 dias
    /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/gi,
  ]

  for (const pattern of datePatterns) {
    const matches = message.match(pattern)
    if (matches) {
      entities.dates = matches
      break
    }
  }

  // Números
  const numberPattern = /\d+/g
  const numbers = message.match(numberPattern)
  if (numbers) {
    entities.numbers = numbers.map(n => parseInt(n, 10))
  }

  // Departamentos comuns
  const departments = ['TI', 'RH', 'financeiro', 'vendas', 'marketing', 'operações']
  for (const dept of departments) {
    if (normalizeText(message).includes(normalizeText(dept))) {
      entities.department = dept
      break
    }
  }

  // Tipos de ausência
  const absenceTypes = ['férias', 'atestado', 'falta', 'folga', 'licença']
  for (const type of absenceTypes) {
    if (normalizeText(message).includes(type)) {
      entities.absenceType = type
      break
    }
  }

  // Documentos
  const docTypes = ['holerite', 'declaração', 'comprovante', 'atestado', 'certidão']
  for (const doc of docTypes) {
    if (normalizeText(message).includes(doc)) {
      entities.documentType = doc
      break
    }
  }

  return entities
}

// ============================================================================
// Intent Validation
// ============================================================================

export function validateIntent(intent: Intent): boolean {
  return intent.confidence >= 30
}

export function shouldEscalate(intent: Intent): boolean {
  // Escalonar para humano se:
  // 1. Confiança muito baixa
  // 2. Intent de reportar problema
  // 3. Assuntos sensíveis

  if (intent.confidence < 30) return true
  if (intent.type === 'report_issue') return true

  const sensitiveKeywords = ['demissão', 'desligamento', 'assédio', 'discriminação', 'jurídico']
  // Note: Precisaria ter acesso à mensagem original aqui, ou passar como parâmetro

  return false
}

// ============================================================================
// Intent Routing
// ============================================================================

export function getIntentRoute(intent: Intent): string | null {
  return intent.suggestedAction?.route || null
}

export function getIntentDescription(intentType: IntentType): string {
  const descriptions: Record<IntentType, string> = {
    request_vacation: 'Solicitação de férias',
    check_balance: 'Consulta de saldo',
    ask_policy: 'Pergunta sobre política',
    report_issue: 'Relato de problema',
    update_info: 'Atualização de informações',
    check_payroll: 'Consulta de folha de pagamento',
    request_document: 'Solicitação de documento',
    schedule_meeting: 'Agendamento de reunião',
    ask_benefits: 'Pergunta sobre benefícios',
    general_question: 'Pergunta geral',
    unknown: 'Não identificado',
  }

  return descriptions[intentType] || 'Não identificado'
}
