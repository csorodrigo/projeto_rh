/**
 * Headcount Chart Component
 * Fase 8 - Diferenciação
 */

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HeadcountMetrics } from '@/types/analytics';
import { Users, TrendingUp, Building2 } from 'lucide-react';

interface HeadcountChartProps {
  data: HeadcountMetrics;
  className?: string;
}

export function HeadcountChart({ data, className = '' }: HeadcountChartProps) {
  // Preparar dados da tendência
  const trendData = data.trend.map((item) => ({
    month: item.label || item.date,
    headcount: item.value,
  }));

  // Preparar dados por departamento
  const deptData = data.byDepartment
    .map((dept) => ({
      department: dept.department,
      count: dept.value,
      percentage: dept.percentage || 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Preparar dados por cargo (top 10)
  const positionData = data.byPosition
    .map((pos) => ({
      position: pos.position,
      count: pos.value,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calcular crescimento
  const growth =
    trendData.length >= 2
      ? trendData[trendData.length - 1].headcount - trendData[0].headcount
      : 0;
  const growthPercentage =
    trendData.length >= 2 && trendData[0].headcount > 0
      ? (growth / trendData[0].headcount) * 100
      : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Headcount</CardTitle>
        <CardDescription>Evolução e distribuição da força de trabalho</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend">
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Evolução</TabsTrigger>
            <TabsTrigger value="department">Departamentos</TabsTrigger>
            <TabsTrigger value="position">Cargos</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <div className="space-y-4">
              {/* KPIs resumidos */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{data.total}</p>
                    <p className="text-xs text-gray-500">funcionários</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Crescimento</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {growth > 0 ? '+' : ''}
                      {growth}
                    </p>
                    <p className="text-xs text-gray-500">
                      {growthPercentage > 0 ? '+' : ''}
                      {growthPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Departamentos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.byDepartment.length}
                    </p>
                    <p className="text-xs text-gray-500">ativos</p>
                  </div>
                </div>
              </div>

              {/* Gráfico de área */}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Headcount']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="headcount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHeadcount)"
                    name="Headcount"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="department">
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="department"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Funcionários'];
                      if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Percentual'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Funcionários" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Departamento</th>
                      <th className="text-right py-2 px-4">Funcionários</th>
                      <th className="text-right py-2 px-4">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptData.map((dept) => (
                      <tr key={dept.department} className="border-b">
                        <td className="py-2 px-4">{dept.department}</td>
                        <td className="text-right py-2 px-4 font-medium">{dept.count}</td>
                        <td className="text-right py-2 px-4 text-gray-600">
                          {dept.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="position">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Top 10 cargos com mais funcionários</p>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={positionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="position"
                    width={180}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => [value, 'Funcionários']} />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    name="Funcionários"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
