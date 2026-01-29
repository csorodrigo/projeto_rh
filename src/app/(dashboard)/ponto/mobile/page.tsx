"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CameraCapture } from "@/components/pwa/CameraCapture";
import {
  getCurrentPosition,
  checkIfAtWorkplace,
  type Coordinates,
} from "@/lib/pwa/geolocation";
import { vibrate } from "@/lib/pwa/setup";

interface ClockEntry {
  id: string;
  timestamp: string;
  type: "entry" | "exit" | "break_start" | "break_end";
  location?: Coordinates;
  photo?: string;
}

export default function MobileClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClocking, setIsClocking] = useState(false);
  const [todayEntries, setTodayEntries] = useState<ClockEntry[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastEntry, setLastEntry] = useState<ClockEntry | null>(null);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Carregar registros do dia
  useEffect(() => {
    loadTodayEntries();
  }, []);

  // Obter localização ao montar
  useEffect(() => {
    getCurrentPosition()
      .then((coords) => {
        setLocation(coords);
        setLocationError(null);
      })
      .catch((error) => {
        setLocationError(error.message);
      });
  }, []);

  const loadTodayEntries = async () => {
    try {
      const response = await fetch("/api/ponto/today");
      if (response.ok) {
        const data = await response.json();
        setTodayEntries(data.entries || []);
        setLastEntry(data.entries?.[0] || null);
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const getNextAction = (): "entry" | "exit" | "break_start" | "break_end" => {
    if (!lastEntry) return "entry";

    switch (lastEntry.type) {
      case "entry":
        return "break_start";
      case "break_start":
        return "break_end";
      case "break_end":
        return "exit";
      case "exit":
        return "entry";
      default:
        return "entry";
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      entry: "Registrar Entrada",
      exit: "Registrar Saída",
      break_start: "Iniciar Intervalo",
      break_end: "Finalizar Intervalo",
    };
    return labels[action] || "Bater Ponto";
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, typeof LogIn> = {
      entry: LogIn,
      exit: LogOut,
      break_start: Clock,
      break_end: Clock,
    };
    return icons[action] || Clock;
  };

  const handleClockIn = async (photo?: string) => {
    setIsClocking(true);

    try {
      // Vibrar dispositivo
      vibrate([200, 100, 200]);

      const nextAction = getNextAction();

      const entry: Partial<ClockEntry> = {
        type: nextAction,
        timestamp: new Date().toISOString(),
        location: location || undefined,
        photo,
      };

      const response = await fetch("/api/ponto/clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        const data = await response.json();
        setLastEntry(data.entry);
        await loadTodayEntries();

        // Feedback de sucesso
        vibrate(200);
      } else {
        throw new Error("Erro ao registrar ponto");
      }
    } catch (error) {
      console.error("Erro ao bater ponto:", error);
      alert("Erro ao registrar ponto. Tente novamente.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    handleClockIn(imageData);
  };

  const nextAction = getNextAction();
  const ActionIcon = getActionIcon(nextAction);

  // Verificar se está no local de trabalho
  const workplaceCoords: Coordinates = {
    latitude: -23.5505,
    longitude: -46.6333,
  };

  const locationCheck = location
    ? checkIfAtWorkplace(location, workplaceCoords, 500)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="container max-w-lg space-y-6 p-4">
        {/* Relógio Principal */}
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="text-6xl font-bold tabular-nums">
                {format(currentTime, "HH:mm")}
              </div>
              <p className="text-2xl font-medium text-muted-foreground">
                {format(currentTime, "ss")}s
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status de Localização */}
        {locationError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        ) : locationCheck && (
          <Alert variant={locationCheck.isAtWorkplace ? "default" : "destructive"}>
            <MapPin className="h-4 w-4" />
            <AlertDescription>{locationCheck.message}</AlertDescription>
          </Alert>
        )}

        {/* Último Registro */}
        {lastEntry && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Último Registro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={lastEntry.type === "entry" ? "default" : "secondary"}>
                    {getEntryTypeLabel(lastEntry.type)}
                  </Badge>
                </div>
                <div className="text-lg font-semibold">
                  {format(parseISO(lastEntry.timestamp), "HH:mm")}
                </div>
              </div>
              {lastEntry.location && (
                <p className="text-xs text-muted-foreground">
                  {lastEntry.location.latitude.toFixed(6)},{" "}
                  {lastEntry.location.longitude.toFixed(6)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botão Principal de Clock In/Out */}
        <div className="space-y-3">
          <Button
            onClick={() => handleClockIn()}
            disabled={isClocking}
            size="lg"
            className="h-20 w-full text-lg font-semibold"
          >
            {isClocking ? (
              "Registrando..."
            ) : (
              <>
                <ActionIcon className="mr-2 h-6 w-6" />
                {getActionLabel(nextAction)}
              </>
            )}
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
        </div>

        {/* Timeline do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Registros de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Nenhum registro hoje
              </p>
            ) : (
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between border-l-2 border-primary pl-3"
                  >
                    <div>
                      <p className="font-medium">
                        {getEntryTypeLabel(entry.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.timestamp), "HH:mm:ss")}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Úteis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Dicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Mantenha a localização ativada para registros precisos</p>
            <p>• Use a foto opcional para maior segurança</p>
            <p>• Seus registros ficam salvos mesmo offline</p>
          </CardContent>
        </Card>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        title="Foto de Validação"
        description="Tire uma foto para confirmar seu registro de ponto"
      />
    </div>
  );
}

function getEntryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    entry: "Entrada",
    exit: "Saída",
    break_start: "Início Intervalo",
    break_end: "Fim Intervalo",
  };
  return labels[type] || type;
}
