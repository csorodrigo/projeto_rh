/**
 * Notification Engine
 * Sistema de verificação e envio automático de notificações
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from './email-sender';
import { getEmailTemplate } from './templates/notification-templates';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  Employee,
  Absence,
} from '@/types/database';
import { addDays, subDays, differenceInDays, format, startOfDay, endOfDay } from 'date-fns';

export interface NotificationData {
  companyId: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailTo?: string;
}

export class NotificationEngine {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Verificar aniversários (dia anterior)
   */
  async checkBirthdays(): Promise<void> {
    console.log('[NotificationEngine] Checking birthdays...');

    try {
      const tomorrow = addDays(new Date(), 1);
      const tomorrowMonth = tomorrow.getMonth() + 1;
      const tomorrowDay = tomorrow.getDate();

      // Buscar funcionários que fazem aniversário amanhã
      const { data: employees, error } = await this.supabase
        .from('employees')
        .select('id, name, birth_date, position, email, company_id')
        .eq('status', 'active')
        .not('birth_date', 'is', null);

      if (error) throw error;

      for (const employee of employees || []) {
        const birthDate = new Date(employee.birth_date);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();

        if (birthMonth === tomorrowMonth && birthDay === tomorrowDay) {
          // Notificar gestores e RH
          await this.notifyBirthday(employee);
        }
      }

      console.log(`[NotificationEngine] Processed ${employees?.length || 0} employees for birthdays`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking birthdays:', error);
      throw error;
    }
  }

  /**
   * Verificar aniversários de admissão
   */
  async checkAnniversaries(): Promise<void> {
    console.log('[NotificationEngine] Checking work anniversaries...');

    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      // Buscar funcionários que fazem aniversário de empresa hoje
      const { data: employees, error } = await this.supabase
        .from('employees')
        .select('id, name, hire_date, position, email, company_id')
        .eq('status', 'active')
        .not('hire_date', 'is', null);

      if (error) throw error;

      for (const employee of employees || []) {
        const hireDate = new Date(employee.hire_date);
        const hireMonth = hireDate.getMonth() + 1;
        const hireDay = hireDate.getDate();
        const hireYear = hireDate.getFullYear();

        if (hireMonth === todayMonth && hireDay === todayDay && hireYear < today.getFullYear()) {
          const years = today.getFullYear() - hireYear;
          await this.notifyWorkAnniversary(employee, years);
        }
      }

      console.log(`[NotificationEngine] Processed ${employees?.length || 0} employees for anniversaries`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking anniversaries:', error);
      throw error;
    }
  }

  /**
   * Verificar férias vencendo (30 dias antes)
   */
  async checkVacationExpiring(): Promise<void> {
    console.log('[NotificationEngine] Checking expiring vacations...');

    try {
      const thirtyDaysFromNow = addDays(new Date(), 30);

      // Buscar saldos de férias que vencem em 30 dias
      const { data: balances, error } = await this.supabase
        .from('vacation_balances')
        .select(`
          *,
          employee:employees(id, name, email, company_id)
        `)
        .eq('status', 'active')
        .gt('available_days', 0)
        .not('expires_at', 'is', null)
        .lte('expires_at', thirtyDaysFromNow.toISOString());

      if (error) throw error;

      for (const balance of balances || []) {
        const daysUntilExpiry = differenceInDays(
          new Date(balance.expires_at),
          new Date()
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          await this.notifyVacationExpiring(balance.employee, daysUntilExpiry);
        }
      }

      console.log(`[NotificationEngine] Processed ${balances?.length || 0} vacation balances`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking expiring vacations:', error);
      throw error;
    }
  }

  /**
   * Verificar ausências pendentes de aprovação
   */
  async checkPendingAbsences(): Promise<void> {
    console.log('[NotificationEngine] Checking pending absences...');

    try {
      // Buscar ausências pendentes
      const { data: absences, error } = await this.supabase
        .from('absences')
        .select(`
          *,
          employee:employees(id, name, email, position, manager_id, company_id)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (error) throw error;

      for (const absence of absences || []) {
        // Notificar apenas se passou mais de 1 dia desde a solicitação
        const requestedAt = new Date(absence.requested_at || absence.created_at);
        const daysSinceRequest = differenceInDays(new Date(), requestedAt);

        if (daysSinceRequest >= 1) {
          await this.notifyPendingAbsence(absence);
        }
      }

      console.log(`[NotificationEngine] Processed ${absences?.length || 0} pending absences`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking pending absences:', error);
      throw error;
    }
  }

  /**
   * Verificar registros de ponto faltantes (fim do dia - 18h)
   */
  async checkMissingTimeRecords(): Promise<void> {
    console.log('[NotificationEngine] Checking missing time records...');

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Buscar registros do dia
      const { data: records, error } = await this.supabase
        .from('time_tracking_daily')
        .select(`
          *,
          employee:employees(id, name, email, company_id)
        `)
        .eq('date', todayStr)
        .eq('is_workday', true)
        .is('clock_out', null)
        .not('clock_in', 'is', null);

      if (error) throw error;

      for (const record of records || []) {
        await this.notifyMissingTimeRecord(record.employee, today);
      }

      console.log(`[NotificationEngine] Processed ${records?.length || 0} missing time records`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking missing time records:', error);
      throw error;
    }
  }

  /**
   * Verificar violações de compliance
   */
  async checkComplianceViolations(): Promise<void> {
    console.log('[NotificationEngine] Checking compliance violations...');

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Buscar alertas de compliance críticos
      const { data: violations, error } = await this.supabase
        .from('compliance_alerts')
        .select(`
          *,
          employee:employees(id, name, email, company_id, manager_id)
        `)
        .eq('severity', 'critical')
        .eq('alert_date', today)
        .eq('is_resolved', false);

      if (error) throw error;

      for (const violation of violations || []) {
        await this.notifyComplianceViolation(violation);
      }

      console.log(`[NotificationEngine] Processed ${violations?.length || 0} compliance violations`);
    } catch (error) {
      console.error('[NotificationEngine] Error checking compliance violations:', error);
      throw error;
    }
  }

  /**
   * Criar e enviar notificação
   */
  async sendNotification(data: NotificationData): Promise<void> {
    try {
      // 1. Verificar preferências do usuário
      const { data: preferences } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', data.userId)
        .single();

      const shouldSendInApp = preferences?.enable_in_app !== false;
      const shouldSendEmail = preferences?.enable_email !== false && data.sendEmail;

      // 2. Criar notificação in-app
      if (shouldSendInApp) {
        const { error: notifError } = await this.supabase
          .from('notifications')
          .insert({
            company_id: data.companyId,
            user_id: data.userId,
            type: data.type,
            priority: data.priority,
            title: data.title,
            message: data.message,
            link: data.link,
            action_text: data.actionText,
            metadata: data.metadata || {},
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      // 3. Enviar email se necessário
      if (shouldSendEmail && data.emailTo) {
        const { subject, html } = getEmailTemplate(data.type, {
          employeeName: data.metadata?.employeeName as string,
          employeePosition: data.metadata?.employeePosition as string,
          managerName: data.metadata?.managerName as string,
          date: data.metadata?.date as Date,
          startDate: data.metadata?.startDate as Date,
          endDate: data.metadata?.endDate as Date,
          days: data.metadata?.days as number,
          absenceType: data.metadata?.absenceType as string,
          reason: data.metadata?.reason as string,
          violationType: data.metadata?.violationType as string,
          link: data.link,
        });

        const result = await sendEmail({
          to: data.emailTo,
          subject,
          html,
        });

        // Log do envio
        await this.supabase.from('notification_logs').insert({
          company_id: data.companyId,
          user_id: data.userId,
          channel: 'email',
          status: result.success ? 'sent' : 'failed',
          error_message: result.error,
          email_to: data.emailTo,
          email_subject: subject,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  private async notifyBirthday(employee: any) {
    // Buscar gestores e RH para notificar
    const { data: managers } = await this.supabase
      .from('profiles')
      .select('id, email, name')
      .eq('company_id', employee.company_id)
      .in('role', ['company_admin', 'hr_manager', 'hr_analyst']);

    for (const manager of managers || []) {
      await this.sendNotification({
        companyId: employee.company_id,
        userId: manager.id,
        type: 'birthday',
        priority: 'low',
        title: `Aniversário de ${employee.name}`,
        message: `Amanhã é aniversário de ${employee.name}${employee.position ? `, ${employee.position}` : ''}!`,
        link: `/funcionarios/${employee.id}`,
        actionText: 'Ver perfil',
        metadata: { employeeName: employee.name, employeePosition: employee.position },
        sendEmail: true,
        emailTo: manager.email,
      });
    }
  }

  private async notifyWorkAnniversary(employee: any, years: number) {
    // Buscar perfil do usuário
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', employee.id)
      .single();

    if (profile) {
      await this.sendNotification({
        companyId: employee.company_id,
        userId: profile.id,
        type: 'work_anniversary',
        priority: 'medium',
        title: `Parabéns! ${years} ${years === 1 ? 'ano' : 'anos'} na empresa`,
        message: `Você completa ${years} ${years === 1 ? 'ano' : 'anos'} de dedicação à empresa hoje! 🎉`,
        link: `/perfil`,
        actionText: 'Ver seu perfil',
        metadata: { employeeName: employee.name, days: years },
        sendEmail: true,
        emailTo: employee.email,
      });
    }
  }

  private async notifyVacationExpiring(employee: any, daysUntilExpiry: number) {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', employee.id)
      .single();

    if (profile) {
      await this.sendNotification({
        companyId: employee.company_id,
        userId: profile.id,
        type: 'vacation_expiring',
        priority: 'high',
        title: `Férias vencem em ${daysUntilExpiry} dias`,
        message: `Você possui férias que vencem em ${daysUntilExpiry} dias. Agende suas férias o quanto antes!`,
        link: `/ausencias/novo?type=vacation`,
        actionText: 'Solicitar férias',
        metadata: { employeeName: employee.name, days: daysUntilExpiry },
        sendEmail: true,
        emailTo: employee.email,
      });
    }
  }

  private async notifyPendingAbsence(absence: any) {
    // Buscar gestor
    if (absence.employee?.manager_id) {
      const { data: manager } = await this.supabase
        .from('profiles')
        .select('id, email, name')
        .eq('employee_id', absence.employee.manager_id)
        .single();

      if (manager) {
        const days = differenceInDays(
          new Date(absence.end_date),
          new Date(absence.start_date)
        ) + 1;

        await this.sendNotification({
          companyId: absence.employee.company_id,
          userId: manager.id,
          type: 'absence_pending',
          priority: 'high',
          title: `Ausência pendente - ${absence.employee.name}`,
          message: `${absence.employee.name} solicitou ${absence.type} de ${format(new Date(absence.start_date), 'dd/MM/yyyy')} a ${format(new Date(absence.end_date), 'dd/MM/yyyy')}`,
          link: `/ausencias/${absence.id}`,
          actionText: 'Analisar',
          metadata: {
            employeeName: absence.employee.name,
            employeePosition: absence.employee.position,
            managerName: manager.name,
            absenceType: absence.type,
            startDate: absence.start_date,
            endDate: absence.end_date,
            days,
            reason: absence.reason,
          },
          sendEmail: true,
          emailTo: manager.email,
        });
      }
    }
  }

  private async notifyMissingTimeRecord(employee: any, date: Date) {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', employee.id)
      .single();

    if (profile) {
      await this.sendNotification({
        companyId: employee.company_id,
        userId: profile.id,
        type: 'time_missing',
        priority: 'medium',
        title: 'Ponto não registrado',
        message: `Você não registrou a saída hoje. Por favor, regularize seu ponto.`,
        link: `/ponto/registro`,
        actionText: 'Registrar ponto',
        metadata: { employeeName: employee.name, date },
        sendEmail: true,
        emailTo: employee.email,
      });
    }
  }

  private async notifyComplianceViolation(violation: any) {
    // Notificar RH
    const { data: hrUsers } = await this.supabase
      .from('profiles')
      .select('id, email, name')
      .eq('company_id', violation.employee.company_id)
      .in('role', ['company_admin', 'hr_manager']);

    for (const user of hrUsers || []) {
      await this.sendNotification({
        companyId: violation.employee.company_id,
        userId: user.id,
        type: 'compliance_violation',
        priority: 'urgent',
        title: `Violação de compliance - ${violation.employee.name}`,
        message: `${violation.violation_type}: ${violation.description}`,
        link: `/relatorios/compliance`,
        actionText: 'Ver detalhes',
        metadata: {
          employeeName: violation.employee.name,
          violationType: violation.violation_type,
          date: violation.alert_date,
        },
        sendEmail: true,
        emailTo: user.email,
      });
    }
  }
}
