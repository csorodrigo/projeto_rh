"use client"

/**
 * Notification Bell Component
 * Sino de notificações no header com dropdown
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Archive, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from '@/lib/supabase/queries/notifications';
import { Notification, NotificationType } from '@/types/database';

const notificationIcons: Record<NotificationType, string> = {
  birthday: '🎉',
  work_anniversary: '🎊',
  vacation_expiring: '⏰',
  absence_pending: '📋',
  absence_approved: '✅',
  absence_rejected: '❌',
  time_missing: '⏰',
  compliance_violation: '⚠️',
  document_expiring: '📄',
  aso_expiring: '🏥',
  new_employee: '👤',
  payroll_ready: '💰',
  system: 'ℹ️',
};

const notificationColors: Record<NotificationType, string> = {
  birthday: 'text-pink-600',
  work_anniversary: 'text-purple-600',
  vacation_expiring: 'text-orange-600',
  absence_pending: 'text-blue-600',
  absence_approved: 'text-green-600',
  absence_rejected: 'text-red-600',
  time_missing: 'text-yellow-600',
  compliance_violation: 'text-red-700',
  document_expiring: 'text-orange-600',
  aso_expiring: 'text-teal-600',
  new_employee: 'text-indigo-600',
  payroll_ready: 'text-green-700',
  system: 'text-gray-600',
};

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar notificações
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [userId]);

  // Subscrever a notificações em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Mostrar toast
      toast.info(notification.title, {
        description: notification.message,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await getUnreadNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  async function handleMarkAsRead(notificationId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await markAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Marcada como lida');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Erro ao marcar como lida');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(userId);
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Todas marcadas como lidas');
      setOpen(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar todas como lidas');
    }
  }

  async function handleDelete(notificationId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    }
  }

  function formatRelativeTime(date: string) {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full p-0 text-[10px] animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está em dia com tudo!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Link href="/notificacoes" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-center text-sm">
              Ver todas as notificações
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string, event: React.MouseEvent) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  formatRelativeTime: (date: string) => string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  formatRelativeTime,
}: NotificationItemProps) {
  const icon = notificationIcons[notification.type] || 'ℹ️';
  const color = notificationColors[notification.type] || 'text-gray-600';

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer group',
        !notification.read && 'bg-accent/30'
      )}
    >
      <div className={cn('text-2xl shrink-0', color)}>{icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-sm leading-tight">{notification.title}</p>
          {!notification.read && (
            <span className="size-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.created_at)}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => onMarkAsRead(notification.id, e)}
              title="Marcar como lida"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => onDelete(notification.id, e)}
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={() => onMarkAsRead(notification.id, {} as any)}>
        {content}
      </Link>
    );
  }

  return content;
}
