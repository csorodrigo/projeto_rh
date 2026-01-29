/**
 * Queries para estatísticas do dashboard
 * Fase 3 - Integração Supabase
 */

import { createClient } from '@/lib/supabase/client';

export interface DashboardStatsData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  birthdaysThisWeek: number;
  expiringASOs: number;
  overtimeHours: number;
  attendanceRate: number;
}

interface EmployeeBasicData {
  birth_date: string | null;
}

/**
 * Busca estatísticas gerais do dashboard
 */
export async function getRealDashboardStats(): Promise<DashboardStatsData> {
  const supabase = createClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total de funcionários ativos
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 2. Ausentes hoje (aprovadas e em andamento)
    const { count: absentToday } = await supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'in_progress'])
      .lte('start_date', today)
      .gte('end_date', today);

    // 3. Presentes hoje (funcionários - ausentes)
    const presentToday = (totalEmployees || 0) - (absentToday || 0);

    // 4. Taxa de presença
    const attendanceRate = totalEmployees && totalEmployees > 0
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;

    // 5. Aniversariantes da semana
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay();
    const startOfWeek = new Date(todayDate);
    startOfWeek.setDate(todayDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Buscar todos os funcionários ativos
    const result = await supabase
      .from('employees')
      .select('birth_date')
      .eq('status', 'active')
      .not('birth_date', 'is', null);

    const employees = result.data as EmployeeBasicData[] | null;

    // Contar aniversariantes da semana
    let birthdaysThisWeek = 0;
    if (employees) {
      for (const employee of employees) {
        if (!employee.birth_date) continue;

        const birthDate = new Date(employee.birth_date + 'T00:00:00');
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        // Verificar se cai na semana
        for (let day = 0; day <= 6; day++) {
          const checkDate = new Date(startOfWeek);
          checkDate.setDate(startOfWeek.getDate() + day);

          if (
            checkDate.getMonth() === birthMonth &&
            checkDate.getDate() === birthDay
          ) {
            birthdaysThisWeek++;
            break;
          }
        }
      }
    }

    // 6. ASOs vencendo (próximos 30 dias)
    // TODO: Implementar quando tivermos tabela de health_records
    const expiringASOs = 0;

    // 7. Horas extras
    // TODO: Implementar quando tivermos cálculo de horas
    const overtimeHours = 0;

    return {
      totalEmployees: totalEmployees || 0,
      presentToday,
      absentToday: absentToday || 0,
      birthdaysThisWeek,
      expiringASOs,
      overtimeHours,
      attendanceRate,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);

    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      birthdaysThisWeek: 0,
      expiringASOs: 0,
      overtimeHours: 0,
      attendanceRate: 0,
    };
  }
}

/**
 * Busca contagem simples de funcionários ativos
 */
export async function countActiveEmployees(): Promise<number> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) {
      console.error('Erro ao contar funcionários:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar funcionários:', error);
    return 0;
  }
}

/**
 * Busca contagem de ausências hoje
 */
export async function countTodayAbsences(): Promise<number> {
  const supabase = createClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'in_progress'])
      .lte('start_date', today)
      .gte('end_date', today);

    if (error) {
      console.error('Erro ao contar ausências:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar ausências:', error);
    return 0;
  }
}
