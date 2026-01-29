/**
 * Queries para gráficos do dashboard
 * Task #22 - Conectar gráficos com dados reais do Supabase
 */

import { createClient } from '@/lib/supabase/client';

// ==========================================
// TIPOS
// ==========================================

export interface AttendanceData {
  day: string;
  presentes: number;
  ausentes: number;
}

export interface AbsenceTypeData {
  name: string;
  value: number;
  color: string;
}

export interface HoursWorkedData {
  employee: string;
  esperado: number;
  trabalhado: number;
}

// ==========================================
// UTILITÁRIOS
// ==========================================

/**
 * Retorna data no timezone America/Sao_Paulo
 */
function getBrazilDate(date: Date = new Date()): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

/**
 * Retorna nome do dia da semana abreviado
 */
function getDayName(date: Date): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[date.getDay()];
}

/**
 * Retorna a cor correspondente ao tipo de ausência
 */
function getAbsenceColor(type: string): string {
  const colors: Record<string, string> = {
    vacation: '#3b82f6', // azul
    sick_leave: '#ef4444', // vermelho
    medical_appointment: '#f59e0b', // laranja
    other: '#10b981', // verde
    unpaid_leave: '#8b5cf6', // roxo
    personal_leave: '#ec4899', // rosa
  };
  return colors[type] || '#6b7280'; // cinza padrão
}

/**
 * Retorna o nome traduzido do tipo de ausência
 */
function getAbsenceTypeName(type: string): string {
  const names: Record<string, string> = {
    vacation: 'Férias',
    sick_leave: 'Atestado Médico',
    medical_appointment: 'Consulta Médica',
    other: 'Outros',
    unpaid_leave: 'Licença não Remunerada',
    personal_leave: 'Licença Pessoal',
  };
  return names[type] || type;
}

// ==========================================
// QUERIES
// ==========================================

/**
 * 1. GRÁFICO DE PRESENÇAS - Últimos 7 dias
 *
 * Busca dados de presença dos últimos 7 dias:
 * - Para cada dia, conta funcionários únicos com clock_in
 * - Total funcionários - presentes = ausentes
 */
export async function getLast7DaysAttendance(
  companyId: string
): Promise<AttendanceData[]> {
  const supabase = createClient();

  try {
    // Pegar total de funcionários ativos
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active');

    const total = totalEmployees || 0;

    // Calcular últimos 7 dias
    const today = getBrazilDate();
    const result: AttendanceData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dateStr = date.toISOString().split('T')[0];

      // Contar funcionários únicos com clock_in neste dia
      const { data: records } = await supabase
        .from('time_records')
        .select('employee_id')
        .eq('company_id', companyId)
        .eq('record_type', 'clock_in')
        .gte('recorded_at', date.toISOString())
        .lt('recorded_at', nextDate.toISOString());

      // Remover duplicatas (mesmo funcionário pode ter múltiplos registros)
      const uniqueEmployees = new Set(records?.map(r => r.employee_id) || []);
      const presentes = uniqueEmployees.size;
      const ausentes = total - presentes;

      result.push({
        day: getDayName(date),
        presentes,
        ausentes: ausentes >= 0 ? ausentes : 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Erro ao buscar dados de presença dos últimos 7 dias:', error);
    return [];
  }
}

/**
 * 2. GRÁFICO DE TIPOS DE AUSÊNCIA - Mês atual
 *
 * Busca ausências do mês atual agrupadas por tipo:
 * - Conta quantidade de cada tipo
 * - Retorna com cores correspondentes
 */
export async function getCurrentMonthAbsencesByType(
  companyId: string
): Promise<AbsenceTypeData[]> {
  const supabase = createClient();

  try {
    // Pegar primeiro e último dia do mês atual
    const now = getBrazilDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];

    // Buscar todas as ausências do mês
    const { data: absences, error } = await supabase
      .from('absences')
      .select('type')
      .eq('company_id', companyId)
      .in('status', ['approved', 'in_progress'])
      .or(`start_date.gte.${firstDayStr},end_date.lte.${lastDayStr}`)
      .or(`start_date.lte.${lastDayStr},end_date.gte.${firstDayStr}`);

    if (error) {
      console.error('Erro ao buscar ausências por tipo:', error);
      return [];
    }

    if (!absences || absences.length === 0) {
      return [];
    }

    // Agrupar por tipo
    const typeCount: Record<string, number> = {};
    absences.forEach(absence => {
      const type = absence.type || 'other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    // Converter para formato do gráfico
    const result: AbsenceTypeData[] = Object.entries(typeCount).map(
      ([type, value]) => ({
        name: getAbsenceTypeName(type),
        value,
        color: getAbsenceColor(type),
      })
    );

    // Ordenar por valor (maior primeiro)
    return result.sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('Erro ao buscar tipos de ausência do mês:', error);
    return [];
  }
}

/**
 * 3. GRÁFICO DE HORAS TRABALHADAS - Top 5 funcionários do mês
 *
 * Busca os top 5 funcionários com mais horas trabalhadas no mês:
 * - Calcula horas trabalhadas por funcionário
 * - Compara com esperado (176h para 44h semanais)
 */
export async function getTopEmployeesHours(
  companyId: string,
  limit: number = 5
): Promise<HoursWorkedData[]> {
  const supabase = createClient();

  try {
    // Pegar primeiro e último dia do mês atual
    const now = getBrazilDate();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Buscar resumo diário de todos os funcionários do mês
    const { data: dailySummaries, error } = await supabase
      .from('time_tracking_daily')
      .select(`
        employee_id,
        worked_minutes,
        employees!inner (
          full_name
        )
      `)
      .eq('company_id', companyId)
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);

    if (error) {
      console.error('Erro ao buscar horas trabalhadas:', error);
      return [];
    }

    if (!dailySummaries || dailySummaries.length === 0) {
      return [];
    }

    // Agrupar por funcionário e somar horas
    const employeeHours: Record<
      string,
      { name: string; totalMinutes: number }
    > = {};

    dailySummaries.forEach(summary => {
      const employeeId = summary.employee_id;
      const minutes = summary.worked_minutes || 0;
      const employeeName = (summary.employees as any)?.full_name || 'Desconhecido';

      if (!employeeHours[employeeId]) {
        employeeHours[employeeId] = { name: employeeName, totalMinutes: 0 };
      }
      employeeHours[employeeId].totalMinutes += minutes;
    });

    // Converter para array e ordenar por horas (maior primeiro)
    const sortedEmployees = Object.values(employeeHours)
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, limit);

    // Calcular horas esperadas para o mês (176h = 44h semanais * 4 semanas)
    // Ajustar proporcionalmente ao dia atual do mês
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const currentDay = now.getDate();
    const expectedMonthlyHours = 176;
    const expectedHoursSoFar = Math.round(
      (expectedMonthlyHours * currentDay) / daysInMonth
    );

    // Converter para formato do gráfico
    const result: HoursWorkedData[] = sortedEmployees.map(emp => ({
      employee: emp.name.split(' ')[0], // Primeiro nome
      esperado: expectedHoursSoFar,
      trabalhado: Math.round(emp.totalMinutes / 60), // Converter minutos para horas
    }));

    return result;
  } catch (error) {
    console.error('Erro ao buscar top funcionários por horas:', error);
    return [];
  }
}

// ==========================================
// FUNÇÃO AUXILIAR PARA CARREGAR TODOS OS GRÁFICOS
// ==========================================

export interface DashboardChartsData {
  attendance: AttendanceData[];
  absenceTypes: AbsenceTypeData[];
  hoursWorked: HoursWorkedData[];
}

/**
 * Carrega dados de todos os gráficos de uma vez
 */
export async function getAllDashboardCharts(
  companyId: string
): Promise<DashboardChartsData> {
  try {
    const [attendance, absenceTypes, hoursWorked] = await Promise.all([
      getLast7DaysAttendance(companyId),
      getCurrentMonthAbsencesByType(companyId),
      getTopEmployeesHours(companyId),
    ]);

    return {
      attendance,
      absenceTypes,
      hoursWorked,
    };
  } catch (error) {
    console.error('Erro ao carregar dados dos gráficos:', error);
    return {
      attendance: [],
      absenceTypes: [],
      hoursWorked: [],
    };
  }
}
