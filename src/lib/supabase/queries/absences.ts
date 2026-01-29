/**
 * Queries para buscar ausências
 * Fase 3 - Integração Supabase
 */

import { createClient } from '@/lib/supabase/client';

export interface AbsentEmployee {
  id: string;
  name: string;
  photo_url?: string;
  initials: string;
  type: string;
  type_label: string;
  reason?: string;
}

interface AbsenceData {
  id: string;
  type: string;
  reason: string | null;
  employee_id: string;
  employees: {
    id: string;
    name: string;
    personal_email: string | null;
  };
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

/**
 * Busca funcionários ausentes hoje
 */
export async function getTodayAbsences(): Promise<AbsentEmployee[]> {
  const supabase = createClient();

  try {
    const today = new Date().toISOString().split('T')[0];

    // Buscar ausências aprovadas que incluem hoje
    const { data: absences, error } = await supabase
      .from('absences')
      .select(`
        id,
        type,
        reason,
        employee_id,
        employees!inner (
          id,
          name,
          personal_email
        )
      `)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today) as { data: any[] | null; error: any };

    if (error) {
      console.error('Erro ao buscar ausências:', error);
      return [];
    }

    if (!absences || absences.length === 0) {
      return [];
    }

    // Mapear ausências para o formato do widget
    const absentEmployees: AbsentEmployee[] = absences.map((absence: any) => {
      const employee = absence.employees;

      // Gerar iniciais
      const nameParts = employee.name.split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
        : nameParts[0][0];

      // Gerar avatar URL
      const seed = employee.name.replace(/\s+/g, '');
      const photo_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

      return {
        id: employee.id,
        name: employee.name,
        photo_url,
        initials: initials.toUpperCase(),
        type: absence.type,
        type_label: absenceTypeLabels[absence.type] || absence.type,
        reason: absence.reason,
      };
    });

    return absentEmployees;
  } catch (error) {
    console.error('Erro ao processar ausências:', error);
    return [];
  }
}

/**
 * Busca próximas ausências (próximos 7 dias)
 */
export async function getUpcomingAbsences(days: number = 7): Promise<AbsentEmployee[]> {
  const supabase = createClient();

  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Buscar ausências aprovadas futuras
    const { data: absences, error } = await supabase
      .from('absences')
      .select(`
        id,
        type,
        reason,
        start_date,
        employee_id,
        employees!inner (
          id,
          name,
          personal_email
        )
      `)
      .eq('status', 'approved')
      .gte('start_date', todayStr)
      .lte('start_date', futureDateStr)
      .order('start_date', { ascending: true }) as { data: any[] | null; error: any };

    if (error) {
      console.error('Erro ao buscar próximas ausências:', error);
      return [];
    }

    if (!absences || absences.length === 0) {
      return [];
    }

    // Mapear ausências
    const absentEmployees: AbsentEmployee[] = absences.map((absence: any) => {
      const employee = absence.employees;

      const nameParts = employee.name.split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
        : nameParts[0][0];

      const seed = employee.name.replace(/\s+/g, '');
      const photo_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

      return {
        id: employee.id,
        name: employee.name,
        photo_url,
        initials: initials.toUpperCase(),
        type: absence.type,
        type_label: absenceTypeLabels[absence.type] || absence.type,
        reason: absence.reason,
      };
    });

    return absentEmployees;
  } catch (error) {
    console.error('Erro ao processar próximas ausências:', error);
    return [];
  }
}

/**
 * Conta total de ausências no período
 */
export async function countAbsences(startDate: string, endDate: string): Promise<number> {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

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
