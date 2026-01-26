"use client"

import * as React from "react"
import { Play, Coffee, Pause, LogOut, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { ClockType } from "@/types/database"

interface ClockWidgetProps {
  currentStatus: 'not_started' | 'working' | 'break' | 'finished'
  onClockAction: (action: ClockType) => Promise<void>
  isLoading?: boolean
}

export function ClockWidget({ currentStatus, onClockAction, isLoading = false }: ClockWidgetProps) {
  const [time, setTime] = React.useState(new Date())
  const [actionLoading, setActionLoading] = React.useState<ClockType | null>(null)

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const handleAction = async (action: ClockType) => {
    setActionLoading(action)
    try {
      await onClockAction(action)
      const actionLabels: Record<ClockType, string> = {
        clock_in: "Entrada registrada",
        clock_out: "Saída registrada",
        break_start: "Intervalo iniciado",
        break_end: "Retorno registrado",
      }
      toast.success("Ponto registrado!", {
        description: actionLabels[action],
      })
    } catch (error) {
      toast.error("Erro ao registrar ponto", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const isButtonDisabled = (action: ClockType) => {
    if (isLoading || actionLoading) return true

    switch (action) {
      case 'clock_in':
        return currentStatus !== 'not_started'
      case 'break_start':
        return currentStatus !== 'working'
      case 'break_end':
        return currentStatus !== 'break'
      case 'clock_out':
        return currentStatus !== 'working'
      default:
        return true
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <div className="text-center">
        <div className="text-6xl font-bold tracking-tight tabular-nums">
          {formatTime(time)}
        </div>
        <p className="text-sm text-muted-foreground mt-1 capitalize">
          {formatDate(time)}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span>Localização automática ativada</span>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          className="h-20 flex-col gap-2"
          variant={currentStatus === "not_started" ? "default" : "outline"}
          onClick={() => handleAction("clock_in")}
          disabled={isButtonDisabled("clock_in")}
        >
          {actionLoading === "clock_in" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Play className="size-6" />
          )}
          Entrada
        </Button>
        <Button
          size="lg"
          className="h-20 flex-col gap-2"
          variant={currentStatus === "working" ? "default" : "outline"}
          onClick={() => handleAction("break_start")}
          disabled={isButtonDisabled("break_start")}
        >
          {actionLoading === "break_start" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Coffee className="size-6" />
          )}
          Intervalo
        </Button>
        <Button
          size="lg"
          className="h-20 flex-col gap-2"
          variant={currentStatus === "break" ? "default" : "outline"}
          onClick={() => handleAction("break_end")}
          disabled={isButtonDisabled("break_end")}
        >
          {actionLoading === "break_end" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Pause className="size-6" />
          )}
          Retorno
        </Button>
        <Button
          size="lg"
          className="h-20 flex-col gap-2"
          variant="destructive"
          onClick={() => handleAction("clock_out")}
          disabled={isButtonDisabled("clock_out")}
        >
          {actionLoading === "clock_out" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <LogOut className="size-6" />
          )}
          Saída
        </Button>
      </div>
    </div>
  )
}
