"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { AbsenceStatusBadge } from "@/components/absences"
import { ABSENCE_TYPE_LABELS } from "@/lib/constants"
import {
  getPendingAbsences,
  listAbsences,
  approveAbsence,
  rejectAbsence,
  getCurrentProfile,
} from "@/lib/supabase/queries"
import type { AbsenceWithEmployee, AbsenceStatus, UserRole } from "@/types/database"

interface ApprovalAction {
  type: "approve" | "reject"
  absence: AbsenceWithEmployee
}

export default function ApprovacoesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [absences, setAbsences] = React.useState<AbsenceWithEmployee[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<UserRole | null>(null)
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  )

  // Dialogs state
  const [currentAction, setCurrentAction] = React.useState<ApprovalAction | null>(null)
  const [showApproveDialog, setShowApproveDialog] = React.useState(false)
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)
  const [approvalNotes, setApprovalNotes] = React.useState("")
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Stats
  const [stats, setStats] = React.useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Verificar permissões e carregar dados iniciais
  React.useEffect(() => {
    async function loadInitialData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data) {
          toast.error("Erro ao carregar perfil")
          router.push("/ausencias")
          return
        }

        const { company_id, role } = profileResult.data

        // Verificar se o usuário tem permissão para aprovar
        if (role !== "company_admin" && role !== "hr_manager" && role !== "super_admin") {
          toast.error("Você não tem permissão para acessar esta página")
          router.push("/ausencias")
          return
        }

        setCompanyId(company_id)
        setUserRole(role)
      } catch {
        toast.error("Erro ao carregar dados")
        router.push("/ausencias")
      }
    }

    loadInitialData()
  }, [router])

  // Carregar ausências baseado na tab ativa
  React.useEffect(() => {
    async function loadAbsences() {
      if (!companyId) return

      setIsLoading(true)
      try {
        let result
        if (activeTab === "pending") {
          result = await getPendingAbsences(companyId)
        } else if (activeTab === "all") {
          result = await listAbsences(companyId)
        } else {
          result = await listAbsences(companyId, { status: activeTab })
        }

        if (result.error) {
          toast.error("Erro ao carregar ausências")
          return
        }

        const absencesData = result.data || []
        setAbsences(absencesData)

        // Calcular estatísticas
        const pending = absencesData.filter((a) => a.status === "pending").length
        const approved = absencesData.filter((a) => a.status === "approved").length
        const rejected = absencesData.filter((a) => a.status === "rejected").length

        if (activeTab === "all") {
          setStats({ pending, approved, rejected })
        }
      } catch {
        toast.error("Erro ao carregar ausências")
      } finally {
        setIsLoading(false)
      }
    }

    loadAbsences()
  }, [companyId, activeTab])

  // Handlers
  const handleApproveClick = (absence: AbsenceWithEmployee) => {
    setCurrentAction({ type: "approve", absence })
    setApprovalNotes("")
    setShowApproveDialog(true)
  }

  const handleRejectClick = (absence: AbsenceWithEmployee) => {
    setCurrentAction({ type: "reject", absence })
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleConfirmApprove = async () => {
    if (!currentAction) return

    setIsProcessing(true)
    try {
      const result = await approveAbsence(currentAction.absence.id)
      if (result.error) {
        toast.error("Erro ao aprovar: " + result.error.message)
        return
      }

      toast.success(`Ausência de ${currentAction.absence.employee_name} aprovada com sucesso`)

      // Remover da lista de pendentes
      setAbsences((prev) => prev.filter((a) => a.id !== currentAction.absence.id))
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1,
      }))

      setShowApproveDialog(false)
      setCurrentAction(null)
      setApprovalNotes("")
    } catch {
      toast.error("Erro ao aprovar ausência")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!currentAction || !rejectionReason.trim()) return

    setIsProcessing(true)
    try {
      const result = await rejectAbsence(currentAction.absence.id, rejectionReason)
      if (result.error) {
        toast.error("Erro ao rejeitar: " + result.error.message)
        return
      }

      toast.success(`Ausência de ${currentAction.absence.employee_name} rejeitada`)

      // Remover da lista de pendentes
      setAbsences((prev) => prev.filter((a) => a.id !== currentAction.absence.id))
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }))

      setShowRejectDialog(false)
      setCurrentAction(null)
      setRejectionReason("")
    } catch {
      toast.error("Erro ao rejeitar ausência")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewDetails = (absence: AbsenceWithEmployee) => {
    router.push(`/ausencias/${absence.id}`)
  }

  // Componente de Card de Ausência
  const AbsenceCard = ({ absence }: { absence: AbsenceWithEmployee }) => {
    const isPending = absence.status === "pending"

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header - Funcionário */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={absence.employee_photo_url || undefined} />
                  <AvatarFallback>
                    {absence.employee_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{absence.employee_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-3" />
                    <span>{absence.employee_department || "Sem departamento"}</span>
                  </div>
                </div>
              </div>
              <AbsenceStatusBadge status={absence.status} />
            </div>

            <Separator />

            {/* Informações da Ausência */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  <span>Tipo</span>
                </div>
                <p className="font-medium text-sm">
                  {ABSENCE_TYPE_LABELS[absence.type] || absence.type}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>Duração</span>
                </div>
                <p className="font-medium text-sm">{absence.total_days} dias</p>
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Período</span>
                </div>
                <p className="font-medium text-sm">
                  {format(new Date(absence.start_date), "dd/MM/yyyy", { locale: ptBR })} até{" "}
                  {format(new Date(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>

              {absence.requested_at && (
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    <span>Solicitado em</span>
                  </div>
                  <p className="font-medium text-sm">
                    {format(new Date(absence.requested_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Motivo/Observação */}
            {absence.reason && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{absence.reason}</p>
                </div>
              </>
            )}

            {/* Informações médicas (se houver) */}
            {absence.cid_code && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Informações Médicas</p>
                  <div className="text-sm bg-muted p-3 rounded-md space-y-1">
                    {absence.cid_code && <p>CID: {absence.cid_code}</p>}
                    {absence.issuing_doctor && <p>Médico: {absence.issuing_doctor}</p>}
                    {absence.crm && <p>CRM: {absence.crm}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Documento anexo */}
            {absence.document_url && (
              <>
                <Separator />
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={absence.document_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 size-4" />
                    Visualizar Documento
                  </a>
                </Button>
              </>
            )}

            {/* Ações */}
            {isPending && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewDetails(absence)}
                  >
                    <FileText className="mr-2 size-4" />
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRejectClick(absence)}
                  >
                    <XCircle className="mr-2 size-4" />
                    Rejeitar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveClick(absence)}
                  >
                    <CheckCircle className="mr-2 size-4" />
                    Aprovar
                  </Button>
                </div>
              </>
            )}

            {/* Apenas botão de detalhes para já processadas */}
            {!isPending && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewDetails(absence)}
                >
                  <FileText className="mr-2 size-4" />
                  Ver Detalhes
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <AlertCircle className="size-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">
        Quando houver solicitações, elas aparecerão aqui.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Aprovação de Ausências</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as solicitações de ausências dos funcionários
        </p>
      </div>

      {/* Stats Cards */}
      {activeTab === "all" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 text-green-600 rounded-lg p-3">
                  <CheckCircle className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Aprovadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 text-red-600 rounded-lg p-3">
                  <XCircle className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>
                Ausências aguardando sua aprovação ou rejeição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : absences.length === 0 ? (
                <EmptyState message="Nenhuma solicitação pendente de aprovação" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Aprovadas</CardTitle>
              <CardDescription>Histórico de ausências aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : absences.length === 0 ? (
                <EmptyState message="Nenhuma ausência aprovada" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Rejeitadas</CardTitle>
              <CardDescription>Histórico de ausências rejeitadas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : absences.length === 0 ? (
                <EmptyState message="Nenhuma ausência rejeitada" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Solicitações</CardTitle>
              <CardDescription>Histórico completo de solicitações de ausências</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : absences.length === 0 ? (
                <EmptyState message="Nenhuma solicitação registrada" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {absences.map((absence) => (
                    <AbsenceCard key={absence.id} absence={absence} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Confirme a aprovação da ausência de {currentAction?.absence.employee_name}
            </DialogDescription>
          </DialogHeader>

          {currentAction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {ABSENCE_TYPE_LABELS[currentAction.absence.type] ||
                      currentAction.absence.type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Período</p>
                  <p className="font-medium">{currentAction.absence.total_days} dias</p>
                </div>
              </div>

              <div>
                <Label htmlFor="approval-notes">Observações (opcional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Adicione observações sobre esta aprovação..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 size-4" />
              )}
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição da ausência de {currentAction?.absence.employee_name}.
              Esta informação será visível para o funcionário.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explique o motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isProcessing || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 size-4" />
              )}
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
