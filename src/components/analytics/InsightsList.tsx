/**
 * Insights List Component
 * Fase 8 - Diferenciação
 *
 * Exibe insights gerados automaticamente
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart,
} from 'lucide-react';
import type { Insight } from '@/types/analytics';

interface InsightsListProps {
  insights: Insight[];
  className?: string;
  maxItems?: number;
}

export function InsightsList({
  insights,
  className = '',
  maxItems,
}: InsightsListProps) {
  const displayInsights = maxItems ? insights.slice(0, maxItems) : insights;

  if (displayInsights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Análises automáticas dos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-medium text-gray-900">
              Tudo está sob controle!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Nenhum insight crítico ou alerta detectado no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>
          {displayInsights.length} análise(s) automática(s) dos dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Card individual de insight
 */
function InsightCard({ insight }: { insight: Insight }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = () => {
    switch (insight.category) {
      case 'turnover':
        return <TrendingDown className="h-4 w-4" />;
      case 'absenteeism':
        return <AlertCircle className="h-4 w-4" />;
      case 'recruitment':
        return <Users className="h-4 w-4" />;
      case 'productivity':
        return <TrendingUp className="h-4 w-4" />;
      case 'diversity':
        return <BarChart className="h-4 w-4" />;
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTypeStyles = () => {
    switch (insight.type) {
      case 'alert':
        return {
          container: 'border-l-4 border-red-500 bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-700',
        };
      case 'warning':
        return {
          container: 'border-l-4 border-yellow-500 bg-yellow-50',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700',
        };
      case 'success':
        return {
          container: 'border-l-4 border-green-500 bg-green-50',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-700',
        };
      case 'info':
      default:
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
        };
    }
  };

  const getImpactBadge = () => {
    switch (insight.impact) {
      case 'high':
        return (
          <Badge variant="destructive" className="ml-auto">
            Alto Impacto
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="default" className="ml-auto bg-yellow-500">
            Médio Impacto
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="secondary" className="ml-auto">
            Baixo Impacto
          </Badge>
        );
    }
  };

  const getCategoryLabel = () => {
    const labels: Record<string, string> = {
      turnover: 'Turnover',
      absenteeism: 'Absenteísmo',
      recruitment: 'Recrutamento',
      productivity: 'Produtividade',
      diversity: 'Diversidade',
      cost: 'Custos',
    };
    return labels[insight.category] || insight.category;
  };

  const styles = getTypeStyles();

  return (
    <div className={`p-4 rounded-lg ${styles.container}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${styles.icon}`}>{getIcon()}</div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">
              {insight.title}
            </h4>
            {getImpactBadge()}
          </div>

          {/* Category */}
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            {getCategoryIcon()}
            <span>{getCategoryLabel()}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

          {/* Metric comparison */}
          {insight.metric && (
            <div className="flex items-center gap-4 text-xs mb-3 p-2 bg-white/50 rounded">
              <div>
                <span className="text-gray-600">Valor Atual:</span>
                <span className="font-bold text-gray-900 ml-1">
                  {insight.metric.value.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Benchmark:</span>
                <span className="font-bold text-gray-900 ml-1">
                  {insight.metric.benchmark.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Diferença:</span>
                <span
                  className={`font-bold ml-1 ${
                    insight.metric.difference > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {insight.metric.difference > 0 ? '+' : ''}
                  {insight.metric.difference.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {insight.recommendation && (
            <div className="p-3 bg-white/70 rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-900 mb-1">
                💡 Recomendação:
              </p>
              <p className="text-xs text-gray-700">{insight.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Summary de Insights
 */
interface InsightsSummaryProps {
  insights: Insight[];
  className?: string;
}

export function InsightsSummary({
  insights,
  className = '',
}: InsightsSummaryProps) {
  const countByType = {
    alert: insights.filter((i) => i.type === 'alert').length,
    warning: insights.filter((i) => i.type === 'warning').length,
    info: insights.filter((i) => i.type === 'info').length,
    success: insights.filter((i) => i.type === 'success').length,
  };

  const countByImpact = {
    high: insights.filter((i) => i.impact === 'high').length,
    medium: insights.filter((i) => i.impact === 'medium').length,
    low: insights.filter((i) => i.impact === 'low').length,
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm font-medium text-red-900">Alertas</p>
        </div>
        <p className="text-2xl font-bold text-red-600">{countByType.alert}</p>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-900">Avisos</p>
        </div>
        <p className="text-2xl font-bold text-yellow-600">
          {countByType.warning}
        </p>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">Informações</p>
        </div>
        <p className="text-2xl font-bold text-blue-600">{countByType.info}</p>
      </div>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-green-900">Positivos</p>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {countByType.success}
        </p>
      </div>
    </div>
  );
}
