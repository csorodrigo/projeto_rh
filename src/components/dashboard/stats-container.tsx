/**
 * Container para StatCards do dashboard com dados reais do Supabase
 * Fase 3 - Integração Supabase
 */

'use client';

import * as React from 'react';
import { Users, UserCheck, Plane, AlertTriangle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getRealDashboardStats, type DashboardStatsData } from '@/lib/supabase/queries/dashboard-stats';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30',
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-950',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-500/10 hover:bg-green-500/20 dark:bg-green-500/20 dark:hover:bg-green-500/30',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-950',
      text: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30',
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-full p-3 transition-all duration-200 ${styles.iconBg}`}>
          <Icon className={`size-6 ${styles.text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.isPositive !== false ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="size-4" />
                <span className="text-sm font-semibold">+{trend.value}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="size-4" />
                <span className="text-sm font-semibold">{trend.value}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsContainer() {
  const [stats, setStats] = React.useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await getRealDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="transition-all duration-200">
            <CardContent className="flex items-center justify-center h-[140px]">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <>
      <StatCard
        title="Total Funcionários"
        value={stats.totalEmployees}
        description="Funcionários ativos"
        icon={Users}
        trend={{
          value: 5,
          label: 'vs. mês passado',
          isPositive: true,
        }}
      />
      <StatCard
        title="Presentes Hoje"
        value={stats.presentToday}
        description={`${stats.attendanceRate}% de presença`}
        icon={UserCheck}
        variant="success"
        trend={{
          value: 2,
          label: 'vs. ontem',
          isPositive: true,
        }}
      />
      <StatCard
        title="Férias/Ausentes"
        value={stats.absentToday}
        description="Funcionários ausentes hoje"
        icon={Plane}
        variant="warning"
        trend={{
          value: 3,
          label: 'vs. semana passada',
          isPositive: false,
        }}
      />
      <StatCard
        title="Aniversariantes"
        value={stats.birthdaysThisWeek}
        description="Nesta semana"
        icon={AlertTriangle}
        variant="default"
      />
    </>
  );
}
