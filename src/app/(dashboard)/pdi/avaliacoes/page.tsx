"use client"

import * as React from "react"
import {
  Plus,
  Users,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentProfile, listEvaluationCycles } from "@/lib/supabase/queries"

interface EvaluationCycle {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
  total_evaluations: number
  completed_evaluations: number
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

const cycleStatusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  active: { bg: "bg-blue-100", text: "text-blue-700" },
  self_evaluation: { bg: "bg-yellow-100", text: "text-yellow-700" },
  manager_evaluation: { bg: "bg-orange-100", text: "text-orange-700" },
  calibration: { bg: "bg-purple-100", text: "text-purple-700" },
  feedback: { bg: "bg-cyan-100", text: "text-cyan-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  )
}

export default function AvaliacoesPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [cycles, setCycles] = React.useState<EvaluationCycle[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [newCycle, setNewCycle] = React.useState({
    name: "",
    start_date: "",
    end_date: "",
  })

  // Stats calculados dos ciclos
  const stats = React.useMemo(() => {
    const activeCycles = cycles.filter((c) =>
      ["active", "self_evaluation", "manager_evaluation", "calibration", "feedback"].includes(c.status)
    ).length
    const completedCycles = cycles.filter((c) => c.status === "completed").length
    const totalEvaluations = cycles.reduce((acc, c) => acc + c.total_evaluations, 0)
    const completedEvaluations = cycles.reduce((acc, c) => acc + c.completed_evaluations, 0)
    const pendingEvaluations = totalEvaluations - completedEvaluations

    return {
      activeCycles,
      completedCycles,
      totalEvaluations,
      pendingEvaluations,
    }
  }, [cycles])

  const fetchCycles = React.useCallback(async () => {
    try {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao carregar perfil")
        return
      }

      const companyId = profileResult.data.company_id
      const cyclesResult = await listEvaluationCycles(companyId)

      if (cyclesResult.data) {
        setCycles(cyclesResult.data)
      }
    } catch {
      toast.error("Erro ao carregar ciclos de avaliacao")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

  const handleCreateCycle = async () => {
    if (!newCycle.name || !newCycle.start_date || !newCycle.end_date) {
      toast.error("Preencha todos os campos")
      return
    }

    setIsCreating(true)
    try {
      // Simula criacao - em producao, chamar a query de criacao
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Ciclo de avaliacao criado com sucesso")
      setIsDialogOpen(false)
      setNewCycle({ name: "", start_date: "", end_date: "" })
      await fetchCycles()
    } catch {
      toast.error("Erro ao criar ciclo de avaliacao")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeCycles = cycles.filter((c) =>
    ["active", "self_evaluation", "manager_evaluation", "calibration", "feedback"].includes(c.status)
  )
  const completedCycles = cycles.filter((c) => c.status === "completed")
  const draftCycles = cycles.filter((c) => c.status === "draft")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliacoes 360</h1>
          <p className="text-muted-foreground">
            Gerencie ciclos de avaliacao de desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCycles}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Novo Ciclo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Ciclo de Avaliacao</DialogTitle>
                <DialogDescription>
                  Configure um novo ciclo de avaliacao 360 graus para sua equipe.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ciclo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Avaliacao Anual 2024"
                    value={newCycle.name}
                    onChange={(e) =>
                      setNewCycle({ ...newCycle, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data de Inicio</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newCycle.start_date}
                      onChange={(e) =>
                        setNewCycle({ ...newCycle, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data de Termino</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newCycle.end_date}
                      onChange={(e) =>
                        setNewCycle({ ...newCycle, end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateCycle} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Ciclo"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Play className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCycles}</p>
                <p className="text-sm text-muted-foreground">Ciclos ativos</p>
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
                <p className="text-2xl font-bold">{stats.completedCycles}</p>
                <p className="text-sm text-muted-foreground">Ciclos concluidos</p>
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
                <p className="text-2xl font-bold">{stats.totalEvaluations}</p>
                <p className="text-sm text-muted-foreground">Total avaliacoes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingEvaluations}</p>
                <p className="text-sm text-muted-foreground">Avaliacoes pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com ciclos */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Play className="size-4" />
            Em Andamento ({activeCycles.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            <Pause className="size-4" />
            Rascunhos ({draftCycles.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="size-4" />
            Concluidos ({completedCycles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Ciclos em Andamento</CardTitle>
              <CardDescription>
                Ciclos de avaliacao ativos que estao coletando respostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="mx-auto size-10 opacity-50 mb-2" />
                  <p>Nenhum ciclo em andamento</p>
                  <p className="text-sm">Crie um novo ciclo para comecar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Ciclo</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCycles.map((cycle) => {
                      const statusStyle = cycleStatusColors[cycle.status] || cycleStatusColors.active
                      return (
                        <TableRow key={cycle.id}>
                          <TableCell className="font-medium">{cycle.name}</TableCell>
                          <TableCell>
                            {new Date(cycle.start_date).toLocaleDateString("pt-BR")} -{" "}
                            {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusStyle.bg} ${statusStyle.text}`}>
                              {cycleStatusLabels[cycle.status] || cycle.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{cycle.completed_evaluations} de {cycle.total_evaluations}</span>
                                <span>
                                  {cycle.total_evaluations > 0
                                    ? Math.round((cycle.completed_evaluations / cycle.total_evaluations) * 100)
                                    : 0}%
                                </span>
                              </div>
                              <ProgressBar value={cycle.completed_evaluations} max={cycle.total_evaluations} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
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
                                  <Users className="mr-2 size-4" />
                                  Ver avaliacoes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>Rascunhos</CardTitle>
              <CardDescription>
                Ciclos de avaliacao ainda nao iniciados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftCycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pause className="mx-auto size-10 opacity-50 mb-2" />
                  <p>Nenhum rascunho</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Ciclo</TableHead>
                      <TableHead>Periodo Planejado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftCycles.map((cycle) => (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">{cycle.name}</TableCell>
                        <TableCell>
                          {new Date(cycle.start_date).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-700">Rascunho</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm">
                            <Play className="mr-2 size-4" />
                            Iniciar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Ciclos Concluidos</CardTitle>
              <CardDescription>
                Historico de ciclos de avaliacao finalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedCycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-10 opacity-50 mb-2" />
                  <p>Nenhum ciclo concluido</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Ciclo</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Avaliacoes</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedCycles.map((cycle) => (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">{cycle.name}</TableCell>
                        <TableCell>
                          {new Date(cycle.start_date).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-600" />
                            <span>{cycle.completed_evaluations} avaliacoes</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 size-4" />
                            Ver Resultados
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
