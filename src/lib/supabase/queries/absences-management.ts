/**
 * Queries para gerenciamento de ausências/férias
 * Task #20 - Implementar solicitação de ausências
 *
 * Funções para criar, gerenciar e calcular ausências e férias
 */

import { createClient } from '@/lib/supabase/client';
import type { AbsenceType, AbsenceStatus } from '@/types/database';
import { QueryResult, QueryError } from '@/lib/supabase/queries';
import { WorkflowEngine } from '@/lib/workflows/engine';

export interface CreateAbsenceRequest {
  company_id: string;
  employee_id: string;
  type: AbsenceType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason?: string;
  notes?: string;
  document_url?: string;
  document_type?: string;
  cid_code?: string;
  issuing_doctor?: string;
  crm?: string;
  vacation_balance_id?: string;
  is_vacation_split?: boolean;
  split_number?: number;
  is_vacation_sold?: boolean;
  sold_days?: number;
}

export interface MyAbsence {
  id: string;
  type: AbsenceType;
  type_label: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: AbsenceStatus;
  status_label: string;
  reason: string | null;
  notes: string | null;
  requested_at: string | null;
  created_at: string;
}

export interface VacationBalanceInfo {
  id: string;
  period_start: string;
  period_end: string;
  accrued_days: number;
  used_days: number;
  sold_days: number;
  available_days: number;
  expires_at: string | null;
  is_expired: boolean;
  status: 'active' | 'used' | 'expired';
}

// Mapeamento de tipos de ausência para labels
const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
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

// Mapeamento de status para labels
const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
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
export function getAbsenceTypeLabel(type: AbsenceType): string {
  return ABSENCE_TYPE_LABELS[type] || type;
}

/**
 * Retorna o label de um status de ausência
 */
export function getAbsenceStatusLabel(status: AbsenceStatus): string {
  return ABSENCE_STATUS_LABELS[status] || status;
}

/**
 * Cria uma nova solicitação de ausência
 */
export async function createAbsenceRequest(
  data: CreateAbsenceRequest
): Promise<QueryResult<{ id: string }>> {
  const supabase = createClient();

  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: { message: 'Usuário não autenticado' },
      };
    }

    // Calcular total de dias
    const totalDays = countBusinessDays(
      new Date(data.start_date),
      new Date(data.end_date)
    );

    // Criar ausência com status pending
    const { data: absence, error } = await supabase
      .from('absences')
      .insert({
        company_id: data.company_id,
        employee_id: data.employee_id,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
        notes: data.notes || null,
        document_url: data.document_url || null,
        document_type: data.document_type || null,
        cid_code: data.cid_code || null,
        issuing_doctor: data.issuing_doctor || null,
        crm: data.crm || null,
        vacation_balance_id: data.vacation_balance_id || null,
        is_vacation_split: data.is_vacation_split || false,
        split_number: data.split_number || null,
        is_vacation_sold: data.is_vacation_sold || false,
        sold_days: data.sold_days || 0,
        status: 'pending',
        requested_at: new Date().toISOString(),
        requested_by: user.id,
        affects_salary: false,
        salary_deduction_days: 0,
        auto_justify_time_records: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar ausência:', error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    // Criar workflow de aprovação
    try {
      const workflowEngine = new WorkflowEngine(data.company_id);
      await workflowEngine.createWorkflowInstance('absence', {
        entityType: 'absence',
        entityId: absence.id,
        requesterId: user.id,
        metadata: {
          days: totalDays,
          type: data.type,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason || '',
        },
      });
    } catch (workflowError) {
      console.error('Erro ao criar workflow:', workflowError);
      // Não falhar a criação da ausência se o workflow falhar
    }

    return {
      data: absence,
      error: null,
    };
  } catch (error) {
    console.error('Erro ao criar ausência:', error);
    return {
      data: null,
      error: { message: 'Erro ao criar ausência' },
    };
  }
}

/**
 * Busca ausências do funcionário logado
 */
export async function getMyAbsences(
  employeeId: string,
  statusFilter?: AbsenceStatus | AbsenceStatus[]
): Promise<QueryResult<MyAbsence[]>> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    // Aplicar filtro de status se fornecido
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        query = query.in('status', statusFilter);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    const { data: absences, error } = await query;

    if (error) {
      console.error('Erro ao buscar minhas ausências:', error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    // Mapear para formato com labels
    const mapped: MyAbsence[] = (absences || []).map((absence: any) => ({
      id: absence.id,
      type: absence.type,
      type_label: getAbsenceTypeLabel(absence.type),
      start_date: absence.start_date,
      end_date: absence.end_date,
      total_days: absence.total_days || 0,
      status: absence.status,
      status_label: getAbsenceStatusLabel(absence.status),
      reason: absence.reason,
      notes: absence.notes,
      requested_at: absence.requested_at,
      created_at: absence.created_at,
    }));

    return {
      data: mapped,
      error: null,
    };
  } catch (error) {
    console.error('Erro ao buscar minhas ausências:', error);
    return {
      data: null,
      error: { message: 'Erro ao buscar ausências' },
    };
  }
}

/**
 * Calcula o saldo de férias de um funcionário
 */
export async function calculateVacationBalance(
  employeeId: string
): Promise<QueryResult<VacationBalanceInfo[]>> {
  const supabase = createClient();

  try {
    const { data: balances, error } = await supabase
      .from('vacation_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .order('period_start', { ascending: false });

    if (error) {
      console.error('Erro ao buscar saldo de férias:', error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      data: balances || [],
      error: null,
    };
  } catch (error) {
    console.error('Erro ao calcular saldo de férias:', error);
    return {
      data: null,
      error: { message: 'Erro ao calcular saldo de férias' },
    };
  }
}

/**
 * Conta dias úteis entre duas datas (exclui sábados e domingos)
 * Não considera feriados (pode ser expandido no futuro)
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  if (startDate > endDate) {
    return 0;
  }

  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Verifica se há ausências aprovadas que sobrepõem o período
 */
export async function checkAbsenceOverlap(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeAbsenceId?: string
): Promise<QueryResult<boolean>> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('absences')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .limit(1);

    // Excluir a ausência atual se estiver editando
    if (excludeAbsenceId) {
      query = query.neq('id', excludeAbsenceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar sobreposição:', error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    // Retorna true se encontrou sobreposição
    return {
      data: (data && data.length > 0) || false,
      error: null,
    };
  } catch (error) {
    console.error('Erro ao verificar sobreposição:', error);
    return {
      data: null,
      error: { message: 'Erro ao verificar sobreposição' },
    };
  }
}

/**
 * Cancela uma ausência (apenas se pending)
 */
export async function cancelMyAbsence(
  absenceId: string,
  cancellationReason?: string
): Promise<QueryResult<{ id: string }>> {
  const supabase = createClient();

  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: { message: 'Usuário não autenticado' },
      };
    }

    // Verificar se está pending
    const { data: absence, error: fetchError } = await supabase
      .from('absences')
      .select('status')
      .eq('id', absenceId)
      .single();

    if (fetchError) {
      return {
        data: null,
        error: { message: fetchError.message, code: fetchError.code },
      };
    }

    if (absence.status !== 'pending') {
      return {
        data: null,
        error: { message: 'Apenas ausências pendentes podem ser canceladas' },
      };
    }

    // Atualizar para cancelled
    const { data: updated, error } = await supabase
      .from('absences')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: cancellationReason || 'Cancelado pelo usuário',
      })
      .eq('id', absenceId)
      .select('id')
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    return {
      data: updated,
      error: null,
    };
  } catch (error) {
    console.error('Erro ao cancelar ausência:', error);
    return {
      data: null,
      error: { message: 'Erro ao cancelar ausência' },
    };
  }
}

/**
 * Busca detalhes de uma ausência específica
 */
export async function getAbsenceDetails(
  absenceId: string
): Promise<QueryResult<MyAbsence>> {
  const supabase = createClient();

  try {
    const { data: absence, error } = await supabase
      .from('absences')
      .select('*')
      .eq('id', absenceId)
      .single();

    if (error) {
      console.error('Erro ao buscar detalhes da ausência:', error);
      return {
        data: null,
        error: { message: error.message, code: error.code },
      };
    }

    const mapped: MyAbsence = {
      id: absence.id,
      type: absence.type,
      type_label: getAbsenceTypeLabel(absence.type),
      start_date: absence.start_date,
      end_date: absence.end_date,
      total_days: absence.total_days || 0,
      status: absence.status,
      status_label: getAbsenceStatusLabel(absence.status),
      reason: absence.reason,
      notes: absence.notes,
      requested_at: absence.requested_at,
      created_at: absence.created_at,
    };

    return {
      data: mapped,
      error: null,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes da ausência:', error);
    return {
      data: null,
      error: { message: 'Erro ao buscar detalhes da ausência' },
    };
  }
}
