"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Trash2,
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  getMyAbsences,
  cancelMyAbsence,
  type MyAbsence,
} from "@/lib/supabase/queries/absences-management"
import { getCurrentProfile } from "@/lib/supabase/queries"
import type { AbsenceStatus } from "@/types/database"

export default function MinhasAusenciasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [absences, setAbsences] = React.useState<MyAbsence[]>([])
  const [filteredAbsences, setFilteredAbsences] = React.useState<MyAbsence[]>([])
  const [activeTab, setActiveTab] = React.useState<string>("all")
  const [employeeId, setEmployeeId] = React.useState<string | null>(null)

  // Estado para confirmação de cancelamento
  const [absenceToCancel, setAbsenceToCancel] = React.useState<MyAbsence | null>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)

  // Carregar ausências
  React.useEffect(() => {
    async function loadAbsences() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.employee_id) {
          toast.error("Erro ao carregar perfil")
          router.push("/ausencias")
          return
        }

        setEmployeeId(profileResult.data.employee_id)

        const result = await getMyAbsences(profileResult.data.employee_id)
        if (result.error) {
          toast.error("Erro ao carregar ausências")
          return
        }

        setAbsences(result.data || [])
      } catch {
        toast.error("Erro ao carregar ausências")
      } finally {
        setIsLoading(false)
      }
    }

    loadAbsences()
  }, [router])

  // Filtrar ausências por tab
  React.useEffect(() => {
    let filtered = absences

    switch (activeTab) {
      case "pending":
        filtered = absences.filter((a) => a.status === "pending")
        break
      case "approved":
        filtered = absences.filter((a) => a.status === "approved")
        break
      case "rejected":
        filtered = absences.filter((a) => a.status === "rejected")
        break
      default:
        filtered = absences
    }

    setFilteredAbsences(filtered)
  }, [absences, activeTab])

  // Contar por status
  const stats = React.useMemo(() => {
    return {
      total: absences.length,
      pending: absences.filter((a) => a.status === "pending").length,
      approved: absences.filter((a) => a.status === "approved").length,
      rejected: absences.filter((a) => a.status === "rejected").length,
    }
  }, [absences])

  const handleCancelAbsence = async () => {
    if (!absenceToCancel) return

    setIsCancelling(true)

    try {
      const result = await cancelMyAbsence(absenceToCancel.id)

      if (result.error) {
        toast.error("Erro ao cancelar: " + result.error.message)
        return
      }

      toast.success("Solicitação cancelada com sucesso")

      // Atualizar lista
      setAbsences((prev) =>
        prev.map((a) =>
          a.id === absenceToCancel.id
            ? { ...a, status: "cancelled" as AbsenceStatus }
            : a
        )
      )
    } catch {
      toast.error("Erro ao cancelar solicitação")
    } finally {
      setIsCancelling(false)
      setAbsenceToCancel(null)
    }
  }

  const getStatusBadge = (status: AbsenceStatus) => {
    const variants: Record<AbsenceStatus, {
      variant: "default" | "secondary" | "destructive" | "outline"
      icon: React.ReactNode
    }> = {
      draft: { variant: "outline", icon: <FileText className="size-3" /> },
      pending: { variant: "secondary", icon: <Clock className="size-3" /> },
      approved: { variant: "default", icon: <CheckCircle2 className="size-3" /> },
      rejected: { variant: "destructive", icon: <XCircle className="size-3" /> },
      cancelled: { variant: "outline", icon: <XCircle className="size-3" /> },
      in_progress: { variant: "default", icon: <Clock className="size-3" /> },
      completed: { variant: "outline", icon: <CheckCircle2 className="size-3" /> },
    }

    const config = variants[status] || variants.draft

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status === "pending" && "Pendente"}
        {status === "approved" && "Aprovada"}
        {status === "rejected" && "Rejeitada"}
        {status === "cancelled" && "Cancelada"}
        {status === "in_progress" && "Em Andamento"}
        {status === "completed" && "Concluída"}
        {status === "draft" && "Rascunho"}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Ausências</h1>
          <p className="text-muted-foreground">
            Acompanhe o status das suas solicitações de ausência
          </p>
        </div>
        <Button asChild>
          <Link href="/ausencias/solicitar">
            <Plus className="mr-2 size-4" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Calendar className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <CheckCircle2 className="size-5" />
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todas
            {stats.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
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
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações</CardTitle>
              <CardDescription>
                {filteredAbsences.length > 0
                  ? `${filteredAbsences.length} solicitação(ões)`
                  : "Nenhuma solicitação encontrada"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAbsences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="size-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Nenhuma solicitação
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você ainda não possui solicitações nesta categoria
                  </p>
                  <Button asChild>
                    <Link href="/ausencias/solicitar">
                      <Plus className="mr-2 size-4" />
                      Nova Solicitação
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-center">Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Solicitado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAbsences.map((absence) => (
                        <TableRow key={absence.id}>
                          <TableCell className="font-medium">
                            {absence.type_label}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(absence.start_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                até {format(new Date(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {absence.total_days}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(absence.status)}
                          </TableCell>
                          <TableCell>
                            {absence.requested_at
                              ? format(new Date(absence.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/ausencias/${absence.id}`)}
                              >
                                Ver detalhes
                              </Button>
                              {absence.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setAbsenceToCancel(absence)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de cancelamento */}
      <AlertDialog
        open={!!absenceToCancel}
        onOpenChange={(open) => !open && setAbsenceToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta solicitação de ausência?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Não, manter
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAbsence}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
