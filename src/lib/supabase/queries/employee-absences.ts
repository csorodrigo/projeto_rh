/**
 * Queries para buscar ausências de funcionários específicos
 * Fase 4 - MVP Core: Employee Absences
 */

import { createClient } from '@/lib/supabase/client';

export interface EmployeeAbsence {
  id: string;
  employee_id: string;
  type: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_progress' | 'completed';
  reason: string | null;
  days_count: number;
  created_at: string;
}

const absenceTypeLabels: Record<string, string> = {
  vacation: 'Férias',
  vacation_advance: 'Férias Antecipadas',
  vacation_sold: 'Abono Pecuniário',
  sick_leave: 'Licença Médica',
  maternity_leave: 'Licença Maternidade',
  paternity_leave: 'Licença Paternidade',
  adoption_leave: 'Licença Adoção',
  bereavement: 'Licença Nojo',
  marriage_leave: 'Licença Casamento',
  jury_duty: 'Serviço do Júri',
  military_service: 'Serviço Militar',
  election_duty: 'Mesário',
  blood_donation: 'Doação de Sangue',
  union_leave: 'Licença Sindical',
  medical_appointment: 'Consulta Médica',
  prenatal: 'Pré-natal',
  child_sick: 'Filho Doente',
  legal_obligation: 'Obrigação Legal',
  study_leave: 'Licença para Estudos',
  unjustified: 'Falta Injustificada',
  time_bank: 'Banco de Horas',
  compensatory: 'Folga Compensatória',
  other: 'Outros',
};

const absenceStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

/**
 * Retorna o label de um tipo de ausência
 */
export function getAbsenceTypeLabel(type: string): string {
  return absenceTypeLabels[type] || type;
}

/**
 * Retorna o label de um status de ausência
 */
export function getAbsenceStatusLabel(status: string): string {
  return absenceStatusLabels[status] || status;
}

/**
 * Busca ausências de um funcionário
 */
export async function getEmployeeAbsences(
  employeeId: string,
  limit?: number
): Promise<EmployeeAbsence[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const result = await query;

    const absences = result.data as EmployeeAbsence[] | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar ausências do funcionário:', error);
      return [];
    }

    return absences || [];
  } catch (error) {
    console.error('Erro ao buscar ausências do funcionário:', error);
    return [];
  }
}

/**
 * Busca ausências de um funcionário por status
 */
export async function getEmployeeAbsencesByStatus(
  employeeId: string,
  status: string,
  limit?: number
): Promise<EmployeeAbsence[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', status)
      .order('start_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const result = await query;

    const absences = result.data as EmployeeAbsence[] | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar ausências do funcionário por status:', error);
      return [];
    }

    return absences || [];
  } catch (error) {
    console.error('Erro ao buscar ausências do funcionário por status:', error);
    return [];
  }
}

/**
 * Conta total de ausências de um funcionário
 */
export async function countEmployeeAbsences(
  employeeId: string
): Promise<number> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Erro ao contar ausências do funcionário:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erro ao contar ausências do funcionário:', error);
    return 0;
  }
}

/**
 * Busca ausências de um funcionário em um período
 */
export async function getEmployeeAbsencesInPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<EmployeeAbsence[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .order('start_date', { ascending: false });

    const absences = result.data as EmployeeAbsence[] | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar ausências do funcionário em período:', error);
      return [];
    }

    return absences || [];
  } catch (error) {
    console.error('Erro ao buscar ausências do funcionário em período:', error);
    return [];
  }
}
