/**
 * Queries para registros de ponto
 * Fase 4 - MVP Core: Time Records
 */

import { createClient } from '@/lib/supabase/client';

export interface TimeRecord {
  id: string;
  employee_id: string;
  record_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  recorded_at: string;
  location_address: string | null;
  source: string;
  notes: string | null;
  created_at: string;
}

/**
 * Busca registros de ponto de um funcionário
 */
export async function getEmployeeTimeRecords(
  employeeId: string,
  limit: number = 10
): Promise<TimeRecord[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    const records = result.data as TimeRecord[] | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar registros de ponto:', error);
      return [];
    }

    return records || [];
  } catch (error) {
    console.error('Erro ao buscar registros de ponto:', error);
    return [];
  }
}

/**
 * Busca registros de ponto de um funcionário em um período
 */
export async function getEmployeeTimeRecordsInPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimeRecord[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: false });

    const records = result.data as TimeRecord[] | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar registros de ponto:', error);
      return [];
    }

    return records || [];
  } catch (error) {
    console.error('Erro ao buscar registros de ponto:', error);
    return [];
  }
}

/**
 * Conta total de registros de ponto de um funcionário
 */
export async function countEmployeeTimeRecords(
  employeeId: string
): Promise<number> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from('time_records')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Erro ao contar registros de ponto:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar registros de ponto:', error);
    return 0;
  }
}
