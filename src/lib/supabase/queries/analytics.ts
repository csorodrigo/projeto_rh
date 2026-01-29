/**
 * Queries para Analytics Dashboard
 * Fase 8 - Diferenciação
 */

import { createClient } from '@/lib/supabase/client';
import type { AnalyticsPeriod, TrendData } from '@/types/analytics';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface EmployeeSnapshot {
  id: string;
  name: string;
  department: string | null;
  position: string;
  hire_date: string;
  birth_date: string;
  status: string;
  base_salary: number | null;
  termination_date?: string | null;
  termination_reason?: string | null;
  gender?: string | null;
}

export interface AbsenceRecord {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  days: number;
}

export interface TimeRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
}

export interface RecruitmentData {
  id: string;
  job_id: string;
  candidate_id: string;
  application_date: string;
  status: string;
  hired_date?: string | null;
  stage: string;
}

/**
 * Busca evolução do headcount por período
 */
export async function getHeadcountTrend(
  period: AnalyticsPeriod
): Promise<TrendData[]> {
  const supabase = createClient();

  try {
    // Gerar array de meses no período
    const months: Date[] = [];
    let currentDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    while (currentDate <= endDate) {
      months.push(new Date(currentDate));
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }

    // Buscar headcount para cada mês
    const trend: TrendData[] = await Promise.all(
      months.map(async (month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .lte('hire_date', format(monthEnd, 'yyyy-MM-dd'))
          .or(
            `termination_date.is.null,termination_date.gte.${format(monthStart, 'yyyy-MM-dd')}`
          );

        return {
          date: format(month, 'yyyy-MM'),
          value: count || 0,
          label: format(month, 'MMM yyyy'),
        };
      })
    );

    return trend;
  } catch (error) {
    console.error('Erro ao buscar tendência de headcount:', error);
    return [];
  }
}

/**
 * Busca admissões e desligamentos por período
 */
export async function getHiresAndTerminations(period: AnalyticsPeriod): Promise<{
  hires: TrendData[];
  terminations: TrendData[];
  byDepartment: Array<{
    department: string;
    hires: number;
    terminations: number;
  }>;
}> {
  const supabase = createClient();

  try {
    const startDate = format(period.startDate, 'yyyy-MM-dd');
    const endDate = format(period.endDate, 'yyyy-MM-dd');

    // Buscar contratações
    const { data: hiredEmployees } = await supabase
      .from('employees')
      .select('hire_date, department')
      .gte('hire_date', startDate)
      .lte('hire_date', endDate) as any;

    // Buscar desligamentos
    const { data: terminatedEmployees } = await supabase
      .from('employees')
      .select('termination_date, department')
      .not('termination_date', 'is', null)
      .gte('termination_date', startDate)
      .lte('termination_date', endDate) as any;

    // Processar dados por mês
    const hiresByMonth: Record<string, number> = {};
    const terminationsByMonth: Record<string, number> = {};

    hiredEmployees?.forEach((emp) => {
      const month = format(new Date(emp.hire_date), 'yyyy-MM');
      hiresByMonth[month] = (hiresByMonth[month] || 0) + 1;
    });

    terminatedEmployees?.forEach((emp) => {
      if (emp.termination_date) {
        const month = format(new Date(emp.termination_date), 'yyyy-MM');
        terminationsByMonth[month] = (terminationsByMonth[month] || 0) + 1;
      }
    });

    // Converter para TrendData
    const months = Array.from(
      new Set([
        ...Object.keys(hiresByMonth),
        ...Object.keys(terminationsByMonth),
      ])
    ).sort();

    const hires = months.map((month) => ({
      date: month,
      value: hiresByMonth[month] || 0,
      label: format(new Date(month), 'MMM yyyy'),
    }));

    const terminations = months.map((month) => ({
      date: month,
      value: terminationsByMonth[month] || 0,
      label: format(new Date(month), 'MMM yyyy'),
    }));

    // Agrupar por departamento
    const deptData: Record<string, { hires: number; terminations: number }> =
      {};

    hiredEmployees?.forEach((emp) => {
      const dept = emp.department || 'Sem Departamento';
      if (!deptData[dept]) deptData[dept] = { hires: 0, terminations: 0 };
      deptData[dept].hires += 1;
    });

    terminatedEmployees?.forEach((emp) => {
      const dept = emp.department || 'Sem Departamento';
      if (!deptData[dept]) deptData[dept] = { hires: 0, terminations: 0 };
      deptData[dept].terminations += 1;
    });

    const byDepartment = Object.entries(deptData).map(([department, data]) => ({
      department,
      hires: data.hires,
      terminations: data.terminations,
    }));

    return { hires, terminations, byDepartment };
  } catch (error) {
    console.error('Erro ao buscar contratações e desligamentos:', error);
    return { hires: [], terminations: [], byDepartment: [] };
  }
}

/**
 * Busca métricas de ausências
 */
export async function getAbsenceMetrics(period: AnalyticsPeriod): Promise<{
  totalDays: number;
  byType: Array<{ type: string; days: number }>;
  byDepartment: Array<{ department: string; days: number; employees: number }>;
  trend: TrendData[];
}> {
  const supabase = createClient();

  try {
    const startDate = format(period.startDate, 'yyyy-MM-dd');
    const endDate = format(period.endDate, 'yyyy-MM-dd');

    // Buscar ausências no período
    const { data: absences } = await supabase
      .from('absences')
      .select(
        `
        *,
        employee:employees(department)
      `
      )
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'approved') as any;

    if (!absences || absences.length === 0) {
      return {
        totalDays: 0,
        byType: [],
        byDepartment: [],
        trend: [],
      };
    }

    // Calcular total de dias
    const totalDays = absences.reduce((sum, abs) => {
      const start = new Date(abs.start_date);
      const end = new Date(abs.end_date);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      return sum + days;
    }, 0);

    // Agrupar por tipo
    const typeData: Record<string, number> = {};
    absences.forEach((abs) => {
      const start = new Date(abs.start_date);
      const end = new Date(abs.end_date);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      typeData[abs.type] = (typeData[abs.type] || 0) + days;
    });

    const byType = Object.entries(typeData).map(([type, days]) => ({
      type,
      days,
    }));

    // Agrupar por departamento
    const deptData: Record<string, { days: number; employees: Set<string> }> =
      {};
    absences.forEach((abs: any) => {
      const dept = abs.employee?.department || 'Sem Departamento';
      if (!deptData[dept]) {
        deptData[dept] = { days: 0, employees: new Set() };
      }
      const start = new Date(abs.start_date);
      const end = new Date(abs.end_date);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      deptData[dept].days += days;
      deptData[dept].employees.add(abs.employee_id);
    });

    const byDepartment = Object.entries(deptData).map(([department, data]) => ({
      department,
      days: data.days,
      employees: data.employees.size,
    }));

    // Tendência mensal
    const monthlyData: Record<string, number> = {};
    absences.forEach((abs) => {
      const month = format(new Date(abs.start_date), 'yyyy-MM');
      const start = new Date(abs.start_date);
      const end = new Date(abs.end_date);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      monthlyData[month] = (monthlyData[month] || 0) + days;
    });

    const trend = Object.entries(monthlyData)
      .map(([date, value]) => ({
        date,
        value,
        label: format(new Date(date), 'MMM yyyy'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalDays, byType, byDepartment, trend };
  } catch (error) {
    console.error('Erro ao buscar métricas de ausências:', error);
    return {
      totalDays: 0,
      byType: [],
      byDepartment: [],
      trend: [],
    };
  }
}

/**
 * Busca métricas por departamento
 */
export async function getDepartmentMetrics(): Promise<
  Array<{
    department: string;
    headcount: number;
    avgSalary: number;
    avgTenure: number;
  }>
> {
  const supabase = createClient();

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('department, base_salary, hire_date')
      .eq('status', 'active') as any;

    if (!employees) return [];

    // Agrupar por departamento
    const deptData: Record<
      string,
      { count: number; totalSalary: number; tenures: number[] }
    > = {};

    const now = new Date();
    employees.forEach((emp) => {
      const dept = emp.department || 'Sem Departamento';
      if (!deptData[dept]) {
        deptData[dept] = { count: 0, totalSalary: 0, tenures: [] };
      }
      deptData[dept].count += 1;
      deptData[dept].totalSalary += emp.base_salary || 0;

      // Calcular tenure em meses
      const hireDate = new Date(emp.hire_date);
      const months = Math.floor(
        (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      deptData[dept].tenures.push(months);
    });

    return Object.entries(deptData).map(([department, data]) => ({
      department,
      headcount: data.count,
      avgSalary: data.count > 0 ? data.totalSalary / data.count : 0,
      avgTenure:
        data.tenures.length > 0
          ? data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length
          : 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar métricas por departamento:', error);
    return [];
  }
}

/**
 * Busca distribuição etária
 */
export async function getAgeDistribution(): Promise<
  Array<{ range: string; count: number }>
> {
  const supabase = createClient();

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('birth_date')
      .eq('status', 'active') as any;

    if (!employees) return [];

    const ranges = [
      { range: '18-24', min: 18, max: 24 },
      { range: '25-34', min: 25, max: 34 },
      { range: '35-44', min: 35, max: 44 },
      { range: '45-54', min: 45, max: 54 },
      { range: '55+', min: 55, max: 999 },
    ];

    const now = new Date();
    const counts = ranges.map((r) => {
      const count = employees.filter((emp) => {
        const birthDate = new Date(emp.birth_date);
        const age = Math.floor(
          (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );
        return age >= r.min && age <= r.max;
      }).length;

      return { range: r.range, count };
    });

    return counts;
  } catch (error) {
    console.error('Erro ao buscar distribuição etária:', error);
    return [];
  }
}

/**
 * Busca distribuição de tempo de casa
 */
export async function getTenureDistribution(): Promise<
  Array<{ range: string; count: number }>
> {
  const supabase = createClient();

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('hire_date')
      .eq('status', 'active') as any;

    if (!employees) return [];

    const ranges = [
      { range: '0-6 meses', min: 0, max: 6 },
      { range: '6-12 meses', min: 6, max: 12 },
      { range: '1-2 anos', min: 12, max: 24 },
      { range: '2-5 anos', min: 24, max: 60 },
      { range: '5+ anos', min: 60, max: 9999 },
    ];

    const now = new Date();
    const counts = ranges.map((r) => {
      const count = employees.filter((emp) => {
        const hireDate = new Date(emp.hire_date);
        const months = Math.floor(
          (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        return months >= r.min && months < r.max;
      }).length;

      return { range: r.range, count };
    });

    return counts;
  } catch (error) {
    console.error('Erro ao buscar distribuição de tempo de casa:', error);
    return [];
  }
}

/**
 * Busca faixas salariais
 */
export async function getSalaryBands(): Promise<
  Array<{ range: string; count: number; avgSalary: number }>
> {
  const supabase = createClient();

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('base_salary')
      .eq('status', 'active')
      .not('base_salary', 'is', null) as any;

    if (!employees) return [];

    const ranges = [
      { range: 'Até R$ 3.000', min: 0, max: 3000 },
      { range: 'R$ 3.000 - R$ 5.000', min: 3000, max: 5000 },
      { range: 'R$ 5.000 - R$ 8.000', min: 5000, max: 8000 },
      { range: 'R$ 8.000 - R$ 12.000', min: 8000, max: 12000 },
      { range: 'R$ 12.000+', min: 12000, max: 999999 },
    ];

    const bands = ranges.map((r) => {
      const inRange = employees.filter(
        (emp) =>
          emp.base_salary &&
          emp.base_salary >= r.min &&
          emp.base_salary < r.max
      );
      const avgSalary =
        inRange.length > 0
          ? inRange.reduce((sum, emp) => sum + (emp.base_salary || 0), 0) /
            inRange.length
          : 0;

      return {
        range: r.range,
        count: inRange.length,
        avgSalary,
      };
    });

    return bands;
  } catch (error) {
    console.error('Erro ao buscar faixas salariais:', error);
    return [];
  }
}

/**
 * Busca tempo de contratação por vaga
 */
export async function getTimeToHireByJob(): Promise<
  Array<{ jobTitle: string; avgDays: number; hires: number }>
> {
  const supabase = createClient();

  try {
    // Buscar vagas com candidatos contratados
    const { data: jobs } = await supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        created_at,
        applications:job_applications(
          id,
          created_at,
          hired_at,
          status
        )
      `
      )
      .eq('applications.status', 'hired') as any;

    if (!jobs) return [];

    const timeByJob = jobs
      .map((job: any) => {
        const hiredApps = job.applications.filter(
          (app: any) => app.hired_at
        );

        if (hiredApps.length === 0) return null;

        const totalDays = hiredApps.reduce((sum: number, app: any) => {
          const posted = new Date(job.created_at);
          const hired = new Date(app.hired_at);
          const days = Math.floor(
            (hired.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);

        return {
          jobTitle: job.title,
          avgDays: Math.round(totalDays / hiredApps.length),
          hires: hiredApps.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return timeByJob;
  } catch (error) {
    console.error('Erro ao buscar tempo de contratação:', error);
    return [];
  }
}

/**
 * Busca headcount atual
 */
export async function getCurrentHeadcount(): Promise<{
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}> {
  const supabase = createClient();

  try {
    const { data: employees } = await supabase
      .from('employees')
      .select('status') as any;

    if (!employees) {
      return { total: 0, active: 0, onLeave: 0, inactive: 0 };
    }

    const counts = {
      total: employees.length,
      active: employees.filter((e) => e.status === 'active').length,
      onLeave: employees.filter((e) => e.status === 'on_leave').length,
      inactive: employees.filter(
        (e) => e.status === 'inactive' || e.status === 'terminated'
      ).length,
    };

    return counts;
  } catch (error) {
    console.error('Erro ao buscar headcount atual:', error);
    return { total: 0, active: 0, onLeave: 0, inactive: 0 };
  }
}
