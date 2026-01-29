"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  isStandalone,
  isMobile,
  isInstallPromptAvailable,
  promptInstall,
} from "@/lib/pwa/setup";

const STORAGE_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Não mostrar se já estiver instalado
    if (isStandalone()) {
      return;
    }

    // Não mostrar se não for mobile
    if (!isMobile()) {
      return;
    }

    // Verificar se usuário já dispensou recentemente
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const timeSinceDismissed = Date.now() - parseInt(dismissedAt, 10);
      if (timeSinceDismissed < DISMISS_DURATION) {
        return;
      }
    }

    // Listener para quando o prompt estiver disponível
    const handleInstallable = () => {
      setShowPrompt(true);
    };

    // Listener para quando o app for instalado
    const handleInstalled = () => {
      setShowPrompt(false);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("pwa-installable", handleInstallable);
    window.addEventListener("pwa-installed", handleInstalled);

    // Verificar se já está disponível
    if (isInstallPromptAvailable()) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("pwa-installable", handleInstallable);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      const result = await promptInstall();

      if (result === "accepted") {
        setShowPrompt(false);
        localStorage.removeItem(STORAGE_KEY);
      } else if (result === "dismissed") {
        handleDismiss();
      }
    } catch (error) {
      console.error("[Install] Erro:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleNeverShow = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, "never");
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-in slide-in-from-bottom duration-300">
      <Card className="relative overflow-hidden border-2 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />

        <div className="relative p-4">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 space-y-3 pr-6">
              <div>
                <h3 className="font-semibold">Instalar Sistema RH</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse rapidamente o sistema e receba notificações importantes
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isInstalling ? "Instalando..." : "Instalar Agora"}
                </Button>

                <Button
                  onClick={handleNeverShow}
                  variant="ghost"
                  size="sm"
                >
                  Não mostrar novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
