/**
 * Email Templates for Notifications
 * Templates específicos para cada tipo de notificação
 */

import { baseEmailTemplate } from './base-template';
import { NotificationType } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface NotificationTemplateData {
  employeeName?: string;
  employeePosition?: string;
  managerName?: string;
  date?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  days?: number;
  absenceType?: string;
  reason?: string;
  documentType?: string;
  violationType?: string;
  companyName?: string;
  link?: string;
}

export function getEmailTemplate(
  type: NotificationType,
  data: NotificationTemplateData
): { subject: string; html: string } {
  switch (type) {
    case 'birthday':
      return birthdayTemplate(data);
    case 'work_anniversary':
      return workAnniversaryTemplate(data);
    case 'vacation_expiring':
      return vacationExpiringTemplate(data);
    case 'absence_pending':
      return absencePendingTemplate(data);
    case 'absence_approved':
      return absenceApprovedTemplate(data);
    case 'absence_rejected':
      return absenceRejectedTemplate(data);
    case 'time_missing':
      return timeMissingTemplate(data);
    case 'compliance_violation':
      return complianceViolationTemplate(data);
    case 'document_expiring':
      return documentExpiringTemplate(data);
    case 'aso_expiring':
      return asoExpiringTemplate(data);
    default:
      return defaultTemplate(data);
  }
}

function birthdayTemplate(data: NotificationTemplateData) {
  const formattedDate = data.date
    ? format(new Date(data.date), "d 'de' MMMM", { locale: ptBR })
    : 'amanhã';

  return {
    subject: `🎉 Aniversário de ${data.employeeName}`,
    html: baseEmailTemplate({
      title: '🎉 Aniversário Amanhã!',
      preheader: `${data.employeeName} faz aniversário amanhã`,
      content: `
        <p>Olá!</p>
        <p>Não esqueça: <strong>${formattedDate}</strong> é aniversário de <strong>${data.employeeName}</strong>
        ${data.employeePosition ? `, ${data.employeePosition}` : ''}!</p>
        <p>Que tal enviar uma mensagem de parabéns? 🎂</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver perfil',
      companyName: data.companyName,
    }),
  };
}

function workAnniversaryTemplate(data: NotificationTemplateData) {
  return {
    subject: `🎊 Aniversário de Empresa - ${data.employeeName}`,
    html: baseEmailTemplate({
      title: '🎊 Aniversário de Empresa!',
      preheader: `${data.employeeName} completa ${data.days} ano(s) na empresa`,
      content: `
        <p>Parabéns, <strong>${data.employeeName}</strong>!</p>
        <p>Hoje você completa <strong>${data.days} ${data.days === 1 ? 'ano' : 'anos'}</strong> de dedicação à empresa! 🎉</p>
        <p>Agradecemos sua contribuição e comprometimento ao longo deste tempo.</p>
        <p>Desejamos muito sucesso e realizações em sua jornada conosco!</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver seu perfil',
      companyName: data.companyName,
    }),
  };
}

function vacationExpiringTemplate(data: NotificationTemplateData) {
  return {
    subject: `⏰ Suas férias vencem em ${data.days} dias`,
    html: baseEmailTemplate({
      title: '⏰ Férias Vencendo',
      preheader: `Você possui férias que vencem em ${data.days} dias`,
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Este é um lembrete importante: você possui <strong>férias que vencem em ${data.days} dias</strong>.</p>
        <p>É necessário agendar suas férias o quanto antes para não perder o direito.</p>
        <p>Entre em contato com o RH ou solicite suas férias pelo sistema.</p>
      `,
      actionUrl: data.link,
      actionText: 'Solicitar férias',
      companyName: data.companyName,
    }),
  };
}

function absencePendingTemplate(data: NotificationTemplateData) {
  const startDateFormatted = data.startDate
    ? format(new Date(data.startDate), "dd/MM/yyyy", { locale: ptBR })
    : '';
  const endDateFormatted = data.endDate
    ? format(new Date(data.endDate), "dd/MM/yyyy", { locale: ptBR })
    : '';

  return {
    subject: `📋 Nova solicitação de ausência - ${data.employeeName}`,
    html: baseEmailTemplate({
      title: '📋 Ausência Pendente de Aprovação',
      preheader: `${data.employeeName} solicitou ${data.absenceType}`,
      content: `
        <p>Olá, <strong>${data.managerName}</strong>!</p>
        <p><strong>${data.employeeName}</strong> solicitou uma ausência que requer sua aprovação:</p>
        <ul style="line-height: 2;">
          <li><strong>Tipo:</strong> ${data.absenceType}</li>
          <li><strong>Período:</strong> ${startDateFormatted} a ${endDateFormatted}</li>
          <li><strong>Dias:</strong> ${data.days} ${data.days === 1 ? 'dia' : 'dias'}</li>
          ${data.reason ? `<li><strong>Motivo:</strong> ${data.reason}</li>` : ''}
        </ul>
        <p>Por favor, analise e aprove ou rejeite esta solicitação.</p>
      `,
      actionUrl: data.link,
      actionText: 'Analisar solicitação',
      companyName: data.companyName,
    }),
  };
}

function absenceApprovedTemplate(data: NotificationTemplateData) {
  const startDateFormatted = data.startDate
    ? format(new Date(data.startDate), "dd/MM/yyyy", { locale: ptBR })
    : '';
  const endDateFormatted = data.endDate
    ? format(new Date(data.endDate), "dd/MM/yyyy", { locale: ptBR })
    : '';

  return {
    subject: `✅ Ausência aprovada`,
    html: baseEmailTemplate({
      title: '✅ Ausência Aprovada!',
      preheader: 'Sua solicitação de ausência foi aprovada',
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Sua solicitação de <strong>${data.absenceType}</strong> foi <span style="color: #059669; font-weight: 600;">aprovada</span>!</p>
        <ul style="line-height: 2;">
          <li><strong>Período:</strong> ${startDateFormatted} a ${endDateFormatted}</li>
          <li><strong>Dias:</strong> ${data.days} ${data.days === 1 ? 'dia' : 'dias'}</li>
        </ul>
        <p>Aproveite seu período de ausência!</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver detalhes',
      companyName: data.companyName,
    }),
  };
}

function absenceRejectedTemplate(data: NotificationTemplateData) {
  return {
    subject: `❌ Ausência não aprovada`,
    html: baseEmailTemplate({
      title: '❌ Ausência Não Aprovada',
      preheader: 'Sua solicitação de ausência foi recusada',
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Infelizmente, sua solicitação de <strong>${data.absenceType}</strong> foi <span style="color: #DC2626; font-weight: 600;">recusada</span>.</p>
        ${data.reason ? `<p><strong>Motivo:</strong> ${data.reason}</p>` : ''}
        <p>Entre em contato com seu gestor ou RH para mais informações.</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver detalhes',
      companyName: data.companyName,
    }),
  };
}

function timeMissingTemplate(data: NotificationTemplateData) {
  const dateFormatted = data.date
    ? format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR })
    : 'hoje';

  return {
    subject: `⏰ Registro de ponto pendente`,
    html: baseEmailTemplate({
      title: '⏰ Ponto Não Registrado',
      preheader: 'Você esqueceu de registrar a saída',
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Notamos que você não registrou a <strong>saída</strong> em <strong>${dateFormatted}</strong>.</p>
        <p>Por favor, regularize seu registro de ponto o quanto antes.</p>
      `,
      actionUrl: data.link,
      actionText: 'Registrar ponto',
      companyName: data.companyName,
    }),
  };
}

function complianceViolationTemplate(data: NotificationTemplateData) {
  return {
    subject: `⚠️ Alerta de Compliance - ${data.employeeName}`,
    html: baseEmailTemplate({
      title: '⚠️ Violação de Compliance Detectada',
      preheader: `Violação detectada: ${data.violationType}`,
      content: `
        <p>Olá,</p>
        <p>Foi detectada uma violação de compliance que requer atenção:</p>
        <ul style="line-height: 2;">
          <li><strong>Funcionário:</strong> ${data.employeeName}</li>
          <li><strong>Tipo:</strong> ${data.violationType}</li>
          ${data.date ? `<li><strong>Data:</strong> ${format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR })}</li>` : ''}
        </ul>
        <p>Esta situação requer ação imediata do RH.</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver detalhes',
      companyName: data.companyName,
    }),
  };
}

function documentExpiringTemplate(data: NotificationTemplateData) {
  return {
    subject: `📄 Documento vencendo - ${data.documentType}`,
    html: baseEmailTemplate({
      title: '📄 Documento Vencendo',
      preheader: `${data.documentType} vence em ${data.days} dias`,
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Seu documento <strong>${data.documentType}</strong> vence em <strong>${data.days} dias</strong>.</p>
        <p>Por favor, providencie a renovação do documento o quanto antes.</p>
      `,
      actionUrl: data.link,
      actionText: 'Atualizar documento',
      companyName: data.companyName,
    }),
  };
}

function asoExpiringTemplate(data: NotificationTemplateData) {
  return {
    subject: `🏥 ASO vencendo em ${data.days} dias`,
    html: baseEmailTemplate({
      title: '🏥 ASO Vencendo',
      preheader: `Seu exame médico vence em ${data.days} dias`,
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Seu Atestado de Saúde Ocupacional (ASO) vence em <strong>${data.days} dias</strong>.</p>
        <p>É necessário agendar um novo exame médico. Entre em contato com o RH para mais informações.</p>
      `,
      actionUrl: data.link,
      actionText: 'Agendar exame',
      companyName: data.companyName,
    }),
  };
}

function defaultTemplate(data: NotificationTemplateData) {
  return {
    subject: 'Notificação do Sistema RH',
    html: baseEmailTemplate({
      title: 'Notificação',
      content: `
        <p>Olá, <strong>${data.employeeName || 'Usuário'}</strong>!</p>
        <p>Você tem uma nova notificação no sistema.</p>
      `,
      actionUrl: data.link,
      actionText: 'Ver notificação',
      companyName: data.companyName,
    }),
  };
}
