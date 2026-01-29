/**
 * Department Analytics Page
 * Fase 8 - Diferenciação
 *
 * Comparação de métricas entre departamentos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download } from 'lucide-react';
import { PeriodFilter } from '@/components/analytics/PeriodFilter';
import type { AnalyticsPeriod } from '@/types/analytics';
import {
  getDepartmentMetrics,
  getHiresAndTerminations,
  getAbsenceMetrics,
} from '@/lib/supabase/queries/analytics';
import { calculateTurnover } from '@/lib/analytics/metrics';
import {
  TURNOVER_BENCHMARKS,
  ABSENTEEISM_BENCHMARKS,
  getBenchmarkStatus,
  getStatusColor,
} from '@/lib/analytics/benchmarks';

interface DepartmentData {
  department: string;
  headcount: number;
  avgSalary: number;
  avgTenure: number;
  turnoverRate: number;
  terminations: number;
  hires: number;
  absenteeismDays: number;
  absenteeismRate: number;
}

type SortField = 'department' | 'headcount' | 'turnoverRate' | 'absenteeismRate' | 'avgSalary';
type SortDirection = 'asc' | 'desc';

export default function DepartmentAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>({
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
    label: 'Últimos 6 meses',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [sortField, setSortField] = useState<SortField>('turnoverRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptMetrics, hiresTerminations, absenceMetrics] = await Promise.all([
        getDepartmentMetrics(),
        getHiresAndTerminations(period),
        getAbsenceMetrics(period),
      ]);

      const deptData: DepartmentData[] = deptMetrics.map((dept) => {
        // Find department data
        const htData = hiresTerminations.byDepartment.find(
          (d) => d.department === dept.department
        ) || { hires: 0, terminations: 0 };

        const absData = absenceMetrics.byDepartment.find(
          (d) => d.department === dept.department
        ) || { days: 0, employees: 0 };

        const turnoverRate = calculateTurnover(htData.terminations, dept.headcount);
        const workDays = 22 * 6; // 6 meses
        const absenteeismRate =
          dept.headcount > 0 && workDays > 0
            ? (absData.days / (workDays * dept.headcount)) * 100
            : 0;

        return {
          department: dept.department,
          headcount: dept.headcount,
          avgSalary: dept.avgSalary,
          avgTenure: dept.avgTenure,
          turnoverRate,
          terminations: htData.terminations,
          hires: htData.hires,
          absenteeismDays: absData.days,
          absenteeismRate,
        };
      });

      setDepartments(deptData);
    } catch (error) {
      console.error('Error loading department data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDepartments = [...departments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }
    return ((aValue as number) - (bValue as number)) * multiplier;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics por Departamento</h1>
          <p className="text-gray-600 mt-1">
            Comparação de métricas entre {departments.length} departamentos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="default">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Departamentos</CardDescription>
            <CardTitle className="text-3xl">{departments.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Maior Headcount</CardDescription>
            <CardTitle className="text-2xl">
              {departments.length > 0
                ? Math.max(...departments.map((d) => d.headcount))
                : 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {departments.length > 0
              ? departments.reduce((prev, current) =>
                  prev.headcount > current.headcount ? prev : current
                ).department
              : '-'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Maior Turnover</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {departments.length > 0
                ? Math.max(...departments.map((d) => d.turnoverRate)).toFixed(1)
                : 0}
              %
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {departments.length > 0
              ? departments.reduce((prev, current) =>
                  prev.turnoverRate > current.turnoverRate ? prev : current
                ).department
              : '-'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Maior Absenteísmo</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {departments.length > 0
                ? Math.max(...departments.map((d) => d.absenteeismRate)).toFixed(1)
                : 0}
              %
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {departments.length > 0
              ? departments.reduce((prev, current) =>
                  prev.absenteeismRate > current.absenteeismRate ? prev : current
                ).department
              : '-'}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela Comparativa</CardTitle>
          <CardDescription>
            Clique nos cabeçalhos para ordenar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('department')}
                      className="font-semibold hover:bg-gray-100"
                    >
                      Departamento
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('headcount')}
                      className="font-semibold hover:bg-gray-100"
                    >
                      Headcount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('turnoverRate')}
                      className="font-semibold hover:bg-gray-100"
                    >
                      Turnover
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-right py-3 px-4">Desligamentos</th>
                  <th className="text-right py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('absenteeismRate')}
                      className="font-semibold hover:bg-gray-100"
                    >
                      Absenteísmo
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-right py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('avgSalary')}
                      className="font-semibold hover:bg-gray-100"
                    >
                      Salário Médio
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-right py-3 px-4">Tenure Médio</th>
                </tr>
              </thead>
              <tbody>
                {sortedDepartments.map((dept) => {
                  const turnoverStatus = getBenchmarkStatus(
                    dept.turnoverRate,
                    TURNOVER_BENCHMARKS,
                    false
                  );
                  const absenteeismStatus = getBenchmarkStatus(
                    dept.absenteeismRate,
                    ABSENTEEISM_BENCHMARKS,
                    false
                  );

                  return (
                    <tr key={dept.department} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{dept.department}</td>
                      <td className="text-right py-3 px-4">{dept.headcount}</td>
                      <td className={`text-right py-3 px-4 font-medium ${getStatusColor(turnoverStatus)}`}>
                        {dept.turnoverRate.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {dept.terminations}
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${getStatusColor(absenteeismStatus)}`}>
                        {dept.absenteeismRate.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(dept.avgSalary)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {dept.avgTenure.toFixed(0)} meses
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Melhores Performances</CardTitle>
            <CardDescription>Departamentos com melhores métricas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Menor Turnover */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Menor Turnover</p>
                {sortedDepartments
                  .sort((a, b) => a.turnoverRate - b.turnoverRate)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{dept.department}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {dept.turnoverRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>

              {/* Menor Absenteísmo */}
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-900 mb-2">Menor Absenteísmo</p>
                {sortedDepartments
                  .sort((a, b) => a.absenteeismRate - b.absenteeismRate)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{dept.department}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {dept.absenteeismRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Áreas de Atenção</CardTitle>
            <CardDescription>Departamentos que requerem ação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Maior Turnover */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Maior Turnover</p>
                {sortedDepartments
                  .sort((a, b) => b.turnoverRate - a.turnoverRate)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{dept.department}</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {dept.turnoverRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>

              {/* Maior Absenteísmo */}
              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-900 mb-2">Maior Absenteísmo</p>
                {sortedDepartments
                  .sort((a, b) => b.absenteeismRate - a.absenteeismRate)
                  .slice(0, 3)
                  .map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-400">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{dept.department}</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {dept.absenteeismRate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
