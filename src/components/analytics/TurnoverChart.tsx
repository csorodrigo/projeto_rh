/**
 * Turnover Chart Component
 * Fase 8 - Diferenciação
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TurnoverMetrics } from '@/types/analytics';
import { TURNOVER_BENCHMARKS } from '@/lib/analytics/benchmarks';

interface TurnoverChartProps {
  data: TurnoverMetrics;
  className?: string;
}

export function TurnoverChart({ data, className = '' }: TurnoverChartProps) {
  const [view, setView] = useState<'trend' | 'department'>('trend');

  // Preparar dados da tendência
  const trendData = data.trend.map((item) => ({
    month: item.label || item.date,
    taxa: item.value,
  }));

  // Preparar dados por departamento
  const deptData = data.byDepartment
    .map((dept) => ({
      department: dept.department,
      taxa: dept.value,
      count: dept.count || 0,
    }))
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 10); // Top 10

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Turnover</CardTitle>
        <CardDescription>
          Análise de rotatividade de funcionários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Tendência</TabsTrigger>
            <TabsTrigger value="department">Por Departamento</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <div className="space-y-4">
              {/* Métricas resumidas */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Taxa Atual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.rate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Voluntário</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.voluntary.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Involuntário</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.involuntary.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Gráfico de tendência */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    label={{
                      value: 'Taxa (%)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa']}
                  />
                  <Legend />
                  <ReferenceLine
                    y={TURNOVER_BENCHMARKS.good}
                    stroke="#16a34a"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Meta',
                      position: 'right',
                      fill: '#16a34a',
                    }}
                  />
                  <ReferenceLine
                    y={TURNOVER_BENCHMARKS.average}
                    stroke="#ca8a04"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Média',
                      position: 'right',
                      fill: '#ca8a04',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="taxa"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Turnover"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Legenda de benchmarks */}
              <div className="flex gap-6 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Excelente (&lt;{TURNOVER_BENCHMARKS.excellent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Bom (&lt;{TURNOVER_BENCHMARKS.good}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Médio (&lt;{TURNOVER_BENCHMARKS.average}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Ruim (&gt;{TURNOVER_BENCHMARKS.poor}%)</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="department">
            <div className="space-y-4">
              {/* Resumo */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Comparação entre departamentos - Top 10 maior turnover
                </p>
              </div>

              {/* Gráfico de barras */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Taxa (%)', position: 'bottom' }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'taxa') return [`${value.toFixed(1)}%`, 'Taxa'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <ReferenceLine
                    x={TURNOVER_BENCHMARKS.good}
                    stroke="#16a34a"
                    strokeDasharray="3 3"
                  />
                  <Bar
                    dataKey="taxa"
                    fill="#3b82f6"
                    name="Taxa de Turnover"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Tabela detalhada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Departamento</th>
                      <th className="text-right py-2 px-4">Taxa</th>
                      <th className="text-right py-2 px-4">Desligamentos</th>
                      <th className="text-right py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptData.map((dept) => {
                      const status =
                        dept.taxa <= TURNOVER_BENCHMARKS.good
                          ? 'Bom'
                          : dept.taxa <= TURNOVER_BENCHMARKS.average
                            ? 'Médio'
                            : 'Alto';
                      const statusColor =
                        status === 'Bom'
                          ? 'text-green-600'
                          : status === 'Médio'
                            ? 'text-yellow-600'
                            : 'text-red-600';

                      return (
                        <tr key={dept.department} className="border-b">
                          <td className="py-2 px-4">{dept.department}</td>
                          <td className="text-right py-2 px-4 font-medium">
                            {dept.taxa.toFixed(1)}%
                          </td>
                          <td className="text-right py-2 px-4">{dept.count}</td>
                          <td
                            className={`text-right py-2 px-4 font-medium ${statusColor}`}
                          >
                            {status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
