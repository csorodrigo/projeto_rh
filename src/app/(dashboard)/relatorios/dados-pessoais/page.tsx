"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Filter, Users, UserCheck, UserX, UserPlus, ArrowLeft, Loader2, Shield, Search, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Dados mockados para demonstracao
const MOCK_DEPARTMENTS = [
  { id: "all", name: "Todos os departamentos" },
  { id: "ti", name: "Tecnologia" },
  { id: "rh", name: "Recursos Humanos" },
  { id: "financeiro", name: "Financeiro" },
  { id: "comercial", name: "Comercial" },
  { id: "operacoes", name: "Operacoes" },
]

const MOCK_STATUS = [
  { id: "all", name: "Todos os status" },
  { id: "ativo", name: "Ativo" },
  { id: "inativo", name: "Inativo" },
  { id: "ferias", name: "Ferias" },
  { id: "afastado", name: "Afastado" },
]

const MOCK_EMPLOYEES_DATA = [
  {
    id: "1",
    nome: "Joao Silva",
    email: "joao.silva@empresa.com",
    telefone: "(11) 98765-4321",
    cpf: "123.456.789-00",
    department: "Tecnologia",
    cargo: "Desenvolvedor Senior",
    dataAdmissao: "2022-03-15",
    status: "ativo",
    dataNascimento: "1990-05-20",
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "maria.santos@empresa.com",
    telefone: "(11) 91234-5678",
    cpf: "234.567.890-11",
    department: "Recursos Humanos",
    cargo: "Analista de RH",
    dataAdmissao: "2021-06-01",
    status: "ativo",
    dataNascimento: "1988-12-10",
  },
  {
    id: "3",
    nome: "Carlos Oliveira",
    email: "carlos.oliveira@empresa.com",
    telefone: "(11) 99876-5432",
    cpf: "345.678.901-22",
    department: "Financeiro",
    cargo: "Contador",
    dataAdmissao: "2020-01-10",
    status: "ativo",
    dataNascimento: "1985-03-25",
  },
  {
    id: "4",
    nome: "Ana Costa",
    email: "ana.costa@empresa.com",
    telefone: "(11) 92345-6789",
    cpf: "456.789.012-33",
    department: "Comercial",
    cargo: "Gerente de Vendas",
    dataAdmissao: "2019-08-20",
    status: "ferias",
    dataNascimento: "1992-07-15",
  },
  {
    id: "5",
    nome: "Pedro Lima",
    email: "pedro.lima@empresa.com",
    telefone: "(11) 93456-7890",
    cpf: "567.890.123-44",
    department: "Operacoes",
    cargo: "Coordenador",
    dataAdmissao: "2023-02-01",
    status: "ativo",
    dataNascimento: "1995-11-30",
  },
  {
    id: "6",
    nome: "Lucia Ferreira",
    email: "lucia.ferreira@empresa.com",
    telefone: "(11) 94567-8901",
    cpf: "678.901.234-55",
    department: "Tecnologia",
    cargo: "Tech Lead",
    dataAdmissao: "2021-09-15",
    status: "ativo",
    dataNascimento: "1987-02-18",
  },
  {
    id: "7",
    nome: "Roberto Almeida",
    email: "roberto.almeida@empresa.com",
    telefone: "(11) 95678-9012",
    cpf: "789.012.345-66",
    department: "Recursos Humanos",
    cargo: "Diretor de RH",
    dataAdmissao: "2018-04-10",
    status: "ativo",
    dataNascimento: "1980-08-05",
  },
  {
    id: "8",
    nome: "Fernanda Souza",
    email: "fernanda.souza@empresa.com",
    telefone: "(11) 96789-0123",
    cpf: "890.123.456-77",
    department: "Financeiro",
    cargo: "Analista Financeiro",
    dataAdmissao: "2022-11-01",
    status: "afastado",
    dataNascimento: "1993-04-22",
  },
  {
    id: "9",
    nome: "Paulo Henrique",
    email: "paulo.henrique@empresa.com",
    telefone: "(11) 97890-1234",
    cpf: "901.234.567-88",
    department: "Comercial",
    cargo: "Vendedor",
    dataAdmissao: "2024-01-15",
    status: "ativo",
    dataNascimento: "1998-09-12",
  },
  {
    id: "10",
    nome: "Camila Rodrigues",
    email: "camila.rodrigues@empresa.com",
    telefone: "(11) 98901-2345",
    cpf: "012.345.678-99",
    department: "Operacoes",
    cargo: "Assistente",
    dataAdmissao: "2023-07-01",
    status: "inativo",
    dataNascimento: "1996-01-08",
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "ativo":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
    case "inativo":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inativo</Badge>
    case "ferias":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ferias</Badge>
    case "afastado":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Afastado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

function maskCPF(cpf: string) {
  // Mascara CPF para LGPD: mostra apenas os 3 primeiros e 2 ultimos digitos
  return cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, "$1.***.***-$4")
}

export default function RelatorioDadosPessoaisPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [department, setDepartment] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showFullCPF, setShowFullCPF] = React.useState(false)
  const [data, setData] = React.useState(MOCK_EMPLOYEES_DATA)

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setData(MOCK_EMPLOYEES_DATA)
    } catch {
      toast.error("Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = MOCK_EMPLOYEES_DATA

      if (department !== "all") {
        const deptName = MOCK_DEPARTMENTS.find((d) => d.id === department)?.name
        filtered = filtered.filter((item) => item.department === deptName)
      }

      if (status !== "all") {
        filtered = filtered.filter((item) => item.status === status)
      }

      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cargo.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setData(filtered)
      setIsLoading(false)
      toast.success("Filtros aplicados")
    }, 500)
  }

  function handleExportLGPD() {
    // Exporta dados com conformidade LGPD (dados sensíveis mascarados)
    const headers = ["Nome", "Email", "Telefone", "CPF (Mascarado)", "Departamento", "Cargo", "Data Admissao", "Status"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        [
          row.nome,
          row.email,
          row.telefone,
          maskCPF(row.cpf),
          row.department,
          row.cargo,
          row.dataAdmissao,
          row.status,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-dados-pessoais-lgpd-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success("Relatorio LGPD exportado com sucesso")
  }

  function handleExportFull() {
    // Alerta sobre exportacao de dados completos
    toast.info("Exportacao de dados completos requer autorizacao especial")
  }

  // Calcula estatisticas
  const totalFuncionarios = data.length
  const ativos = data.filter((item) => item.status === "ativo").length
  const inativos = data.filter((item) => item.status === "inativo").length
  // Novos = admitidos nos ultimos 90 dias
  const hoje = new Date()
  const novos = data.filter((item) => {
    const dataAdmissao = new Date(item.dataAdmissao)
    const diffTime = Math.abs(hoje.getTime() - dataAdmissao.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90
  }).length

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
            <h1 className="text-2xl font-bold">Dados Pessoais</h1>
            <p className="text-muted-foreground">
              Relatorios de aniversariantes, documentos e informacoes cadastrais
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportFull}>
            <Download className="size-4 mr-2" />
            Exportar Completo
          </Button>
          <Button onClick={handleExportLGPD}>
            <Shield className="size-4 mr-2" />
            Exportar LGPD
          </Button>
        </div>
      </div>

      {/* Alerta LGPD */}
      <Alert>
        <Shield className="size-4" />
        <AlertTitle>Conformidade LGPD</AlertTitle>
        <AlertDescription>
          Este relatorio segue as diretrizes da Lei Geral de Protecao de Dados.
          Dados sensiveis como CPF sao mascarados por padrao. Para acessar dados completos,
          e necessaria autorizacao especial do DPO (Data Protection Officer).
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_STATUS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
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
                  placeholder="Nome, email ou cargo..."
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
            <CardDescription>Total de Funcionarios</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="size-6 text-primary" />
              {totalFuncionarios}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Funcionarios Ativos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-green-600">
              <UserCheck className="size-6" />
              {ativos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em atividade regular
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Funcionarios Inativos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-gray-600">
              <UserX className="size-6" />
              {inativos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Desligados ou suspensos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Novos Funcionarios</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-blue-600">
              <UserPlus className="size-6" />
              {novos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admitidos nos ultimos 90 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dados dos Funcionarios</CardTitle>
              <CardDescription>
                Informacoes cadastrais com conformidade LGPD
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullCPF(!showFullCPF)}
            >
              {showFullCPF ? "Mascarar CPF" : "Mostrar CPF"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Admissao</TableHead>
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
                      <TableCell className="font-medium">{row.nome}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="size-3 text-muted-foreground" />
                            {row.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="size-3" />
                            {row.telefone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {showFullCPF ? row.cpf : maskCPF(row.cpf)}
                      </TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.cargo}</TableCell>
                      <TableCell>{formatDate(row.dataAdmissao)}</TableCell>
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
