/**
 * Demographics Charts Component
 * Fase 8 - Diferenciação
 */

'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
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
import type { DiversityMetrics } from '@/types/analytics';

interface DemographicsChartsProps {
  data: DiversityMetrics;
  className?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export function DemographicsCharts({ data, className = '' }: DemographicsChartsProps) {
  // Preparar dados de gênero
  const genderData = data.genderDistribution.map((g) => ({
    name: g.gender,
    value: g.count,
    percentage: g.percentage,
  }));

  // Preparar dados de idade
  const ageData = data.ageDistribution.map((a) => ({
    range: a.range,
    value: a.count,
    percentage: a.percentage,
  }));

  // Preparar dados de tenure
  const tenureData = data.tenureDistribution.map((t) => ({
    range: t.range,
    value: t.count,
    percentage: t.percentage,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Demografia e Diversidade</CardTitle>
        <CardDescription>
          Distribuição da força de trabalho por características demográficas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Índice de Diversidade */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Índice de Diversidade
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.diversityIndex.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.diversityIndex >= 80
                    ? 'Excelente diversidade'
                    : data.diversityIndex >= 65
                      ? 'Boa diversidade'
                      : data.diversityIndex >= 50
                        ? 'Diversidade média'
                        : 'Diversidade abaixo do ideal'}
                </p>
              </div>
              <div className="w-20 h-20 rounded-full border-8 border-gray-200 flex items-center justify-center"
                style={{
                  borderColor:
                    data.diversityIndex >= 80
                      ? '#10b981'
                      : data.diversityIndex >= 65
                        ? '#3b82f6'
                        : data.diversityIndex >= 50
                          ? '#f59e0b'
                          : '#ef4444',
                }}
              >
                <span className="text-2xl font-bold">
                  {data.diversityIndex.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Distribuição por Gênero */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Distribuição por Gênero</h3>
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) =>
                      `${name}: ${percentage.toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Funcionários']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center space-y-3">
                {genderData.map((gender, index) => (
                  <div key={gender.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium">{gender.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{gender.value}</p>
                      <p className="text-xs text-gray-500">
                        {gender.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribuição por Idade - Pirâmide Etária */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pirâmide Etária</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'value') return [value, 'Funcionários'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  name="Funcionários"
                  radius={[4, 4, 0, 0]}
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Tabela de idade */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Faixa Etária</th>
                    <th className="text-right py-2 px-4">Funcionários</th>
                    <th className="text-right py-2 px-4">Percentual</th>
                  </tr>
                </thead>
                <tbody>
                  {ageData.map((age, index) => (
                    <tr key={age.range} className="border-b">
                      <td className="py-2 px-4 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        {age.range}
                      </td>
                      <td className="text-right py-2 px-4 font-medium">{age.value}</td>
                      <td className="text-right py-2 px-4 text-gray-600">
                        {age.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribuição por Tempo de Casa */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tempo de Casa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-15} textAnchor="end" height={60} />
                <YAxis label={{ value: 'Funcionários', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => [value, 'Funcionários']}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  name="Funcionários"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Equidade Salarial */}
          {data.salaryEquity && data.salaryEquity.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Equidade Salarial</h3>
              <div className="space-y-3">
                {data.salaryEquity.map((equity) => {
                  const isPositive = equity.gap > 0;
                  const isSignificant = Math.abs(equity.gap) > 10;

                  return (
                    <div
                      key={equity.category}
                      className={`p-4 rounded-lg border ${
                        isSignificant
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {equity.category}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {equity.count} funcionários
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(equity.avgSalary)}
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {equity.gap.toFixed(1)}% da média
                          </p>
                        </div>
                      </div>
                      {isSignificant && (
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ Gap salarial significativo detectado
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
