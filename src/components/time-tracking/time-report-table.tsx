"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { TimeTrackingDaily, TimeRecordStatus } from "@/types/database"

interface TimeReportTableProps {
  data: (TimeTrackingDaily & { employee_name?: string; department?: string | null })[]
  showEmployee?: boolean
}

function formatMinutesToHours(minutes: number): string {
  if (minutes === 0) return "0h"
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : ''

  if (hours === 0) {
    return `${sign}${mins}min`
  }

  return `${sign}${hours}h${mins > 0 ? ` ${mins}min` : ''}`
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '--:--'
  const date = new Date(dateString)
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
}

const statusConfig: Record<TimeRecordStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  adjusted: { label: "Ajustado", variant: "outline" },
}

export function TimeReportTable({ data, showEmployee = false }: TimeReportTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro encontrado para o período selecionado
      </div>
    )
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      worked: acc.worked + item.worked_minutes,
      overtime: acc.overtime + item.overtime_minutes,
      missing: acc.missing + item.missing_minutes,
      break: acc.break + item.break_minutes,
    }),
    { worked: 0, overtime: 0, missing: 0, break: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {showEmployee && <TableHead>Funcionário</TableHead>}
              <TableHead>Entrada</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Trabalhado</TableHead>
              <TableHead>Extras</TableHead>
              <TableHead>Falta</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const statusCfg = statusConfig[item.status]
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {formatDate(item.date)}
                  </TableCell>
                  {showEmployee && (
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.employee_name}</span>
                        {item.department && (
                          <p className="text-xs text-muted-foreground">{item.department}</p>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{formatTime(item.clock_in)}</TableCell>
                  <TableCell>{formatTime(item.clock_out)}</TableCell>
                  <TableCell>{formatMinutesToHours(item.worked_minutes)}</TableCell>
                  <TableCell className={item.overtime_minutes > 0 ? "text-green-600 font-medium" : ""}>
                    {item.overtime_minutes > 0 ? `+${formatMinutesToHours(item.overtime_minutes)}` : '-'}
                  </TableCell>
                  <TableCell className={item.missing_minutes > 0 ? "text-red-600 font-medium" : ""}>
                    {item.missing_minutes > 0 ? `-${formatMinutesToHours(item.missing_minutes)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Total Trabalhado</p>
          <p className="text-lg font-bold">{formatMinutesToHours(totals.worked)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Extras</p>
          <p className="text-lg font-bold text-green-600">+{formatMinutesToHours(totals.overtime)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Falta</p>
          <p className="text-lg font-bold text-red-600">-{formatMinutesToHours(totals.missing)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saldo Período</p>
          <p className={`text-lg font-bold ${totals.overtime - totals.missing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatMinutesToHours(totals.overtime - totals.missing)}
          </p>
        </div>
      </div>
    </div>
  )
}
