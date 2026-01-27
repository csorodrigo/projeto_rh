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
import {
  getCurrentProfile,
  getOrCreatePayrollPeriod,
  listEmployeePayrolls,
  getPayrollStats,
  generatePayrollForPeriod,
  type EmployeePayrollWithEmployee,
} from "@/lib/supabase/queries"
import type { PayrollPeriod, PayrollStatus } from "@/types/database"

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

const statusLabels: Record<PayrollStatus, string> = {
  draft: "Rascunho",
  calculating: "Calculando",
  calculated: "Calculado",
  review: "Revisao",
  approved: "Aprovado",
  processing: "Processando",
  paid: "Pago",
  exported: "Exportado",
  cancelled: "Cancelado",
}

const statusVariant: Record<PayrollStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  calculating: "outline",
  calculated: "outline",
  review: "outline",
  approved: "default",
  processing: "outline",
  paid: "default",
  exported: "default",
  cancelled: "destructive",
}

export default function FolhaPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCalculating, setIsCalculating] = React.useState(false)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())
  const [period, setPeriod] = React.useState<PayrollPeriod | null>(null)
  const [payrolls, setPayrolls] = React.useState<EmployeePayrollWithEmployee[]>([])
  const [stats, setStats] = React.useState({
    totalNetSalary: 0,
    totalEmployees: 0,
    totalOvertime: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    periodStatus: null as PayrollStatus | null,
  })

  // Load data for selected month/year
  const loadData = React.useCallback(async (compId: string, year: number, month: number) => {
    setIsLoading(true)
    try {
      // Get or create period
      const periodResult = await getOrCreatePayrollPeriod(compId, year, month + 1)
      if (periodResult.data) {
        setPeriod(periodResult.data)

        // Load payrolls for this period
        const payrollsResult = await listEmployeePayrolls(periodResult.data.id)
        if (payrollsResult.data) {
          setPayrolls(payrollsResult.data)
        }
      }

      // Load stats
      const statsResult = await getPayrollStats(compId, year, month + 1)
      setStats(statsResult)
    } catch {
      toast.error("Erro ao carregar dados da folha")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  React.useEffect(() => {
    async function init() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          setIsLoading(false)
          return
        }

        const compId = profileResult.data.company_id
        setCompanyId(compId)
        await loadData(compId, selectedYear, selectedMonth)
      } catch {
        toast.error("Erro ao carregar dados")
        setIsLoading(false)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when month/year changes
  React.useEffect(() => {
    if (companyId) {
      loadData(companyId, selectedYear, selectedMonth)
    }
  }, [companyId, selectedYear, selectedMonth, loadData])

  const handleCalculatePayroll = async () => {
    if (!companyId || !period) return

    setIsCalculating(true)
    try {
      const result = await generatePayrollForPeriod(companyId, period.id)
      if (result.error) {
        toast.error("Erro ao calcular folha: " + result.error.message)
      } else if (result.data) {
        toast.success(`Folha calculada: ${result.data.processed} funcionarios processados`)
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.errors.length} erros encontrados`)
        }
        // Reload data
        await loadData(companyId, selectedYear, selectedMonth)
      }
    } catch {
      toast.error("Erro ao calcular folha")
    } finally {
      setIsCalculating(false)
    }
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
                {months[selectedMonth]} {selectedYear}
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {months.map((month, index) => (
                <DropdownMenuItem
                  key={month}
                  onClick={() => setSelectedMonth(index)}
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
          <Button onClick={handleCalculatePayroll} disabled={isCalculating}>
            {isCalculating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Calculator className="mr-2 size-4" />
            )}
            Calcular Folha
          </Button>
        </div>
      </div>

      {/* Period Status */}
      {period && stats.periodStatus && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status do periodo:</span>
          <Badge variant={statusVariant[stats.periodStatus]}>
            {statusLabels[stats.periodStatus]}
          </Badge>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalNetSalary)}</p>
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
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(stats.totalOvertime)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(stats.totalBonuses)}</p>
                <p className="text-sm text-muted-foreground">Bonus/Comissoes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Folha de {months[selectedMonth]}/{selectedYear}</CardTitle>
          <CardDescription>
            Detalhamento de proventos e descontos por funcionario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="mx-auto size-12 mb-4 opacity-20" />
              <p>Nenhuma folha calculada para este periodo</p>
              <p className="text-sm">Clique em "Calcular Folha" para processar</p>
            </div>
          ) : (
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
                {payrolls.map((row) => {
                  const overtime = (row.overtime_50_value || 0) + (row.overtime_100_value || 0)
                  const bonuses = row.total_earnings - row.base_salary - overtime
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.employee_name}
                        {row.employee_department && (
                          <p className="text-xs text-muted-foreground">
                            {row.employee_department}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.base_salary)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(overtime)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(Math.max(0, bonuses))}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(row.total_deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(row.net_salary)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[row.status]}>
                          {statusLabels[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
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
