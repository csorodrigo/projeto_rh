/**
 * AI Chat API Route
 * Endpoint para interação com o chatbot
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/ai/chatbot-service'
import type { ChatRequest, ChatResponse } from '@/types/ai'

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  // Allow 20 messages per minute
  const limit = 20
  const windowMs = 60 * 1000

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, context } = body as ChatRequest

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // TODO: Get actual user ID from session/auth
    const userId = 'demo_user'

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // TODO: Get user profile and company from database
    const userProfile = {
      userId,
      name: 'Usuário Demo',
      email: 'demo@empresa.com',
      department: 'TI',
      role: 'Desenvolvedor',
    }

    // Enrich context with user data
    const enrichedContext = {
      ...context,
      userProfile,
    }

    // Send message to chatbot service
    const response: ChatResponse = await sendMessage({
      message,
      sessionId,
      context: enrichedContext,
    })

    // TODO: Log conversation to database for analytics
    // await logConversation(userId, message, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in chat API:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
      },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'AI Chat API',
    timestamp: new Date().toISOString(),
  })
}

// Streaming support (for future implementation)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
