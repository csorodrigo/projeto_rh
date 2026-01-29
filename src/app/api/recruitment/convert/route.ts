/**
 * API Route: Convert Candidate to Employee
 * POST /api/recruitment/convert
 *
 * Converte um candidato aprovado em funcionário
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { buildEmployeeFromConversion, validateEmployeeData, checkDuplicateEmployee } from '@/lib/recruitment/employee-conversion';
import { createOnboardingChecklist } from '@/lib/recruitment/onboarding';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticação
    const {
      data: { session },
      error: authError
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar profile do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['super_admin', 'company_admin', 'hr_manager', 'hr_analyst'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { application_id, employee_data, create_onboarding = true, buddy_id, hr_contact_id, onboarding_template_id } = body;

    if (!application_id || !employee_data) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // =====================================================
    // 1. Validar dados do funcionário
    // =====================================================

    const validation = validateEmployeeData(employee_data);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Dados inválidos',
        validation_errors: validation.errors
      }, { status: 400 });
    }

    // =====================================================
    // 2. Buscar application, candidate e job
    // =====================================================

    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        candidate:candidate_id (*),
        job:job_id (*)
      `)
      .eq('id', application_id)
      .eq('company_id', profile.company_id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 });
    }

    // =====================================================
    // 3. Validações de negócio
    // =====================================================

    // Verificar se já foi convertido
    if (application.employee_id) {
      return NextResponse.json({ error: 'Candidato já foi convertido em funcionário' }, { status: 400 });
    }

    // Verificar se foi contratado
    if (application.status !== 'hired' || !application.hired_at) {
      return NextResponse.json({ error: 'Candidato não foi marcado como contratado' }, { status: 400 });
    }

    // Verificar blacklist
    if (application.candidate.is_blacklisted) {
      return NextResponse.json({
        error: `Candidato está na lista negra: ${application.candidate.blacklist_reason || 'Sem motivo especificado'}`
      }, { status: 400 });
    }

    // Verificar duplicatas
    const duplicate = await checkDuplicateEmployee(
      employee_data.cpf,
      application.candidate.email,
      profile.company_id,
      supabase
    );

    if (duplicate.exists) {
      return NextResponse.json({
        error: `Já existe um funcionário com este ${duplicate.field === 'cpf' ? 'CPF' : 'e-mail'}`
      }, { status: 400 });
    }

    // =====================================================
    // 4. Criar funcionário
    // =====================================================

    const employeeRecord = buildEmployeeFromConversion(
      application.candidate,
      employee_data,
      profile.company_id,
      session.user.id
    );

    // Adicionar position da vaga
    employeeRecord.position = application.job.title;

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert(employeeRecord)
      .select()
      .single();

    if (employeeError || !employee) {
      console.error('Erro ao criar funcionário:', employeeError);
      return NextResponse.json({
        error: 'Erro ao criar funcionário',
        details: employeeError?.message
      }, { status: 500 });
    }

    // =====================================================
    // 5. Atualizar application
    // =====================================================

    const { error: updateAppError } = await supabase
      .from('job_applications')
      .update({
        employee_id: employee.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', application_id);

    if (updateAppError) {
      console.error('Erro ao atualizar application:', updateAppError);
    }

    // =====================================================
    // 6. Rejeitar outras applications do candidato
    // =====================================================

    const { error: rejectError } = await supabase
      .from('job_applications')
      .update({
        status: 'rejected',
        rejection_reason: 'Candidato já foi contratado para outra vaga',
        rejected_at: new Date().toISOString(),
        rejected_by: session.user.id
      })
      .eq('candidate_id', application.candidate_id)
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .neq('id', application_id);

    if (rejectError) {
      console.error('Erro ao rejeitar outras applications:', rejectError);
    }

    // =====================================================
    // 7. Criar onboarding
    // =====================================================

    let onboardingId: string | null = null;

    if (create_onboarding) {
      try {
        // Buscar template se especificado
        let checklistTemplate = null;
        if (onboarding_template_id) {
          const { data: template } = await supabase
            .from('onboarding_templates')
            .select('checklist_template')
            .eq('id', onboarding_template_id)
            .eq('company_id', profile.company_id)
            .single();

          if (template) {
            checklistTemplate = template.checklist_template;
          }
        }

        // Se não tem template, buscar template padrão do departamento ou geral
        if (!checklistTemplate) {
          // Tentar buscar pela função do Supabase
          const { data: defaultChecklist } = await supabase
            .rpc('create_default_onboarding_checklist', {
              p_company_id: profile.company_id,
              p_department: employee_data.department
            });

          if (defaultChecklist) {
            checklistTemplate = defaultChecklist;
          }
        }

        // Criar checklist
        const firstDay = new Date(employee_data.hire_date);
        const checklist = createOnboardingChecklist(firstDay, checklistTemplate);

        // Criar onboarding
        const { data: onboarding, error: onboardingError } = await supabase
          .from('employee_onboarding')
          .insert({
            company_id: profile.company_id,
            employee_id: employee.id,
            application_id: application_id,
            checklist: checklist,
            start_date: new Date().toISOString().split('T')[0],
            first_day: employee_data.hire_date,
            status: 'pending',
            buddy_id: buddy_id || null,
            hr_contact_id: hr_contact_id || profile.id
          })
          .select()
          .single();

        if (onboardingError) {
          console.error('Erro ao criar onboarding:', onboardingError);
        } else if (onboarding) {
          onboardingId = onboarding.id;
        }
      } catch (error) {
        console.error('Erro ao criar onboarding:', error);
      }
    }

    // =====================================================
    // 8. Registrar atividade
    // =====================================================

    await supabase.from('application_activities').insert({
      company_id: profile.company_id,
      application_id: application_id,
      activity_type: 'status_change',
      title: 'Candidato convertido em funcionário',
      description: `Funcionário criado: ${employee.name}`,
      data: { employee_id: employee.id },
      performed_by: session.user.id,
      performed_at: new Date().toISOString()
    });

    // =====================================================
    // 9. TODO: Enviar notificações e emails
    // =====================================================

    // TODO: Enviar email de boas-vindas ao novo funcionário
    // TODO: Notificar time RH sobre nova contratação
    // TODO: Notificar gestor direto

    // =====================================================
    // 10. Retornar sucesso
    // =====================================================

    return NextResponse.json({
      success: true,
      employee_id: employee.id,
      onboarding_id: onboardingId,
      message: 'Candidato convertido em funcionário com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao converter candidato:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
