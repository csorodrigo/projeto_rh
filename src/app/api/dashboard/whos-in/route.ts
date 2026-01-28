/**
 * Who's In Dashboard Widget API Route
 * GET: Fetch presence status of all employees for dashboard widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ClockType, PresenceStatus } from '@/types/database';

/**
 * GET /api/dashboard/whos-in
 * Get presence status for all active employees in the company
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get user's profile to determine company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single<{ id: string; company_id: string | null; role: string }>();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: 'Perfil nao encontrado', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department');
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Define types for query results
    type EmployeeResult = {
      id: string;
      name: string;
      full_name: string | null;
      department: string | null;
      photo_url: string | null;
      position: string | null;
    };

    // Build employees query with conditional department filter
    let employeesQueryBuilder = supabase
      .from('employees')
      .select('id, name, full_name, department, photo_url, position')
      .eq('company_id', profile.company_id)
      .eq('status', 'active');

    if (department) {
      employeesQueryBuilder = employeesQueryBuilder.eq('department', department);
    }

    const { data: employeesData, error: empError } = await employeesQueryBuilder.order('full_name', { ascending: true });
    const employees = employeesData as EmployeeResult[] | null;

    if (empError) {
      console.error('Error fetching employees:', empError);
      return NextResponse.json(
        { error: 'Erro ao buscar funcionarios', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          employees: [],
          summary: {
            total: 0,
            working: 0,
            on_break: 0,
            absent: 0,
            remote: 0,
          },
          last_updated: new Date().toISOString(),
        },
      });
    }

    // Define type for time records query result
    type TimeRecordResult = {
      employee_id: string;
      record_type: string;
      recorded_at: string;
      location_address: string | null;
    };

    // Get today's time records for all employees in the company
    const { data: recordsData, error: recError } = await supabase
      .from('time_records')
      .select('employee_id, record_type, recorded_at, location_address')
      .eq('company_id', profile.company_id)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: false });
    const records = recordsData as TimeRecordResult[] | null;

    if (recError) {
      console.error('Error fetching time records:', recError);
      return NextResponse.json(
        { error: 'Erro ao buscar registros de ponto', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    // Map records by employee - get most recent record and first clock_in
    const recordsByEmployee = new Map<string, {
      lastType: ClockType;
      lastTime: string;
      clockInTime: string | null;
      isRemote: boolean;
    }>();

    // Process records (already sorted by recorded_at desc)
    for (const record of records || []) {
      const employeeId = record.employee_id;
      const existingData = recordsByEmployee.get(employeeId);

      if (!existingData) {
        // First record we see is the most recent
        recordsByEmployee.set(employeeId, {
          lastType: record.record_type as ClockType,
          lastTime: record.recorded_at,
          clockInTime: record.record_type === 'clock_in' ? record.recorded_at : null,
          isRemote: record.location_address?.toLowerCase().includes('remoto') || false,
        });
      } else if (record.record_type === 'clock_in' && !existingData.clockInTime) {
        // Track first clock_in of the day
        existingData.clockInTime = record.recorded_at;
        recordsByEmployee.set(employeeId, existingData);
      }
    }

    // Build presence status array
    const presenceData: PresenceStatus[] = employees.map((emp) => {
      const recordData = recordsByEmployee.get(emp.id);

      let status: PresenceStatus['status'] = 'absent';
      if (recordData) {
        if (recordData.isRemote) {
          status = 'remote';
        } else {
          switch (recordData.lastType) {
            case 'clock_in':
            case 'break_end':
              status = 'working';
              break;
            case 'break_start':
              status = 'break';
              break;
            case 'clock_out':
              status = 'absent';
              break;
          }
        }
      }

      return {
        employee_id: emp.id,
        employee_name: emp.full_name || emp.name,
        department: emp.department,
        photo_url: emp.photo_url,
        status,
        clock_in: recordData?.clockInTime || null,
        last_action: recordData?.lastType || null,
        last_action_time: recordData?.lastTime || null,
      };
    });

    // Filter by status if requested
    let filteredData = presenceData;
    if (statusFilter) {
      const validStatuses = ['working', 'break', 'absent', 'remote'];
      if (validStatuses.includes(statusFilter)) {
        filteredData = presenceData.filter(p => p.status === statusFilter);
      }
    }

    // Sort: working first, then break, then remote, then absent
    const statusOrder: Record<PresenceStatus['status'], number> = {
      working: 0,
      break: 1,
      remote: 2,
      absent: 3,
    };
    filteredData.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    // Apply limit
    const limitedData = filteredData.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      total: presenceData.length,
      working: presenceData.filter(p => p.status === 'working').length,
      on_break: presenceData.filter(p => p.status === 'break').length,
      remote: presenceData.filter(p => p.status === 'remote').length,
      absent: presenceData.filter(p => p.status === 'absent').length,
    };

    // Get unique departments for filtering options
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      data: {
        employees: limitedData,
        summary,
        departments,
        last_updated: new Date().toISOString(),
        filters_applied: {
          department: department || null,
          status: statusFilter || null,
          limit,
        },
      },
    });

  } catch (error) {
    console.error('Whos-in API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
