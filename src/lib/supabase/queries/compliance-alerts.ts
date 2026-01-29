/**
 * Queries para alertas de compliance trabalhista
 * Fase 2 - Widgets e Relatórios
 */

import { createClient } from '@/lib/supabase/client';

export interface ComplianceAlert {
  id: string;
  type: 'missing_records' | 'overtime_violation' | 'rest_violation' | 'missing_pis' | 'duplicate_records';
  severity: 'warning' | 'error';
  title: string;
  description: string;
  count: number;
  affectedEmployees?: string[];
  actionLink?: string;
}

/**
 * Busca todos os alertas de compliance para a empresa
 */
export async function getComplianceAlerts(companyId: string): Promise<ComplianceAlert[]> {
  const alerts: ComplianceAlert[] = [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // 1. Funcionários sem PIS (crítico - impede geração de AFD/AEJ)
    const missingPisAlert = await checkMissingPis(companyId);
    if (missingPisAlert) {
      alerts.push(missingPisAlert);
    }

    // 2. Registros faltantes hoje
    const missingRecordsAlert = await checkMissingRecordsToday(companyId, today);
    if (missingRecordsAlert) {
      alerts.push(missingRecordsAlert);
    }

    // 3. Violações de jornada (> 10h/dia) nos últimos 7 dias
    const overtimeAlert = await checkOvertimeViolations(companyId, sevenDaysAgoStr, today);
    if (overtimeAlert) {
      alerts.push(overtimeAlert);
    }

    // 4. Interjornada não respeitada (< 11h) nos últimos 7 dias
    const restViolationAlert = await checkRestViolations(companyId, sevenDaysAgoStr, today);
    if (restViolationAlert) {
      alerts.push(restViolationAlert);
    }

    // 5. Marcações duplicadas
    const duplicateRecordsAlert = await checkDuplicateRecords(companyId, today);
    if (duplicateRecordsAlert) {
      alerts.push(duplicateRecordsAlert);
    }

    return alerts;
  } catch (error) {
    console.error('Erro ao buscar alertas de compliance:', error);
    return [];
  }
}

/**
 * Verifica funcionários sem PIS cadastrado
 */
async function checkMissingPis(companyId: string): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .select('id, name, pis')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .or('pis.is.null,pis.eq.');

  if (error || !data || data.length === 0) {
    return null;
  }

  return {
    id: 'missing_pis',
    type: 'missing_pis',
    severity: 'error',
    title: 'Funcionários sem PIS',
    description: 'Cadastro de PIS é obrigatório para geração de AFD e AEJ',
    count: data.length,
    affectedEmployees: data.map(e => e.name),
    actionLink: '/funcionarios',
  };
}

/**
 * Verifica funcionários sem registro de ponto hoje
 */
async function checkMissingRecordsToday(
  companyId: string,
  today: string
): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  // Buscar funcionários ativos
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (employeesError || !employees) {
    return null;
  }

  // Buscar ausências aprovadas de hoje
  const { data: absences } = await supabase
    .from('absences')
    .select('employee_id')
    .eq('company_id', companyId)
    .in('status', ['approved', 'in_progress'])
    .lte('start_date', today)
    .gte('end_date', today);

  const absentEmployeeIds = new Set(absences?.map(a => a.employee_id) || []);

  // Buscar registros de ponto de hoje
  const { data: records } = await supabase
    .from('time_records')
    .select('employee_id')
    .eq('company_id', companyId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lte('recorded_at', `${today}T23:59:59`);

  const employeesWithRecords = new Set(records?.map(r => r.employee_id) || []);

  // Filtrar funcionários sem registro e não ausentes
  const missingRecords = employees.filter(
    e => !employeesWithRecords.has(e.id) && !absentEmployeeIds.has(e.id)
  );

  if (missingRecords.length === 0) {
    return null;
  }

  return {
    id: 'missing_records',
    type: 'missing_records',
    severity: 'warning',
    title: 'Registros faltantes hoje',
    description: 'Funcionários sem marcação de entrada/saída',
    count: missingRecords.length,
    affectedEmployees: missingRecords.map(e => e.name),
    actionLink: '/ponto',
  };
}

/**
 * Verifica violações de jornada (> 10h trabalhadas/dia)
 */
async function checkOvertimeViolations(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_tracking_daily')
    .select(`
      id,
      employee_id,
      date,
      worked_minutes,
      employees!inner(name)
    `)
    .eq('company_id', companyId)
    .gte('date', startDate)
    .lte('date', endDate)
    .gt('worked_minutes', 600); // > 10 horas (600 minutos)

  if (error || !data || data.length === 0) {
    return null;
  }

  // Agrupar por funcionário para contar ocorrências únicas
  const violationsByEmployee = new Map<string, { name: string; count: number }>();

  for (const record of data) {
    const employeeName = (record.employees as unknown as { name: string }).name;
    const existing = violationsByEmployee.get(record.employee_id);

    if (existing) {
      existing.count++;
    } else {
      violationsByEmployee.set(record.employee_id, {
        name: employeeName,
        count: 1,
      });
    }
  }

  const affectedEmployees = Array.from(violationsByEmployee.values())
    .map(e => `${e.name} (${e.count}x)`);

  return {
    id: 'overtime_violation',
    type: 'overtime_violation',
    severity: 'error',
    title: 'Violações de jornada',
    description: 'Funcionários com mais de 10h trabalhadas/dia',
    count: data.length,
    affectedEmployees,
    actionLink: '/relatorios/compliance',
  };
}

/**
 * Verifica violações de interjornada (< 11h de descanso)
 */
async function checkRestViolations(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  // Buscar resumos diários ordenados por funcionário e data
  const { data, error } = await supabase
    .from('time_tracking_daily')
    .select(`
      id,
      employee_id,
      date,
      clock_out,
      employees!inner(name)
    `)
    .eq('company_id', companyId)
    .gte('date', startDate)
    .lte('date', endDate)
    .not('clock_out', 'is', null)
    .order('employee_id')
    .order('date');

  if (error || !data || data.length === 0) {
    return null;
  }

  const violations: Array<{ employeeId: string; employeeName: string }> = [];
  const violationsByEmployee = new Map<string, number>();

  // Verificar interjornada entre dias consecutivos
  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];

    // Só comparar se for o mesmo funcionário
    if (current.employee_id !== next.employee_id) {
      continue;
    }

    // Verificar se as datas são consecutivas
    const currentDate = new Date(current.date);
    const nextDate = new Date(next.date);
    const dayDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff !== 1) {
      continue;
    }

    // Buscar clock_in do próximo dia
    const { data: nextDayRecords } = await supabase
      .from('time_tracking_daily')
      .select('clock_in')
      .eq('employee_id', next.employee_id)
      .eq('date', next.date)
      .single();

    if (!nextDayRecords?.clock_in || !current.clock_out) {
      continue;
    }

    // Calcular horas de descanso
    const clockOut = new Date(current.clock_out);
    const clockIn = new Date(nextDayRecords.clock_in);
    const restHours = (clockIn.getTime() - clockOut.getTime()) / (1000 * 60 * 60);

    // Violação: menos de 11 horas de descanso
    if (restHours < 11) {
      const employeeName = (current.employees as unknown as { name: string }).name;
      violations.push({
        employeeId: current.employee_id,
        employeeName,
      });

      const count = violationsByEmployee.get(current.employee_id) || 0;
      violationsByEmployee.set(current.employee_id, count + 1);
    }
  }

  if (violations.length === 0) {
    return null;
  }

  const affectedEmployees = Array.from(violationsByEmployee.entries())
    .map(([_, count]) => {
      const violation = violations.find(v => v.employeeId === _);
      return `${violation?.employeeName || 'Desconhecido'} (${count}x)`;
    });

  return {
    id: 'rest_violation',
    type: 'rest_violation',
    severity: 'error',
    title: 'Interjornada não respeitada',
    description: 'Menos de 11h de descanso entre jornadas',
    count: violations.length,
    affectedEmployees,
    actionLink: '/relatorios/compliance',
  };
}

/**
 * Verifica marcações duplicadas (mesma marcação 2x)
 */
async function checkDuplicateRecords(
  companyId: string,
  today: string
): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  // Buscar registros de hoje
  const { data: records, error } = await supabase
    .from('time_records')
    .select(`
      id,
      employee_id,
      record_type,
      recorded_at,
      employees!inner(name)
    `)
    .eq('company_id', companyId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lte('recorded_at', `${today}T23:59:59`)
    .order('employee_id')
    .order('recorded_at');

  if (error || !records || records.length === 0) {
    return null;
  }

  const duplicates: Array<{
    employeeId: string;
    employeeName: string;
    type: string;
    time: string;
  }> = [];

  // Verificar registros duplicados (mesmo tipo em intervalo de 5 minutos)
  for (let i = 0; i < records.length - 1; i++) {
    const current = records[i];
    const next = records[i + 1];

    if (
      current.employee_id === next.employee_id &&
      current.record_type === next.record_type
    ) {
      const currentTime = new Date(current.recorded_at);
      const nextTime = new Date(next.recorded_at);
      const diffMinutes = (nextTime.getTime() - currentTime.getTime()) / (1000 * 60);

      // Se for em menos de 5 minutos, é provavelmente duplicado
      if (diffMinutes < 5) {
        const employeeName = (current.employees as unknown as { name: string }).name;
        duplicates.push({
          employeeId: current.employee_id,
          employeeName,
          type: current.record_type,
          time: currentTime.toLocaleTimeString('pt-BR'),
        });
      }
    }
  }

  if (duplicates.length === 0) {
    return null;
  }

  const affectedEmployees = Array.from(
    new Set(duplicates.map(d => d.employeeName))
  );

  return {
    id: 'duplicate_records',
    type: 'duplicate_records',
    severity: 'warning',
    title: 'Marcações duplicadas',
    description: 'Mesma marcação registrada mais de uma vez',
    count: duplicates.length,
    affectedEmployees,
    actionLink: '/ponto',
  };
}
