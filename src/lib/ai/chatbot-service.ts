/**
 * Chatbot Service
 * Serviço principal para interação com IA
 */

import type { ChatMessage, ChatRequest, ChatResponse, Intent } from '@/types/ai'
import { detectIntent } from './intent-detector'
import { searchKnowledgeBase } from './knowledge-base'

// ============================================================================
// Configuration
// ============================================================================

const AI_CONFIG = {
  provider: (process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'local',
  model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
  maxTokens: 1000,
  temperature: 0.7,
  streamingEnabled: true,
}

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `Você é um assistente virtual de RH especializado em ajudar funcionários e gestores.

DIRETRIZES:
1. Seja profissional, mas amigável e acessível
2. Responda de forma clara e objetiva
3. Use português brasileiro
4. Se não souber a resposta, admita e ofereça ajuda para encontrar
5. Nunca invente informações - sempre baseie suas respostas em dados reais
6. Proteja informações sensíveis - não revele dados pessoais de outros funcionários
7. Para questões complexas ou sensíveis, sugira escalonamento para RH humano
8. Cite fontes quando referenciar políticas ou procedimentos
9. Seja empático e compreensivo
10. Ofereça próximos passos claros

CAPACIDADES:
- Responder dúvidas sobre políticas da empresa
- Explicar processos de RH (férias, benefícios, ponto, etc)
- Ajudar com navegação no sistema
- Fornecer informações sobre saldo de férias e horas
- Orientar sobre como solicitar documentos
- Explicar cálculos de folha de pagamento
- Informar sobre benefícios disponíveis

LIMITAÇÕES:
- Não pode aprovar solicitações (apenas orientar sobre o processo)
- Não pode acessar informações de outros funcionários
- Não pode alterar dados no sistema
- Não substitui atendimento humano em casos complexos`

// ============================================================================
// Helper Functions
// ============================================================================

function buildContext(context: ChatRequest['context']): string {
  if (!context) return ''

  const parts: string[] = []

  if (context.userProfile) {
    const { name, department, role } = context.userProfile
    parts.push(`Funcionário: ${name}`)
    if (department) parts.push(`Departamento: ${department}`)
    if (role) parts.push(`Cargo: ${role}`)
  }

  if (context.currentPage) {
    parts.push(`Página atual: ${context.currentPage}`)
  }

  if (context.recentActions?.length) {
    parts.push(`Ações recentes: ${context.recentActions.join(', ')}`)
  }

  return parts.length > 0 ? `\n\nCONTEXTO DO USUÁRIO:\n${parts.join('\n')}` : ''
}

function createSystemMessage(context?: ChatRequest['context']): ChatMessage {
  const contextInfo = buildContext(context)
  return {
    id: 'system',
    role: 'system',
    content: SYSTEM_PROMPT + contextInfo,
    timestamp: new Date(),
  }
}

// ============================================================================
// OpenAI Integration
// ============================================================================

async function sendToOpenAI(messages: ChatMessage[]): Promise<string> {
  if (!AI_CONFIG.apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// ============================================================================
// Anthropic Integration
// ============================================================================

async function sendToAnthropic(messages: ChatMessage[]): Promise<string> {
  if (!AI_CONFIG.apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_CONFIG.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      system: systemMessage?.content || SYSTEM_PROMPT,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Anthropic API error')
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

// ============================================================================
// Local Fallback (Rule-based)
// ============================================================================

async function sendToLocal(messages: ChatMessage[]): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user') {
    return 'Desculpe, não entendi sua mensagem.'
  }

  // Buscar na base de conhecimento
  const knowledgeResults = await searchKnowledgeBase(lastMessage.content)

  if (knowledgeResults.length > 0) {
    const best = knowledgeResults[0]
    return best.answer
  }

  // Fallback genérico
  return `Entendi sua pergunta sobre "${lastMessage.content}".

No momento, não tenho informações específicas sobre isso em minha base de conhecimento.

Algumas opções para você:
- Tente reformular sua pergunta
- Entre em contato diretamente com o RH
- Consulte o manual do colaborador

Como posso ajudar de outra forma?`
}

// ============================================================================
// Main Service Functions
// ============================================================================

export async function sendMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    const { message, sessionId, context } = request

    // Criar histórico de mensagens
    const messages: ChatMessage[] = [
      createSystemMessage(context),
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }
    ]

    // Detectar intenção
    const intent = await detectIntent(message)

    // Enviar para IA
    let responseText: string

    switch (AI_CONFIG.provider) {
      case 'openai':
        responseText = await sendToOpenAI(messages)
        break
      case 'anthropic':
        responseText = await sendToAnthropic(messages)
        break
      case 'local':
      default:
        responseText = await sendToLocal(messages)
        break
    }

    // Gerar sugestões baseadas na intenção
    const suggestions = generateQuickReplies(intent)

    return {
      message: responseText,
      sessionId: sessionId || Date.now().toString(),
      intent,
      suggestions,
      metadata: {
        provider: AI_CONFIG.provider,
        model: AI_CONFIG.model,
        timestamp: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error in sendMessage:', error)

    // Fallback error response
    return {
      message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou entre em contato com o suporte.',
      sessionId: request.sessionId || Date.now().toString(),
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export function generateQuickReplies(intent: Intent) {
  const replies = []

  switch (intent.type) {
    case 'request_vacation':
      replies.push(
        { id: '1', text: 'Como solicitar férias?', category: 'faq' as const, intent: 'request_vacation' },
        { id: '2', text: 'Ver meu saldo de férias', category: 'action' as const, action: '/ausencias?type=vacation' },
        { id: '3', text: 'Política de férias', category: 'faq' as const, intent: 'ask_policy' }
      )
      break

    case 'check_balance':
      replies.push(
        { id: '1', text: 'Ver banco de horas', category: 'action' as const, action: '/ponto/banco-horas' },
        { id: '2', text: 'Ver saldo de férias', category: 'action' as const, action: '/ausencias' },
        { id: '3', text: 'Extrato de ponto', category: 'action' as const, action: '/ponto' }
      )
      break

    case 'check_payroll':
      replies.push(
        { id: '1', text: 'Ver holerites', category: 'action' as const, action: '/folha/holerites' },
        { id: '2', text: 'Como entender meu holerite?', category: 'faq' as const, intent: 'check_payroll' },
        { id: '3', text: 'Calendário de pagamento', category: 'faq' as const, intent: 'ask_policy' }
      )
      break

    case 'ask_benefits':
      replies.push(
        { id: '1', text: 'Quais benefícios tenho?', category: 'faq' as const, intent: 'ask_benefits' },
        { id: '2', text: 'Como usar o VR/VA?', category: 'faq' as const, intent: 'ask_benefits' },
        { id: '3', text: 'Plano de saúde', category: 'faq' as const, intent: 'ask_benefits' }
      )
      break

    default:
      replies.push(
        { id: '1', text: 'Como solicitar férias?', category: 'faq' as const, intent: 'request_vacation' },
        { id: '2', text: 'Ver meu ponto', category: 'action' as const, action: '/ponto' },
        { id: '3', text: 'Falar com RH', category: 'action' as const, action: '/suporte' }
      )
  }

  return replies
}

// ============================================================================
// Session Management
// ============================================================================

export async function createSession(userId: string, companyId: string) {
  const sessionId = `${userId}_${Date.now()}`

  // TODO: Salvar no banco de dados

  return {
    id: sessionId,
    userId,
    companyId,
    messages: [],
    context: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active' as const,
  }
}

export async function getSession(sessionId: string) {
  // TODO: Buscar do banco de dados
  return null
}

export async function updateSession(sessionId: string, messages: ChatMessage[]) {
  // TODO: Atualizar no banco de dados
  return true
}

export async function archiveSession(sessionId: string) {
  // TODO: Arquivar no banco de dados
  return true
}
