"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MoreHorizontal, Eye, CheckCircle, XCircle, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AbsenceStatusBadge } from "./absence-status-badge"
import { ABSENCE_TYPE_LABELS, ABSENCE_TYPE_COLORS } from "@/lib/constants"
import type { AbsenceWithEmployee, AbsenceType } from "@/types/database"

interface AbsenceTableProps {
  absences: AbsenceWithEmployee[]
  isLoading?: boolean
  onView?: (absence: AbsenceWithEmployee) => void
  onApprove?: (absence: AbsenceWithEmployee) => void
  onReject?: (absence: AbsenceWithEmployee) => void
  onCancel?: (absence: AbsenceWithEmployee) => void
}

export function AbsenceTable({
  absences,
  isLoading = false,
  onView,
  onApprove,
  onReject,
  onCancel,
}: AbsenceTableProps) {
  if (isLoading) {
    return <AbsenceTableSkeleton />
  }

  if (absences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma ausência encontrada</p>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros ou criar uma nova solicitação
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Período</TableHead>
          <TableHead className="text-center">Dias</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {absences.map((absence) => (
          <TableRow key={absence.id}>
            {/* Funcionário */}
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={absence.employee_photo_url || undefined} />
                  <AvatarFallback>
                    {absence.employee_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{absence.employee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {absence.employee_department || "-"}
                  </p>
                </div>
              </div>
            </TableCell>

            {/* Tipo */}
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  className={`size-2 rounded-full ${
                    ABSENCE_TYPE_COLORS[absence.type as AbsenceType] || "bg-gray-500"
                  }`}
                />
                <span className="text-sm">
                  {ABSENCE_TYPE_LABELS[absence.type as AbsenceType] || absence.type}
                </span>
              </div>
            </TableCell>

            {/* Período */}
            <TableCell>
              <div className="text-sm">
                {format(new Date(absence.start_date), "dd/MM/yyyy", { locale: ptBR })}
                {absence.start_date !== absence.end_date && (
                  <>
                    {" - "}
                    {format(new Date(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </>
                )}
              </div>
            </TableCell>

            {/* Dias */}
            <TableCell className="text-center">
              <span className="font-medium">{absence.total_days}</span>
            </TableCell>

            {/* Motivo */}
            <TableCell>
              <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                {absence.reason || "-"}
              </p>
            </TableCell>

            {/* Status */}
            <TableCell>
              <AbsenceStatusBadge status={absence.status} />
            </TableCell>

            {/* Ações */}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(absence)}>
                    <Eye className="mr-2 size-4" />
                    Ver detalhes
                  </DropdownMenuItem>

                  {absence.status === "pending" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onApprove?.(absence)}
                        className="text-green-600"
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Aprovar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onReject?.(absence)}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 size-4" />
                        Rejeitar
                      </DropdownMenuItem>
                    </>
                  )}

                  {(absence.status === "draft" || absence.status === "pending") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onCancel?.(absence)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function AbsenceTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Período</TableHead>
          <TableHead className="text-center">Dias</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-8 mx-auto" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="size-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
