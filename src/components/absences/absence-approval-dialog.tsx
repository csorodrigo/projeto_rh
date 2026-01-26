"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AbsenceStatusBadge } from "./absence-status-badge"
import { ABSENCE_TYPE_LABELS } from "@/lib/constants"
import type { AbsenceWithEmployee, AbsenceType } from "@/types/database"

interface AbsenceApprovalDialogProps {
  absence: AbsenceWithEmployee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (absenceId: string) => Promise<void>
  onReject: (absenceId: string, reason: string) => Promise<void>
}

export function AbsenceApprovalDialog({
  absence,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: AbsenceApprovalDialogProps) {
  const [rejectReason, setRejectReason] = React.useState("")
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleApprove = async () => {
    if (!absence) return
    setIsLoading(true)
    try {
      await onApprove(absence.id)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!absence || !rejectReason.trim()) return
    setIsLoading(true)
    try {
      await onReject(absence.id, rejectReason)
      setShowRejectDialog(false)
      onOpenChange(false)
      setRejectReason("")
    } finally {
      setIsLoading(false)
    }
  }

  if (!absence) return null

  return (
    <>
      <Dialog open={open && !showRejectDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Analisar Solicitação</DialogTitle>
            <DialogDescription>
              Revise os detalhes da ausência antes de aprovar ou rejeitar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Funcionário */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {absence.employee_photo_url ? (
                  <img
                    src={absence.employee_photo_url}
                    alt={absence.employee_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {absence.employee_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{absence.employee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {absence.employee_department || "Sem departamento"}
                </p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {ABSENCE_TYPE_LABELS[absence.type as AbsenceType]}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <AbsenceStatusBadge status={absence.status} />
              </div>
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium">
                  {format(new Date(absence.start_date), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(new Date(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Dias</p>
                <p className="font-medium">{absence.total_days} dias</p>
              </div>
            </div>

            {/* Motivo */}
            {absence.reason && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Motivo</p>
                <p className="text-sm bg-muted p-3 rounded-md">{absence.reason}</p>
              </div>
            )}

            {/* Documentação médica */}
            {absence.cid_code && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Informações Médicas</p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  {absence.cid_code && <p>CID: {absence.cid_code}</p>}
                  {absence.issuing_doctor && <p>Médico: {absence.issuing_doctor}</p>}
                  {absence.crm && <p>CRM: {absence.crm}</p>}
                </div>
              </div>
            )}

            {/* Documento anexo */}
            {absence.document_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Documento</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={absence.document_url} target="_blank" rel="noopener noreferrer">
                    Visualizar documento
                  </a>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
            >
              <XCircle className="mr-2 size-4" />
              Rejeitar
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 size-4" />
              )}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, informe o motivo da rejeição. Este motivo será visível para o funcionário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
            <Textarea
              id="reject-reason"
              placeholder="Informe o motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isLoading || !rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 size-4" />
              )}
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
