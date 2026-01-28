/**
 * Today's Time Records API Route
 * GET: Fetch today's time records for the authenticated employee
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/signings/today
 * Get today's time records for current user or specified employee
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const employeeIdParam = searchParams.get('employee_id');

    // Get user's profile
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

    // Determine which employee to query
    let employeeId = profile.id; // Default to current user

    if (employeeIdParam) {
      // Validate employee_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(employeeIdParam)) {
        return NextResponse.json(
          { error: 'ID do funcionario invalido', code: 'INVALID_EMPLOYEE_ID' },
          { status: 400 }
        );
      }

      // Check if user has permission to view other employees' records
      const isAdmin = ['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role);

      if (employeeIdParam !== profile.id && !isAdmin) {
        return NextResponse.json(
          { error: 'Acesso negado', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      // Verify employee belongs to same company
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, company_id')
        .eq('id', employeeIdParam)
        .eq('company_id', profile.company_id)
        .single();

      if (empError || !employee) {
        return NextResponse.json(
          { error: 'Funcionario nao encontrado', code: 'EMPLOYEE_NOT_FOUND' },
          { status: 404 }
        );
      }

      employeeId = employeeIdParam;
    }

    // Get today's date in ISO format
    const today = new Date().toISOString().split('T')[0];

    // Tipo para registros de ponto
    type TimeRecordType = {
      id: string;
      employee_id: string;
      company_id: string;
      record_type: string;
      recorded_at: string;
      source: string;
      notes: string | null;
      location_address: string | null;
      location_accuracy: number | null;
      device_info: Record<string, unknown> | null;
      photo_url: string | null;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    };

    // Fetch today's records - com tipo explícito
    const { data: records, error: recordsError } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: true }) as { data: TimeRecordType[] | null; error: Error | null };

    if (recordsError) {
      console.error('Error fetching today records:', recordsError);
      return NextResponse.json(
        { error: 'Erro ao buscar registros', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    // Calculate current status based on last record
    let currentStatus: 'not_started' | 'working' | 'break' | 'finished' = 'not_started';
    let lastAction: string | null = null;
    let lastActionTime: string | null = null;

    if (records && records.length > 0) {
      const lastRecord = records[records.length - 1];
      lastAction = lastRecord.record_type;
      lastActionTime = lastRecord.recorded_at;

      switch (lastRecord.record_type) {
        case 'clock_in':
          currentStatus = 'working';
          break;
        case 'break_start':
          currentStatus = 'break';
          break;
        case 'break_end':
          currentStatus = 'working';
          break;
        case 'clock_out':
          currentStatus = 'finished';
          break;
      }
    }

    // Calculate worked time
    let workedMinutes = 0;
    let breakMinutes = 0;

    if (records && records.length > 0) {
      let clockInTime: Date | null = null;
      let breakStartTime: Date | null = null;

      for (const record of records) {
        const recordTime = new Date(record.recorded_at);

        switch (record.record_type) {
          case 'clock_in':
            clockInTime = recordTime;
            break;
          case 'break_start':
            if (clockInTime) {
              workedMinutes += Math.floor((recordTime.getTime() - clockInTime.getTime()) / 60000);
              clockInTime = null;
            }
            breakStartTime = recordTime;
            break;
          case 'break_end':
            if (breakStartTime) {
              breakMinutes += Math.floor((recordTime.getTime() - breakStartTime.getTime()) / 60000);
              breakStartTime = null;
            }
            clockInTime = recordTime;
            break;
          case 'clock_out':
            if (clockInTime) {
              workedMinutes += Math.floor((recordTime.getTime() - clockInTime.getTime()) / 60000);
              clockInTime = null;
            }
            break;
        }
      }

      // If still working, add time until now
      if (clockInTime && currentStatus === 'working') {
        const now = new Date();
        workedMinutes += Math.floor((now.getTime() - clockInTime.getTime()) / 60000);
      }

      // If on break, add break time until now
      if (breakStartTime && currentStatus === 'break') {
        const now = new Date();
        breakMinutes += Math.floor((now.getTime() - breakStartTime.getTime()) / 60000);
      }
    }

    // Get daily tracking summary if exists - com tipo explícito
    type DailySummaryType = {
      worked_minutes: number | null;
      break_minutes: number | null;
      overtime_minutes: number | null;
      status: string | null;
    };
    const { data: dailySummary } = await supabase
      .from('time_tracking_daily')
      .select('worked_minutes, break_minutes, overtime_minutes, status')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle() as { data: DailySummaryType | null; error: Error | null };

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        employee_id: employeeId,
        records: records || [],
        status: {
          current: currentStatus,
          last_action: lastAction,
          last_action_time: lastActionTime,
        },
        summary: {
          worked_minutes: dailySummary?.worked_minutes ?? workedMinutes,
          break_minutes: dailySummary?.break_minutes ?? breakMinutes,
          overtime_minutes: dailySummary?.overtime_minutes ?? 0,
          record_status: dailySummary?.status ?? 'pending',
        },
        next_allowed_actions: getNextAllowedActions(currentStatus),
      },
    });

  } catch (error) {
    console.error('Today signings error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get allowed actions based on current status
 */
function getNextAllowedActions(status: 'not_started' | 'working' | 'break' | 'finished'): string[] {
  const transitions: Record<typeof status, string[]> = {
    not_started: ['clock_in'],
    working: ['break_start', 'clock_out'],
    break: ['break_end'],
    finished: ['clock_in'], // For next day or corrections
  };
  return transitions[status];
}
