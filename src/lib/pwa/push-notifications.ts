"use client";

/**
 * Sistema de Push Notifications para PWA
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Verificar se push notifications são suportadas
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Obter status da permissão de notificação
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Solicitar permissão de notificação
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notificações não suportadas');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permissão:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Erro ao solicitar permissão:', error);
    return 'denied';
  }
}

/**
 * Converter chave VAPID de base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Inscrever usuário para push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscriptionData | null> {
  if (!isPushNotificationSupported()) {
    console.warn('[Push] Push notifications não suportadas');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Verificar se já existe inscrição
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Criar nova inscrição
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('[Push] Inscrito com sucesso');
    } else {
      console.log('[Push] Já inscrito');
    }

    // Converter para formato serializado
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    };

    return subscriptionData;
  } catch (error) {
    console.error('[Push] Erro ao inscrever:', error);
    return null;
  }
}

/**
 * Cancelar inscrição de push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('[Push] Desinscrição:', success ? 'sucesso' : 'falhou');
      return success;
    }

    return false;
  } catch (error) {
    console.error('[Push] Erro ao desinscrever:', error);
    return false;
  }
}

/**
 * Obter inscrição atual
 */
export async function getCurrentSubscription(): Promise<PushSubscriptionData | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return null;
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    };
  } catch (error) {
    console.error('[Push] Erro ao obter inscrição:', error);
    return null;
  }
}

/**
 * Mostrar notificação local (sem push)
 */
export async function showLocalNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notificações não suportadas');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push] Permissão de notificação não concedida');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag || 'default',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
    };

    if (payload.actions && payload.actions.length > 0) {
      options.actions = payload.actions;
    }

    await registration.showNotification(payload.title, options);
  } catch (error) {
    console.error('[Push] Erro ao mostrar notificação:', error);
  }
}

/**
 * Enviar notificação teste
 */
export async function sendTestNotification(): Promise<void> {
  await showLocalNotification({
    title: 'Sistema RH - Teste',
    body: 'Esta é uma notificação de teste. As notificações estão funcionando!',
    tag: 'test-notification',
    data: { type: 'test' },
  });
}

/**
 * Notificação de lembrete de ponto
 */
export async function sendClockReminder(type: 'entry' | 'exit'): Promise<void> {
  const title = type === 'entry' ? 'Lembrete de Entrada' : 'Lembrete de Saída';
  const body =
    type === 'entry'
      ? 'Não esqueça de bater o ponto de entrada!'
      : 'Não esqueça de bater o ponto de saída!';

  await showLocalNotification({
    title,
    body,
    tag: 'clock-reminder',
    requireInteraction: true,
    data: {
      type: 'clock-reminder',
      action: type,
      url: '/ponto/mobile',
    },
    actions: [
      {
        action: 'open',
        title: 'Bater Ponto',
      },
      {
        action: 'dismiss',
        title: 'Depois',
      },
    ],
  });
}

/**
 * Notificação de aprovação de ausência
 */
export async function sendAbsenceApprovalNotification(
  status: 'approved' | 'rejected',
  period: string
): Promise<void> {
  const title =
    status === 'approved' ? 'Ausência Aprovada' : 'Ausência Rejeitada';
  const body =
    status === 'approved'
      ? `Sua solicitação de ausência para ${period} foi aprovada!`
      : `Sua solicitação de ausência para ${period} foi rejeitada.`;

  await showLocalNotification({
    title,
    body,
    tag: 'absence-approval',
    data: {
      type: 'absence-approval',
      status,
      url: '/ausencias/mobile',
    },
  });
}

/**
 * Notificação de novo holerite disponível
 */
export async function sendPayslipNotification(month: string): Promise<void> {
  await showLocalNotification({
    title: 'Novo Holerite Disponível',
    body: `Seu holerite de ${month} está disponível para visualização.`,
    tag: 'new-payslip',
    data: {
      type: 'new-payslip',
      month,
      url: '/folha/mobile',
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Holerite',
      },
    ],
  });
}

/**
 * Converter ArrayBuffer para Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Configurar handlers de notificação (deve ser chamado uma vez no app)
 */
export function setupNotificationHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Listener para quando o SW mostra uma notificação
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'notification-clicked') {
      console.log('[Push] Notificação clicada:', event.data);

      // Navegar para URL se fornecida
      if (event.data.url) {
        window.location.href = event.data.url;
      }
    }
  });
}

/**
 * Salvar subscription no servidor
 */
export async function saveSubscriptionToServer(
  subscription: PushSubscriptionData
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Erro ao salvar subscription no servidor:', error);
    return false;
  }
}

/**
 * Remover subscription do servidor
 */
export async function removeSubscriptionFromServer(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Erro ao remover subscription do servidor:', error);
    return false;
  }
}

/**
 * Chave VAPID pública (deve ser gerada no servidor)
 * Esta é uma chave de exemplo - deve ser substituída por uma real
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrGrYXd-F6s_qNr5X_ZfXQCN3VoKFGV3cZ_Oc7CqQ8b8H9bvgRE';
