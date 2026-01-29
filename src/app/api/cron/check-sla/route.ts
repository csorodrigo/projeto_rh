/**
 * Cron Job - Verificação de SLA de Workflows
 *
 * Este endpoint deve ser chamado periodicamente (ex: a cada hora)
 * para verificar workflows com SLA vencido e tomar ações apropriadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkflowEngine } from '@/lib/workflows/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (pode ser um token de cron job)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Buscar todas as empresas ativas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .eq('status', 'active');

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    let totalChecked = 0;
    let totalNotified = 0;
    let totalEscalated = 0;

    // Para cada empresa, verificar SLA
    for (const company of companies || []) {
      const engine = new WorkflowEngine(company.id);
      const overdueInstances = await engine.checkSLA();

      totalChecked += overdueInstances.length;

      for (const instance of overdueInstances) {
        // Notificar aprovadores
        for (const approver of instance.current_approvers) {
          try {
            // Criar notificação
            await supabase.from('notifications').insert({
              company_id: company.id,
              user_id: approver.id,
              type: 'sla_overdue',
              priority: 'high',
              title: 'Aprovação Atrasada',
              message: `A solicitação está atrasada há ${instance.hours_overdue} horas`,
              link: `/aprovacoes`,
              metadata: {
                workflow_instance_id: instance.id,
                hours_overdue: instance.hours_overdue,
              },
            });

            totalNotified++;
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        }

        // Escalar se muito atrasado (mais de 24h)
        if (instance.hours_overdue > 24) {
          try {
            await engine.escalate(instance.id);
            totalEscalated++;
          } catch (error) {
            console.error('Error escalating workflow:', error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      companiesChecked: companies?.length || 0,
      instancesChecked: totalChecked,
      notificationsSent: totalNotified,
      instancesEscalated: totalEscalated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in SLA check cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
