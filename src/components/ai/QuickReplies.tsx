'use client'

/**
 * Quick Replies Component
 * Botões de sugestão rápida de respostas
 */

import { MessageCircle, ExternalLink, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuickReply } from '@/types/ai'

interface QuickRepliesProps {
  suggestions: QuickReply[]
  onSelect: (reply: QuickReply) => void
  className?: string
}

export function QuickReplies({
  suggestions,
  onSelect,
  className,
}: QuickRepliesProps) {
  if (suggestions.length === 0) return null

  const getCategoryIcon = (category: QuickReply['category']) => {
    switch (category) {
      case 'faq':
        return HelpCircle
      case 'action':
        return ExternalLink
      case 'navigation':
        return ExternalLink
      default:
        return MessageCircle
    }
  }

  const getCategoryLabel = (category: QuickReply['category']) => {
    switch (category) {
      case 'faq':
        return 'FAQ'
      case 'action':
        return 'Ação'
      case 'navigation':
        return 'Navegar'
      default:
        return ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">
        Sugestões:
      </p>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const Icon = getCategoryIcon(suggestion.category)

          return (
            <Button
              key={suggestion.id}
              variant="outline"
              size="sm"
              onClick={() => onSelect(suggestion)}
              className="h-auto py-2 px-3 justify-start text-left"
            >
              <Icon className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span className="text-sm">{suggestion.text}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Quick Reply Categories Display
 */
interface QuickReplyCategoriesProps {
  onSelectCategory: (category: string) => void
}

export function QuickReplyCategories({
  onSelectCategory,
}: QuickReplyCategoriesProps) {
  const categories = [
    {
      id: 'vacation',
      label: 'Férias',
      icon: '🏖️',
      description: 'Solicitar férias, consultar saldo',
    },
    {
      id: 'timesheet',
      label: 'Ponto',
      icon: '⏰',
      description: 'Banco de horas, ajustes de ponto',
    },
    {
      id: 'payroll',
      label: 'Folha',
      icon: '💰',
      description: 'Holerite, adiantamento, benefícios',
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: '📄',
      description: 'Declarações, comprovantes',
    },
    {
      id: 'benefits',
      label: 'Benefícios',
      icon: '🎁',
      description: 'VR, VA, plano de saúde',
    },
    {
      id: 'support',
      label: 'Suporte',
      icon: '💬',
      description: 'Falar com RH',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          className="h-auto flex flex-col items-start p-4 gap-2"
          onClick={() => onSelectCategory(category.id)}
        >
          <div className="flex items-center gap-2 w-full">
            <span className="text-2xl">{category.icon}</span>
            <span className="font-semibold">{category.label}</span>
          </div>
          <span className="text-xs text-muted-foreground text-left">
            {category.description}
          </span>
        </Button>
      ))}
    </div>
  )
}
