"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Filter, Clock, TrendingUp, Users, ArrowLeft, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Dados mockados para demonstracao
const MOCK_DEPARTMENTS = [
  { id: "all", name: "Todos os departamentos" },
  { id: "ti", name: "Tecnologia" },
  { id: "rh", name: "Recursos Humanos" },
  { id: "financeiro", name: "Financeiro" },
  { id: "comercial", name: "Comercial" },
  { id: "operacoes", name: "Operacoes" },
]

const MOCK_EMPLOYEES = [
  { id: "all", name: "Todos os funcionarios" },
  { id: "1", name: "Joao Silva" },
  { id: "2", name: "Maria Santos" },
  { id: "3", name: "Carlos Oliveira" },
  { id: "4", name: "Ana Costa" },
  { id: "5", name: "Pedro Lima" },
]

const MOCK_TIME_DATA = [
  {
    id: "1",
    employee: "Joao Silva",
    department: "Tecnologia",
    horasTrabalhadas: 176,
    bancoHoras: 8,
    mediaDiaria: "8h00",
    faltas: 0,
    atrasos: 1,
    status: "regular",
  },
  {
    id: "2",
    employee: "Maria Santos",
    department: "Recursos Humanos",
    horasTrabalhadas: 168,
    bancoHoras: -4,
    mediaDiaria: "7h38",
    faltas: 1,
    atrasos: 2,
    status: "atencao",
  },
  {
    id: "3",
    employee: "Carlos Oliveira",
    department: "Financeiro",
    horasTrabalhadas: 184,
    bancoHoras: 16,
    mediaDiaria: "8h22",
    faltas: 0,
    atrasos: 0,
    status: "regular",
  },
  {
    id: "4",
    employee: "Ana Costa",
    department: "Comercial",
    horasTrabalhadas: 160,
    bancoHoras: -12,
    mediaDiaria: "7h16",
    faltas: 2,
    atrasos: 3,
    status: "critico",
  },
  {
    id: "5",
    employee: "Pedro Lima",
    department: "Operacoes",
    horasTrabalhadas: 172,
    bancoHoras: 4,
    mediaDiaria: "7h49",
    faltas: 0,
    atrasos: 1,
    status: "regular",
  },
  {
    id: "6",
    employee: "Lucia Ferreira",
    department: "Tecnologia",
    horasTrabalhadas: 180,
    bancoHoras: 12,
    mediaDiaria: "8h11",
    faltas: 0,
    atrasos: 0,
    status: "regular",
  },
  {
    id: "7",
    employee: "Roberto Almeida",
    department: "Recursos Humanos",
    horasTrabalhadas: 176,
    bancoHoras: 8,
    mediaDiaria: "8h00",
    faltas: 0,
    atrasos: 2,
    status: "regular",
  },
  {
    id: "8",
    employee: "Fernanda Souza",
    department: "Financeiro",
    horasTrabalhadas: 164,
    bancoHoras: -8,
    mediaDiaria: "7h27",
    faltas: 1,
    atrasos: 1,
    status: "atencao",
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "regular":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Regular</Badge>
    case "atencao":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Atencao</Badge>
    case "critico":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critico</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function RelatorioPontoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [department, setDepartment] = React.useState("all")
  const [employee, setEmployee] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [data, setData] = React.useState(MOCK_TIME_DATA)

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      // Simula carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 800))
      setData(MOCK_TIME_DATA)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = MOCK_TIME_DATA

      if (department !== "all") {
        const deptName = MOCK_DEPARTMENTS.find((d) => d.id === department)?.name
        filtered = filtered.filter((item) => item.department === deptName)
      }

      if (employee !== "all") {
        const empName = MOCK_EMPLOYEES.find((e) => e.id === employee)?.name
        filtered = filtered.filter((item) => item.employee === empName)
      }

      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.department.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setData(filtered)
      setIsLoading(false)
      toast.success("Filtros aplicados")
    }, 500)
  }

  function handleExport() {
    // Gera CSV
    const headers = ["Funcionario", "Departamento", "Horas Trabalhadas", "Banco de Horas", "Media Diaria", "Faltas", "Atrasos", "Status"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.employee,
          row.department,
          row.horasTrabalhadas,
          row.bancoHoras,
          row.mediaDiaria,
          row.faltas,
          row.atrasos,
          row.status,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-ponto-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success("Relatorio exportado com sucesso")
  }

  // Calcula estatisticas
  const totalHoras = data.reduce((acc, item) => acc + item.horasTrabalhadas, 0)
  const totalBancoHoras = data.reduce((acc, item) => acc + item.bancoHoras, 0)
  const mediaDiariaGeral = data.length > 0 ? (totalHoras / data.length / 22).toFixed(1) : "0"

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
            <h1 className="text-2xl font-bold">Registro de Ponto</h1>
            <p className="text-muted-foreground">
              Relatorios de horas trabalhadas, banco de horas e frequencia
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
              <label className="text-sm font-medium">Funcionario</label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_EMPLOYEES.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
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
                  placeholder="Nome ou departamento..."
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
            <CardDescription>Total de Horas</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="size-6 text-primary" />
              {totalHoras}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {data.length} funcionarios no periodo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Banco de Horas Total</CardDescription>
            <CardTitle className={`text-3xl flex items-center gap-2 ${totalBancoHoras >= 0 ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className="size-6" />
              {totalBancoHoras > 0 ? "+" : ""}{totalBancoHoras}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {totalBancoHoras >= 0 ? "Saldo positivo" : "Saldo negativo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media Diaria</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="size-6 text-blue-500" />
              {mediaDiariaGeral}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por funcionario/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Funcionarios</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="size-6 text-purple-500" />
              {data.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No relatorio atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Funcionario</CardTitle>
          <CardDescription>
            Registro de ponto detalhado do periodo selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionario</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Horas Trabalhadas</TableHead>
                  <TableHead className="text-right">Banco de Horas</TableHead>
                  <TableHead className="text-right">Media Diaria</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">Atrasos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado para os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.employee}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell className="text-right">{row.horasTrabalhadas}h</TableCell>
                      <TableCell className={`text-right ${row.bancoHoras >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {row.bancoHoras > 0 ? "+" : ""}{row.bancoHoras}h
                      </TableCell>
                      <TableCell className="text-right">{row.mediaDiaria}</TableCell>
                      <TableCell className="text-center">{row.faltas}</TableCell>
                      <TableCell className="text-center">{row.atrasos}</TableCell>
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
