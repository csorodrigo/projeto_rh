/**
 * Tipos compartilhados para componentes de gráficos
 */

export interface DataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartDataKey {
  key: string;
  color?: string;
  name?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface BaseChartProps {
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

export type Theme = 'light' | 'dark';

export interface ChartColors {
  gridColor: string;
  textColor: string;
  tooltipBg: string;
  tooltipBorder: string;
}
