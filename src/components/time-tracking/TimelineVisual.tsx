"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Clock, Coffee, Moon } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TimeRecord, ClockType } from "@/types/database"

interface TimelineVisualProps {
  entries: TimeRecord[]
  expectedHours: number
  date?: Date
  className?: string
}

interface TimeSegment {
  type: "working" | "break" | "outside"
  startTime: Date
  endTime: Date
  durationMinutes: number
}

export function TimelineVisual({
  entries,
  expectedHours,
  date = new Date(),
  className,
}: TimelineVisualProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
  }, [entries])

  const segments = React.useMemo((): TimeSegment[] => {
    if (sortedEntries.length === 0) return []

    const result: TimeSegment[] = []
    let currentStatus: "working" | "break" | "outside" = "outside"
    let segmentStart: Date | null = null

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    for (const entry of sortedEntries) {
      const entryTime = new Date(entry.recorded_at)
      const recordType = entry.record_type as ClockType

      if (recordType === "clock_in") {
        if (segmentStart && currentStatus === "outside") {
          result.push({
            type: "outside",
            startTime: segmentStart,
            endTime: entryTime,
            durationMinutes: (entryTime.getTime() - segmentStart.getTime()) / 60000,
          })
        }
        currentStatus = "working"
        segmentStart = entryTime
      } else if (recordType === "break_start" && currentStatus === "working") {
        if (segmentStart) {
          result.push({
            type: "working",
            startTime: segmentStart,
            endTime: entryTime,
            durationMinutes: (entryTime.getTime() - segmentStart.getTime()) / 60000,
          })
        }
        currentStatus = "break"
        segmentStart = entryTime
      } else if (recordType === "break_end" && currentStatus === "break") {
        if (segmentStart) {
          result.push({
            type: "break",
            startTime: segmentStart,
            endTime: entryTime,
            durationMinutes: (entryTime.getTime() - segmentStart.getTime()) / 60000,
          })
        }
        currentStatus = "working"
        segmentStart = entryTime
      } else if (recordType === "clock_out") {
        if (segmentStart && currentStatus !== "outside") {
          result.push({
            type: currentStatus,
            startTime: segmentStart,
            endTime: entryTime,
            durationMinutes: (entryTime.getTime() - segmentStart.getTime()) / 60000,
          })
        }
        currentStatus = "outside"
        segmentStart = entryTime
      }
    }

    // If still working or on break, extend to current time or end of day
    if (currentStatus !== "outside" && segmentStart) {
      const now = new Date()
      const endTime = now < dayEnd ? now : dayEnd
      result.push({
        type: currentStatus,
        startTime: segmentStart,
        endTime,
        durationMinutes: (endTime.getTime() - segmentStart.getTime()) / 60000,
      })
    }

    return result
  }, [sortedEntries, date])

  const totalWorkedMinutes = React.useMemo(() => {
    return segments
      .filter((s) => s.type === "working")
      .reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [segments])

  const totalBreakMinutes = React.useMemo(() => {
    return segments
      .filter((s) => s.type === "break")
      .reduce((acc, s) => acc + s.durationMinutes, 0)
  }, [segments])

  const expectedMinutes = expectedHours * 60
  const progressPercentage = Math.min((totalWorkedMinutes / expectedMinutes) * 100, 100)

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return `${hours}h ${mins}min`
  }

  const getSegmentColor = (type: TimeSegment["type"]): string => {
    switch (type) {
      case "working":
        return "bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600"
      case "break":
        return "bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-500"
      case "outside":
        return "bg-gray-300 dark:bg-gray-700"
      default:
        return "bg-gray-300"
    }
  }

  // Get current time position
  const getCurrentTimePosition = (): number => {
    const now = new Date()
    return getPositionPercentage(now)
  }

  const [currentTimePos, setCurrentTimePos] = React.useState(getCurrentTimePosition())

  // Update current time position every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimePos(getCurrentTimePosition())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const getSegmentIcon = (type: TimeSegment["type"]) => {
    switch (type) {
      case "working":
        return Clock
      case "break":
        return Coffee
      case "outside":
        return Moon
      default:
        return Clock
    }
  }

  const getSegmentLabel = (type: TimeSegment["type"]): string => {
    switch (type) {
      case "working":
        return "Trabalhando"
      case "break":
        return "Intervalo"
      case "outside":
        return "Fora do expediente"
      default:
        return "Desconhecido"
    }
  }

  // Calculate timeline positions based on work hours (6am to 10pm)
  const timelineStart = 6 // 6 AM
  const timelineEnd = 22 // 10 PM
  const timelineRange = timelineEnd - timelineStart

  const getPositionPercentage = (time: Date): number => {
    const hours = time.getHours() + time.getMinutes() / 60
    const clampedHours = Math.max(timelineStart, Math.min(timelineEnd, hours))
    return ((clampedHours - timelineStart) / timelineRange) * 100
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Timeline do Dia</CardTitle>
            <CardDescription>
              {date.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/50 dark:border-emerald-800/50 transition-all hover:scale-105">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatDuration(totalWorkedMinutes)}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Trabalhado</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50 transition-all hover:scale-105">
            <p className="text-2xl font-bold text-blue-600 dark:text-cyan-400 tabular-nums">
              {formatDuration(totalBreakMinutes)}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Intervalo</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border border-slate-200/50 dark:border-slate-800/50 transition-all hover:scale-105">
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 tabular-nums">
              {formatDuration(expectedMinutes)}
            </p>
            <p className="text-xs text-muted-foreground font-medium">Esperado</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso da jornada</span>
            <span className="tabular-nums font-semibold">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div
            className="h-3 w-full rounded-full bg-muted overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Visual Timeline */}
        <TooltipProvider>
          <div className="relative h-12 rounded-lg bg-muted overflow-hidden shadow-inner">
            {/* Time markers */}
            <div className="absolute inset-0 flex justify-between px-2 text-[10px] text-muted-foreground/50 items-center pointer-events-none">
              <span className="font-mono">06:00</span>
              <span className="font-mono">12:00</span>
              <span className="font-mono">18:00</span>
              <span className="font-mono">22:00</span>
            </div>

            {/* Segments */}
            {segments.map((segment, index) => {
              const left = getPositionPercentage(segment.startTime)
              const right = getPositionPercentage(segment.endTime)
              const width = right - left

              if (width <= 0) return null

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute top-2 bottom-2 rounded-md cursor-pointer transition-all duration-300 hover:scale-y-110 hover:shadow-lg",
                        getSegmentColor(segment.type),
                        "animate-in slide-in-from-left duration-700"
                      )}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                      role="button"
                      aria-label={`${getSegmentLabel(segment.type)}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover/95 backdrop-blur-sm">
                    <div className="text-sm">
                      <p className="font-semibold">{getSegmentLabel(segment.type)}</p>
                      <p className="text-muted-foreground font-mono">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </p>
                      <p className="text-muted-foreground font-medium">
                        {formatDuration(segment.durationMinutes)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}

            {/* Current time indicator (red vertical line) */}
            {currentTimePos >= 0 && currentTimePos <= 100 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-auto cursor-help transition-all duration-1000 ease-linear"
                    style={{ left: `${currentTimePos}%` }}
                    role="presentation"
                    aria-label={`Horário atual: ${formatTime(new Date())}`}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse" />
                    <div className="absolute -bottom-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-red-500 text-white font-semibold">
                  Agora: {formatTime(new Date())}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs" role="list" aria-label="Legenda">
          <div className="flex items-center gap-1.5" role="listitem">
            <span className="size-3 rounded bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm" aria-hidden="true" />
            <span className="font-medium">Trabalhando</span>
          </div>
          <div className="flex items-center gap-1.5" role="listitem">
            <span className="size-3 rounded bg-gradient-to-r from-blue-400 to-cyan-400 shadow-sm" aria-hidden="true" />
            <span className="font-medium">Intervalo</span>
          </div>
          <div className="flex items-center gap-1.5" role="listitem">
            <span className="size-3 rounded bg-gray-300 dark:bg-gray-700 shadow-sm" aria-hidden="true" />
            <span className="font-medium">Fora</span>
          </div>
          <div className="flex items-center gap-1.5" role="listitem">
            <span className="size-3 rounded-full bg-red-500 shadow-sm animate-pulse" aria-hidden="true" />
            <span className="font-medium text-red-600 dark:text-red-400">Agora</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && segments.length > 0 && (
          <div className="space-y-2 pt-2 border-t" role="list" aria-label="Detalhes dos registros">
            <h4 className="text-sm font-medium">Detalhes</h4>
            {segments.map((segment, index) => {
              const Icon = getSegmentIcon(segment.type)
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                  role="listitem"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "size-4",
                        segment.type === "working"
                          ? "text-green-600"
                          : segment.type === "break"
                            ? "text-yellow-600"
                            : "text-gray-500"
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">
                      {getSegmentLabel(segment.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="tabular-nums">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatDuration(segment.durationMinutes)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {segments.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum registro para este dia
          </div>
        )}
      </CardContent>
    </Card>
  )
}
