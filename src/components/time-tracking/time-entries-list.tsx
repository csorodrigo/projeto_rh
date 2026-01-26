"use client"

import * as React from "react"
import { Play, Coffee, Pause, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { TimeRecord, ClockType } from "@/types/database"

interface TimeEntriesListProps {
  entries: TimeRecord[]
  showEmpty?: boolean
}

const entryConfig: Record<ClockType, { label: string; icon: React.ElementType; color: string }> = {
  clock_in: { label: "Entrada", icon: Play, color: "text-green-600" },
  break_start: { label: "Início Intervalo", icon: Coffee, color: "text-yellow-600" },
  break_end: { label: "Fim Intervalo", icon: Pause, color: "text-blue-600" },
  clock_out: { label: "Saída", icon: LogOut, color: "text-red-600" },
}

export function TimeEntriesList({ entries, showEmpty = true }: TimeEntriesListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (entries.length === 0 && showEmpty) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum registro hoje
      </div>
    )
  }

  if (entries.length === 0) {
    return null
  }

  return (
    <>
      <Separator />
      <div>
        <h4 className="font-medium mb-3">Registros de Hoje</h4>
        <div className="space-y-2">
          {entries.map((entry) => {
            const config = entryConfig[entry.record_type]
            const Icon = config.icon
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${config.color}`} />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
                <span className="font-medium tabular-nums">
                  {formatTime(entry.recorded_at)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
