/**
 * Time Signing Summary API Route
 * GET: Get summary of worked hours (daily, weekly, monthly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Query parameters schema for summary
 */
const summaryQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mes deve estar no formato YYYY-MM').optional(),
});

type SummaryPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * GET /api/signings/summary
 * Get summary of worked hours
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = summaryQuerySchema.safeParse({
      employee_id: searchParams.get('employee_id') || undefined,
      period: searchParams.get('period') || 'daily',
      date: searchParams.get('date') || undefined,
      month: searchParams.get('month') || undefined,
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

    const { employee_id, period, date, month } = queryValidation.data;

    // Determine target employee
    let targetEmployeeId = profile.id;
    if (employee_id) {
      const isAdmin = ['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role);
      if (!isAdmin && employee_id !== profile.id) {
        return NextResponse.json(
          { error: 'Acesso negado', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      targetEmployeeId = employee_id;
    }

    // Calculate date range based on period
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let startDate: string;
    let endDate: string;

    switch (period as SummaryPeriod) {
      case 'daily':
        startDate = date || todayStr;
        endDate = startDate;
        break;
      case 'weekly':
        const weekDate = date ? new Date(date) : today;
        const dayOfWeek = weekDate.getDay();
        const monday = new Date(weekDate);
        monday.setDate(weekDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        startDate = monday.toISOString().split('T')[0];
        endDate = sunday.toISOString().split('T')[0];
        break;
      case 'monthly':
        if (month) {
          startDate = `${month}-01`;
          const [year, monthNum] = month.split('-').map(Number);
          const lastDay = new Date(year, monthNum, 0).getDate();
          endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
        } else {
          const monthDate = date ? new Date(date) : today;
          const year = monthDate.getFullYear();
          const monthNum = monthDate.getMonth();
          startDate = `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(year, monthNum + 1, 0).getDate();
          endDate = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
        break;
    }

    // Fetch daily tracking records for the period
    const { data: dailyRecords, error: recordsError } = await supabase
      .from('time_tracking_daily')
      .select('*')
      .eq('employee_id', targetEmployeeId)
      .eq('company_id', profile.company_id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (recordsError) {
      console.error('Error fetching daily records:', recordsError);
      return NextResponse.json(
        { error: 'Erro ao buscar registros', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    // Calculate summary
    const summary = calculateSummary(dailyRecords || [], period as SummaryPeriod);

    // Get employee info
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, department, position')
      .eq('id', targetEmployeeId)
      .single();

    // Get time bank balance
    const { data: timeBankBalance } = await supabase
      .from('time_bank')
      .select('balance_after')
      .eq('employee_id', targetEmployeeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { balance_after: number } | null; error: Error | null };

    return NextResponse.json({
      success: true,
      data: {
        employee: employee || { id: targetEmployeeId },
        period: {
          type: period,
          start_date: startDate,
          end_date: endDate,
        },
        summary,
        time_bank_balance_minutes: timeBankBalance?.balance_after || 0,
        daily_records: dailyRecords || [],
      },
    });

  } catch (error) {
    console.error('Summary GET error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

interface DailyRecord {
  date: string;
  worked_minutes: number | null;
  break_minutes: number | null;
  overtime_minutes: number | null;
  missing_minutes: number | null;
  night_shift_minutes: number | null;
  is_workday: boolean;
  is_holiday: boolean;
  status: string;
}

interface SummaryResult {
  total_worked_minutes: number;
  total_worked_hours: number;
  total_break_minutes: number;
  total_overtime_minutes: number;
  total_overtime_hours: number;
  total_missing_minutes: number;
  total_night_shift_minutes: number;
  workdays_count: number;
  worked_days_count: number;
  holidays_count: number;
  average_daily_minutes: number;
  average_daily_hours: number;
  pending_approvals: number;
  approved_count: number;
  rejected_count: number;
}

/**
 * Calculate summary statistics from daily records
 */
function calculateSummary(records: DailyRecord[], period: SummaryPeriod): SummaryResult {
  const summary: SummaryResult = {
    total_worked_minutes: 0,
    total_worked_hours: 0,
    total_break_minutes: 0,
    total_overtime_minutes: 0,
    total_overtime_hours: 0,
    total_missing_minutes: 0,
    total_night_shift_minutes: 0,
    workdays_count: 0,
    worked_days_count: 0,
    holidays_count: 0,
    average_daily_minutes: 0,
    average_daily_hours: 0,
    pending_approvals: 0,
    approved_count: 0,
    rejected_count: 0,
  };

  if (records.length === 0) {
    return summary;
  }

  for (const record of records) {
    summary.total_worked_minutes += record.worked_minutes || 0;
    summary.total_break_minutes += record.break_minutes || 0;
    summary.total_overtime_minutes += record.overtime_minutes || 0;
    summary.total_missing_minutes += record.missing_minutes || 0;
    summary.total_night_shift_minutes += record.night_shift_minutes || 0;

    if (record.is_workday) {
      summary.workdays_count++;
    }

    if (record.is_holiday) {
      summary.holidays_count++;
    }

    if ((record.worked_minutes || 0) > 0) {
      summary.worked_days_count++;
    }

    // Count by status
    switch (record.status) {
      case 'pending':
        summary.pending_approvals++;
        break;
      case 'approved':
        summary.approved_count++;
        break;
      case 'rejected':
        summary.rejected_count++;
        break;
    }
  }

  // Calculate averages and hours
  summary.total_worked_hours = Math.round((summary.total_worked_minutes / 60) * 100) / 100;
  summary.total_overtime_hours = Math.round((summary.total_overtime_minutes / 60) * 100) / 100;

  if (summary.worked_days_count > 0) {
    summary.average_daily_minutes = Math.round(summary.total_worked_minutes / summary.worked_days_count);
    summary.average_daily_hours = Math.round((summary.average_daily_minutes / 60) * 100) / 100;
  }

  return summary;
}
