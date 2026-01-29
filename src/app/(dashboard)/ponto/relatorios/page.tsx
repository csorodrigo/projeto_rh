"use client"

import * as React from "react"
import { CalendarDays, Download, Filter, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeReportTable } from "@/components/time-tracking"

import {
  getTimeTrackingReport,
  listEmployees,
  getCurrentCompany,
} from "@/lib/supabase/queries"

import type { TimeTrackingDaily, Employee } from "@/types/database"

type ReportData = TimeTrackingDaily & { employee_name: string; department: string | null }

export default function RelatoriosPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [reportData, setReportData] = React.useState<ReportData[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)

  // Filters
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("all")
  const [startDate, setStartDate] = React.useState<string>(() => {
    const date = new Date()
    date.setDate(1) // First day of month
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")

  // Get unique departments from employees
  const departments = React.useMemo(() => {
    const depts = new Set<string>()
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department)
    })
    return Array.from(depts).sort()
  }, [employees])

  // Load initial data
  React.useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const companyResult = await getCurrentCompany()
        if (!companyResult.data) {
          console.error("Erro ao carregar empresa")
          return
        }

        const compId = companyResult.data.id
        setCompanyId(compId)

        // Load employees for filter
        const employeesResult = await listEmployees(compId, { status: 'active' })
        if (employeesResult.data) {
          setEmployees(employeesResult.data)
        }

        // Load initial report (current month)
        await loadReport(compId)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load report data
  const loadReport = async (compId?: string) => {
    const targetCompanyId = compId || companyId
    if (!targetCompanyId) return

    setIsLoading(true)
    try {
      const filters: {
        employeeId?: string
        startDate?: string
        endDate?: string
        department?: string
      } = {}

      if (selectedEmployee !== "all") {
        filters.employeeId = selectedEmployee
      }

      if (startDate) {
        filters.startDate = startDate
      }

      if (endDate) {
        filters.endDate = endDate
      }

      if (selectedDepartment !== "all") {
        filters.department = selectedDepartment
      }

      const result = await getTimeTrackingReport(targetCompanyId, filters)

      if (result.data) {
        setReportData(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter apply
  const handleApplyFilters = () => {
    loadReport()
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) return

    const headers = [
      "Data",
      "Funcionário",
      "Departamento",
      "Entrada",
      "Saída",
      "Trabalhado (min)",
      "Extras (min)",
      "Falta (min)",
      "Status"
    ]

    const rows = reportData.map(item => [
      item.date,
      item.employee_name,
      item.department || "",
      item.clock_in ? new Date(item.clock_in).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
      item.clock_out ? new Date(item.clock_out).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
      item.worked_minutes.toString(),
      item.overtime_minutes.toString(),
      item.missing_minutes.toString(),
      item.status
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-ponto-${startDate}-${endDate}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Ponto</h1>
          <p className="text-muted-foreground">
            Visualize e exporte relatórios de ponto dos funcionários
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={reportData.length === 0}
        >
          <Download className="size-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Selecione os critérios para gerar o relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Employee Filter */}
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      Todos
                    </div>
                  </SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name || emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <Button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="w-full"
              >
                <Search className="size-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Ponto</CardTitle>
          <CardDescription>
            {reportData.length > 0
              ? `${reportData.length} registro(s) encontrado(s)`
              : "Nenhum registro encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <TimeReportTable
              data={reportData}
              showEmployee={selectedEmployee === "all"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
