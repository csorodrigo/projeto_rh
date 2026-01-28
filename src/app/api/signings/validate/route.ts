/**
 * Time Signing Validation API Route
 * POST: Validate if user can register time entry now
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ClockType } from '@/types/database';

/**
 * Validation request schema
 */
const validateSigningSchema = z.object({
  employee_id: z.string().uuid('ID do funcionario invalido'),
  company_id: z.string().uuid('ID da empresa invalido'),
  action: z.enum(['clock_in', 'clock_out', 'break_start', 'break_end']),
  location: z.object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
});

interface ValidationResult {
  can_register: boolean;
  current_status: 'not_started' | 'working' | 'break' | 'finished';
  next_allowed_actions: ClockType[];
  last_record: {
    type: ClockType;
    recorded_at: string;
  } | null;
  today_records_count: number;
  warnings: string[];
  errors: string[];
  geofence?: {
    required: boolean;
    is_within: boolean | null;
    nearest_location?: string;
  };
  schedule?: {
    start_time: string | null;
    end_time: string | null;
    is_within_schedule: boolean;
  };
}

/**
 * POST /api/signings/validate
 * Validate if user can register time entry
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
    const validation = validateSigningSchema.safeParse(body);

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

    const { employee_id, company_id, action, location } = validation.data;

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

    // Verify company matches
    if (profile.company_id !== company_id) {
      return NextResponse.json(
        { error: 'Empresa nao corresponde ao perfil', code: 'COMPANY_MISMATCH' },
        { status: 403 }
      );
    }

    // Verify employee exists and is active - com tipo explícito
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

    // Initialize validation result
    const result: ValidationResult = {
      can_register: true,
      current_status: 'not_started',
      next_allowed_actions: ['clock_in'],
      last_record: null,
      today_records_count: 0,
      warnings: [],
      errors: [],
    };

    // Check employee status
    if (employee.status !== 'active') {
      result.can_register = false;
      result.errors.push('Funcionario inativo nao pode registrar ponto');
      return NextResponse.json({ success: true, data: result });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's records - com tipo explícito
    type RecordType = { id: string; record_type: string; recorded_at: string };
    const { data: todayRecords, error: recordsError } = await supabase
      .from('time_records')
      .select('id, record_type, recorded_at')
      .eq('employee_id', employee_id)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: false }) as { data: RecordType[] | null; error: Error | null };

    if (recordsError) {
      console.error('Error fetching today records:', recordsError);
      return NextResponse.json(
        { error: 'Erro ao verificar registros', code: 'QUERY_ERROR' },
        { status: 500 }
      );
    }

    result.today_records_count = todayRecords?.length || 0;

    // Determine current status based on last record
    if (todayRecords && todayRecords.length > 0) {
      const lastRecord = todayRecords[0];
      result.last_record = {
        type: lastRecord.record_type as ClockType,
        recorded_at: lastRecord.recorded_at,
      };

      switch (lastRecord.record_type) {
        case 'clock_in':
          result.current_status = 'working';
          result.next_allowed_actions = ['break_start', 'clock_out'];
          break;
        case 'break_start':
          result.current_status = 'break';
          result.next_allowed_actions = ['break_end'];
          break;
        case 'break_end':
          result.current_status = 'working';
          result.next_allowed_actions = ['break_start', 'clock_out'];
          break;
        case 'clock_out':
          result.current_status = 'finished';
          result.next_allowed_actions = ['clock_in'];
          break;
      }

      // Check minimum interval between records (1 minute)
      const lastRecordTime = new Date(lastRecord.recorded_at);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastRecordTime.getTime()) / 1000;

      if (diffSeconds < 60) {
        result.can_register = false;
        result.errors.push(`Aguarde pelo menos ${Math.ceil(60 - diffSeconds)} segundos para registrar novamente`);
      }
    }

    // Validate action sequence
    if (!result.next_allowed_actions.includes(action as ClockType)) {
      result.can_register = false;
      const actionNames: Record<string, string> = {
        clock_in: 'Entrada',
        clock_out: 'Saida',
        break_start: 'Inicio de intervalo',
        break_end: 'Fim de intervalo',
      };
      result.errors.push(
        `Acao "${actionNames[action]}" nao permitida no status atual. Acoes permitidas: ${result.next_allowed_actions.map(a => actionNames[a]).join(', ')}`
      );
    }

    // Check maximum records per day (4 main actions)
    if (result.today_records_count >= 8) {
      result.warnings.push('Numero elevado de registros hoje. Verifique se nao ha duplicatas.');
    }

    // Get employee's work schedule - com tipos explícitos
    type ScheduleResult = {
      schedule_id: string;
      work_schedules: { id: string; name: string; daily_hours: number } | null;
    };
    const { data: schedule } = await supabase
      .from('employee_schedules')
      .select(`
        schedule_id,
        work_schedules(
          id,
          name,
          daily_hours
        )
      `)
      .eq('employee_id', employee_id)
      .eq('company_id', company_id)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .maybeSingle() as { data: ScheduleResult | null; error: Error | null };

    if (schedule?.schedule_id) {
      // Get today's weekday schedule
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayWeekday = weekdays[new Date().getDay()];

      type WeekdayScheduleResult = { start_time: string; end_time: string };
      const { data: weekdaySchedule } = await supabase
        .from('schedule_weekdays')
        .select('start_time, end_time')
        .eq('schedule_id', schedule.schedule_id)
        .eq('weekday', todayWeekday)
        .maybeSingle() as { data: WeekdayScheduleResult | null; error: Error | null };

      if (weekdaySchedule) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        result.schedule = {
          start_time: weekdaySchedule.start_time,
          end_time: weekdaySchedule.end_time,
          is_within_schedule: true,
        };

        // Check if within schedule (with 30 min tolerance)
        if (weekdaySchedule.start_time && weekdaySchedule.end_time) {
          const scheduleStart = weekdaySchedule.start_time;
          const scheduleEnd = weekdaySchedule.end_time;

          // Add tolerance for early/late
          const tolerance = 30; // minutes
          const startParts = scheduleStart.split(':').map(Number);
          const earlyStart = new Date();
          earlyStart.setHours(startParts[0], startParts[1] - tolerance, 0, 0);
          const earlyStartTime = `${String(earlyStart.getHours()).padStart(2, '0')}:${String(earlyStart.getMinutes()).padStart(2, '0')}`;

          if (action === 'clock_in' && currentTime < earlyStartTime) {
            result.warnings.push(`Entrada muito cedo. Jornada inicia as ${scheduleStart}`);
          }

          if (currentTime > scheduleEnd && action === 'clock_in') {
            result.warnings.push(`Entrada muito tarde. Jornada termina as ${scheduleEnd}`);
          }
        }
      } else {
        result.warnings.push('Hoje nao e dia de trabalho conforme escala');
      }
    }

    // Validate geofence if location provided
    if (location?.latitude && location?.longitude) {
      type GeofenceType = {
        id: string;
        name: string;
        center: unknown;
        radius_meters: number;
        is_required: boolean;
      };
      const { data: geofences } = await supabase
        .from('geofences')
        .select('id, name, center, radius_meters, is_required')
        .eq('company_id', company_id)
        .eq('is_active', true) as { data: GeofenceType[] | null; error: Error | null };

      if (geofences && geofences.length > 0) {
        let isWithinAnyGeofence = false;
        let nearestLocation = '';
        const isGeofenceRequired = geofences.some(g => g.is_required);

        for (const geofence of geofences) {
          // Calculate distance using Haversine formula
          // Note: In production, this should use PostGIS in the database
          const center = geofence.center as unknown as { x: number; y: number };
          if (center) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              center.y, // latitude
              center.x  // longitude
            );

            if (distance <= geofence.radius_meters) {
              isWithinAnyGeofence = true;
              nearestLocation = geofence.name;
              break;
            }
          }
        }

        result.geofence = {
          required: isGeofenceRequired,
          is_within: isWithinAnyGeofence,
          nearest_location: nearestLocation || undefined,
        };

        if (isGeofenceRequired && !isWithinAnyGeofence) {
          result.can_register = false;
          result.errors.push('Voce deve estar dentro de uma area autorizada para registrar ponto');
        } else if (!isWithinAnyGeofence) {
          result.warnings.push('Voce esta fora das areas de trabalho conhecidas');
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Signing validate error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
