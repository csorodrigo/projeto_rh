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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get user's profile to find company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Fetch all active employees with minimal fields for org chart
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
      .eq('status', 'active')
      .order('name')

    if (error) {
      console.error('Error fetching employees:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar funcionários' },
        { status: 500 }
      )
    }

    // TODO: Check for absences today
    // For now, returning all as not absent
    const employeesWithAbsence = employees?.map((emp) => ({
      ...emp,
      isAbsent: false,
    }))

    return NextResponse.json({
      employees: employeesWithAbsence || [],
      count: employees?.length || 0,
    })
  } catch (error) {
    console.error('Error in organogram hierarchy API:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
