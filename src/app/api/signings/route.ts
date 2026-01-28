/**
 * Time Signing API Routes
 * POST: Record a new time entry (clock in/out, break start/end)
 * GET: List time entries with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSigningSchema,
  listSigningsQuerySchema,
  validateActionSequence,
  checkDuplicateWindow,
} from '@/lib/validations/signing';
import type { ClockType, RecordSource } from '@/types/database';

/**
 * POST /api/signings
 * Record a new time entry
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = createSigningSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados invalidos',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      employee_id,
      company_id,
      record_type,
      source,
      notes,
      location,
      device_info,
      photo_url,
    } = validation.data;

    // Verify employee exists and belongs to company - com tipo explícito
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, status, company_id')
      .eq('id', employee_id)
      .eq('company_id', company_id)
      .single<{ id: string; name: string; status: string; company_id: string }>();

    if (empError || !employee) {
      return NextResponse.json(
        { error: 'Funcionario nao encontrado', code: 'EMPLOYEE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Funcionario inativo nao pode registrar ponto', code: 'EMPLOYEE_INACTIVE' },
        { status: 403 }
      );
    }

    // Get today's date for queries
    const today = new Date().toISOString().split('T')[0];

    // Get last record for today to validate action sequence - com tipo explícito
    const { data: lastRecord, error: lastRecordError } = await supabase
      .from('time_records')
      .select('record_type, recorded_at')
      .eq('employee_id', employee_id)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { record_type: string; recorded_at: string } | null; error: Error | null };

    if (lastRecordError) {
      console.error('Error fetching last record:', lastRecordError);
      return NextResponse.json(
        { error: 'Erro ao verificar registros anteriores', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    // Determine current status
    let currentStatus: 'not_started' | 'working' | 'break' | 'finished' = 'not_started';
    if (lastRecord) {
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

    // Validate action sequence
    const sequenceValidation = validateActionSequence(currentStatus, record_type as ClockType);
    if (!sequenceValidation.valid) {
      return NextResponse.json(
        {
          error: sequenceValidation.message,
          code: 'INVALID_ACTION_SEQUENCE',
          current_status: currentStatus,
          requested_action: record_type,
        },
        { status: 400 }
      );
    }

    // Check for duplicate records within time window (1 minute)
    if (lastRecord) {
      const lastRecordTime = new Date(lastRecord.recorded_at);
      const duplicateCheck = checkDuplicateWindow(lastRecordTime, 1);
      if (duplicateCheck.isDuplicate) {
        return NextResponse.json(
          { error: duplicateCheck.message, code: 'DUPLICATE_RECORD' },
          { status: 429 }
        );
      }
    }

    // Insert the time record - com tipo explícito para evitar 'never'
    const insertData = {
      employee_id,
      company_id,
      record_type: record_type as ClockType,
      recorded_at: new Date().toISOString(),
      source: (source || 'web') as RecordSource,
      notes,
      location_address: location?.address,
      location_accuracy: location?.accuracy,
      device_info: device_info || {},
      photo_url,
      created_by: user.id,
    };
    const { data: newRecord, error: insertError } = await supabase
      .from('time_records')
      .insert(insertData as never)
      .select()
      .single() as { data: Record<string, unknown> | null; error: Error | null };

    if (insertError) {
      console.error('Error inserting time record:', insertError);
      return NextResponse.json(
        { error: 'Erro ao registrar ponto', code: 'INSERT_ERROR', details: insertError.message },
        { status: 500 }
      );
    }

    // Consolidate daily records (call RPC function if exists)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('consolidate_daily_records', {
        p_employee_id: employee_id,
        p_date: today,
      });
    } catch (consolidateError) {
      // Log but don't fail the request - consolidation can be retried
      console.warn('Daily consolidation warning:', consolidateError);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: newRecord,
      message: getActionMessage(record_type as ClockType),
    }, { status: 201 });

  } catch (error) {
    console.error('Signing POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/signings
 * List time entries with filters
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = listSigningsQuerySchema.safeParse({
      employee_id: searchParams.get('employee_id') || undefined,
      date: searchParams.get('date') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Parametros invalidos',
          code: 'VALIDATION_ERROR',
          details: queryValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { employee_id, date, start_date, end_date, limit, offset } = queryValidation.data;

    // Build query
    let query = supabase
      .from('time_records')
      .select('*, employees(name, department)', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (employee_id) {
      // If not admin/hr, users can only see their own records
      const isAdmin = ['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role);
      if (!isAdmin && employee_id !== profile.id) {
        return NextResponse.json(
          { error: 'Acesso negado', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      query = query.eq('employee_id', employee_id);
    }

    // Date filters
    if (date) {
      query = query
        .gte('recorded_at', `${date}T00:00:00`)
        .lte('recorded_at', `${date}T23:59:59`);
    } else {
      if (start_date) {
        query = query.gte('recorded_at', `${start_date}T00:00:00`);
      }
      if (end_date) {
        query = query.lte('recorded_at', `${end_date}T23:59:59`);
      }
    }

    const { data: records, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching time records:', queryError);
      return NextResponse.json(
        { error: 'Erro ao buscar registros', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: records || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
    });

  } catch (error) {
    console.error('Signing GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get user-friendly action message
 */
function getActionMessage(action: ClockType): string {
  const messages: Record<ClockType, string> = {
    clock_in: 'Entrada registrada com sucesso',
    clock_out: 'Saida registrada com sucesso',
    break_start: 'Inicio de intervalo registrado',
    break_end: 'Fim de intervalo registrado',
  };
  return messages[action];
}
