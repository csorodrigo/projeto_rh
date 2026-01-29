/**
 * Queries para buscar aniversariantes
 * Fase 3 - Integração Supabase
 */

import { createClient } from '@/lib/supabase/client';

export interface Birthday {
  id: string;
  name: string;
  photo_url?: string;
  initials: string;
  age: number;
  date: string;
  birth_date: string;
}

interface EmployeeData {
  id: string;
  name: string;
  birth_date: string | null;
  personal_email: string | null;
}

/**
 * Busca aniversariantes da semana atual
 * Considera domingo como início da semana
 */
export async function getWeeklyBirthdays(): Promise<Birthday[]> {
  const supabase = createClient();

  try {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Dom) a 6 (Sáb)

    // Calcular início da semana (domingo)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calcular fim da semana (sábado)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Buscar funcionários ativos
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, birth_date, personal_email')
      .eq('status', 'active')
      .not('birth_date', 'is', null) as { data: EmployeeData[] | null; error: any };

    if (error) {
      console.error('Erro ao buscar aniversariantes:', error);
      return [];
    }

    if (!employees || employees.length === 0) {
      return [];
    }

    // Filtrar aniversariantes da semana
    const birthdays: Birthday[] = employees
      .filter((employee) => {
        if (!employee.birth_date) return false;

        const birthDate = new Date(employee.birth_date + 'T00:00:00');
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        // Verificar se o aniversário cai dentro da semana
        for (let day = 0; day <= 6; day++) {
          const checkDate = new Date(startOfWeek);
          checkDate.setDate(startOfWeek.getDate() + day);

          if (
            checkDate.getMonth() === birthMonth &&
            checkDate.getDate() === birthDay
          ) {
            return true;
          }
        }

        return false;
      })
      .map((employee) => {
        const birthDate = new Date(employee.birth_date + 'T00:00:00');
        const age = today.getFullYear() - birthDate.getFullYear();

        // Formatar data do aniversário
        const birthdayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const dateStr = birthdayThisYear.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        });

        // Gerar iniciais
        const nameParts = employee.name.split(' ');
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
          : nameParts[0][0];

        // Gerar avatar URL usando DiceBear
        const seed = employee.name.replace(/\s+/g, '');
        const photo_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

        return {
          id: employee.id,
          name: employee.name,
          photo_url,
          initials: initials.toUpperCase(),
          age,
          date: dateStr,
          birth_date: employee.birth_date,
        };
      })
      .sort((a, b) => {
        // Ordenar por data de aniversário (mais próximo primeiro)
        const dateA = new Date(a.birth_date + 'T00:00:00');
        const dateB = new Date(b.birth_date + 'T00:00:00');
        return dateA.getDate() - dateB.getDate();
      });

    return birthdays;
  } catch (error) {
    console.error('Erro ao processar aniversariantes:', error);
    return [];
  }
}

/**
 * Busca aniversários do dia
 */
export async function getTodayBirthdays(): Promise<Birthday[]> {
  const supabase = createClient();

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();

    // Buscar funcionários que fazem aniversário hoje
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, birth_date, personal_email')
      .eq('status', 'active')
      .not('birth_date', 'is', null) as { data: EmployeeData[] | null; error: any };

    if (error) {
      console.error('Erro ao buscar aniversariantes do dia:', error);
      return [];
    }

    if (!employees || employees.length === 0) {
      return [];
    }

    // Filtrar aniversariantes de hoje
    const birthdays: Birthday[] = employees
      .filter((employee) => {
        if (!employee.birth_date) return false;

        const birthDate = new Date(employee.birth_date + 'T00:00:00');
        return (
          birthDate.getMonth() === currentMonth - 1 &&
          birthDate.getDate() === currentDay
        );
      })
      .map((employee) => {
        const birthDate = new Date(employee.birth_date + 'T00:00:00');
        const age = today.getFullYear() - birthDate.getFullYear();

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
          age,
          date: 'Hoje',
          birth_date: employee.birth_date,
        };
      });

    return birthdays;
  } catch (error) {
    console.error('Erro ao processar aniversariantes do dia:', error);
    return [];
  }
}
