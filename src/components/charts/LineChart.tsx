import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: DataPoint[];
  dataKeys: {
    key: string;
    color?: string;
    name?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }[];
  xAxisKey?: string;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  curved?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  isLoading = false,
  emptyMessage = 'Nenhum dado disponível',
  showGrid = true,
  showLegend = true,
  showDots = true,
  curved = true,
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
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
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

  // Chart theme colors
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke={textColor}
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke={textColor} style={{ fontSize: '12px' }} />
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
              iconType="line"
            />
          )}
          {dataKeys.map((item, index) => (
            <Line
              key={item.key}
              type={curved ? 'monotone' : 'linear'}
              dataKey={item.key}
              name={item.name || item.key}
              stroke={item.color || defaultColors[index % defaultColors.length]}
              strokeWidth={item.strokeWidth || 2}
              strokeDasharray={item.strokeDasharray}
              dot={
                showDots
                  ? {
                      fill:
                        item.color ||
                        defaultColors[index % defaultColors.length],
                      r: 4,
                    }
                  : false
              }
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
