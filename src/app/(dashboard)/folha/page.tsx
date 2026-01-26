"use client"

import * as React from "react"
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Users,
  Calculator,
  Calendar,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Placeholder data
const payrollData = [
  {
    id: "1",
    employee: "Maria Silva",
    baseSalary: 5000,
    overtime: 250,
    bonuses: 500,
    deductions: 850,
    netSalary: 4900,
    status: "approved",
  },
  {
    id: "2",
    employee: "Joao Santos",
    baseSalary: 7500,
    overtime: 0,
    bonuses: 1000,
    deductions: 1200,
    netSalary: 7300,
    status: "approved",
  },
  {
    id: "3",
    employee: "Pedro Costa",
    baseSalary: 3500,
    overtime: 150,
    bonuses: 0,
    deductions: 550,
    netSalary: 3100,
    status: "draft",
  },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const months = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export default function FolhaPage() {
  const [selectedMonth, setSelectedMonth] = React.useState("Janeiro")
  const [selectedYear, setSelectedYear] = React.useState("2024")

  const totalSalaries = payrollData.reduce((acc, p) => acc + p.netSalary, 0)
  const totalOvertime = payrollData.reduce((acc, p) => acc + p.overtime, 0)
  const totalBonuses = payrollData.reduce((acc, p) => acc + p.bonuses, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Gestao de proventos e descontos
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 size-4" />
                {selectedMonth} {selectedYear}
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {months.map((month) => (
                <DropdownMenuItem
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                >
                  {month}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Exportar
          </Button>
          <Button>
            <Calculator className="mr-2 size-4" />
            Calcular Folha
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSalaries)}</p>
                <p className="text-sm text-muted-foreground">Total liquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payrollData.length}</p>
                <p className="text-sm text-muted-foreground">Funcionarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalOvertime)}</p>
                <p className="text-sm text-muted-foreground">Horas extras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalBonuses)}</p>
                <p className="text-sm text-muted-foreground">Bonus/Comissoes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Folha de {selectedMonth}/{selectedYear}</CardTitle>
          <CardDescription>
            Detalhamento de proventos e descontos por funcionario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionario</TableHead>
                <TableHead className="text-right">Salario Base</TableHead>
                <TableHead className="text-right">Horas Extras</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Descontos</TableHead>
                <TableHead className="text-right">Liquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.employee}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.baseSalary)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatCurrency(row.overtime)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatCurrency(row.bonuses)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(row.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(row.netSalary)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "approved" ? "default" : "secondary"}
                    >
                      {row.status === "approved" ? "Aprovado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exportacao</CardTitle>
          <CardDescription>
            Exporte os dados para sistemas contabeis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>Contabil Phoenix</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>Dominio Sistemas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>CSV Generico</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
