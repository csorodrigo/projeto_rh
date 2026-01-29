/**
 * Organogram Update API
 * POST: Update employee hierarchy (move employee to new manager)
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  employeeId: z.string().uuid(),
  newManagerId: z.string().uuid().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Check permissions (only admins and HR managers)
    if (!['super_admin', 'company_admin', 'hr_manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar hierarquia' },
        { status: 403 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validation = updateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error },
        { status: 400 }
      )
    }

    const { employeeId, newManagerId } = validation.data

    // Get all employees to validate the change
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, manager_id, name, position')
      .eq('company_id', profile.company_id)

    if (fetchError || !employees) {
      return NextResponse.json(
        { error: 'Erro ao buscar funcionários' },
        { status: 500 }
      )
    }

    // Validate employee exists
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }

    // Validate new manager exists (if provided)
    if (newManagerId) {
      const newManager = employees.find((e) => e.id === newManagerId)
      if (!newManager) {
        return NextResponse.json(
          { error: 'Novo gestor não encontrado' },
          { status: 404 }
        )
      }

      // Can't be your own manager
      if (employeeId === newManagerId) {
        return NextResponse.json(
          { error: 'Um funcionário não pode ser seu próprio gestor' },
          { status: 400 }
        )
      }

      // Check for cycles: new manager can't be a subordinate
      function isSubordinate(
        targetId: string,
        managerId: string,
        emps: typeof employees
      ): boolean {
        const directReports = emps.filter((e) => e.manager_id === targetId)

        if (directReports.some((r) => r.id === managerId)) {
          return true
        }

        return directReports.some((r) => isSubordinate(r.id, managerId, emps))
      }

      if (isSubordinate(employeeId, newManagerId, employees)) {
        return NextResponse.json(
          {
            error:
              'Esta mudança criaria um ciclo na hierarquia (o novo gestor é subordinado deste funcionário)',
          },
          { status: 400 }
        )
      }
    }

    // Update employee's manager
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        manager_id: newManagerId,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', employeeId)
      .eq('company_id', profile.company_id)

    if (updateError) {
      console.error('Error updating employee hierarchy:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar hierarquia' },
        { status: 500 }
      )
    }

    // TODO: Log the change in audit table

    return NextResponse.json({
      success: true,
      message: 'Hierarquia atualizada com sucesso',
      data: {
        employeeId,
        oldManagerId: employee.manager_id,
        newManagerId,
      },
    })
  } catch (error) {
    console.error('Error in organogram update API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
