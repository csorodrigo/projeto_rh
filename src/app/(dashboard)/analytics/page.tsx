/**
 * Analytics Dashboard - Main Page
 * Fase 8 - Diferenciação
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { subMonths } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

// Components
import { KPIGrid } from '@/components/analytics/KPICard';
import { TurnoverChart } from '@/components/analytics/TurnoverChart';
import { HeadcountChart } from '@/components/analytics/HeadcountChart';
import { AbsenteeismChart } from '@/components/analytics/AbsenteeismChart';
import { DemographicsCharts } from '@/components/analytics/DemographicsCharts';
import { InsightsList, InsightsSummary } from '@/components/analytics/InsightsList';
import { PeriodFilter } from '@/components/analytics/PeriodFilter';

// Types & Utils
import type {
  AnalyticsPeriod,
  KPIData,
  TurnoverMetrics,
  HeadcountMetrics,
  AbsenteeismMetrics,
  DiversityMetrics,
} from '@/types/analytics';

// Queries & Analytics
import {
  getHeadcountTrend,
  getHiresAndTerminations,
  getAbsenceMetrics,
  getDepartmentMetrics,
  getAgeDistribution,
  getTenureDistribution,
  getSalaryBands,
  getCurrentHeadcount,
} from '@/lib/supabase/queries/analytics';

import {
  calculateTurnover,
  calculateTurnoverByType,
  calculateTurnoverCost,
  calculateAbsenteeismRate,
  calculateAbsenteeismByType,
  calculateAbsenteeismCost,
  calculateAverageTenure,
  calculateGenderDistribution,
  calculateAgeDistribution,
  calculateTenureDistribution,
  calculateSalaryEquity,
  calculateDiversityIndex,
  calculatePercentageChange,
} from '@/lib/analytics/metrics';

import { generateInsights } from '@/lib/analytics/insights';

export default function AnalyticsPage() {
  // State
  const [period, setPeriod] = useState<AnalyticsPeriod>({
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
    label: 'Últimos 6 meses',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [headcountData, setHeadcountData] = useState<HeadcountMetrics | null>(
    null
  );
  const [turnoverData, setTurnoverData] = useState<TurnoverMetrics | null>(
    null
  );
  const [absenteeismData, setAbsenteeismData] =
    useState<AbsenteeismMetrics | null>(null);
  const [diversityData, setDiversityData] = useState<DiversityMetrics | null>(
    null
  );

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [
        headcountTrend,
        hiresTerminations,
        currentHeadcount,
        absenceMetrics,
        departmentMetrics,
        ageDistribution,
        tenureDistribution,
        salaryBands,
      ] = await Promise.all([
        getHeadcountTrend(period),
        getHiresAndTerminations(period),
        getCurrentHeadcount(),
        getAbsenceMetrics(period),
        getDepartmentMetrics(),
        getAgeDistribution(),
        getTenureDistribution(),
        getSalaryBands(),
      ]);

      // Calculate headcount metrics
      const headcount: HeadcountMetrics = {
        total: currentHeadcount.total,
        active: currentHeadcount.active,
        onLeave: currentHeadcount.onLeave,
        byDepartment: departmentMetrics.map((d) => ({
          department: d.department,
          value: d.headcount,
          percentage: (d.headcount / currentHeadcount.total) * 100,
        })),
        byPosition: [], // TODO: Get position data
        trend: headcountTrend,
      };

      // Calculate turnover metrics
      const avgHeadcount =
        headcountTrend.length > 0
          ? headcountTrend.reduce((sum, t) => sum + t.value, 0) /
            headcountTrend.length
          : currentHeadcount.total;

      const totalTerminations = hiresTerminations.terminations.reduce(
        (sum, t) => sum + t.value,
        0
      );
      const turnoverRate = calculateTurnover(totalTerminations, avgHeadcount);

      const turnover: TurnoverMetrics = {
        rate: turnoverRate,
        voluntary: turnoverRate * 0.65, // Estimate: 65% voluntary
        involuntary: turnoverRate * 0.35, // Estimate: 35% involuntary
        hires: hiresTerminations.hires.reduce((sum, h) => sum + h.value, 0),
        terminations: totalTerminations,
        avgHeadcount,
        cost: calculateTurnoverCost(
          totalTerminations,
          departmentMetrics.length > 0
            ? departmentMetrics.reduce((sum, d) => sum + d.avgSalary, 0) /
                departmentMetrics.length
            : 5000
        ),
        byDepartment: hiresTerminations.byDepartment.map((d) => ({
          department: d.department,
          value:
            d.terminations > 0
              ? calculateTurnover(d.terminations, avgHeadcount)
              : 0,
          count: d.terminations,
        })),
        trend: hiresTerminations.terminations,
      };

      // Calculate absenteeism metrics
      const workDays = 22; // Average work days per month
      const months =
        (period.endDate.getTime() - period.startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      const totalWorkDays = workDays * months;

      const absenteeism: AbsenteeismMetrics = {
        rate: calculateAbsenteeismRate(
          absenceMetrics.totalDays,
          totalWorkDays,
          avgHeadcount
        ),
        totalAbsences: absenceMetrics.totalDays,
        avgDuration:
          absenceMetrics.byType.length > 0
            ? absenceMetrics.totalDays /
              absenceMetrics.byType.reduce((sum, t) => sum + t.days, 0)
            : 0,
        cost: calculateAbsenteeismCost(
          absenceMetrics.totalDays,
          departmentMetrics.length > 0
            ? departmentMetrics.reduce((sum, d) => sum + d.avgSalary, 0) /
                departmentMetrics.length /
                22
            : 250
        ),
        byType: absenceMetrics.byType.map((t) => ({
          type: t.type,
          value: t.days,
          percentage: (t.days / absenceMetrics.totalDays) * 100,
        })),
        byDepartment: absenceMetrics.byDepartment.map((d) => ({
          department: d.department,
          value: d.days,
          count: d.employees,
        })),
        trend: absenceMetrics.trend,
        heatmap: [], // TODO: Implement heatmap data
      };

      // Calculate diversity metrics
      const diversity: DiversityMetrics = {
        genderDistribution: [
          { gender: 'Masculino', count: 60, percentage: 60 },
          { gender: 'Feminino', count: 38, percentage: 38 },
          { gender: 'Outro', count: 2, percentage: 2 },
        ], // TODO: Get real data
        ageDistribution: ageDistribution.map((a) => ({
          range: a.range,
          count: a.count,
          percentage:
            (a.count /
              ageDistribution.reduce((sum, x) => sum + x.count, 0)) *
            100,
        })),
        tenureDistribution: tenureDistribution.map((t) => ({
          range: t.range,
          count: t.count,
          percentage:
            (t.count /
              tenureDistribution.reduce((sum, x) => sum + x.count, 0)) *
            100,
        })),
        salaryEquity: [], // TODO: Calculate salary equity
        diversityIndex: calculateDiversityIndex([
          ...ageDistribution.map((a) => ({ category: a.range, count: a.count })),
        ]),
      };

      setHeadcountData(headcount);
      setTurnoverData(turnover);
      setAbsenteeismData(absenteeism);
      setDiversityData(diversity);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  // Generate KPIs
  const kpis = useMemo((): KPIData[] => {
    if (!headcountData || !turnoverData || !absenteeismData) return [];

    return [
      {
        label: 'Headcount Total',
        value: headcountData.total,
        change: headcountData.trend.length >= 2
          ? calculatePercentageChange(
              headcountData.trend[headcountData.trend.length - 1].value,
              headcountData.trend[0].value
            )
          : 0,
        trend:
          headcountData.trend.length >= 2 &&
          headcountData.trend[headcountData.trend.length - 1].value >
            headcountData.trend[0].value
            ? 'up'
            : 'down',
        status: 'good',
        format: 'number',
        sparkline: headcountData.trend.map((t) => t.value),
      },
      {
        label: 'Taxa de Turnover',
        value: turnoverData.rate,
        change: 0, // TODO: Calculate change
        trend: turnoverData.rate <= 10 ? 'down' : 'up',
        status: turnoverData.rate <= 10 ? 'good' : turnoverData.rate <= 15 ? 'warning' : 'critical',
        format: 'percentage',
        sparkline: turnoverData.trend.map((t) => t.value),
      },
      {
        label: 'Taxa de Absenteísmo',
        value: absenteeismData.rate,
        change: 0, // TODO: Calculate change
        trend: absenteeismData.rate <= 3 ? 'down' : 'up',
        status: absenteeismData.rate <= 3 ? 'good' : absenteeismData.rate <= 5 ? 'warning' : 'critical',
        format: 'percentage',
        sparkline: absenteeismData.trend.map((t) => t.value),
      },
      {
        label: 'Custo de Turnover',
        value: turnoverData.cost,
        change: 0, // TODO: Calculate change
        trend: 'stable',
        status: turnoverData.cost < 100000 ? 'good' : turnoverData.cost < 200000 ? 'warning' : 'critical',
        format: 'currency',
      },
    ];
  }, [headcountData, turnoverData, absenteeismData]);

  // Generate insights
  const insights = useMemo(() => {
    if (!turnoverData || !absenteeismData) return [];

    return generateInsights({
      turnover: turnoverData,
      absenteeism: absenteeismData,
    });
  }, [turnoverData, absenteeismData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People Analytics</h1>
          <p className="text-gray-600 mt-1">
            Dashboard executivo de métricas e insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="default">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <KPIGrid kpis={kpis} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {headcountData && <HeadcountChart data={headcountData} />}
            {turnoverData && <TurnoverChart data={turnoverData} />}
          </div>

          {/* Top Insights */}
          {insights.length > 0 && (
            <InsightsList insights={insights} maxItems={3} />
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {headcountData && <HeadcountChart data={headcountData} />}
            {turnoverData && <TurnoverChart data={turnoverData} />}
            {absenteeismData && <AbsenteeismChart data={absenteeismData} />}
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {diversityData && <DemographicsCharts data={diversityData} />}
            {absenteeismData && <AbsenteeismChart data={absenteeismData} />}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsSummary insights={insights} />
          <InsightsList insights={insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
