"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Filter, FolderKanban, Clock, Users, ArrowLeft, Loader2, Search, TrendingUp, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Dados mockados para demonstracao
const MOCK_DEPARTMENTS = [
  { id: "all", name: "Todos os departamentos" },
  { id: "ti", name: "Tecnologia" },
  { id: "rh", name: "Recursos Humanos" },
  { id: "financeiro", name: "Financeiro" },
  { id: "comercial", name: "Comercial" },
  { id: "operacoes", name: "Operacoes" },
]

const MOCK_PROJECTS = [
  { id: "all", name: "Todos os projetos" },
  { id: "1", name: "Sistema RH 2.0" },
  { id: "2", name: "Integracao ERP" },
  { id: "3", name: "App Mobile" },
  { id: "4", name: "Gestao de Ponto" },
  { id: "5", name: "Portal do Colaborador" },
]

const MOCK_PROJECTS_DATA = [
  {
    id: "1",
    nome: "Sistema RH 2.0",
    department: "Tecnologia",
    responsavel: "Joao Silva",
    dataInicio: "2024-01-15",
    dataFim: "2024-06-30",
    horasAlocadas: 1200,
    horasUsadas: 840,
    funcionarios: 5,
    status: "em_andamento",
    progresso: 70,
  },
  {
    id: "2",
    nome: "Integracao ERP",
    department: "Tecnologia",
    responsavel: "Lucia Ferreira",
    dataInicio: "2024-02-01",
    dataFim: "2024-08-31",
    horasAlocadas: 800,
    horasUsadas: 320,
    funcionarios: 3,
    status: "em_andamento",
    progresso: 40,
  },
  {
    id: "3",
    nome: "App Mobile Colaboradores",
    department: "Tecnologia",
    responsavel: "Carlos Oliveira",
    dataInicio: "2024-03-01",
    dataFim: "2024-09-30",
    horasAlocadas: 600,
    horasUsadas: 150,
    funcionarios: 4,
    status: "planejamento",
    progresso: 25,
  },
  {
    id: "4",
    nome: "Gestao de Ponto Digital",
    department: "Recursos Humanos",
    responsavel: "Maria Santos",
    dataInicio: "2023-10-01",
    dataFim: "2024-02-28",
    horasAlocadas: 400,
    horasUsadas: 400,
    funcionarios: 2,
    status: "concluido",
    progresso: 100,
  },
  {
    id: "5",
    nome: "Portal do Colaborador",
    department: "Recursos Humanos",
    responsavel: "Roberto Almeida",
    dataInicio: "2024-01-01",
    dataFim: "2024-04-30",
    horasAlocadas: 500,
    horasUsadas: 425,
    funcionarios: 3,
    status: "em_andamento",
    progresso: 85,
  },
  {
    id: "6",
    nome: "Automacao Financeira",
    department: "Financeiro",
    responsavel: "Fernanda Souza",
    dataInicio: "2024-02-15",
    dataFim: "2024-07-15",
    horasAlocadas: 350,
    horasUsadas: 140,
    funcionarios: 2,
    status: "em_andamento",
    progresso: 40,
  },
  {
    id: "7",
    nome: "CRM Vendas",
    department: "Comercial",
    responsavel: "Ana Costa",
    dataInicio: "2024-01-10",
    dataFim: "2024-05-31",
    horasAlocadas: 450,
    horasUsadas: 360,
    funcionarios: 4,
    status: "em_andamento",
    progresso: 80,
  },
  {
    id: "8",
    nome: "Otimizacao Logistica",
    department: "Operacoes",
    responsavel: "Pedro Lima",
    dataInicio: "2023-11-01",
    dataFim: "2024-03-31",
    horasAlocadas: 300,
    horasUsadas: 300,
    funcionarios: 3,
    status: "concluido",
    progresso: 100,
  },
]

// Dados de alocacao por funcionario
const MOCK_ALLOCATIONS = [
  { funcionario: "Joao Silva", projeto: "Sistema RH 2.0", horasSemanais: 40, percentual: 100 },
  { funcionario: "Maria Santos", projeto: "Portal do Colaborador", horasSemanais: 20, percentual: 50 },
  { funcionario: "Maria Santos", projeto: "Gestao de Ponto Digital", horasSemanais: 20, percentual: 50 },
  { funcionario: "Carlos Oliveira", projeto: "App Mobile Colaboradores", horasSemanais: 32, percentual: 80 },
  { funcionario: "Lucia Ferreira", projeto: "Integracao ERP", horasSemanais: 40, percentual: 100 },
  { funcionario: "Ana Costa", projeto: "CRM Vendas", horasSemanais: 30, percentual: 75 },
  { funcionario: "Pedro Lima", projeto: "Otimizacao Logistica", horasSemanais: 40, percentual: 100 },
  { funcionario: "Roberto Almeida", projeto: "Portal do Colaborador", horasSemanais: 24, percentual: 60 },
  { funcionario: "Fernanda Souza", projeto: "Automacao Financeira", horasSemanais: 36, percentual: 90 },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "em_andamento":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Em Andamento</Badge>
    case "planejamento":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Planejamento</Badge>
    case "concluido":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Concluido</Badge>
    case "pausado":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pausado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export default function RelatorioProjetosPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [department, setDepartment] = React.useState("all")
  const [project, setProject] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [data, setData] = React.useState(MOCK_PROJECTS_DATA)
  const [activeTab, setActiveTab] = React.useState<"projetos" | "alocacoes">("projetos")

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setData(MOCK_PROJECTS_DATA)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = MOCK_PROJECTS_DATA

      if (department !== "all") {
        const deptName = MOCK_DEPARTMENTS.find((d) => d.id === department)?.name
        filtered = filtered.filter((item) => item.department === deptName)
      }

      if (project !== "all") {
        const projName = MOCK_PROJECTS.find((p) => p.id === project)?.name
        filtered = filtered.filter((item) => item.nome === projName)
      }

      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setData(filtered)
      setIsLoading(false)
      toast.success("Filtros aplicados")
    }, 500)
  }

  function handleExport() {
    const headers = ["Projeto", "Departamento", "Responsavel", "Data Inicio", "Data Fim", "Horas Alocadas", "Horas Usadas", "Funcionarios", "Status", "Progresso"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.nome,
          row.department,
          row.responsavel,
          row.dataInicio,
          row.dataFim,
          row.horasAlocadas,
          row.horasUsadas,
          row.funcionarios,
          row.status,
          `${row.progresso}%`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-projetos-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success("Relatorio exportado com sucesso")
  }

  // Calcula estatisticas
  const projetosAtivos = data.filter((item) => item.status === "em_andamento" || item.status === "planejamento").length
  const totalHorasAlocadas = data.reduce((acc, item) => acc + item.horasAlocadas, 0)
  const totalFuncionarios = new Set(MOCK_ALLOCATIONS.map((a) => a.funcionario)).size
  const projetosConcluidos = data.filter((item) => item.status === "concluido").length

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/relatorios")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Projetos e Tarefas</h1>
            <p className="text-muted-foreground">
              Relatorios de PDI, avaliacoes e desenvolvimento
            </p>
          </div>
        </div>
        <Button onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicio</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Projeto</label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PROJECTS.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Projeto ou responsavel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleFilter}>
              <Filter className="size-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projetos Ativos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FolderKanban className="size-6 text-primary" />
              {projetosAtivos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em andamento ou planejamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Horas Alocadas</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-blue-600">
              <Clock className="size-6" />
              {totalHorasAlocadas.toLocaleString()}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total em todos os projetos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Funcionarios Alocados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="size-6 text-purple-500" />
              {totalFuncionarios}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Trabalhando em projetos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projetos Concluidos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-6" />
              {projetosConcluidos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Finalizados no periodo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "projetos" ? "default" : "ghost"}
          className="rounded-b-none"
          onClick={() => setActiveTab("projetos")}
        >
          <FolderKanban className="size-4 mr-2" />
          Projetos
        </Button>
        <Button
          variant={activeTab === "alocacoes" ? "default" : "ghost"}
          className="rounded-b-none"
          onClick={() => setActiveTab("alocacoes")}
        >
          <Users className="size-4 mr-2" />
          Alocacoes
        </Button>
      </div>

      {/* Tabela de Projetos */}
      {activeTab === "projetos" && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Projetos</CardTitle>
            <CardDescription>
              Visao geral dos projetos e seu progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Responsavel</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-center">Equipe</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum projeto encontrado para os filtros selecionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.nome}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.responsavel}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(row.dataInicio)}</div>
                            <div className="text-muted-foreground">ate {formatDate(row.dataFim)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <div>{row.horasUsadas}h usadas</div>
                            <div className="text-muted-foreground">de {row.horasAlocadas}h</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="size-4 text-muted-foreground" />
                            {row.funcionarios}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{row.progresso}%</span>
                            </div>
                            <Progress value={row.progresso} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(row.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Alocacoes */}
      {activeTab === "alocacoes" && (
        <Card>
          <CardHeader>
            <CardTitle>Alocacoes de Funcionarios</CardTitle>
            <CardDescription>
              Distribuicao de funcionarios por projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Horas Semanais</TableHead>
                    <TableHead>Alocacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ALLOCATIONS.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.funcionario}</TableCell>
                      <TableCell>{row.projeto}</TableCell>
                      <TableCell className="text-right">{row.horasSemanais}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={row.percentual} className="h-2 w-24" />
                          <span className="text-sm text-muted-foreground">{row.percentual}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
