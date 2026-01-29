'use client'

/**
 * Chat Message Component
 * Renderiza uma mensagem individual no chat
 */

import { Bot, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/types/ai'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  if (message.role === 'system') {
    return null // Don't render system messages
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center h-10 w-10 rounded-full shrink-0',
          isAssistant && 'bg-primary/10',
          isUser && 'bg-muted'
        )}
      >
        {isAssistant && <Bot className="h-5 w-5 text-primary" />}
        {isUser && <User className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[75%]',
          isUser && 'items-end'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-3',
            isAssistant && 'bg-muted',
            isUser && 'bg-primary text-primary-foreground'
          )}
        >
          <MessageContent content={message.content} />
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground px-1">
          {format(message.timestamp, "HH:mm", { locale: ptBR })}
        </span>

        {/* Metadata (Intent/Confidence) */}
        {message.metadata?.intent && (
          <span className="text-xs text-muted-foreground px-1">
            {message.metadata.intent}
            {message.metadata.confidence && (
              <> • {message.metadata.confidence.toFixed(0)}% confiança</>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Message Content with Markdown Support
 */
function MessageContent({ content }: { content: string }) {
  // Simple markdown parsing
  const parseMarkdown = (text: string) => {
    const parts: React.ReactNode[] = []
    let currentText = text

    // Bold: **text**
    currentText = currentText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Italic: *text*
    currentText = currentText.replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Code: `code`
    currentText = currentText.replace(
      /`(.+?)`/g,
      '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
    )

    // Links: [text](url)
    currentText = currentText.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="underline hover:text-primary" target="_blank" rel="noopener noreferrer">$1</a>'
    )

    return currentText
  }

  // Split by newlines for paragraphs
  const paragraphs = content.split('\n\n')

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => {
        // Check if it's a list
        if (paragraph.startsWith('•') || paragraph.startsWith('-')) {
          const items = paragraph.split('\n')
          return (
            <ul key={index} className="space-y-1 list-disc list-inside">
              {items.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(item.replace(/^[•-]\s*/, '')),
                  }}
                />
              ))}
            </ul>
          )
        }

        // Check if it's a numbered list
        if (/^\d+\./.test(paragraph)) {
          const items = paragraph.split('\n')
          return (
            <ol key={index} className="space-y-1 list-decimal list-inside">
              {items.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(item.replace(/^\d+\.\s*/, '')),
                  }}
                />
              ))}
            </ol>
          )
        }

        // Check if it's a heading (starts with #)
        if (paragraph.startsWith('#')) {
          const level = paragraph.match(/^#+/)?.[0].length || 1
          const text = paragraph.replace(/^#+\s*/, '')

          const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements

          return (
            <HeadingTag
              key={index}
              className="font-semibold"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}
            />
          )
        }

        // Regular paragraph
        return (
          <p
            key={index}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(paragraph) }}
          />
        )
      })}
    </div>
  )
}
