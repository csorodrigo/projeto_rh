"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getOnlineStatus, addConnectionListeners } from "@/lib/pwa/setup";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    // Estado inicial
    setIsOnline(getOnlineStatus());

    // Adicionar listeners
    const cleanup = addConnectionListeners(
      () => {
        setIsOnline(true);
        setShowTransition(true);
        setTimeout(() => setShowTransition(false), 3000);
      },
      () => {
        setIsOnline(false);
        setShowTransition(true);
      }
    );

    return cleanup;
  }, []);

  // Não mostrar nada se estiver online e não estiver em transição
  if (isOnline && !showTransition) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-50 animate-in slide-in-from-top duration-300">
      <Alert
        variant={isOnline ? "default" : "destructive"}
        className="rounded-none border-x-0 border-t-0"
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {isOnline ? (
              "Você está online novamente"
            ) : (
              "Você está offline. Algumas funcionalidades podem estar limitadas."
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

interface PendingAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

export function OfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    setIsOnline(getOnlineStatus());

    const cleanup = addConnectionListeners(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    // Verificar ações pendentes no IndexedDB
    loadPendingActions();

    return cleanup;
  }, []);

  const loadPendingActions = async () => {
    try {
      const db = await openDatabase();
      const actions = await getPendingActions(db);
      setPendingActions(actions);
    } catch (error) {
      console.error("Erro ao carregar ações pendentes:", error);
    }
  };

  if (isOnline || pendingActions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300 md:left-auto md:right-4 md:w-80">
      <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="space-y-2">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            Ações Pendentes ({pendingActions.length})
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Suas ações serão sincronizadas quando você voltar a ficar online.
          </p>
          <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
            {pendingActions.slice(0, 3).map((action) => (
              <li key={action.id} className="truncate">
                • {action.description}
              </li>
            ))}
            {pendingActions.length > 3 && (
              <li className="font-medium">
                + {pendingActions.length - 3} mais
              </li>
            )}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Helper functions para IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("rh-sesame-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending-entries")) {
        db.createObjectStore("pending-entries", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

function getPendingActions(db: IDBDatabase): Promise<PendingAction[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending-entries"], "readonly");
    const store = transaction.objectStore("pending-entries");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entries = request.result || [];
      const actions = entries.map((entry: any) => ({
        id: entry.id,
        type: entry.type || "unknown",
        description: entry.description || "Ação pendente",
        timestamp: entry.timestamp || Date.now(),
      }));
      resolve(actions);
    };
  });
}
