"use client"

import * as React from "react"
import {
  Plus,
  Target,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  MoreHorizontal,
  Eye,
  MessageSquare,
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getCurrentProfile,
  listCompanyPDIs,
  getPDIStats,
  listEvaluationCycles,
  type PDIWithEmployee,
} from "@/lib/supabase/queries"
import type { EvaluationCycle } from "@/types/database"

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  in_progress: "Em Andamento",
  completed: "Concluido",
  cancelled: "Cancelado",
  on_hold: "Pausado",
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  active: { bg: "bg-green-100", text: "text-green-700" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-purple-100", text: "text-purple-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
  on_hold: { bg: "bg-yellow-100", text: "text-yellow-700" },
}

const cycleStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Em Andamento",
  self_evaluation: "Auto-avaliacao",
  manager_evaluation: "Avaliacao Gestor",
  calibration: "Calibracao",
  feedback: "Feedback",
  completed: "Concluido",
  cancelled: "Cancelado",
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export default function PDIPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [pdis, setPdis] = React.useState<PDIWithEmployee[]>([])
  const [cycles, setCycles] = React.useState<EvaluationCycle[]>([])
  const [stats, setStats] = React.useState({
    totalPDIs: 0,
    activePDIs: 0,
    completedPDIs: 0,
    averageProgress: 0,
    totalObjectives: 0,
    completedObjectives: 0,
  })

  // Load initial data
  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          return
        }

        const companyId = profileResult.data.company_id

        // Load data in parallel
        const [pdisResult, statsResult, cyclesResult] = await Promise.all([
          listCompanyPDIs(companyId),
          getPDIStats(companyId),
          listEvaluationCycles(companyId),
        ])

        if (pdisResult.data) {
          setPdis(pdisResult.data)
        }

        if (cyclesResult.data) {
          setCycles(cyclesResult.data)
        }

        setStats(statsResult)
      } catch {
        toast.error("Erro ao carregar dados de PDI")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDI</h1>
          <p className="text-muted-foreground">
            Planos de Desenvolvimento Individual com IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Sparkles className="mr-2 size-4" />
            Gerar PDI com IA
          </Button>
          <Button>
            <Plus className="mr-2 size-4" />
            Novo PDI
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Target className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activePDIs}</p>
                <p className="text-sm text-muted-foreground">PDIs ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.averageProgress)}%</p>
                <p className="text-sm text-muted-foreground">Progresso medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPDIs}</p>
                <p className="text-sm text-muted-foreground">Total de PDIs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedObjectives}</p>
                <p className="text-sm text-muted-foreground">Metas concluidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pdis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pdis" className="gap-2">
            <Target className="size-4" />
            PDIs
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2">
            <Users className="size-4" />
            Avaliacoes 360
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="gap-2">
            <MessageSquare className="size-4" />
            Feedbacks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdis">
          {pdis.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Target className="mx-auto size-12 mb-4 opacity-20" />
                  <p>Nenhum PDI cadastrado</p>
                  <p className="text-sm">Clique em "Novo PDI" para criar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pdis.map((pdi) => {
                const statusStyle = statusColors[pdi.status] || statusColors.draft
                const completedGoals = pdi.objectives?.filter(o => o.status === 'completed').length || 0
                const totalGoals = pdi.objectives?.length || 0
                return (
                  <Card key={pdi.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            {pdi.employee_photo_url && (
                              <AvatarImage src={pdi.employee_photo_url} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {pdi.employee_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{pdi.employee_name}</CardTitle>
                            <CardDescription className="text-xs">
                              {pdi.title}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 size-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 size-4" />
                              Adicionar check-in
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{Math.round(pdi.overall_progress)}%</span>
                        </div>
                        <ProgressBar value={pdi.overall_progress} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {completedGoals}/{totalGoals} metas
                        </span>
                        <Badge className={`${statusStyle.bg} ${statusStyle.text}`}>
                          {statusLabels[pdi.status] || pdi.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Meta: {new Date(pdi.target_date).toLocaleDateString("pt-BR")}
                      </div>
                      {pdi.employee_department && (
                        <div className="text-xs text-muted-foreground">
                          {pdi.employee_department}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Ciclos de Avaliacao</CardTitle>
              <CardDescription>
                Avaliacoes 360 graus em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto size-10 opacity-50 mb-2" />
                  <p>Nenhum ciclo de avaliacao</p>
                  <Button variant="link" className="mt-2">
                    Criar ciclo
                  </Button>
                </div>
              ) : (
                cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{cycle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(cycle.start_date).toLocaleDateString("pt-BR")} -{" "}
                        {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {cycleStatusLabels[cycle.status] || cycle.status}
                      </Badge>
                      <Button size="sm">Ver</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks">
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks Recentes</CardTitle>
              <CardDescription>
                Feedbacks continuos e reconhecimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto size-10 opacity-50 mb-2" />
                <p>Nenhum feedback recente</p>
                <Button variant="link" className="mt-2">
                  Dar feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
