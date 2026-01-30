"use client"

import * as React from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { KanbanBoard, KanbanItem, defaultAbsenceColumns } from "@/components/ui/kanban"
import { getCurrentProfile, listAbsences, updateAbsenceStatus } from "@/lib/supabase/queries"
import type { AbsenceStatus, AbsenceWithEmployee } from "@/types/database"

export default function KanbanPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [items, setItems] = React.useState<KanbanItem[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)

  // Transform absence data to kanban items
  const transformToKanbanItems = (absences: AbsenceWithEmployee[]): KanbanItem[] => {
    return absences.map((absence) => ({
      id: absence.id,
      title: absence.reason || "Sem motivo informado",
      description: absence.notes || undefined,
      status: absence.status,
      type: absence.type,
      startDate: absence.start_date,
      endDate: absence.end_date,
      employee: {
        id: absence.employee_id,
        name: absence.employee_name || "Funcionario",
        avatar_url: absence.employee_photo_url,
        department: absence.employee_department || undefined,
      },
      metadata: {
        absenceId: absence.id,
      },
    }))
  }

  // Load absences data
  const loadAbsences = React.useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    }

    try {
      // Get user profile to get company_id
      const profileResult = await getCurrentProfile()

      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao carregar perfil do usuario")
        return
      }

      const currentCompanyId = profileResult.data.company_id
      setCompanyId(currentCompanyId)

      // Load all absences (we only show pending, approved, rejected, in_progress on kanban)
      const absencesResult = await listAbsences(currentCompanyId, {
        status: ["pending", "approved", "rejected", "in_progress"] as AbsenceStatus[],
      })

      if (absencesResult.error) {
        toast.error("Erro ao carregar ausencias: " + absencesResult.error.message)
        return
      }

      const kanbanItems = transformToKanbanItems(absencesResult.data || [])
      setItems(kanbanItems)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados do kanban")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Load data on mount
  React.useEffect(() => {
    loadAbsences()
  }, [loadAbsences])

  // Handle item move (drag & drop)
  const handleItemMove = React.useCallback(async (itemId: string, newStatus: AbsenceStatus) => {
    // Optimistically update the UI
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    )

    try {
      const result = await updateAbsenceStatus(itemId, newStatus)

      if (result.error) {
        // Revert on error
        loadAbsences()
        toast.error("Erro ao atualizar status: " + result.error.message)
        return
      }

      const statusLabels: Record<AbsenceStatus, string> = {
        draft: "Rascunho",
        pending: "Pendente",
        approved: "Aprovado",
        rejected: "Rejeitado",
        cancelled: "Cancelado",
        in_progress: "Em Andamento",
        completed: "Concluido",
      }

      toast.success(`Status atualizado para "${statusLabels[newStatus]}"`)
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      // Revert on error
      loadAbsences()
      toast.error("Erro ao atualizar status")
    }
  }, [loadAbsences])

  // Handle item click (could open a detail modal/page)
  const handleItemClick = React.useCallback((item: KanbanItem) => {
    // For now, just navigate to the absence detail page
    window.location.href = `/ausencias/${item.id}`
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban de Ausencias</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie ausencias em quadro kanban
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban de Ausencias</h1>
          <p className="text-muted-foreground">
            Arraste e solte os cartoes para alterar o status das solicitacoes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAbsences(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhuma ausencia encontrada para exibir no kanban.
          </p>
          <Button variant="outline" onClick={() => loadAbsences(true)}>
            <RefreshCw className="size-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <KanbanBoard
          items={items}
          columns={defaultAbsenceColumns}
          onItemMove={handleItemMove}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  )
}
