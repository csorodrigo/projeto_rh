/**
 * KPI Card Component
 * Fase 8 - Diferenciação
 *
 * Card para exibir KPIs com tendência e sparkline
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { KPIData } from '@/types/analytics';

interface KPICardProps {
  data: KPIData;
  className?: string;
}

export function KPICard({ data, className = '' }: KPICardProps) {
  // Formatar valor baseado no tipo
  const formatValue = (value: number | string): string => {
    if (typeof value === 'string') return value;

    switch (data.format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'days':
        return `${Math.round(value)} dias`;
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  // Cor baseada no status
  const getStatusColor = () => {
    switch (data.status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Ícone da tendência
  const TrendIcon = () => {
    if (data.trend === 'up') {
      return <TrendingUp className="h-4 w-4" />;
    }
    if (data.trend === 'down') {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  // Cor da mudança
  const getChangeColor = () => {
    if (data.change === 0) return 'text-gray-500';

    // Para KPIs onde menor é melhor (turnover, absenteísmo, etc)
    const lowerIsBetter = ['turnover', 'absenteísmo', 'custo'].some((term) =>
      data.label.toLowerCase().includes(term)
    );

    if (lowerIsBetter) {
      return data.change < 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return data.change > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  const ChangeIcon = () => {
    if (data.change === 0) return null;
    return data.change > 0 ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <Card className={`${className} border-l-4 ${getStatusColor()}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {data.label}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-3xl font-bold text-gray-900">
                {formatValue(data.value)}
              </h3>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}
              >
                <ChangeIcon />
                <span>
                  {Math.abs(data.change).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendIcon />
              <span>
                {data.trend === 'up' && 'Em alta'}
                {data.trend === 'down' && 'Em queda'}
                {data.trend === 'stable' && 'Estável'}
              </span>
            </div>
          </div>

          {/* Mini Sparkline */}
          {data.sparkline && data.sparkline.length > 0 && (
            <div className="ml-4">
              <Sparkline
                data={data.sparkline}
                color={
                  data.status === 'good'
                    ? '#16a34a'
                    : data.status === 'warning'
                      ? '#ca8a04'
                      : '#dc2626'
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mini sparkline component
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 80;
  const height = 40;
  const padding = 2;

  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Criar pontos do path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y =
      height -
      padding -
      ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg width={width} height={height} className="opacity-75">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Grid de KPI Cards
 */
interface KPIGridProps {
  kpis: KPIData[];
  className?: string;
}

export function KPIGrid({ kpis, className = '' }: KPIGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {kpis.map((kpi, index) => (
        <KPICard key={`${kpi.label}-${index}`} data={kpi} />
      ))}
    </div>
  );
}
