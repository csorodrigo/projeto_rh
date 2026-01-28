/**
 * Individual Time Signing API Routes
 * GET: Get details of a specific time record
 * PATCH: Request correction (own record) or update (admin)
 * DELETE: Cancel time record (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSigningSchema } from '@/lib/validations/signing';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Tipo para registros de ponto - evita inferência de 'never'
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

/**
 * GET /api/signings/[id]
 * Get details of a specific time record
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const uuidValidation = uuidSchema.safeParse(id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'ID invalido', code: 'INVALID_ID' },
        { status: 400 }
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

    // Fetch the time record - com tipo explícito para evitar 'never'
    type TimeRecordWithEmployee = {
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
      employees: { id: string; name: string; department: string | null; email: string | null } | null;
    };

    const { data: record, error: recordError } = await supabase
      .from('time_records')
      .select(`
        *,
        employees(id, name, department, email)
      `)
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single<TimeRecordWithEmployee>();

    if (recordError || !record) {
      return NextResponse.json(
        { error: 'Registro nao encontrado', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check permission - users can only see their own records unless admin/hr
    const isAdmin = ['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role);
    if (!isAdmin && record.employee_id !== profile.id) {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });

  } catch (error) {
    console.error('Signing GET [id] error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/signings/[id]
 * Request correction for a time record (own record) or update (admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const uuidValidation = uuidSchema.safeParse(id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'ID invalido', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateSigningSchema.safeParse(body);

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

    // Fetch the existing time record - com tipo explícito
    const { data: existingRecord, error: existingError } = await supabase
      .from('time_records')
      .select('*')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single<TimeRecordType>();

    if (existingError || !existingRecord) {
      return NextResponse.json(
        { error: 'Registro nao encontrado', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    const isAdmin = ['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role);
    const isOwnRecord = existingRecord.employee_id === profile.id;

    // Permission check
    if (!isOwnRecord && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { recorded_at, notes, adjustment_reason } = validation.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      notes: notes || existingRecord.notes,
    };

    // Only admins can directly change recorded_at
    if (recorded_at && isAdmin) {
      updateData.recorded_at = recorded_at;
    }

    // If user is requesting a correction (non-admin), create adjustment request
    if (!isAdmin && (recorded_at || adjustment_reason)) {
      // Store adjustment request in notes or a separate table (for now, in notes)
      const adjustmentNote = `[CORRECAO SOLICITADA em ${new Date().toISOString()}] Motivo: ${adjustment_reason}${recorded_at ? `. Nova hora solicitada: ${recorded_at}` : ''}`;
      updateData.notes = existingRecord.notes
        ? `${existingRecord.notes}\n\n${adjustmentNote}`
        : adjustmentNote;
    }

    // Update the record - com tipo explícito
    const { data: updatedRecord, error: updateError } = await supabase
      .from('time_records')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single() as { data: TimeRecordType | null; error: Error | null };

    if (updateError) {
      console.error('Error updating time record:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar registro', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    // If admin changed recorded_at, reconsolidate the day
    if (recorded_at && isAdmin) {
      const recordDate = new Date(existingRecord.recorded_at).toISOString().split('T')[0];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('consolidate_daily_records', {
          p_employee_id: existingRecord.employee_id,
          p_date: recordDate,
        });
      } catch (consolidateError) {
        console.warn('Daily consolidation warning:', consolidateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: isAdmin
        ? 'Registro atualizado com sucesso'
        : 'Solicitacao de correcao registrada com sucesso',
    });

  } catch (error) {
    console.error('Signing PATCH error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/signings/[id]
 * Cancel a time record (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nao autenticado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const uuidValidation = uuidSchema.safeParse(id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'ID invalido', code: 'INVALID_ID' },
        { status: 400 }
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

    // Only admins can delete records
    const isAdmin = ['super_admin', 'company_admin', 'hr_manager'].includes(profile.role);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem cancelar registros', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch the record to get employee_id and date before deleting
    const { data: existingRecord, error: existingError } = await supabase
      .from('time_records')
      .select('employee_id, recorded_at')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single<{ employee_id: string; recorded_at: string }>();

    if (existingError || !existingRecord) {
      return NextResponse.json(
        { error: 'Registro nao encontrado', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('time_records')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting time record:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao cancelar registro', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    // Reconsolidate the day
    const recordDate = new Date(existingRecord.recorded_at).toISOString().split('T')[0];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('consolidate_daily_records', {
        p_employee_id: existingRecord.employee_id,
        p_date: recordDate,
      });
    } catch (consolidateError) {
      console.warn('Daily consolidation warning:', consolidateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Registro cancelado com sucesso',
    });

  } catch (error) {
    console.error('Signing DELETE error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
