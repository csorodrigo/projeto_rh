/**
 * Organogram Hierarchy API
 * GET: Retrieve organizational hierarchy
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Organogram API] Auth error:', {
        message: authError?.message,
        code: authError?.code,
      })
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get user's profile to find company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Organogram API] Profile error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
      })
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    if (!profile?.company_id) {
      console.error('[Organogram API] No company_id found for user:', user.id)
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Fetch employees - filter by active/on_leave status (not terminated/inactive)
    // Using 'in' filter to be more flexible and avoid errors if status column has different values
    const { data: employees, error } = await supabase
      .from('employees')
      .select(
        `
        id,
        name,
        position,
        department,
        photo_url,
        manager_id,
        email,
        phone,
        hire_date,
        employee_number,
        status
      `
      )
      .eq('company_id', profile.company_id)
      .in('status', ['active', 'on_leave'])
      .order('name')

    if (error) {
      console.error('[Organogram API] Error fetching employees:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // Try fetching without status filter as fallback
      console.log('[Organogram API] Trying fallback query without status filter...')
      const { data: fallbackEmployees, error: fallbackError } = await supabase
        .from('employees')
        .select(
          `
          id,
          name,
          position,
          department,
          photo_url,
          manager_id,
          email,
          phone,
          hire_date,
          employee_number,
          status
        `
        )
        .eq('company_id', profile.company_id)
        .order('name')

      if (fallbackError) {
        console.error('[Organogram API] Fallback query also failed:', {
          message: fallbackError.message,
          code: fallbackError.code,
          details: fallbackError.details,
          hint: fallbackError.hint,
        })
        return NextResponse.json(
          {
            error: 'Erro ao buscar funcionários',
            details: fallbackError.message,
          },
          { status: 500 }
        )
      }

      // Filter out terminated employees in JavaScript if status column exists
      const activeEmployees = fallbackEmployees?.filter(
        (emp) => !emp.status || !['terminated', 'inactive'].includes(emp.status)
      ) || []

      const employeesWithAbsence = activeEmployees.map((emp) => ({
        ...emp,
        isAbsent: false,
      }))

      return NextResponse.json({
        employees: employeesWithAbsence,
        count: activeEmployees.length,
      })
    }

    // TODO: Check for absences today
    // For now, returning all as not absent
    const employeesWithAbsence = employees?.map((emp) => ({
      ...emp,
      isAbsent: false,
    })) || []

    return NextResponse.json({
      employees: employeesWithAbsence,
      count: employees?.length || 0,
    })
  } catch (error) {
    console.error('[Organogram API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
