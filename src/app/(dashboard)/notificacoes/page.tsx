"use client"

/**
 * Notifications Page
 * Centro de notificações completo
 */

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Archive, Trash2, Filter, Search } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  getNotificationStats,
} from '@/lib/supabase/queries/notifications';
import { Notification, NotificationType } from '@/types/database';
import Link from 'next/link';

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
  birthday: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  work_anniversary: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  vacation_expiring: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  absence_pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  absence_approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  absence_rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  time_missing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  compliance_violation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  document_expiring: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  aso_expiring: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  new_employee: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  payroll_ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function NotificationsPage() {
  // TODO: Get real user ID from auth
  const userId = 'user-id-placeholder';

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ unread: 0, total: 0, today: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [activeTab, page]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const result = await getAllNotifications(userId, page, 20, activeTab);
      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await getNotificationStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      toast.success('Marcada como lida');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Erro ao marcar como lida');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(userId);
      await loadNotifications();
      await loadStats();
      toast.success('Todas marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar todas como lidas');
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    }
  }

  async function handleArchive(notificationId: string) {
    try {
      await archiveNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notificação arquivada');
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast.error('Erro ao arquivar notificação');
    }
  }

  function formatRelativeTime(date: string) {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  }

  const filteredNotifications = notifications.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as notificações e alertas do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Não lidas</p>
              <p className="text-2xl font-bold">{stats.unread}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Bell className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Archive className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hoje</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Link href="/configuracoes/notificacoes">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Preferências
            </Button>
          </Link>
          {stats.unread > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            Todas
            {stats.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas
            {stats.unread > 0 && (
              <Badge variant="default" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Lidas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Nenhuma notificação encontrada com esse critério'
                    : 'Você está em dia com tudo!'}
                </p>
              </div>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onArchive={handleArchive}
                formatRelativeTime={formatRelativeTime}
              />
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      onClick={() => setPage(pageNum)}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  formatRelativeTime: (date: string) => string;
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  formatRelativeTime,
}: NotificationCardProps) {
  const icon = notificationIcons[notification.type] || 'ℹ️';
  const colorClass = notificationColors[notification.type] || 'bg-gray-100 text-gray-700';

  const content = (
    <Card
      className={cn(
        'p-6 transition-all hover:shadow-md group',
        !notification.read && 'border-l-4 border-l-primary'
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl',
            colorClass
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base">{notification.title}</h3>
                {!notification.read && (
                  <Badge variant="default" className="text-xs">
                    Nova
                  </Badge>
                )}
                {notification.priority === 'urgent' && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs bg-orange-500">
                    Alta
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onArchive(notification.id)}
                title="Arquivar"
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(notification.id)}
                title="Excluir"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.created_at)}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            {notification.action_text && notification.link && (
              <Link href={notification.link}>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  {notification.action_text} →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (notification.link && !notification.read) {
    return (
      <div onClick={() => onMarkAsRead(notification.id)}>
        <Link href={notification.link}>{content}</Link>
      </div>
    );
  }

  return content;
}
