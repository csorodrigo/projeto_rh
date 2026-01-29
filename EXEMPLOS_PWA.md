# Exemplos de Uso - PWA Mobile App

## Guia prático com exemplos de código para usar as funcionalidades PWA

## 1. Inicialização Básica

### No Layout Principal

```tsx
// src/app/(dashboard)/layout.tsx
import { PWAInitializer } from "@/components/pwa/PWAInitializer";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { BottomNav } from "@/components/pwa/BottomNav";

export default function Layout({ children }) {
  return (
    <>
      <PWAInitializer />
      <OfflineIndicator />
      {children}
      <InstallPrompt />
      <BottomNav />
    </>
  );
}
```

## 2. Detecção de Instalação

### Verificar se app está instalado

```tsx
"use client";

import { useEffect, useState } from "react";
import { isStandalone, isMobile } from "@/lib/pwa/setup";

export default function MyPage() {
  const [installed, setInstalled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setMobile(isMobile());
  }, []);

  return (
    <div>
      {installed ? (
        <p>App instalado! 🎉</p>
      ) : mobile ? (
        <p>Instale nosso app para melhor experiência</p>
      ) : (
        <p>Acesse pelo mobile para instalar</p>
      )}
    </div>
  );
}
```

## 3. Prompt de Instalação Customizado

### Botão para forçar instalação

```tsx
"use client";

import { useState } from "react";
import { promptInstall, isInstallPromptAvailable } from "@/lib/pwa/setup";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function InstallButton() {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!isInstallPromptAvailable()) {
      alert("Instalação não disponível no momento");
      return;
    }

    setInstalling(true);
    const result = await promptInstall();

    if (result === "accepted") {
      alert("App instalado com sucesso!");
    } else if (result === "dismissed") {
      alert("Instalação cancelada");
    }

    setInstalling(false);
  };

  if (!isInstallPromptAvailable()) {
    return null;
  }

  return (
    <Button onClick={handleInstall} disabled={installing}>
      <Download className="mr-2 h-4 w-4" />
      {installing ? "Instalando..." : "Instalar App"}
    </Button>
  );
}
```

## 4. Geolocalização

### Capturar localização do usuário

```tsx
"use client";

import { useState } from "react";
import { getCurrentPosition, checkIfAtWorkplace } from "@/lib/pwa/geolocation";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function LocationChecker() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);

    try {
      // Obter localização atual
      const coords = await getCurrentPosition();

      // Coordenadas do escritório
      const officeCoords = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      // Verificar se está no escritório (raio de 100m)
      const check = checkIfAtWorkplace(coords, officeCoords, 100);

      setResult(check.message);
    } catch (error: any) {
      setResult(`Erro: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleCheck} disabled={checking}>
        <MapPin className="mr-2 h-4 w-4" />
        {checking ? "Verificando..." : "Verificar Localização"}
      </Button>
      {result && <p className="text-sm">{result}</p>}
    </div>
  );
}
```

### Tracking contínuo de posição

```tsx
"use client";

import { useEffect, useState } from "react";
import { watchPosition, clearWatch, type Coordinates } from "@/lib/pwa/geolocation";

export function LocationTracker() {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const watchId = watchPosition(
      (coords) => {
        setPosition(coords);
        setError(null);
      },
      (err) => {
        setError(err.message);
      }
    );

    // Cleanup
    return () => {
      if (watchId) {
        clearWatch(watchId);
      }
    };
  }, []);

  return (
    <div>
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : position ? (
        <div>
          <p>Lat: {position.latitude.toFixed(6)}</p>
          <p>Lng: {position.longitude.toFixed(6)}</p>
          <p>Precisão: {position.accuracy}m</p>
        </div>
      ) : (
        <p>Obtendo localização...</p>
      )}
    </div>
  );
}
```

## 5. Câmera

### Capturar foto do usuário

```tsx
"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/pwa/CameraCapture";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export function PhotoCapture() {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setPhoto(imageData);
    console.log("Foto capturada:", imageData.length, "bytes");
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowCamera(true)}>
        <Camera className="mr-2 h-4 w-4" />
        Tirar Foto
      </Button>

      {photo && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Foto capturada:
          </p>
          <img
            src={photo}
            alt="Foto capturada"
            className="h-48 w-48 rounded-lg object-cover"
          />
        </div>
      )}

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        title="Validação de Ponto"
        description="Tire uma foto para confirmar o registro"
      />
    </div>
  );
}
```

## 6. Notificações

### Solicitar permissão

```tsx
"use client";

import { useState } from "react";
import { requestNotificationPermission } from "@/lib/pwa/push-notifications";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const handleRequest = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleRequest} disabled={permission === "granted"}>
        <Bell className="mr-2 h-4 w-4" />
        {permission === "granted"
          ? "Notificações Ativadas"
          : "Ativar Notificações"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Status: {permission}
      </p>
    </div>
  );
}
```

### Enviar notificação local

```tsx
"use client";

import { showLocalNotification, sendTestNotification } from "@/lib/pwa/push-notifications";
import { Button } from "@/components/ui/button";

export function NotificationTester() {
  const handleTest = async () => {
    await sendTestNotification();
  };

  const handleCustom = async () => {
    await showLocalNotification({
      title: "Lembrete Personalizado",
      body: "Não esqueça de bater o ponto!",
      tag: "custom-reminder",
      requireInteraction: true,
      actions: [
        { action: "open", title: "Abrir" },
        { action: "dismiss", title: "Dispensar" },
      ],
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleTest} variant="outline">
        Testar Notificação
      </Button>
      <Button onClick={handleCustom}>
        Notificação Customizada
      </Button>
    </div>
  );
}
```

## 7. Status Online/Offline

### Detectar conexão

```tsx
"use client";

import { useEffect, useState } from "react";
import { getOnlineStatus, addConnectionListeners } from "@/lib/pwa/setup";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(getOnlineStatus());

    const cleanup = addConnectionListeners(
      () => {
        setIsOnline(true);
        console.log("Voltou online!");
      },
      () => {
        setIsOnline(false);
        console.log("Ficou offline!");
      }
    );

    return cleanup;
  }, []);

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm">Offline</span>
        </>
      )}
    </div>
  );
}
```

## 8. Vibração (Haptic Feedback)

### Feedback tátil

```tsx
"use client";

import { vibrate } from "@/lib/pwa/setup";
import { Button } from "@/components/ui/button";

export function HapticDemo() {
  const handleShortVibrate = () => {
    vibrate(100); // 100ms
  };

  const handleLongVibrate = () => {
    vibrate(500); // 500ms
  };

  const handlePattern = () => {
    vibrate([200, 100, 200, 100, 200]); // Padrão
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleShortVibrate} variant="outline">
        Vibração Curta
      </Button>
      <Button onClick={handleLongVibrate} variant="outline">
        Vibração Longa
      </Button>
      <Button onClick={handlePattern} variant="outline">
        Padrão de Vibração
      </Button>
    </div>
  );
}
```

## 9. Clock In com Localização e Foto

### Exemplo completo de registro de ponto

```tsx
"use client";

import { useState } from "react";
import { getCurrentPosition, checkIfAtWorkplace } from "@/lib/pwa/geolocation";
import { CameraCapture } from "@/components/pwa/CameraCapture";
import { vibrate } from "@/lib/pwa/setup";
import { Button } from "@/components/ui/button";
import { Clock, Camera } from "lucide-react";

export function ClockInButton() {
  const [isClocking, setIsClocking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleClockIn = async (photo?: string) => {
    setIsClocking(true);

    try {
      // 1. Obter localização
      const location = await getCurrentPosition();

      // 2. Verificar local de trabalho
      const officeCoords = {
        latitude: -23.5505,
        longitude: -46.6333,
      };
      const check = checkIfAtWorkplace(location, officeCoords, 500);

      if (!check.isAtWorkplace) {
        const confirm = window.confirm(
          `${check.message}. Deseja continuar mesmo assim?`
        );
        if (!confirm) {
          setIsClocking(false);
          return;
        }
      }

      // 3. Registrar ponto
      const response = await fetch("/api/ponto/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "entry",
          timestamp: new Date().toISOString(),
          location,
          photo,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar ponto");
      }

      // 4. Feedback de sucesso
      vibrate([200, 100, 200]);
      alert("Ponto registrado com sucesso!");

    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsClocking(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={() => handleClockIn()}
        disabled={isClocking}
        size="lg"
        className="w-full"
      >
        <Clock className="mr-2 h-5 w-5" />
        {isClocking ? "Registrando..." : "Bater Ponto"}
      </Button>

      <Button
        onClick={() => setShowCamera(true)}
        disabled={isClocking}
        variant="outline"
        size="lg"
        className="w-full"
      >
        <Camera className="mr-2 h-5 w-5" />
        Bater Ponto com Foto
      </Button>

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(photo) => {
          setShowCamera(false);
          handleClockIn(photo);
        }}
      />
    </div>
  );
}
```

## 10. Queue de Sincronização Offline

### Salvar ação para sincronizar depois

```tsx
"use client";

import { getOnlineStatus } from "@/lib/pwa/setup";

// Salvar no IndexedDB
async function saveToQueue(action: any) {
  const db = await openDatabase();
  const transaction = db.transaction(["pending-entries"], "readwrite");
  const store = transaction.objectStore("pending-entries");

  await store.add({
    ...action,
    timestamp: Date.now(),
  });
}

// Exemplo de uso
export async function clockInOffline(data: any) {
  const isOnline = getOnlineStatus();

  if (isOnline) {
    // Enviar direto para API
    const response = await fetch("/api/ponto/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  } else {
    // Salvar na queue
    await saveToQueue({
      type: "clock-entry",
      description: "Registro de ponto",
      data,
    });

    // Service Worker vai sincronizar quando voltar online
    if ("serviceWorker" in navigator && "sync" in (window as any).ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register("sync-clock-entries");
    }

    return { success: true, queued: true };
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("rh-sesame-db", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
```

## 11. Safe Areas (iOS Notch)

### Usando safe areas no CSS

```tsx
// Componente com safe area
export function MobileHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 bg-background pt-safe">
      <div className="flex h-14 items-center justify-between px-4">
        <h1>Sistema RH</h1>
      </div>
    </header>
  );
}

// Bottom Navigation com safe area
export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background pb-safe">
      <div className="flex h-16 items-center justify-around">
        {/* Nav items */}
      </div>
    </nav>
  );
}
```

## 12. Atualização do Service Worker

### Detectar e aplicar atualizações

```tsx
"use client";

import { useEffect, useState } from "react";
import { checkForUpdates, activateUpdate } from "@/lib/pwa/setup";
import { Button } from "@/components/ui/button";

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Listener para nova versão
    const handleUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener("sw-update-available", handleUpdate);

    // Verificar atualizações a cada 1 hora
    const interval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        setUpdateAvailable(true);
      }
    }, 60 * 60 * 1000);

    return () => {
      window.removeEventListener("sw-update-available", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 rounded-lg border bg-card p-4 shadow-lg">
      <p className="mb-2 font-medium">Nova versão disponível!</p>
      <p className="mb-4 text-sm text-muted-foreground">
        Atualize para ter acesso às novas funcionalidades.
      </p>
      <Button onClick={activateUpdate} className="w-full">
        Atualizar Agora
      </Button>
    </div>
  );
}
```

## 13. Mobile-First Utilities

### Usar classes mobile-first

```tsx
export function ResponsiveCard() {
  return (
    <div className="card">
      {/* Visível apenas em mobile */}
      <div className="mobile-only">
        <BottomNav />
      </div>

      {/* Visível apenas em desktop */}
      <div className="desktop-only">
        <Sidebar />
      </div>

      {/* Touch-friendly button */}
      <button className="touch-target tap-highlight-transparent">
        Clique aqui
      </button>

      {/* Scrollable sem barra */}
      <div className="scrollbar-hide momentum-scroll h-64 overflow-y-auto">
        Conteúdo scrollável
      </div>
    </div>
  );
}
```

## Conclusão

Estes exemplos cobrem todos os principais recursos PWA implementados. Use-os como referência para:

- Integrar PWA em novas páginas
- Testar funcionalidades
- Entender o fluxo de cada feature
- Customizar comportamentos

Para mais detalhes, consulte:
- `/IMPLEMENTACAO_PWA.md` - Documentação completa
- `/PWA_CHECKLIST.md` - Testing guide
- `src/lib/pwa/` - Código fonte das bibliotecas
