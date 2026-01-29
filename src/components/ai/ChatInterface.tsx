'use client'

/**
 * Chat Interface
 * Interface principal de chat com mensagens e input
 */

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { QuickReplies } from './QuickReplies'
import type { ChatMessage as ChatMessageType, QuickReply } from '@/types/ai'

interface ChatInterfaceProps {
  onNewMessage?: () => void
}

const WELCOME_MESSAGE: ChatMessageType = {
  id: 'welcome',
  role: 'assistant',
  content: `Olá! Sou o assistente virtual de RH. Posso ajudar você com:

• Solicitação de férias e ausências
• Consulta de saldo de horas e banco de horas
• Informações sobre benefícios
• Dúvidas sobre políticas da empresa
• Processos de RH
• E muito mais!

Como posso ajudar você hoje?`,
  timestamp: new Date(),
}

const INITIAL_SUGGESTIONS: QuickReply[] = [
  {
    id: '1',
    text: 'Como solicitar férias?',
    category: 'faq',
    intent: 'request_vacation',
  },
  {
    id: '2',
    text: 'Ver meu ponto',
    category: 'action',
    action: '/ponto',
  },
  {
    id: '3',
    text: 'Consultar benefícios',
    category: 'faq',
    intent: 'ask_benefits',
  },
  {
    id: '4',
    text: 'Entender meu holerite',
    category: 'faq',
    intent: 'check_payroll',
  },
]

export function ChatInterface({ onNewMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<QuickReply[]>(INITIAL_SUGGESTIONS)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim()

    if (!messageText || isLoading) return

    // Clear input
    setInput('')

    // Add user message
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call chatbot API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            currentPage: window.location.pathname,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: ChatMessageType = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          intent: data.intent?.type,
          confidence: data.intent?.confidence,
        },
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      }

      onNewMessage?.()
    } catch (error) {
      console.error('Error sending message:', error)

      // Add error message
      const errorMessage: ChatMessageType = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content:
          'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou entre em contato com o suporte.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (reply: QuickReply) => {
    if (reply.action) {
      // Navigate to action route
      window.location.href = reply.action
    } else {
      // Send as message
      handleSendMessage(reply.text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Quick Replies */}
      {suggestions.length > 0 && !isLoading && (
        <div className="border-t px-4 py-3">
          <QuickReplies
            suggestions={suggestions}
            onSelect={handleQuickReply}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />

          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
