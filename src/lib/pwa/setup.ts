"use client";

/**
 * Setup e configuração do PWA
 */

export interface ServiceWorkerStatus {
  registered: boolean;
  installing: boolean;
  waiting: boolean;
  active: boolean;
  error?: string;
}

/**
 * Registrar Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerStatus> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      registered: false,
      installing: false,
      waiting: false,
      active: false,
      error: 'Service Worker não suportado',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registrado:', registration.scope);

    const status: ServiceWorkerStatus = {
      registered: true,
      installing: !!registration.installing,
      waiting: !!registration.waiting,
      active: !!registration.active,
    };

    // Listener para atualização
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[PWA] Nova versão do Service Worker encontrada');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] Nova versão disponível');
          // Disparar evento customizado para notificar o app
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    return status;
  } catch (error) {
    console.error('[PWA] Erro ao registrar Service Worker:', error);
    return {
      registered: false,
      installing: false,
      waiting: false,
      active: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Verificar se há atualizações do Service Worker
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error('[PWA] Erro ao verificar atualizações:', error);
    return false;
  }
}

/**
 * Ativar atualização do Service Worker
 */
export function activateUpdate(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
}

/**
 * Solicitar permissão para notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notificações não suportadas');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Verificar se o app está em modo standalone (instalado)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // iOS
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Android/Chrome
  const isAndroidStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return isIOSStandalone || isAndroidStandalone;
}

/**
 * Verificar se é um dispositivo mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Interface do evento de instalação
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Capturar evento de instalação
 */
export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt capturado');
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalado com sucesso');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Mostrar prompt de instalação
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    console.warn('[PWA] Prompt de instalação não disponível');
    return 'unavailable';
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Escolha do usuário:', outcome);
    deferredPrompt = null;
    return outcome;
  } catch (error) {
    console.error('[PWA] Erro ao mostrar prompt:', error);
    return 'unavailable';
  }
}

/**
 * Verificar se o prompt de instalação está disponível
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Verificar status online/offline
 */
export function getOnlineStatus(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Adicionar listeners de status de conexão
 */
export function addConnectionListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Vibrar dispositivo (haptic feedback)
 */
export function vibrate(pattern: number | number[]): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return false;
  }

  return navigator.vibrate(pattern);
}

/**
 * Cache de URLs específicas
 */
export async function cacheUrls(urls: string[]): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active) {
    registration.active.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }
}

/**
 * Limpar cache antigo
 */
export async function clearOldCache(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('rh-sesame-') && name !== 'rh-sesame-v1')
      .map((name) => caches.delete(name))
  );
}

/**
 * Obter informações de armazenamento
 */
export async function getStorageInfo(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  } catch (error) {
    console.error('[PWA] Erro ao obter info de armazenamento:', error);
    return null;
  }
}

/**
 * Inicializar PWA (registrar SW e capturar install prompt)
 */
export async function initializePWA(): Promise<ServiceWorkerStatus> {
  captureInstallPrompt();
  return await registerServiceWorker();
}
