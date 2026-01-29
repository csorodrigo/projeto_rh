"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, ArrowDown, ArrowUp, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TimeRecord } from "@/types/database"

interface HistoryCardProps {
  date: Date
  records: TimeRecord[]
  expectedHours?: number
}

interface RecordPair {
  clockIn: TimeRecord | null
  clockOut: TimeRecord | null
  workedMinutes: number
}

export function HistoryCard({ date, records, expectedHours = 8 }: HistoryCardProps) {
  // Group records into pairs (clock_in -> clock_out)
  const pairs = React.useMemo(() => {
    const result: RecordPair[] = []
    let currentPair: RecordPair = { clockIn: null, clockOut: null, workedMinutes: 0 }

    records.forEach((record) => {
      if (record.record_type === "clock_in" || record.record_type === "break_end") {
        // Start a new pair
        if (currentPair.clockIn && !currentPair.clockOut) {
          // Previous pair is incomplete
          result.push(currentPair)
        }
        currentPair = { clockIn: record, clockOut: null, workedMinutes: 0 }
      } else if (record.record_type === "clock_out" || record.record_type === "break_start") {
        // Complete current pair
        if (currentPair.clockIn) {
          const start = new Date(currentPair.clockIn.recorded_at).getTime()
          const end = new Date(record.recorded_at).getTime()
          currentPair.clockOut = record
          currentPair.workedMinutes = Math.round((end - start) / 1000 / 60)
          result.push(currentPair)
          currentPair = { clockIn: null, clockOut: null, workedMinutes: 0 }
        }
      }
    })

    // Add incomplete pair if exists
    if (currentPair.clockIn) {
      result.push(currentPair)
    }

    return result
  }, [records])

  // Calculate total worked minutes
  const totalWorkedMinutes = React.useMemo(() => {
    return pairs.reduce((sum, pair) => sum + pair.workedMinutes, 0)
  }, [pairs])

  // Calculate status
  const status = React.useMemo(() => {
    if (records.length === 0) return "no_records"

    // Check if all pairs are complete
    const hasIncompletePair = pairs.some((pair) => pair.clockIn && !pair.clockOut)
    if (hasIncompletePair) return "incomplete"

    return "complete"
  }, [records, pairs])

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const getStatusIcon = () => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="size-5 text-green-600" />
      case "incomplete":
        return <AlertCircle className="size-5 text-yellow-600" />
      case "no_records":
        return <XCircle className="size-5 text-red-600" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="default" className="bg-green-600">
            Completo
          </Badge>
        )
      case "incomplete":
        return (
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            Incompleto
          </Badge>
        )
      case "no_records":
        return (
          <Badge variant="destructive">
            Sem registros
          </Badge>
        )
    }
  }

  const expectedMinutes = expectedHours * 60
  const difference = totalWorkedMinutes - expectedMinutes

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold capitalize">
                  {format(date, "EEEE, dd/MM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {records.length} registro(s)
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Records */}
          {records.length > 0 ? (
            <div className="space-y-2">
              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {/* Clock In */}
                  {pair.clockIn && (
                    <div className="flex items-center gap-2 flex-1">
                      <ArrowDown className="size-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {pair.clockIn.record_type === "break_end" ? "Volta" : "Entrada"}
                        </p>
                        <p className="font-medium tabular-nums">
                          {format(parseISO(pair.clockIn.recorded_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Arrow */}
                  {pair.clockIn && pair.clockOut && (
                    <div className="text-muted-foreground">→</div>
                  )}

                  {/* Clock Out */}
                  {pair.clockOut && (
                    <div className="flex items-center gap-2 flex-1">
                      <ArrowUp className="size-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {pair.clockOut.record_type === "break_start" ? "Intervalo" : "Saída"}
                        </p>
                        <p className="font-medium tabular-nums">
                          {format(parseISO(pair.clockOut.recorded_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {pair.workedMinutes > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium tabular-nums">
                        {formatMinutes(pair.workedMinutes)}
                      </p>
                    </div>
                  )}

                  {/* Incomplete indicator */}
                  {pair.clockIn && !pair.clockOut && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Em aberto
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <XCircle className="size-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro neste dia</p>
            </div>
          )}

          {/* Summary */}
          {totalWorkedMinutes > 0 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total trabalhado</p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">
                  {formatMinutes(totalWorkedMinutes)}
                </p>
              </div>
              {difference !== 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {difference > 0 ? "Hora extra" : "Faltante"}
                  </p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      difference > 0 ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {difference > 0 ? "+" : ""}
                    {formatMinutes(Math.abs(difference))}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
