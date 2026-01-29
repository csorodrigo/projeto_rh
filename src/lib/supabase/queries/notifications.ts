/**
 * Supabase Queries - Notifications
 * Funções para gerenciar notificações
 */

import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationPreferences } from '@/types/database';

/**
 * Buscar notificações não lidas do usuário
 */
export async function getUnreadNotifications(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Notification[];
}

/**
 * Buscar todas as notificações com paginação
 */
export async function getAllNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  filter: 'all' | 'unread' | 'read' = 'all'
) {
  const supabase = createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('archived', false);

  if (filter === 'unread') {
    query = query.eq('read', false);
  } else if (filter === 'read') {
    query = query.eq('read', true);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    notifications: data as Notification[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Contar notificações não lidas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    .eq('archived', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllAsRead(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false)
    .eq('archived', false);

  if (error) throw error;
}

/**
 * Arquivar notificação
 */
export async function archiveNotification(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Buscar preferências de notificação do usuário
 */
export async function getNotificationPreferences(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as NotificationPreferences | null;
}

/**
 * Atualizar preferências de notificação
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
    })
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
}

/**
 * Subscrever a notificações em tempo real
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Buscar estatísticas de notificações
 */
export async function getNotificationStats(userId: string) {
  const supabase = createClient();

  const [unreadResult, totalResult, todayResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .eq('archived', false),

    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('archived', false),

    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ]);

  return {
    unread: unreadResult.count || 0,
    total: totalResult.count || 0,
    today: todayResult.count || 0,
  };
}
