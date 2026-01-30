/**
 * AI Dashboard Page
 * Dashboard de insights e sugestões de IA
 */

import { Metadata } from 'next'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Brain,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SmartSuggestions, SmartSuggestionsEmpty } from '@/components/ai/SmartSuggestions'

export const metadata: Metadata = {
  title: 'Insights de IA | RH System',
  description: 'Insights e sugestões inteligentes geradas por IA',
}

export default async function AIAnalyticsPage() {
  // TODO: Fetch real data from API
  const suggestions = await fetchSuggestions()
  const insights = await fetchInsights()
  const analytics = await fetchAIAnalytics()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Insights de IA</h1>
            <p className="text-muted-foreground">
              Análises inteligentes e sugestões automatizadas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sugestões Ativas
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.newSuggestionsToday} novas hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Padrões Detectados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.patternsDetected}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Críticos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requerem ação imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Economia Projetada
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {analytics.projectedSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ao aplicar sugestões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="suggestions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suggestions">
            Sugestões Inteligentes
          </TabsTrigger>
          <TabsTrigger value="insights">
            Insights
          </TabsTrigger>
          <TabsTrigger value="patterns">
            Padrões Detectados
          </TabsTrigger>
          <TabsTrigger value="predictions">
            Predições
          </TabsTrigger>
        </TabsList>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          {suggestions.length > 0 ? (
            <SmartSuggestions
              suggestions={suggestions}
              onApply={async (id) => {
                'use server'
                console.log('Apply suggestion:', id)
                // TODO: Implement apply logic
              }}
              onDismiss={async (id) => {
                'use server'
                console.log('Dismiss suggestion:', id)
                // TODO: Implement dismiss logic
              }}
            />
          ) : (
            <SmartSuggestionsEmpty />
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insights Recentes</CardTitle>
              <CardDescription>
                Análises automáticas baseadas nos seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum insight disponível no momento
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Padrões Comportamentais</CardTitle>
              <CardDescription>
                Padrões detectados pela análise de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predições de Turnover</CardTitle>
              <CardDescription>
                Funcionários com risco de saída
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Insight Card Component
 */
function InsightCard({ insight }: { insight: any }) {
  const severityColors = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-orange-600 bg-orange-50',
    high: 'text-red-600 bg-red-50',
    critical: 'text-red-900 bg-red-100',
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{insight.title}</h4>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                severityColors[insight.severity as keyof typeof severityColors]
              }`}
            >
              {insight.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {insight.description}
          </p>
        </div>
      </div>

      {insight.suggestions && insight.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Sugestões:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {insight.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Data Fetching Functions (Mock)
 */
async function fetchSuggestions() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/suggestions?context=dashboard`,
      {
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch suggestions:', response.status)
      return []
    }

    const data = await response.json()
    return data.suggestions || []
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return []
  }
}

async function fetchInsights() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/suggestions?context=dashboard`,
      {
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch insights:', response.status)
      return []
    }

    const data = await response.json()
    return data.insights || []
  } catch (error) {
    console.error('Error fetching insights:', error)
    return []
  }
}

async function fetchAIAnalytics() {
  // TODO: Replace with actual API call
  return {
    activeSuggestions: 12,
    newSuggestionsToday: 3,
    patternsDetected: 8,
    criticalAlerts: 2,
    projectedSavings: 45000,
  }
}
