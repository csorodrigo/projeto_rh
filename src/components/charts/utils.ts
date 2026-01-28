import { ChartColors } from './types';

/**
 * Cores padrão para gráficos (Tailwind CSS)
 */
export const DEFAULT_CHART_COLORS = [
  '#8b5cf6', // purple-600
  '#06b6d4', // cyan-600
  '#10b981', // emerald-600
  '#f59e0b', // amber-600
  '#ef4444', // red-600
  '#ec4899', // pink-600
  '#3b82f6', // blue-600
  '#84cc16', // lime-600
  '#f97316', // orange-600
  '#a855f7', // purple-500
];

/**
 * Retorna as cores do tema do gráfico baseado no dark mode
 */
export function getChartThemeColors(isDark: boolean): ChartColors {
  return {
    gridColor: isDark ? '#374151' : '#e5e7eb',
    textColor: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  };
}

/**
 * Formata um número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número como porcentagem
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata um número com separador de milhares
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Gera uma cor baseada em um índice
 */
export function getColorByIndex(
  index: number,
  customColors?: string[]
): string {
  const colors = customColors || DEFAULT_CHART_COLORS;
  return colors[index % colors.length];
}

/**
 * Calcula a porcentagem de um valor em relação ao total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Trunca um texto para um tamanho máximo
 */
export function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
