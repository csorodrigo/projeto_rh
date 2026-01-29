"use client";

import { useEffect } from "react";
import { initializePWA } from "@/lib/pwa/setup";
import { setupNotificationHandlers } from "@/lib/pwa/push-notifications";

/**
 * Componente para inicializar o PWA
 * Deve ser incluído no layout raiz
 */
export function PWAInitializer() {
  useEffect(() => {
    // Inicializar PWA
    initializePWA().then((status) => {
      console.log("[PWA] Inicializado:", status);
    });

    // Setup de handlers de notificação
    setupNotificationHandlers();
  }, []);

  return null;
}
