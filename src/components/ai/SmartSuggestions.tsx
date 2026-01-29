'use client'

/**
 * Smart Suggestions Component
 * Exibe sugestões inteligentes geradas pela IA
 */

import { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  Target,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { SmartSuggestion } from '@/types/ai'

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[]
  onApply?: (suggestionId: string) => void
  onDismiss?: (suggestionId: string) => void
  onLearnMore?: (suggestionId: string) => void
  className?: string
}

export function SmartSuggestions({
  suggestions,
  onApply,
  onDismiss,
  onLearnMore,
  className,
}: SmartSuggestionsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedIds.has(s.id) && s.status === 'pending'
  )

  if (visibleSuggestions.length === 0) {
    return null
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    onDismiss?.(id)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Sugestões Inteligentes</h3>
        <Badge variant="secondary">{visibleSuggestions.length}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={() => onApply?.(suggestion.id)}
            onDismiss={() => handleDismiss(suggestion.id)}
            onLearnMore={() => onLearnMore?.(suggestion.id)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual Suggestion Card
 */
interface SuggestionCardProps {
  suggestion: SmartSuggestion
  onApply?: () => void
  onDismiss?: () => void
  onLearnMore?: () => void
}

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  onLearnMore,
}: SuggestionCardProps) {
  const getImpactIcon = (type: SmartSuggestion['impact']['type']) => {
    switch (type) {
      case 'cost':
        return DollarSign
      case 'time':
        return Clock
      case 'quality':
        return Target
      case 'efficiency':
        return TrendingUp
      case 'risk':
        return AlertTriangle
      default:
        return Sparkles
    }
  }

  const getPriorityColor = (priority: SmartSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: SmartSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'Alta Prioridade'
      case 'medium':
        return 'Média Prioridade'
      case 'low':
        return 'Baixa Prioridade'
      default:
        return 'Prioridade'
    }
  }

  const ImpactIcon = getImpactIcon(suggestion.impact.type)

  const primaryAction = suggestion.actions.find((a) => a.type === 'primary')
  const secondaryActions = suggestion.actions.filter((a) => a.type === 'secondary')

  return (
    <Card className={cn('relative', getPriorityColor(suggestion.priority))}>
      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Descartar</span>
      </Button>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getPriorityLabel(suggestion.priority)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(suggestion.category)}
              </Badge>
            </div>

            <CardTitle className="text-base">{suggestion.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {suggestion.description}
        </p>

        {/* Impact */}
        <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
          <ImpactIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {getImpactLabel(suggestion.impact.type)}
            </p>
            <p className="text-xs text-muted-foreground">
              {suggestion.impact.value > 0 ? '+' : ''}
              {suggestion.impact.value} {suggestion.impact.unit}
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Por que essa sugestão?</AlertTitle>
          <AlertDescription className="text-xs">
            {suggestion.reasoning}
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {primaryAction && (
            <Button
              onClick={onApply}
              className="w-full"
            >
              {primaryAction.label}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          <div className="flex gap-2">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onLearnMore}
              >
                {action.label}
              </Button>
            ))}

            {secondaryActions.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onLearnMore}
              >
                Saiba Mais
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Helper Functions
 */
function getCategoryLabel(category: SmartSuggestion['category']): string {
  const labels: Record<SmartSuggestion['category'], string> = {
    employee_management: 'Gestão de Pessoas',
    recruitment: 'Recrutamento',
    performance: 'Performance',
    compliance: 'Compliance',
    cost_saving: 'Economia',
    process_improvement: 'Melhoria de Processos',
  }

  return labels[category] || category
}

function getImpactLabel(type: SmartSuggestion['impact']['type']): string {
  const labels: Record<SmartSuggestion['impact']['type'], string> = {
    cost: 'Impacto em Custos',
    time: 'Economia de Tempo',
    quality: 'Melhoria de Qualidade',
    efficiency: 'Ganho de Eficiência',
    risk: 'Redução de Risco',
  }

  return labels[type] || type
}

/**
 * Empty State
 */
export function SmartSuggestionsEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Nenhuma sugestão no momento
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Nossa IA está analisando seus dados. Novas sugestões aparecerão aqui
          quando identificarmos oportunidades de melhoria.
        </p>
      </CardContent>
    </Card>
  )
}
