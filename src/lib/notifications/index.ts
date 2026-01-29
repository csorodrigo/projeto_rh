/**
 * Notifications Module
 * Export central para todas as funcionalidades de notificações
 */

export { NotificationEngine } from './engine';
export type { NotificationData } from './engine';

export { sendEmail, sendBatchEmails, isValidEmail } from './email-sender';
export type { EmailParams, EmailResult } from './email-sender';

export { baseEmailTemplate } from './templates/base-template';
export type { EmailTemplateProps } from './templates/base-template';

export { getEmailTemplate } from './templates/notification-templates';
export type { NotificationTemplateData } from './templates/notification-templates';

export {
  getUnreadNotifications,
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  subscribeToNotifications,
  getNotificationStats,
} from '@/lib/supabase/queries/notifications';
