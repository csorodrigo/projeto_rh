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
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { QuickStatusBadge, type StatusKey } from "@/components/ui/status-badge"
import type { PayrollPeriod, PayrollStatus } from "@/types/database"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const statusMap: Record<PayrollStatus, StatusKey> = {
  draft: "draft",
  calculating: "calculating",
  calculated: "calculated",
  review: "review",
  approved: "approved",
  processing: "processing",
  paid: "paid",
  exported: "exported",
  cancelled: "cancelled",
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

  const loadData = React.useCallback(async (compId: string, year: number, month: number) => {
    setIsLoading(true)
    try {
      const periodResult = await getOrCreatePayrollPeriod(compId, year, month + 1)
      if (periodResult.data) {
        setPeriod(periodResult.data)

        const payrollsResult = await listEmployeePayrolls(periodResult.data.id)
        if (payrollsResult.data) {
          setPayrolls(payrollsResult.data)
        }
      }

      const statsResult = await getPayrollStats(compId, year, month + 1)
      setStats(statsResult)
    } catch {
      toast.error("Erro ao carregar dados da folha")
    } finally {
      setIsLoading(false)
    }
  }, [])

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
  }, [])

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
        toast.success(`Folha calculada: ${result.data.processed} funcionários processados`)
        if (result.data.errors.length > 0) {
          toast.warning(`${result.data.errors.length} erros encontrados`)
        }
        await loadData(companyId, selectedYear, selectedMonth)
      }
    } catch {
      toast.error("Erro ao calcular folha")
    } finally {
      setIsCalculating(false)
    }
  }

  const columns: ColumnDef<EmployeePayrollWithEmployee>[] = [
    {
      accessorKey: "employee_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Funcionário" />,
      cell: ({ row }) => {
        const name = row.getValue("employee_name") as string
        const department = row.original.employee_department
        return (
          <div>
            <p className="font-medium">{name}</p>
            {department && (
              <p className="text-xs text-muted-foreground">{department}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "base_salary",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Salário Base" />,
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.getValue("base_salary"))}</span>
      ),
    },
    {
      id: "overtime",
      header: "Horas Extras",
      cell: ({ row }) => {
        const overtime = (row.original.overtime_50_value || 0) + (row.original.overtime_100_value || 0)
        return (
          <span className="text-green-600 font-medium">
            +{formatCurrency(overtime)}
          </span>
        )
      },
    },
    {
      id: "bonuses",
      header: "Bônus",
      cell: ({ row }) => {
        const overtime = (row.original.overtime_50_value || 0) + (row.original.overtime_100_value || 0)
        const bonuses = row.original.total_earnings - row.original.base_salary - overtime
        return (
          <span className="text-green-600 font-medium">
            +{formatCurrency(Math.max(0, bonuses))}
          </span>
        )
      },
    },
    {
      accessorKey: "total_deductions",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descontos" />,
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">
          -{formatCurrency(row.getValue("total_deductions"))}
        </span>
      ),
    },
    {
      accessorKey: "net_salary",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Líquido" />,
      cell: ({ row }) => (
        <span className="font-bold text-lg">
          {formatCurrency(row.getValue("net_salary"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as PayrollStatus
        const statusKey = statusMap[status]
        return <QuickStatusBadge status={statusKey} />
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline">
          <Eye className="mr-2 size-4" />
          Detalhes
        </Button>
      ),
    },
  ]

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
            Gestão de proventos e descontos
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3 dark:bg-green-900/30">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalNetSalary)}</p>
                <p className="text-sm text-muted-foreground">Total líquido</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3 dark:bg-blue-900/30">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3 dark:bg-yellow-900/30">
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
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3 dark:bg-purple-900/30">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalBonuses)}</p>
                <p className="text-sm text-muted-foreground">Bônus/Comissões</p>
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
            Detalhamento de proventos e descontos por funcionário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payrolls}
            searchKey="employee_name"
            searchPlaceholder="Buscar funcionário..."
            emptyMessage="Nenhuma folha calculada para este período"
            emptyDescription="Clique em 'Calcular Folha' para processar"
            emptyIcon={<DollarSign className="size-12 text-muted-foreground opacity-20" />}
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exportação</CardTitle>
          <CardDescription>
            Exporte os dados para sistemas contábeis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>Contábil Phoenix</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>Domínio Sistemas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="size-6" />
              <span>CSV Genérico</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
