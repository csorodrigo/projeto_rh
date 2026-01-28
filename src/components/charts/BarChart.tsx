import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: DataPoint[];
  dataKeys: {
    key: string;
    color?: string;
    name?: string;
  }[];
  xAxisKey?: string;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  customColors?: string[];
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  isLoading = false,
  emptyMessage = 'Nenhum dado disponível',
  showGrid = true,
  showLegend = true,
  horizontal = false,
  stacked = false,
  customColors,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height }}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  // Default colors for dark and light mode
  const defaultColors = [
    '#8b5cf6', // purple-600
    '#06b6d4', // cyan-600
    '#10b981', // emerald-600
    '#f59e0b', // amber-600
    '#ef4444', // red-600
    '#ec4899', // pink-600
  ];

  const colors = customColors || defaultColors;

  // Chart theme colors
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  const Chart = horizontal ? RechartsBarChart : RechartsBarChart;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <Chart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          )}
          {horizontal ? (
            <>
              <XAxis type="number" stroke={textColor} style={{ fontSize: '12px' }} />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke={textColor} style={{ fontSize: '12px' }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '0.5rem',
              color: textColor,
            }}
            labelStyle={{ color: textColor }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', color: textColor }}
              iconType="rect"
            />
          )}
          {dataKeys.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.name || item.key}
              fill={item.color || colors[index % colors.length]}
              stackId={stacked ? '1' : undefined}
              radius={[4, 4, 0, 0]}
            >
              {/* Apply custom colors to individual bars if provided */}
              {customColors &&
                data.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={customColors[idx % customColors.length]}
                  />
                ))}
            </Bar>
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
