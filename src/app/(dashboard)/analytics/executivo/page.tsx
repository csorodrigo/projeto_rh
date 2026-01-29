/**
 * Executive Analytics Dashboard
 * Fase 8 - Diferenciação
 *
 * Dashboard simplificado para C-level com métricas de alto nível
 */

'use client';

import React, { useState, useEffect } from 'react';
import { subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, AlertCircle, Users, DollarSign } from 'lucide-react';
import { PeriodFilter } from '@/components/analytics/PeriodFilter';
import type { AnalyticsPeriod } from '@/types/analytics';
import {
  getCurrentHeadcount,
  getHiresAndTerminations,
  getAbsenceMetrics,
  getDepartmentMetrics,
} from '@/lib/supabase/queries/analytics';
import {
  calculateTurnover,
  calculateAbsenteeismRate,
  calculateTurnoverCost,
  calculateAbsenteeismCost,
} from '@/lib/analytics/metrics';
import {
  TURNOVER_BENCHMARKS,
  ABSENTEEISM_BENCHMARKS,
  getBenchmarkStatus,
  getStatusLabel,
} from '@/lib/analytics/benchmarks';

export default function ExecutiveDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>({
    startDate: subMonths(new Date(), 12),
    endDate: new Date(),
    label: 'Último ano',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentHeadcount, hiresTerminations, absenceMetrics, departmentMetrics] =
        await Promise.all([
          getCurrentHeadcount(),
          getHiresAndTerminations(period),
          getAbsenceMetrics(period),
          getDepartmentMetrics(),
        ]);

      const avgHeadcount = currentHeadcount.total;
      const totalTerminations = hiresTerminations.terminations.reduce(
        (sum, t) => sum + t.value,
        0
      );
      const turnoverRate = calculateTurnover(totalTerminations, avgHeadcount);

      const avgSalary =
        departmentMetrics.length > 0
          ? departmentMetrics.reduce((sum, d) => sum + d.avgSalary, 0) /
            departmentMetrics.length
          : 5000;

      const workDays = 22 * 12; // 12 meses
      const absenteeismRate = calculateAbsenteeismRate(
        absenceMetrics.totalDays,
        workDays,
        avgHeadcount
      );

      setMetrics({
        headcount: currentHeadcount.total,
        activeEmployees: currentHeadcount.active,
        hires: hiresTerminations.hires.reduce((sum, h) => sum + h.value, 0),
        terminations: totalTerminations,
        turnoverRate,
        turnoverCost: calculateTurnoverCost(totalTerminations, avgSalary),
        absenteeismRate,
        absenteeismDays: absenceMetrics.totalDays,
        absenteeismCost: calculateAbsenteeismCost(
          absenceMetrics.totalDays,
          avgSalary / 22
        ),
        avgSalary,
        totalPayroll: avgSalary * currentHeadcount.total,
      });
    } catch (error) {
      console.error('Error loading executive data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  const turnoverStatus = getBenchmarkStatus(
    metrics.turnoverRate,
    TURNOVER_BENCHMARKS,
    false
  );
  const absenteeismStatus = getBenchmarkStatus(
    metrics.absenteeismRate,
    ABSENTEEISM_BENCHMARKS,
    false
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600 mt-1">Visão estratégica de People Analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="default">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Headcount */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Força de Trabalho</CardDescription>
            <CardTitle className="text-4xl">{metrics.headcount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Users className="h-4 w-4" />
                <span>{metrics.activeEmployees} ativos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Turnover */}
        <Card
          className={`border-l-4 ${
            turnoverStatus === 'excellent' || turnoverStatus === 'good'
              ? 'border-l-green-500'
              : turnoverStatus === 'average'
                ? 'border-l-yellow-500'
                : 'border-l-red-500'
          }`}
        >
          <CardHeader className="pb-3">
            <CardDescription>Taxa de Turnover</CardDescription>
            <CardTitle className="text-4xl">{metrics.turnoverRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    turnoverStatus === 'excellent' || turnoverStatus === 'good'
                      ? 'text-green-600'
                      : turnoverStatus === 'average'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {getStatusLabel(turnoverStatus)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Desligamentos:</span>
                <span className="font-medium">{metrics.terminations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absenteeism */}
        <Card
          className={`border-l-4 ${
            absenteeismStatus === 'excellent' || absenteeismStatus === 'good'
              ? 'border-l-green-500'
              : absenteeismStatus === 'average'
                ? 'border-l-yellow-500'
                : 'border-l-red-500'
          }`}
        >
          <CardHeader className="pb-3">
            <CardDescription>Taxa de Absenteísmo</CardDescription>
            <CardTitle className="text-4xl">{metrics.absenteeismRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    absenteeismStatus === 'excellent' || absenteeismStatus === 'good'
                      ? 'text-green-600'
                      : absenteeismStatus === 'average'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {getStatusLabel(absenteeismStatus)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dias ausentes:</span>
                <span className="font-medium">{metrics.absenteeismDays}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Impacto Financeiro</CardTitle>
          <CardDescription>Custos e investimentos em People</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Folha Total</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.totalPayroll)}
              </p>
              <p className="text-xs text-gray-500 mt-1">mensal</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-gray-600">Custo de Turnover</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.turnoverCost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">no período</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium text-gray-600">Custo de Absenteísmo</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.absenteeismCost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">no período</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-gray-600">Custo por Funcionário</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.avgSalary)}
              </p>
              <p className="text-xs text-gray-500 mt-1">salário médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Pontos Positivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {turnoverStatus === 'excellent' || turnoverStatus === 'good' ? (
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Turnover controlado</p>
                    <p className="text-sm text-gray-600">
                      Taxa de {metrics.turnoverRate.toFixed(1)}% está dentro do benchmark ideal
                    </p>
                  </div>
                </li>
              ) : null}
              {absenteeismStatus === 'excellent' || absenteeismStatus === 'good' ? (
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Absenteísmo sob controle</p>
                    <p className="text-sm text-gray-600">
                      Taxa de {metrics.absenteeismRate.toFixed(1)}% está abaixo da média do mercado
                    </p>
                  </div>
                </li>
              ) : null}
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Contratações em dia</p>
                  <p className="text-sm text-gray-600">
                    {metrics.hires} novas contratações no período
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <TrendingDown className="h-5 w-5" />
              Áreas de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {turnoverStatus === 'poor' || turnoverStatus === 'average' ? (
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Turnover elevado</p>
                    <p className="text-sm text-gray-600">
                      Rever estratégias de retenção e engajamento
                    </p>
                  </div>
                </li>
              ) : null}
              {absenteeismStatus === 'poor' || absenteeismStatus === 'average' ? (
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Absenteísmo alto</p>
                    <p className="text-sm text-gray-600">
                      Investir em programas de saúde e bem-estar
                    </p>
                  </div>
                </li>
              ) : null}
              {metrics.turnoverCost > 100000 ? (
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Custo de turnover elevado</p>
                    <p className="text-sm text-gray-600">
                      ROI positivo em programas de retenção
                    </p>
                  </div>
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
