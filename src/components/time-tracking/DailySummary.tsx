"use client"

import * as React from "react"
import {
  Clock,
  Timer,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type DayStatus = "on_track" | "late" | "overtime" | "not_started" | "finished"

interface DailySummaryProps {
  workedMinutes: number
  expectedMinutes: number
  breakMinutes: number
  remainingMinutes: number
  overtimeMinutes: number
  currentStatus: "not_started" | "working" | "break" | "finished"
  clockInTime?: string | null
  clockOutTime?: string | null
  date?: Date
  className?: string
}

export function DailySummary({
  workedMinutes,
  expectedMinutes,
  breakMinutes,
  remainingMinutes,
  overtimeMinutes,
  currentStatus,
  clockInTime,
  clockOutTime,
  date = new Date(),
  className,
}: DailySummaryProps) {
  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(Math.abs(mins) / 60)
    const minutes = Math.abs(mins) % 60
    const sign = mins < 0 ? "-" : ""
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const formatTimeString = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "--:--"
    const date = new Date(timeStr)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDayStatus = (): DayStatus => {
    if (currentStatus === "not_started") return "not_started"
    if (currentStatus === "finished") {
      if (overtimeMinutes > 0) return "overtime"
      if (remainingMinutes > 0) return "late"
      return "finished"
    }
    // Still working
    if (overtimeMinutes > 0) return "overtime"
    return "on_track"
  }

  const dayStatus = getDayStatus()

  const progressPercentage = expectedMinutes > 0
    ? Math.min((workedMinutes / expectedMinutes) * 100, 100)
    : 0

  const getStatusConfig = () => {
    switch (dayStatus) {
      case "on_track":
        return {
          label: "Em dia",
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-950",
          badgeVariant: "default" as const,
        }
      case "overtime":
        return {
          label: "Hora extra",
          icon: TrendingUp,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-100 dark:bg-amber-950",
          badgeVariant: "secondary" as const,
        }
      case "late":
        return {
          label: "Horas faltantes",
          icon: TrendingDown,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-950",
          badgeVariant: "destructive" as const,
        }
      case "finished":
        return {
          label: "Concluido",
          icon: CheckCircle2,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-950",
          badgeVariant: "outline" as const,
        }
      case "not_started":
      default:
        return {
          label: "Nao iniciado",
          icon: MinusCircle,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          badgeVariant: "outline" as const,
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" aria-hidden="true" />
              Resumo do Dia
            </CardTitle>
            <CardDescription className="capitalize">
              {formatDateHeader(date)}
            </CardDescription>
          </div>
          <Badge
            variant={statusConfig.badgeVariant}
            className={cn("gap-1.5", statusConfig.color)}
          >
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso da jornada</span>
            <span className="font-medium tabular-nums">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-3"
            aria-label={`Progresso: ${progressPercentage.toFixed(0)}%`}
          />
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Worked Hours */}
          <div
            className={cn(
              "rounded-lg p-4 text-center",
              statusConfig.bgColor
            )}
          >
            <Timer
              className={cn("size-5 mx-auto mb-2", statusConfig.color)}
              aria-hidden="true"
            />
            <p
              className={cn("text-2xl font-bold tabular-nums", statusConfig.color)}
              aria-label={`Horas trabalhadas: ${formatMinutes(workedMinutes)}`}
            >
              {formatMinutes(workedMinutes)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Trabalhado</p>
          </div>

          {/* Remaining / Overtime */}
          <div
            className={cn(
              "rounded-lg p-4 text-center",
              overtimeMinutes > 0
                ? "bg-amber-100 dark:bg-amber-950"
                : remainingMinutes > 0
                  ? "bg-muted"
                  : "bg-green-100 dark:bg-green-950"
            )}
          >
            {overtimeMinutes > 0 ? (
              <>
                <TrendingUp
                  className="size-5 mx-auto mb-2 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <p
                  className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400"
                  aria-label={`Hora extra: ${formatMinutes(overtimeMinutes)}`}
                >
                  +{formatMinutes(overtimeMinutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Hora extra</p>
              </>
            ) : remainingMinutes > 0 ? (
              <>
                <Clock
                  className="size-5 mx-auto mb-2 text-muted-foreground"
                  aria-hidden="true"
                />
                <p
                  className="text-2xl font-bold tabular-nums text-foreground"
                  aria-label={`Restante: ${formatMinutes(remainingMinutes)}`}
                >
                  {formatMinutes(remainingMinutes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Restante</p>
              </>
            ) : (
              <>
                <CheckCircle2
                  className="size-5 mx-auto mb-2 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
                <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
                  00:00
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completo</p>
              </>
            )}
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Expected */}
          <div className="space-y-1">
            <p className="text-lg font-semibold tabular-nums">
              {formatMinutes(expectedMinutes)}
            </p>
            <p className="text-xs text-muted-foreground">Esperado</p>
          </div>

          {/* Break */}
          <div className="space-y-1">
            <p className="text-lg font-semibold tabular-nums text-yellow-600 dark:text-yellow-400">
              {formatMinutes(breakMinutes)}
            </p>
            <p className="text-xs text-muted-foreground">Intervalo</p>
          </div>

          {/* Entry/Exit Times */}
          <div className="space-y-1">
            <p className="text-lg font-semibold tabular-nums">
              {formatTimeString(clockInTime)}
            </p>
            <p className="text-xs text-muted-foreground">Entrada</p>
          </div>
        </div>

        {/* Clock In/Out Times */}
        {(clockInTime || clockOutTime) && (
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-2">
              <div
                className="size-2 rounded-full bg-green-500"
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">Entrada:</span>
              <span className="text-sm font-medium tabular-nums">
                {formatTimeString(clockInTime)}
              </span>
            </div>
            {clockOutTime && (
              <div className="flex items-center gap-2">
                <div
                  className="size-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                <span className="text-sm text-muted-foreground">Saida:</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatTimeString(clockOutTime)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Warning for late status */}
        {dayStatus === "late" && currentStatus === "finished" && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900"
            role="alert"
          >
            <AlertTriangle
              className="size-4 text-red-600 dark:text-red-400 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm text-red-600 dark:text-red-400">
              Jornada incompleta. Faltam{" "}
              <span className="font-medium">{formatMinutes(remainingMinutes)}</span>{" "}
              para completar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
