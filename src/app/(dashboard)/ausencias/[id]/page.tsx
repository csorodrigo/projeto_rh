"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  History,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AbsenceStatusBadge,
  AbsenceApprovalDialog,
  VacationBalanceCard,
} from "@/components/absences"
import {
  getAbsenceById,
  getAbsenceHistory,
  getVacationBalance,
  approveAbsence,
  rejectAbsence,
  deleteAbsence,
  getCurrentProfile,
} from "@/lib/supabase/queries"
import { ABSENCE_TYPE_LABELS } from "@/lib/constants"
import type {
  AbsenceWithEmployee,
  AbsenceHistory,
  VacationBalance,
  AbsenceType,
} from "@/types/database"

export default function AbsenceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const absenceId = params.id as string

  const [isLoading, setIsLoading] = React.useState(true)
  const [absence, setAbsence] = React.useState<AbsenceWithEmployee | null>(null)
  const [history, setHistory] = React.useState<AbsenceHistory[]>([])
  const [vacationBalances, setVacationBalances] = React.useState<VacationBalance[]>([])
  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false)
  const [canApprove, setCanApprove] = React.useState(false)

  // Carregar dados
  React.useEffect(() => {
    async function loadData() {
      try {
        // Verificar permissões
        const profileResult = await getCurrentProfile()
        if (profileResult.data?.role) {
          setCanApprove(
            ["super_admin", "company_admin", "hr_manager", "hr_analyst"].includes(
              profileResult.data.role
            )
          )
        }

        // Carregar ausência
        const absenceResult = await getAbsenceById(absenceId)
        if (absenceResult.error || !absenceResult.data) {
          toast.error("Ausência não encontrada")
          router.push("/ausencias")
          return
        }

        setAbsence(absenceResult.data)

        // Carregar histórico
        const historyResult = await getAbsenceHistory(absenceId)
        if (historyResult.data) {
          setHistory(historyResult.data)
        }

        // Carregar saldo de férias se for férias
        if (
          ["vacation", "vacation_advance", "vacation_sold"].includes(
            absenceResult.data.type
          )
        ) {
          const balanceResult = await getVacationBalance(
            absenceResult.data.employee_id
          )
          if (balanceResult.data) {
            setVacationBalances(balanceResult.data)
          }
        }
      } catch {
        toast.error("Erro ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [absenceId, router])

  const handleApprove = async (absenceId: string) => {
    const result = await approveAbsence(absenceId)
    if (result.error) {
      toast.error("Erro ao aprovar: " + result.error.message)
      return
    }
    toast.success("Ausência aprovada!")
    setAbsence((prev) => (prev ? { ...prev, status: "approved" } : null))
  }

  const handleReject = async (absenceId: string, reason: string) => {
    const result = await rejectAbsence(absenceId, reason)
    if (result.error) {
      toast.error("Erro ao rejeitar: " + result.error.message)
      return
    }
    toast.success("Ausência rejeitada")
    setAbsence((prev) =>
      prev ? { ...prev, status: "rejected", rejection_reason: reason } : null
    )
  }

  const handleCancel = async () => {
    if (!absence) return
    if (!confirm("Deseja realmente cancelar esta ausência?")) return

    const result = await deleteAbsence(absence.id, "Cancelado pelo usuário")
    if (result.error) {
      toast.error("Erro ao cancelar: " + result.error.message)
      return
    }
    toast.success("Ausência cancelada")
    router.push("/ausencias")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!absence) {
    return null
  }

  const isVacationType = ["vacation", "vacation_advance", "vacation_sold"].includes(
    absence.type
  )
  const isMedicalType = [
    "sick_leave",
    "medical_appointment",
    "prenatal",
    "child_sick",
  ].includes(absence.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ausencias">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {ABSENCE_TYPE_LABELS[absence.type as AbsenceType]}
              </h1>
              <AbsenceStatusBadge status={absence.status} size="lg" />
            </div>
            <p className="text-muted-foreground">
              Solicitação #{absence.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {absence.status === "pending" && canApprove && (
            <>
              <Button
                variant="outline"
                onClick={() => setApprovalDialogOpen(true)}
              >
                <XCircle className="mr-2 size-4" />
                Rejeitar
              </Button>
              <Button onClick={() => handleApprove(absence.id)}>
                <CheckCircle className="mr-2 size-4" />
                Aprovar
              </Button>
            </>
          )}
          {(absence.status === "draft" || absence.status === "pending") && (
            <Button variant="destructive" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Funcionário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                  {absence.employee_photo_url ? (
                    <img
                      src={absence.employee_photo_url}
                      alt={absence.employee_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    absence.employee_name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">{absence.employee_name}</p>
                  <p className="text-muted-foreground">
                    {absence.employee_department || "Sem departamento"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da ausência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Detalhes da Ausência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {ABSENCE_TYPE_LABELS[absence.type as AbsenceType]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Dias</p>
                  <p className="font-medium">{absence.total_days} dias</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Início</p>
                  <p className="font-medium">
                    {format(new Date(absence.start_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Fim</p>
                  <p className="font-medium">
                    {format(new Date(absence.end_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {absence.reason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Motivo</p>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {absence.reason}
                    </p>
                  </div>
                </>
              )}

              {absence.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Observações Internas
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {absence.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações médicas */}
          {isMedicalType && (absence.cid_code || absence.issuing_doctor) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Informações Médicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {absence.cid_code && (
                    <div>
                      <p className="text-sm text-muted-foreground">CID</p>
                      <p className="font-medium">{absence.cid_code}</p>
                    </div>
                  )}
                  {absence.issuing_doctor && (
                    <div>
                      <p className="text-sm text-muted-foreground">Médico</p>
                      <p className="font-medium">{absence.issuing_doctor}</p>
                    </div>
                  )}
                  {absence.crm && (
                    <div>
                      <p className="text-sm text-muted-foreground">CRM</p>
                      <p className="font-medium">{absence.crm}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documento anexo */}
          {absence.document_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Documento Anexo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a
                    href={absence.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 size-4" />
                    Visualizar Documento
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Motivo da rejeição */}
          {absence.status === "rejected" && absence.rejection_reason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="size-5" />
                  Motivo da Rejeição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{absence.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline / Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Criado</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(absence.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {absence.requested_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Enviado para aprovação</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(absence.requested_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {absence.approved_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Aprovado</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(absence.approved_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {absence.rejected_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">Rejeitado</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(absence.rejected_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {absence.cancelled_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Cancelado</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(absence.cancelled_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saldo de férias */}
          {isVacationType && vacationBalances.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="size-4" />
                Saldo de Férias
              </h3>
              {vacationBalances.map((balance) => (
                <VacationBalanceCard
                  key={balance.id}
                  balance={balance}
                  compact
                />
              ))}
            </div>
          )}

          {/* Histórico */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="size-4" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {item.action}
                        </Badge>
                        <span className="text-muted-foreground">
                          {format(
                            new Date(item.performed_at),
                            "dd/MM/yy HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-muted-foreground">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de aprovação */}
      <AbsenceApprovalDialog
        absence={absence}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
