"use client"

import * as React from "react"
import {
  Play,
  Coffee,
  Pause,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { ClockType } from "@/types/database"

type ButtonState = "idle" | "loading" | "success" | "error"

interface ClockInButtonProps {
  currentStatus: "not_started" | "working" | "break" | "finished"
  onClockAction: (action: ClockType) => Promise<void>
  isLoading?: boolean
  showTimeDisplay?: boolean
  className?: string
}

const actionConfig: Record<
  ClockType,
  {
    label: string
    description: string
    icon: React.ElementType
    color: string
    bgColor: string
    hoverBgColor: string
  }
> = {
  clock_in: {
    label: "Entrada",
    description: "Iniciar jornada de trabalho",
    icon: Play,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500",
    hoverBgColor: "hover:bg-green-600",
  },
  break_start: {
    label: "Intervalo",
    description: "Iniciar intervalo",
    icon: Coffee,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500",
    hoverBgColor: "hover:bg-yellow-600",
  },
  break_end: {
    label: "Retorno",
    description: "Retornar do intervalo",
    icon: Pause,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500",
    hoverBgColor: "hover:bg-blue-600",
  },
  clock_out: {
    label: "Saida",
    description: "Encerrar jornada",
    icon: LogOut,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500",
    hoverBgColor: "hover:bg-red-600",
  },
}

export function ClockInButton({
  currentStatus,
  onClockAction,
  isLoading = false,
  showTimeDisplay = true,
  className,
}: ClockInButtonProps) {
  const [time, setTime] = React.useState(new Date())
  const [buttonState, setButtonState] = React.useState<ButtonState>("idle")
  const [lastAction, setLastAction] = React.useState<ClockType | null>(null)

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Reset button state after feedback
  React.useEffect(() => {
    if (buttonState === "success" || buttonState === "error") {
      const timer = setTimeout(() => {
        setButtonState("idle")
        setLastAction(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [buttonState])

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
    })
  }

  const getNextAction = (): ClockType | null => {
    switch (currentStatus) {
      case "not_started":
        return "clock_in"
      case "working":
        return "break_start" // or clock_out, user can choose
      case "break":
        return "break_end"
      case "finished":
        return null
      default:
        return null
    }
  }

  const isActionAvailable = (action: ClockType): boolean => {
    if (isLoading || buttonState === "loading") return false

    switch (action) {
      case "clock_in":
        return currentStatus === "not_started"
      case "break_start":
        return currentStatus === "working"
      case "break_end":
        return currentStatus === "break"
      case "clock_out":
        return currentStatus === "working"
      default:
        return false
    }
  }

  const handleAction = async (action: ClockType) => {
    if (!isActionAvailable(action)) return

    setButtonState("loading")
    setLastAction(action)

    try {
      await onClockAction(action)
      setButtonState("success")

      const config = actionConfig[action]
      toast.success("Ponto registrado!", {
        description: `${config.label} registrada as ${formatTime(new Date())}`,
      })
    } catch (error) {
      setButtonState("error")
      toast.error("Erro ao registrar ponto", {
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    }
  }

  const nextAction = getNextAction()
  const primaryConfig = nextAction ? actionConfig[nextAction] : null

  const getStatusLabel = (): string => {
    switch (currentStatus) {
      case "not_started":
        return "Aguardando entrada"
      case "working":
        return "Trabalhando"
      case "break":
        return "Em intervalo"
      case "finished":
        return "Jornada encerrada"
      default:
        return "Desconhecido"
    }
  }

  const getStatusColor = (): string => {
    switch (currentStatus) {
      case "not_started":
        return "text-muted-foreground"
      case "working":
        return "text-green-600 dark:text-green-400"
      case "break":
        return "text-yellow-600 dark:text-yellow-400"
      case "finished":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-muted-foreground"
    }
  }

  const renderButtonContent = (action: ClockType) => {
    const config = actionConfig[action]
    const Icon = config.icon
    const isLoadingThis = buttonState === "loading" && lastAction === action
    const isSuccessThis = buttonState === "success" && lastAction === action
    const isErrorThis = buttonState === "error" && lastAction === action

    if (isLoadingThis) {
      return (
        <>
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span className="font-semibold">Registrando...</span>
        </>
      )
    }

    if (isSuccessThis) {
      return (
        <>
          <CheckCircle2 className="size-6 animate-in zoom-in duration-300" aria-hidden="true" />
          <span className="font-semibold">Registrado!</span>
        </>
      )
    }

    if (isErrorThis) {
      return (
        <>
          <XCircle className="size-6 animate-in zoom-in duration-300" aria-hidden="true" />
          <span className="font-semibold">Erro!</span>
        </>
      )
    }

    return (
      <>
        <Icon className="size-6 transition-transform group-hover:scale-110" aria-hidden="true" />
        <span className="font-semibold">{config.label}</span>
      </>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" aria-hidden="true" />
              Controle de Ponto
            </CardTitle>
            <CardDescription className={cn("mt-1", getStatusColor())}>
              {getStatusLabel()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Clock Display */}
        {showTimeDisplay && (
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200/50 dark:border-slate-800/50 shadow-inner" aria-live="polite" aria-atomic="true">
            <time
              className="text-6xl font-bold tracking-tight tabular-nums bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
              dateTime={time.toISOString()}
            >
              {formatTime(time)}
            </time>
            <p className="text-sm text-muted-foreground mt-2 capitalize font-medium">
              {formatDate(time)}
            </p>
          </div>
        )}

        {/* Primary Action Button */}
        {primaryConfig && nextAction && (
          <Button
            size="lg"
            className={cn(
              "w-full h-20 text-xl gap-4 text-white transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group",
              primaryConfig.bgColor,
              primaryConfig.hoverBgColor,
              currentStatus === "working" && "animate-pulse",
              currentStatus === "break" && "animate-pulse",
              buttonState === "success" && lastAction === nextAction && "bg-green-500 scale-105",
              buttonState === "error" && lastAction === nextAction && "bg-red-500 scale-105"
            )}
            onClick={() => handleAction(nextAction)}
            disabled={!isActionAvailable(nextAction)}
            aria-label={`${primaryConfig.label}: ${primaryConfig.description}`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {renderButtonContent(nextAction)}
          </Button>
        )}

        {/* Secondary Actions (when working, show both break and clock out) */}
        {currentStatus === "working" && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "h-16 flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group",
                actionConfig.break_start.color,
                "border-2",
                buttonState === "success" && lastAction === "break_start" && "border-green-500 bg-green-50 dark:bg-green-950 scale-105",
                buttonState === "error" && lastAction === "break_start" && "border-red-500 bg-red-50 dark:bg-red-950"
              )}
              onClick={() => handleAction("break_start")}
              disabled={!isActionAvailable("break_start")}
              aria-label="Iniciar intervalo"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 dark:via-blue-950/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {renderButtonContent("break_start")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "h-16 flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group",
                actionConfig.clock_out.color,
                "border-2",
                buttonState === "success" && lastAction === "clock_out" && "border-green-500 bg-green-50 dark:bg-green-950 scale-105",
                buttonState === "error" && lastAction === "clock_out" && "border-red-500 bg-red-50 dark:bg-red-950"
              )}
              onClick={() => handleAction("clock_out")}
              disabled={!isActionAvailable("clock_out")}
              aria-label="Encerrar jornada"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/50 dark:via-red-950/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {renderButtonContent("clock_out")}
            </Button>
          </div>
        )}

        {/* Finished State */}
        {currentStatus === "finished" && (
          <div
            className="text-center py-4 bg-muted/50 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              className="size-8 mx-auto text-green-600 dark:text-green-400 mb-2"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">Jornada encerrada</p>
            <p className="text-xs text-muted-foreground">
              Ate amanha!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
