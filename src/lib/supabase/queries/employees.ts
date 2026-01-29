/**
 * Queries para gerenciar funcionários
 * Fase 4 - MVP Core: CRUD de Funcionários
 */

import { createClient } from '@/lib/supabase/client';

export interface Employee {
  id: string;
  name: string;
  personal_email: string | null;
  cpf: string;
  birth_date: string;
  hire_date: string;
  position: string;
  department: string | null;
  base_salary: number | null;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  personal_phone: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface EmployeeListResult {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Lista funcionários com filtros e paginação
 */
export async function listEmployees(
  filters: EmployeeFilters = {}
): Promise<EmployeeListResult> {
  const supabase = createClient();

  const {
    search = '',
    department,
    status,
    page = 1,
    pageSize = 10,
  } = filters;

  try {
    // Base query
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    // Filtro de busca (nome ou email)
    if (search) {
      query = query.or(`name.ilike.%${search}%,personal_email.ilike.%${search}%`);
    }

    // Filtro de departamento
    if (department) {
      query = query.eq('department', department);
    }

    // Filtro de status
    if (status) {
      query = query.eq('status', status);
    }

    // Ordenação
    query = query.order('name', { ascending: true });

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Executar query
    const result = await query;
    const employees = result.data as Employee[] | null;
    const error = result.error;
    const count = result.count;

    if (error) {
      console.error('Erro ao listar funcionários:', error);
      return {
        employees: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      employees: employees || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return {
      employees: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Busca um funcionário por ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    const employee = result.data as Employee | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao buscar funcionário:', error);
      return null;
    }

    return employee;
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return null;
  }
}

/**
 * Cria um novo funcionário
 */
export async function createEmployee(
  data: Partial<Employee>
): Promise<{ employee: Employee | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .insert(data)
      .select()
      .single();

    const employee = result.data as Employee | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao criar funcionário:', error);
      return { employee: null, error: error.message };
    }

    return { employee, error: null };
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    return {
      employee: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Atualiza um funcionário existente
 */
export async function updateEmployee(
  id: string,
  data: Partial<Employee>
): Promise<{ employee: Employee | null; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    const employee = result.data as Employee | null;
    const error = result.error;

    if (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return { employee: null, error: error.message };
    }

    return { employee, error: null };
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    return {
      employee: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Deleta um funcionário (soft delete - muda status para 'terminated')
 */
export async function deleteEmployee(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .update({ status: 'terminated' })
      .eq('id', id);

    const error = result.error;

    if (error) {
      console.error('Erro ao deletar funcionário:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Lista departamentos únicos
 */
export async function listDepartments(): Promise<string[]> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .select('department')
      .not('department', 'is', null);

    const data = result.data as { department: string }[] | null;

    if (!data) {
      return [];
    }

    // Extrair departamentos únicos
    const departments = [...new Set(data.map((item) => item.department))].filter(
      (dept) => dept !== null
    ) as string[];

    return departments.sort();
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    return [];
  }
}

/**
 * Conta funcionários por status
 */
export async function countEmployeesByStatus(): Promise<
  Record<string, number>
> {
  const supabase = createClient();

  try {
    const result = await supabase
      .from('employees')
      .select('status');

    const data = result.data as { status: string }[] | null;

    if (!data) {
      return {};
    }

    // Contar por status
    const counts: Record<string, number> = {};
    data.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Erro ao contar funcionários por status:', error);
    return {};
  }
}
