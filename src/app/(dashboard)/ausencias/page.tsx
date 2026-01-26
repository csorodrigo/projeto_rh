"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AbsenceTable,
  AbsenceFilters,
  AbsenceApprovalDialog,
} from "@/components/absences"
import {
  listAbsences,
  getAbsenceStats,
  approveAbsence,
  rejectAbsence,
  deleteAbsence,
} from "@/lib/supabase/queries"
import { getCurrentProfile } from "@/lib/supabase/queries"
import type { AbsenceWithEmployee, AbsenceStatus, AbsenceType } from "@/types/database"

interface AbsenceFiltersState {
  status?: AbsenceStatus
  type?: AbsenceType
  startDate?: Date
  endDate?: Date
}

export default function AbsencesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [absences, setAbsences] = React.useState<AbsenceWithEmployee[]>([])
  const [stats, setStats] = React.useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    thisMonth: 0,
    vacationsThisMonth: 0,
  })
  const [filters, setFilters] = React.useState<AbsenceFiltersState>({})
  const [activeTab, setActiveTab] = React.useState("all")
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [totalCount, setTotalCount] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Diálogo de aprovação
  const [selectedAbsence, setSelectedAbsence] = React.useState<AbsenceWithEmployee | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = React.useState(false)

  // Carregar dados iniciais
  React.useEffect(() => {
    async function loadInitialData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          return
        }

        setCompanyId(profileResult.data.company_id)

        // Carregar estatísticas
        const statsData = await getAbsenceStats(profileResult.data.company_id)
        setStats(statsData)
      } catch {
        toast.error("Erro ao carregar dados")
      }
    }

    loadInitialData()
  }, [])

  // Carregar ausências quando mudar filtros ou tab
  React.useEffect(() => {
    async function loadAbsences() {
      if (!companyId) return

      setIsLoading(true)
      try {
        // Determinar filtro de status baseado na tab
        let statusFilter: AbsenceStatus | AbsenceStatus[] | undefined = filters.status

        if (!statusFilter) {
          switch (activeTab) {
            case "pending":
              statusFilter = "pending"
              break
            case "approved":
              statusFilter = "approved"
              break
            case "rejected":
              statusFilter = "rejected"
              break
            case "all":
            default:
              statusFilter = undefined
          }
        }

        const result = await listAbsences(
          companyId,
          {
            status: statusFilter,
            type: filters.type,
            startDate: filters.startDate?.toISOString().split("T")[0],
            endDate: filters.endDate?.toISOString().split("T")[0],
          },
          { page: currentPage, perPage: 20 }
        )

        if (result.error) {
          toast.error("Erro ao carregar ausências")
          return
        }

        setAbsences(result.data || [])
        setTotalCount(result.count || 0)
      } catch {
        toast.error("Erro ao carregar ausências")
      } finally {
        setIsLoading(false)
      }
    }

    loadAbsences()
  }, [companyId, filters, activeTab, currentPage])

  // Handlers
  const handleApprove = async (absenceId: string) => {
    const result = await approveAbsence(absenceId)
    if (result.error) {
      toast.error("Erro ao aprovar ausência: " + result.error.message)
      return
    }
    toast.success("Ausência aprovada com sucesso")

    // Atualizar lista e stats
    setAbsences((prev) =>
      prev.map((a) => (a.id === absenceId ? { ...a, status: "approved" as AbsenceStatus } : a))
    )
    setStats((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      approved: prev.approved + 1,
    }))
  }

  const handleReject = async (absenceId: string, reason: string) => {
    const result = await rejectAbsence(absenceId, reason)
    if (result.error) {
      toast.error("Erro ao rejeitar ausência: " + result.error.message)
      return
    }
    toast.success("Ausência rejeitada")

    // Atualizar lista e stats
    setAbsences((prev) =>
      prev.map((a) => (a.id === absenceId ? { ...a, status: "rejected" as AbsenceStatus } : a))
    )
    setStats((prev) => ({
      ...prev,
      pending: Math.max(0, prev.pending - 1),
      rejected: prev.rejected + 1,
    }))
  }

  const handleCancel = async (absence: AbsenceWithEmployee) => {
    if (!confirm("Deseja realmente cancelar esta ausência?")) return

    const result = await deleteAbsence(absence.id, "Cancelado pelo usuário")
    if (result.error) {
      toast.error("Erro ao cancelar ausência: " + result.error.message)
      return
    }
    toast.success("Ausência cancelada")

    // Atualizar lista
    setAbsences((prev) => prev.filter((a) => a.id !== absence.id))
    if (absence.status === "pending") {
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
      }))
    }
  }

  const handleView = (absence: AbsenceWithEmployee) => {
    router.push(`/ausencias/${absence.id}`)
  }

  const handleApproveClick = (absence: AbsenceWithEmployee) => {
    setSelectedAbsence(absence)
    setApprovalDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ausências</h1>
          <p className="text-muted-foreground">
            Gerencie férias, atestados e licenças
          </p>
        </div>
        <Button asChild>
          <Link href="/ausencias/novo">
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
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Calendar className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.vacationsThisMonth}</p>
                <p className="text-sm text-muted-foreground">Férias este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">Em andamento</p>
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
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-sm text-muted-foreground">Total este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
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
          <AbsenceFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Ausência</CardTitle>
              <CardDescription>
                {totalCount > 0
                  ? `${totalCount} solicitação(ões) encontrada(s)`
                  : "Lista de todas as solicitações"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceTable
                absences={absences}
                isLoading={isLoading}
                onView={handleView}
                onApprove={handleApproveClick}
                onReject={handleApproveClick}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>Aguardando aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceTable
                absences={absences}
                isLoading={isLoading}
                onView={handleView}
                onApprove={handleApproveClick}
                onReject={handleApproveClick}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Aprovadas</CardTitle>
              <CardDescription>Ausências aprovadas</CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceTable
                absences={absences}
                isLoading={isLoading}
                onView={handleView}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Rejeitadas</CardTitle>
              <CardDescription>Ausências que foram rejeitadas</CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceTable
                absences={absences}
                isLoading={isLoading}
                onView={handleView}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de aprovação */}
      <AbsenceApprovalDialog
        absence={selectedAbsence}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
