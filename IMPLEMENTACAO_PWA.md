# Implementação PWA Mobile App - Sistema RH

## Visão Geral

Implementação completa de Progressive Web App (PWA) para o Sistema RH, fornecendo experiência mobile nativa com funcionalidades offline, notificações push e instalação no dispositivo.

## Arquivos Implementados

### 1. Configuração PWA

#### `public/manifest.json`
Manifest PWA com:
- Metadados do app (nome, descrição, ícones)
- Display mode: standalone
- Orientação: portrait
- Shortcuts para funcionalidades principais
- Theme color: #3b82f6

#### `public/sw.js`
Service Worker completo com:
- Pre-cache de assets essenciais
- Cache strategies (Cache First, Network First)
- Background sync para registros de ponto offline
- Push notifications support
- IndexedDB para queue de sincronização
- Offline fallbacks

### 2. Biblioteca PWA (`src/lib/pwa/`)

#### `setup.ts`
Funções principais:
- `registerServiceWorker()` - Registrar SW
- `checkForUpdates()` - Verificar atualizações
- `activateUpdate()` - Ativar nova versão
- `requestNotificationPermission()` - Permissões
- `isStandalone()` - Detectar instalação
- `isMobile()` - Detectar dispositivo mobile
- `promptInstall()` - Mostrar prompt de instalação
- `vibrate()` - Haptic feedback
- `getOnlineStatus()` - Status de conexão
- `initializePWA()` - Inicialização completa

#### `geolocation.ts`
Funções de localização:
- `getCurrentPosition()` - Obter localização atual
- `watchPosition()` - Tracking contínuo
- `calculateDistance()` - Distância entre coordenadas (Haversine)
- `checkIfAtWorkplace()` - Verificar se está no local de trabalho
- `formatCoordinates()` - Formatação
- `getGoogleMapsLink()` - Link para Google Maps
- `checkGeolocationPermission()` - Status de permissão

#### `push-notifications.ts`
Sistema de notificações:
- `subscribeToPushNotifications()` - Inscrever para push
- `unsubscribeFromPushNotifications()` - Desinscrever
- `showLocalNotification()` - Notificação local
- `sendTestNotification()` - Teste
- `sendClockReminder()` - Lembrete de ponto
- `sendAbsenceApprovalNotification()` - Aprovação de ausência
- `sendPayslipNotification()` - Novo holerite
- `setupNotificationHandlers()` - Configurar handlers

### 3. Componentes PWA (`src/components/pwa/`)

#### `PWAInitializer.tsx`
Componente de inicialização:
- Registra Service Worker
- Captura install prompt
- Setup de notificações
- Deve ser incluído no layout raiz

#### `InstallPrompt.tsx`
Banner de instalação:
- Aparece apenas em mobile
- Detecta quando instalável
- Opções: Instalar, Depois, Nunca Mais
- Persistência de preferência (7 dias)
- Animações suaves

#### `OfflineIndicator.tsx`
Indicador de status:
- Banner quando offline
- Transição suave online/offline
- Queue de ações pendentes
- Integração com IndexedDB

#### `BottomNav.tsx`
Navegação inferior mobile:
- 5 ícones: Home, Ponto, Ausências, Folha, Perfil
- Active states
- Animações
- Safe area support
- Auto-hide em desktop

#### `CameraCapture.tsx`
Captura de foto:
- Acesso à câmera
- Preview em tempo real
- Captura e confirmação
- Switch de câmera (frontal/traseira)
- Compressão de imagem
- Guia de posicionamento

### 4. Páginas Mobile (`src/app/(dashboard)/*/mobile/`)

#### `ponto/mobile/page.tsx`
Registro de ponto:
- Relógio em tempo real
- Botão grande de clock in/out
- Detecção de próxima ação (entrada/saída/intervalo)
- Integração com geolocalização
- Captura de foto opcional
- Timeline de registros do dia
- Último registro destacado
- Vibração de feedback
- Dicas úteis

#### `ausencias/mobile/page.tsx`
Gestão de ausências:
- Cards de estatísticas (pendentes/aprovadas)
- Botão de nova solicitação
- Formulário simplificado
- Seletor de tipo de ausência
- Calendário mobile-friendly
- Cálculo automático de dias
- Lista por status
- Detalhes em modal
- Histórico completo

#### `folha/mobile/page.tsx`
Holerites:
- Resumo financeiro destacado
- Salário líquido atual
- Comparação com média
- Lista de holerites por mês
- Detalhamento completo
- Proventos/Descontos/Benefícios
- Download PDF
- Status de pagamento
- Gráficos de evolução

## Recursos PWA Implementados

### Instalação
- Manifest configurado
- Install prompt customizado
- Detecção de instalação
- Shortcuts para ações rápidas
- Ícones adaptativos

### Offline Support
- Cache de assets estáticos
- Cache de API calls
- Queue de sincronização
- Background sync
- Fallbacks offline

### Notificações Push
- Permissões
- Subscription management
- Notificações locais
- Push notifications do servidor
- Actions em notificações
- Handlers personalizados

### Geolocalização
- Posição atual
- Tracking contínuo
- Validação de local de trabalho
- Cálculo de distância
- Permissões

### Mobile Experience
- Bottom navigation
- Touch-friendly (44px min)
- Gestos nativos
- Haptic feedback
- Safe area support (iOS notch)
- Orientação portrait
- Pull to refresh
- Momentum scrolling

### Performance
- Service Worker caching
- Lazy loading
- Image compression
- GPU acceleration
- Will-change optimization

## Configuração

### Next.js

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=3600, must-revalidate",
        },
      ],
    },
  ];
}
```

### Metadata

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RH Sesame",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};
```

## Uso

### Inicialização

```tsx
// Incluir no layout do dashboard
import { PWAInitializer } from "@/components/pwa/PWAInitializer";

export default function Layout({ children }) {
  return (
    <>
      <PWAInitializer />
      {children}
    </>
  );
}
```

### Componentes

```tsx
// Bottom Navigation
import { BottomNav } from "@/components/pwa/BottomNav";
<BottomNav />

// Install Prompt
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
<InstallPrompt />

// Offline Indicator
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
<OfflineIndicator />

// Camera Capture
import { CameraCapture } from "@/components/pwa/CameraCapture";
<CameraCapture
  open={showCamera}
  onClose={() => setShowCamera(false)}
  onCapture={(imageData) => handleCapture(imageData)}
/>
```

### Funções Úteis

```typescript
import {
  isStandalone,
  isMobile,
  promptInstall,
  vibrate,
  getOnlineStatus,
} from "@/lib/pwa/setup";

import {
  getCurrentPosition,
  checkIfAtWorkplace,
} from "@/lib/pwa/geolocation";

import {
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/pwa/push-notifications";

// Verificar se está instalado
if (isStandalone()) {
  console.log("App instalado!");
}

// Pedir instalação
await promptInstall();

// Vibrar dispositivo
vibrate([200, 100, 200]);

// Obter localização
const coords = await getCurrentPosition();

// Verificar local
const check = checkIfAtWorkplace(userCoords, officeCoords, 100);

// Notificação
await showLocalNotification({
  title: "Lembrete",
  body: "Não esqueça de bater o ponto!",
});
```

## CSS Utilities

```css
/* Safe area support */
.pt-safe { padding-top: env(safe-area-inset-top); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }

/* Touch-friendly */
.touch-target { min-height: 44px; min-width: 44px; }

/* No text selection */
.no-select { user-select: none; }

/* Momentum scrolling */
.momentum-scroll { -webkit-overflow-scrolling: touch; }

/* Hide scrollbar */
.scrollbar-hide { scrollbar-width: none; }

/* Tap highlight */
.tap-highlight-transparent { -webkit-tap-highlight-color: transparent; }

/* Mobile breakpoints */
.mobile-only { /* visible only on mobile */ }
.desktop-only { /* hidden on mobile */ }
```

## API Endpoints Necessárias

Para funcionamento completo, implementar:

### Ponto
- `GET /api/ponto/today` - Registros do dia
- `POST /api/ponto/clock` - Novo registro

### Ausências
- `GET /api/ausencias` - Lista de ausências
- `POST /api/ausencias` - Nova solicitação

### Folha
- `GET /api/folha/payslips` - Lista de holerites
- `GET /api/folha/payslips/:id/download` - Download PDF

### Push Notifications
- `POST /api/push/subscribe` - Salvar subscription
- `POST /api/push/unsubscribe` - Remover subscription

## Testes

### Mobile
1. Abrir em dispositivo mobile real
2. Verificar prompt de instalação
3. Instalar no home screen
4. Testar modo offline
5. Verificar notificações

### Desktop
1. Verificar que mobile-only não aparece
2. Testar responsividade
3. Verificar DevTools PWA audit

### Service Worker
1. Chrome DevTools > Application > Service Workers
2. Verificar registro e status
3. Testar cache storage
4. Simular offline

### Geolocalização
1. Permitir acesso à localização
2. Verificar coordenadas capturadas
3. Testar cálculo de distância

### Câmera
1. Permitir acesso à câmera
2. Capturar foto
3. Verificar preview
4. Confirmar captura

## Troubleshooting

### Service Worker não registra
- Verificar HTTPS (ou localhost)
- Verificar console para erros
- Limpar cache e recarregar

### Notificações não aparecem
- Verificar permissões do navegador
- Testar notificação local primeiro
- Verificar VAPID keys

### Geolocalização não funciona
- Verificar permissões
- Usar HTTPS
- Testar em dispositivo real

### Install prompt não aparece
- Verificar manifest.json
- Verificar Service Worker ativo
- Verificar PWA criteria (Lighthouse)

## Próximos Passos

1. Implementar endpoints de API reais
2. Configurar push notifications server
3. Adicionar analytics PWA
4. Otimizar cache strategies
5. Adicionar mais shortcuts
6. Implementar share target
7. Adicionar periodic background sync
8. Melhorar offline experience

## Recursos

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
