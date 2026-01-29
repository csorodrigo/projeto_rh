/**
 * Absenteeism Chart Component
 * Fase 8 - Diferenciação
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
import type { AbsenteeismMetrics } from '@/types/analytics';
import { ABSENTEEISM_BENCHMARKS } from '@/lib/analytics/benchmarks';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';

interface AbsenteeismChartProps {
  data: AbsenteeismMetrics;
  className?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function AbsenteeismChart({ data, className = '' }: AbsenteeismChartProps) {
  // Preparar dados de tendência
  const trendData = data.trend.map((item) => ({
    month: item.label || item.date,
    dias: item.value,
  }));

  // Preparar dados por tipo
  const typeData = data.byType.map((type) => ({
    name: type.type,
    value: type.value,
    percentage: type.percentage || 0,
  }));

  // Preparar dados por departamento
  const deptData = data.byDepartment
    .map((dept) => ({
      department: dept.department,
      dias: dept.value,
      funcionarios: dept.count || 0,
    }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 10);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Absenteísmo</CardTitle>
        <CardDescription>Análise de ausências e padrões</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="type">Por Tipo</TabsTrigger>
            <TabsTrigger value="department">Por Departamento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Taxa</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">absenteísmo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.totalAbsences}
                    </p>
                    <p className="text-xs text-gray-500">dias de ausência</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Média</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.avgDuration.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">dias por ausência</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Status</p>
                <div className="flex items-center gap-2">
                  {data.rate <= ABSENTEEISM_BENCHMARKS.good ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Taxa dentro do esperado (&lt;{ABSENTEEISM_BENCHMARKS.good}%)
                      </p>
                    </>
                  ) : data.rate <= ABSENTEEISM_BENCHMARKS.average ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Taxa na média do mercado
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Taxa acima do recomendado - atenção necessária
                      </p>
                    </>
                  )}
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
                  <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [value, 'Dias de Ausência']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="dias"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Dias de Ausência"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="type">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Gráfico de pizza */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name}: ${percentage.toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Dias']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela de tipos */}
                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Tipo</th>
                        <th className="text-right py-2 px-4">Dias</th>
                        <th className="text-right py-2 px-4">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeData.map((type, index) => (
                        <tr key={type.name} className="border-b">
                          <td className="py-2 px-4 flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            {type.name}
                          </td>
                          <td className="text-right py-2 px-4 font-medium">
                            {type.value}
                          </td>
                          <td className="text-right py-2 px-4 text-gray-600">
                            {type.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="department">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Departamentos com maior número de ausências
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Departamento</th>
                      <th className="text-right py-2 px-4">Dias</th>
                      <th className="text-right py-2 px-4">Funcionários</th>
                      <th className="text-right py-2 px-4">Média/Pessoa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptData.map((dept) => {
                      const avgPerPerson =
                        dept.funcionarios > 0
                          ? dept.dias / dept.funcionarios
                          : 0;

                      return (
                        <tr key={dept.department} className="border-b">
                          <td className="py-2 px-4">{dept.department}</td>
                          <td className="text-right py-2 px-4 font-medium">
                            {dept.dias}
                          </td>
                          <td className="text-right py-2 px-4">
                            {dept.funcionarios}
                          </td>
                          <td className="text-right py-2 px-4 text-gray-600">
                            {avgPerPerson.toFixed(1)}
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
