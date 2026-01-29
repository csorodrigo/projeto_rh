/**
 * Feature Flags System
 *
 * Controla quais funcionalidades da Fase 8 estão habilitadas.
 * Permite rollout gradual e A/B testing.
 */

// ============================================
// Feature Flags Configuration
// ============================================

export const FEATURES = {
  // PWA
  pwa_enabled: process.env.NEXT_PUBLIC_PWA_ENABLED === 'true',
  pwa_offline_sync: process.env.NEXT_PUBLIC_PWA_ENABLED === 'true',
  pwa_install_prompt: process.env.NEXT_PUBLIC_PWA_ENABLED === 'true',

  // Chatbot
  chatbot_enabled: process.env.NEXT_PUBLIC_CHATBOT_ENABLED === 'true',
  chatbot_ai_mode: process.env.CHATBOT_ENABLED === 'true', // Requer OpenAI key
  chatbot_knowledge_base: true, // Sempre habilitado

  // Analytics
  analytics_enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  analytics_predictions: process.env.NEXT_PUBLIC_PREDICTIONS_ENABLED === 'true',
  analytics_benchmarks: false, // Beta - requer API de benchmark
  analytics_export: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',

  // Organogram
  organogram_enabled: process.env.NEXT_PUBLIC_ORGANOGRAM_ENABLED === 'true',
  organogram_edit_mode: false, // Beta - edição drag & drop
  organogram_export: process.env.NEXT_PUBLIC_ORGANOGRAM_ENABLED === 'true',

  // Push Notifications
  push_notifications_enabled: process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED === 'true',
  push_notifications_auto_prompt: false, // Não pedir automaticamente

  // Advanced Features (Beta)
  ai_insights_daily: process.env.CHATBOT_ENABLED === 'true',
  headcount_projection: process.env.NEXT_PUBLIC_PREDICTIONS_ENABLED === 'true',
  turnover_prediction: process.env.NEXT_PUBLIC_PREDICTIONS_ENABLED === 'true',

  // Experimental (não habilitar em produção)
  voice_chatbot: false,
  organogram_3d: false,
  real_time_analytics: false,
} as const

export type FeatureName = keyof typeof FEATURES

// ============================================
// Feature Flag Functions
// ============================================

/**
 * Verificar se uma feature está habilitada
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return FEATURES[feature] === true
}

/**
 * Verificar múltiplas features (todas devem estar habilitadas)
 */
export function areFeaturesEnabled(...features: FeatureName[]): boolean {
  return features.every(feature => isFeatureEnabled(feature))
}

/**
 * Verificar se qualquer feature está habilitada (OR)
 */
export function isAnyFeatureEnabled(...features: FeatureName[]): boolean {
  return features.some(feature => isFeatureEnabled(feature))
}

/**
 * Obter todas as features habilitadas
 */
export function getEnabledFeatures(): FeatureName[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureName)
}

/**
 * Obter status de todas as features
 */
export function getAllFeatures(): Record<FeatureName, boolean> {
  return { ...FEATURES }
}

// ============================================
// Phase 8 Feature Groups
// ============================================

export const FEATURE_GROUPS = {
  pwa: [
    'pwa_enabled',
    'pwa_offline_sync',
    'pwa_install_prompt'
  ] as FeatureName[],

  chatbot: [
    'chatbot_enabled',
    'chatbot_ai_mode',
    'chatbot_knowledge_base'
  ] as FeatureName[],

  analytics: [
    'analytics_enabled',
    'analytics_predictions',
    'analytics_benchmarks',
    'analytics_export'
  ] as FeatureName[],

  organogram: [
    'organogram_enabled',
    'organogram_edit_mode',
    'organogram_export'
  ] as FeatureName[],

  notifications: [
    'push_notifications_enabled',
    'push_notifications_auto_prompt'
  ] as FeatureName[],

  ai: [
    'chatbot_ai_mode',
    'ai_insights_daily',
    'turnover_prediction',
    'headcount_projection'
  ] as FeatureName[]
}

/**
 * Verificar se um grupo de features está totalmente habilitado
 */
export function isFeatureGroupEnabled(group: keyof typeof FEATURE_GROUPS): boolean {
  const features = FEATURE_GROUPS[group]
  return features.every(feature => isFeatureEnabled(feature))
}

/**
 * Verificar se um grupo está parcialmente habilitado
 */
export function isFeatureGroupPartiallyEnabled(group: keyof typeof FEATURE_GROUPS): boolean {
  const features = FEATURE_GROUPS[group]
  return features.some(feature => isFeatureEnabled(feature))
}

// ============================================
// Feature Requirements
// ============================================

/**
 * Verificar se os requisitos de uma feature estão atendidos
 */
export function checkFeatureRequirements(feature: FeatureName): {
  enabled: boolean
  requirements: {
    name: string
    met: boolean
    message?: string
  }[]
} {
  const requirements: Array<{ name: string; met: boolean; message?: string }> = []

  switch (feature) {
    case 'pwa_enabled':
      requirements.push({
        name: 'Service Worker Support',
        met: typeof window !== 'undefined' && 'serviceWorker' in navigator,
        message: 'Navegador não suporta Service Workers'
      })
      requirements.push({
        name: 'HTTPS',
        met: typeof window !== 'undefined' && (
          window.location.protocol === 'https:' ||
          window.location.hostname === 'localhost'
        ),
        message: 'PWA requer HTTPS em produção'
      })
      break

    case 'chatbot_ai_mode':
      requirements.push({
        name: 'OpenAI API Key',
        met: !!process.env.OPENAI_API_KEY,
        message: 'Configure OPENAI_API_KEY no .env'
      })
      break

    case 'push_notifications_enabled':
      requirements.push({
        name: 'Notification Support',
        met: typeof window !== 'undefined' && 'Notification' in window,
        message: 'Navegador não suporta notificações'
      })
      requirements.push({
        name: 'VAPID Keys',
        met: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        message: 'Configure VAPID keys no .env'
      })
      requirements.push({
        name: 'PWA Enabled',
        met: isFeatureEnabled('pwa_enabled'),
        message: 'Push notifications requer PWA habilitado'
      })
      break

    case 'analytics_predictions':
      requirements.push({
        name: 'Analytics Enabled',
        met: isFeatureEnabled('analytics_enabled'),
        message: 'Analytics deve estar habilitado'
      })
      break

    case 'organogram_edit_mode':
      requirements.push({
        name: 'Organogram Enabled',
        met: isFeatureEnabled('organogram_enabled'),
        message: 'Organogram deve estar habilitado'
      })
      break
  }

  const allRequirementsMet = requirements.every(req => req.met)

  return {
    enabled: isFeatureEnabled(feature) && allRequirementsMet,
    requirements
  }
}

// ============================================
// User-based Feature Flags (opcional)
// ============================================

/**
 * Verificar se feature está habilitada para um usuário específico
 * (Permite A/B testing e rollout gradual)
 */
export function isFeatureEnabledForUser(
  feature: FeatureName,
  userId: string,
  rolloutPercentage: number = 100
): boolean {
  // Se feature não está globalmente habilitada, retornar false
  if (!isFeatureEnabled(feature)) {
    return false
  }

  // Se rollout é 100%, habilitar para todos
  if (rolloutPercentage >= 100) {
    return true
  }

  // Se rollout é 0%, desabilitar para todos
  if (rolloutPercentage <= 0) {
    return false
  }

  // Hash simples do userId para determinar se está no rollout
  const hash = simpleHash(userId)
  const userPercentage = hash % 100

  return userPercentage < rolloutPercentage
}

/**
 * Hash simples para distribuição consistente
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// ============================================
// Feature Metadata
// ============================================

export const FEATURE_METADATA: Record<FeatureName, {
  name: string
  description: string
  category: string
  beta?: boolean
  experimental?: boolean
}> = {
  // PWA
  pwa_enabled: {
    name: 'PWA Mobile App',
    description: 'Progressive Web App instalável',
    category: 'PWA'
  },
  pwa_offline_sync: {
    name: 'Sincronização Offline',
    description: 'Sincronizar dados quando voltar online',
    category: 'PWA'
  },
  pwa_install_prompt: {
    name: 'Prompt de Instalação',
    description: 'Mostrar prompt para instalar app',
    category: 'PWA'
  },

  // Chatbot
  chatbot_enabled: {
    name: 'Chatbot',
    description: 'Assistente virtual de RH',
    category: 'Chatbot'
  },
  chatbot_ai_mode: {
    name: 'Modo IA (OpenAI)',
    description: 'Respostas geradas por IA',
    category: 'Chatbot'
  },
  chatbot_knowledge_base: {
    name: 'Base de Conhecimento',
    description: 'Respostas baseadas em KB local',
    category: 'Chatbot'
  },

  // Analytics
  analytics_enabled: {
    name: 'People Analytics',
    description: 'Dashboard avançado de analytics',
    category: 'Analytics'
  },
  analytics_predictions: {
    name: 'Predições',
    description: 'Predições de turnover e headcount',
    category: 'Analytics',
    beta: true
  },
  analytics_benchmarks: {
    name: 'Benchmarks',
    description: 'Comparação com mercado',
    category: 'Analytics',
    beta: true
  },
  analytics_export: {
    name: 'Exportação',
    description: 'Exportar relatórios em PDF/Excel',
    category: 'Analytics'
  },

  // Organogram
  organogram_enabled: {
    name: 'Organograma',
    description: 'Visualização hierárquica',
    category: 'Organogram'
  },
  organogram_edit_mode: {
    name: 'Edição de Organograma',
    description: 'Editar hierarquia com drag & drop',
    category: 'Organogram',
    beta: true
  },
  organogram_export: {
    name: 'Exportação de Organograma',
    description: 'Exportar em PNG/PDF/SVG',
    category: 'Organogram'
  },

  // Notifications
  push_notifications_enabled: {
    name: 'Push Notifications',
    description: 'Notificações push nativas',
    category: 'Notifications'
  },
  push_notifications_auto_prompt: {
    name: 'Prompt Automático',
    description: 'Pedir permissão automaticamente',
    category: 'Notifications'
  },

  // AI Features
  ai_insights_daily: {
    name: 'Insights Diários',
    description: 'Insights gerados por IA diariamente',
    category: 'AI',
    beta: true
  },
  headcount_projection: {
    name: 'Projeção de Headcount',
    description: 'Previsão de necessidades futuras',
    category: 'AI',
    beta: true
  },
  turnover_prediction: {
    name: 'Predição de Turnover',
    description: 'Identificar funcionários em risco',
    category: 'AI',
    beta: true
  },

  // Experimental
  voice_chatbot: {
    name: 'Chatbot por Voz',
    description: 'Interação por voz com chatbot',
    category: 'Chatbot',
    experimental: true
  },
  organogram_3d: {
    name: 'Organograma 3D',
    description: 'Visualização tridimensional',
    category: 'Organogram',
    experimental: true
  },
  real_time_analytics: {
    name: 'Analytics em Tempo Real',
    description: 'Métricas atualizadas em tempo real',
    category: 'Analytics',
    experimental: true
  }
}

/**
 * Obter metadata de uma feature
 */
export function getFeatureMetadata(feature: FeatureName) {
  return FEATURE_METADATA[feature]
}

/**
 * Obter features por categoria
 */
export function getFeaturesByCategory(category: string): FeatureName[] {
  return Object.entries(FEATURE_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([feature]) => feature as FeatureName)
}

/**
 * Obter features beta
 */
export function getBetaFeatures(): FeatureName[] {
  return Object.entries(FEATURE_METADATA)
    .filter(([_, metadata]) => metadata.beta)
    .map(([feature]) => feature as FeatureName)
}

/**
 * Obter features experimentais
 */
export function getExperimentalFeatures(): FeatureName[] {
  return Object.entries(FEATURE_METADATA)
    .filter(([_, metadata]) => metadata.experimental)
    .map(([feature]) => feature as FeatureName)
}

// ============================================
// Development Helpers
// ============================================

/**
 * Log de features habilitadas (apenas em dev)
 */
export function logEnabledFeatures() {
  if (process.env.NODE_ENV !== 'development') return

  console.group('🚀 Phase 8 Features')

  const categories = [...new Set(
    Object.values(FEATURE_METADATA).map(m => m.category)
  )]

  categories.forEach(category => {
    const features = getFeaturesByCategory(category)
    const enabled = features.filter(f => isFeatureEnabled(f))

    console.log(`\n${category}: ${enabled.length}/${features.length} enabled`)
    enabled.forEach(feature => {
      const meta = getFeatureMetadata(feature)
      const badge = meta.beta ? '[BETA]' : meta.experimental ? '[EXPERIMENTAL]' : ''
      console.log(`  ✓ ${meta.name} ${badge}`)
    })
  })

  console.groupEnd()
}

// ============================================
// Export all
// ============================================

export default {
  FEATURES,
  FEATURE_GROUPS,
  FEATURE_METADATA,
  isFeatureEnabled,
  areFeaturesEnabled,
  isAnyFeatureEnabled,
  getEnabledFeatures,
  getAllFeatures,
  isFeatureGroupEnabled,
  isFeatureGroupPartiallyEnabled,
  checkFeatureRequirements,
  isFeatureEnabledForUser,
  getFeatureMetadata,
  getFeaturesByCategory,
  getBetaFeatures,
  getExperimentalFeatures,
  logEnabledFeatures
}
