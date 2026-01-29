/**
 * Phase 8 Integration Points
 *
 * Este arquivo centraliza todos os pontos de integração entre os módulos da Fase 8
 * e o sistema existente.
 */

import { createClient } from '@/lib/supabase/client'
import type {
  AnalyticsDashboard,
  TurnoverMetrics,
  AbsenteeismMetrics,
  PredictionResult
} from '@/types/analytics'

// ============================================
// PWA Integration
// ============================================

/**
 * Registrar Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('[PWA] Service Worker registered:', registration.scope)

    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível
            console.log('[PWA] New version available')
            // Notificar usuário para atualizar
            if (confirm('Nova versão disponível. Deseja atualizar?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Verificar se app está instalado
 */
export function isPWAInstalled(): boolean {
  // Chrome/Edge
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // iOS
  if ((window.navigator as any).standalone === true) {
    return true
  }

  return false
}

/**
 * Verificar se é possível instalar
 */
export function canInstallPWA(): boolean {
  return !isPWAInstalled() && 'serviceWorker' in navigator
}

// ============================================
// Analytics Integration
// ============================================

/**
 * Buscar dados de Analytics com cache
 */
export async function fetchAnalyticsData(
  period: string = '30d',
  useCache: boolean = true
): Promise<AnalyticsDashboard | null> {
  const cacheKey = `analytics-${period}`

  // Verificar cache (5 minutos)
  if (useCache) {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const data = JSON.parse(cached)
      const age = Date.now() - data.timestamp
      if (age < 5 * 60 * 1000) { // 5 minutos
        return data.value
      }
    }
  }

  try {
    const response = await fetch(`/api/analytics/dashboard?period=${period}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    // Cachear
    sessionStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      value: data
    }))

    return data
  } catch (error) {
    console.error('[Analytics] Failed to fetch data:', error)
    return null
  }
}

/**
 * Integrar Analytics com Dashboard Principal
 */
export async function getAnalyticsWidgets() {
  const data = await fetchAnalyticsData('7d')
  if (!data) return []

  return [
    {
      type: 'kpi',
      title: 'Turnover',
      value: `${data.turnover.rate}%`,
      trend: data.turnover.rate < 10 ? 'good' : 'warning',
      link: '/analytics/turnover'
    },
    {
      type: 'kpi',
      title: 'Absenteísmo',
      value: `${data.absenteeism.rate}%`,
      trend: data.absenteeism.rate < 3 ? 'good' : 'warning',
      link: '/analytics/absenteeism'
    },
    {
      type: 'insight',
      title: 'Insight do Dia',
      content: data.insights[0]?.description || 'Nenhum insight hoje',
      impact: data.insights[0]?.impact || 'low'
    }
  ]
}

// ============================================
// Chatbot Integration
// ============================================

/**
 * Inicializar chatbot com contexto do usuário
 */
export async function initializeChatbot() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar dados do usuário para contexto
  const { data: employee } = await supabase
    .from('employees')
    .select('*, company:companies(*)')
    .eq('email', user.email)
    .single()

  return {
    userId: user.id,
    employeeId: employee?.id,
    companyId: employee?.company_id,
    context: {
      name: employee?.first_name,
      department: employee?.department,
      position: employee?.position,
      hireDate: employee?.hire_date
    }
  }
}

/**
 * Enviar mensagem ao chatbot
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<{
  message: string
  conversationId: string
  suggestedActions?: any[]
}> {
  const context = await initializeChatbot()

  const response = await fetch('/api/chatbot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationId,
      userId: context?.userId,
      context: context?.context
    })
  })

  if (!response.ok) {
    throw new Error(`Chatbot error: ${response.status}`)
  }

  return response.json()
}

// ============================================
// Organogram Integration
// ============================================

/**
 * Buscar estrutura organizacional
 */
export async function fetchOrganizationTree(rootId?: string) {
  const supabase = createClient()

  // Buscar empresa do usuário
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('employees')
    .select('company_id')
    .eq('email', user.email)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Buscar hierarquia
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('status', 'active')
    .order('first_name')

  if (error) throw error

  // Construir árvore
  return buildOrganizationTree(employees, rootId)
}

/**
 * Construir árvore hierárquica
 */
function buildOrganizationTree(employees: any[], rootId?: string) {
  const employeeMap = new Map()
  employees.forEach(emp => employeeMap.set(emp.id, { ...emp, subordinates: [] }))

  const roots: any[] = []

  employees.forEach(emp => {
    const employee = employeeMap.get(emp.id)

    if (emp.manager_id && employeeMap.has(emp.manager_id)) {
      const manager = employeeMap.get(emp.manager_id)
      manager.subordinates.push(employee)
    } else {
      roots.push(employee)
    }
  })

  // Se rootId especificado, retornar apenas essa sub-árvore
  if (rootId) {
    return employeeMap.get(rootId) || null
  }

  // Retornar primeiro root (CEO)
  return roots[0] || null
}

// ============================================
// Push Notifications Integration
// ============================================

/**
 * Solicitar permissão para notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission()
  }

  return Notification.permission
}

/**
 * Registrar subscription de push
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    return null
  }

  const registration = await navigator.serviceWorker.ready

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      )
    })

    // Enviar subscription para o servidor
    await fetch('/api/pwa/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: (await createClient().auth.getUser()).data.user?.id
      })
    })

    return subscription
  } catch (error) {
    console.error('[Push] Subscribe failed:', error)
    return null
  }
}

/**
 * Converter VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ============================================
// Offline Sync Integration
// ============================================

/**
 * Armazenar ação offline
 */
export async function storeOfflineAction(action: {
  type: string
  data: any
  timestamp: Date
}) {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not supported')
    return
  }

  const db = await openOfflineDB()
  const tx = db.transaction(['pending-actions'], 'readwrite')
  const store = tx.objectStore('pending-actions')

  await store.add({
    ...action,
    timestamp: action.timestamp.toISOString()
  })
}

/**
 * Sincronizar ações pendentes
 */
export async function syncOfflineActions() {
  const db = await openOfflineDB()
  const tx = db.transaction(['pending-actions'], 'readonly')
  const store = tx.objectStore('pending-actions')
  const actions = await store.getAll()

  if (actions.length === 0) {
    console.log('[Sync] No pending actions')
    return
  }

  console.log(`[Sync] Syncing ${actions.length} actions`)

  const response = await fetch('/api/pwa/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: actions })
  })

  if (response.ok) {
    // Limpar ações sincronizadas
    const txClear = db.transaction(['pending-actions'], 'readwrite')
    const storeClear = txClear.objectStore('pending-actions')
    await storeClear.clear()

    console.log('[Sync] Actions synced successfully')
  }
}

/**
 * Abrir banco IndexedDB
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rh-sesame-db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', {
          keyPath: 'id',
          autoIncrement: true
        })
      }
    }
  })
}

// ============================================
// Feature Flags Integration
// ============================================

/**
 * Verificar se feature está habilitada
 */
export function isFeatureEnabled(feature: string): boolean {
  const flags = {
    pwa: process.env.NEXT_PUBLIC_PWA_ENABLED === 'true',
    chatbot: process.env.NEXT_PUBLIC_CHATBOT_ENABLED === 'true',
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    organogram: process.env.NEXT_PUBLIC_ORGANOGRAM_ENABLED === 'true',
    predictions: process.env.NEXT_PUBLIC_PREDICTIONS_ENABLED === 'true',
    push_notifications: process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED === 'true'
  }

  return flags[feature as keyof typeof flags] || false
}

/**
 * Obter features habilitadas
 */
export function getEnabledFeatures() {
  return {
    pwa: isFeatureEnabled('pwa'),
    chatbot: isFeatureEnabled('chatbot'),
    analytics: isFeatureEnabled('analytics'),
    organogram: isFeatureEnabled('organogram'),
    predictions: isFeatureEnabled('predictions'),
    pushNotifications: isFeatureEnabled('push_notifications')
  }
}

// ============================================
// Initialize All Phase 8 Features
// ============================================

/**
 * Inicializar todas as features da Fase 8
 */
export async function initializePhase8() {
  console.log('[Phase 8] Initializing...')

  const features = getEnabledFeatures()

  // PWA
  if (features.pwa) {
    await registerServiceWorker()

    // Verificar se está online
    window.addEventListener('online', () => {
      console.log('[PWA] Online - syncing...')
      syncOfflineActions()
    })

    window.addEventListener('offline', () => {
      console.log('[PWA] Offline mode')
    })
  }

  // Push Notifications
  if (features.pushNotifications && features.pwa) {
    // Não solicitar automaticamente, deixar usuário decidir
    console.log('[Push] Ready to subscribe')
  }

  // Chatbot
  if (features.chatbot) {
    await initializeChatbot()
    console.log('[Chatbot] Initialized')
  }

  console.log('[Phase 8] Initialization complete', features)
}
