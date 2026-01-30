"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Filter, Calendar, Users, ArrowLeft, Loader2, AlertTriangle, PieChart } from "lucide-react"
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

const MOCK_ABSENCE_TYPES = [
  { id: "all", name: "Todos os tipos" },
  { id: "ferias", name: "Ferias" },
  { id: "atestado", name: "Atestado Medico" },
  { id: "falta", name: "Falta Injustificada" },
  { id: "licenca", name: "Licenca" },
  { id: "folga", name: "Folga Compensatoria" },
]

const MOCK_ABSENCE_DATA = [
  {
    id: "1",
    employee: "Joao Silva",
    department: "Tecnologia",
    tipo: "Ferias",
    dataInicio: "2024-01-15",
    dataFim: "2024-01-29",
    dias: 14,
    status: "aprovado",
  },
  {
    id: "2",
    employee: "Maria Santos",
    department: "Recursos Humanos",
    tipo: "Atestado Medico",
    dataInicio: "2024-02-05",
    dataFim: "2024-02-07",
    dias: 3,
    status: "aprovado",
  },
  {
    id: "3",
    employee: "Carlos Oliveira",
    department: "Financeiro",
    tipo: "Falta Injustificada",
    dataInicio: "2024-02-10",
    dataFim: "2024-02-10",
    dias: 1,
    status: "registrado",
  },
  {
    id: "4",
    employee: "Ana Costa",
    department: "Comercial",
    tipo: "Licenca",
    dataInicio: "2024-01-20",
    dataFim: "2024-02-20",
    dias: 30,
    status: "em_andamento",
  },
  {
    id: "5",
    employee: "Pedro Lima",
    department: "Operacoes",
    tipo: "Folga Compensatoria",
    dataInicio: "2024-02-12",
    dataFim: "2024-02-12",
    dias: 1,
    status: "aprovado",
  },
  {
    id: "6",
    employee: "Lucia Ferreira",
    department: "Tecnologia",
    tipo: "Ferias",
    dataInicio: "2024-03-01",
    dataFim: "2024-03-15",
    dias: 15,
    status: "pendente",
  },
  {
    id: "7",
    employee: "Roberto Almeida",
    department: "Recursos Humanos",
    tipo: "Atestado Medico",
    dataInicio: "2024-02-08",
    dataFim: "2024-02-09",
    dias: 2,
    status: "aprovado",
  },
  {
    id: "8",
    employee: "Fernanda Souza",
    department: "Financeiro",
    tipo: "Ferias",
    dataInicio: "2024-02-15",
    dataFim: "2024-02-24",
    dias: 10,
    status: "aprovado",
  },
  {
    id: "9",
    employee: "Paulo Henrique",
    department: "Comercial",
    tipo: "Falta Injustificada",
    dataInicio: "2024-02-14",
    dataFim: "2024-02-14",
    dias: 1,
    status: "registrado",
  },
  {
    id: "10",
    employee: "Camila Rodrigues",
    department: "Operacoes",
    tipo: "Atestado Medico",
    dataInicio: "2024-02-01",
    dataFim: "2024-02-05",
    dias: 5,
    status: "aprovado",
  },
]

// Dados para grafico mockado de ausencias por tipo
const ABSENCE_BY_TYPE = [
  { tipo: "Ferias", quantidade: 3, dias: 39, cor: "#3b82f6", percentual: 30 },
  { tipo: "Atestado Medico", quantidade: 3, dias: 10, cor: "#ef4444", percentual: 30 },
  { tipo: "Falta Injustificada", quantidade: 2, dias: 2, cor: "#f59e0b", percentual: 20 },
  { tipo: "Licenca", quantidade: 1, dias: 30, cor: "#8b5cf6", percentual: 10 },
  { tipo: "Folga Compensatoria", quantidade: 1, dias: 1, cor: "#10b981", percentual: 10 },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "aprovado":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>
    case "pendente":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
    case "em_andamento":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Em Andamento</Badge>
    case "registrado":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Registrado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

export default function RelatorioAusenciasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [department, setDepartment] = React.useState("all")
  const [absenceType, setAbsenceType] = React.useState("all")
  const [data, setData] = React.useState(MOCK_ABSENCE_DATA)

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setData(MOCK_ABSENCE_DATA)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = MOCK_ABSENCE_DATA

      if (department !== "all") {
        const deptName = MOCK_DEPARTMENTS.find((d) => d.id === department)?.name
        filtered = filtered.filter((item) => item.department === deptName)
      }

      if (absenceType !== "all") {
        const typeName = MOCK_ABSENCE_TYPES.find((t) => t.id === absenceType)?.name
        filtered = filtered.filter((item) => item.tipo === typeName)
      }

      setData(filtered)
      setIsLoading(false)
      toast.success("Filtros aplicados")
    }, 500)
  }

  function handleExport() {
    const headers = ["Funcionario", "Departamento", "Tipo", "Data Inicio", "Data Fim", "Dias", "Status"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.employee,
          row.department,
          row.tipo,
          row.dataInicio,
          row.dataFim,
          row.dias,
          row.status,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-ausencias-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success("Relatorio exportado com sucesso")
  }

  // Calcula estatisticas
  const totalAusencias = data.length
  const totalDias = data.reduce((acc, item) => acc + item.dias, 0)
  const funcionariosAfetados = new Set(data.map((item) => item.employee)).size

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
            <h1 className="text-2xl font-bold">Ferias e Ausencias</h1>
            <p className="text-muted-foreground">
              Relatorios de ferias, atestados e faltas
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Tipo de Ausencia</label>
              <Select value={absenceType} onValueChange={setAbsenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ABSENCE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
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
            <CardDescription>Total de Ausencias</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Calendar className="size-6 text-primary" />
              {totalAusencias}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Registros no periodo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dias Perdidos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-orange-600">
              <AlertTriangle className="size-6" />
              {totalDias}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total de dias de ausencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Funcionarios Afetados</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="size-6 text-blue-500" />
              {funcionariosAfetados}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Com alguma ausencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media por Funcionario</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <PieChart className="size-6 text-purple-500" />
              {funcionariosAfetados > 0 ? (totalDias / funcionariosAfetados).toFixed(1) : 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dias de ausencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafico de Ausencias por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="size-5" />
            Ausencias por Tipo
          </CardTitle>
          <CardDescription>
            Distribuicao das ausencias no periodo selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ABSENCE_BY_TYPE.map((item) => (
              <div key={item.tipo} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: item.cor }}
                    />
                    <span>{item.tipo}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{item.quantidade} ocorrencias</span>
                    <span className="font-medium text-foreground">{item.dias} dias</span>
                  </div>
                </div>
                <Progress value={item.percentual} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Ausencias</CardTitle>
          <CardDescription>
            Lista completa de ausencias do periodo selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionario</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data Inicio</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead className="text-center">Dias</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado para os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.employee}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.tipo}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(row.dataInicio)}</TableCell>
                      <TableCell>{formatDate(row.dataFim)}</TableCell>
                      <TableCell className="text-center">{row.dias}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(row.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
