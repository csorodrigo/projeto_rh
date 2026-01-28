"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Clock,
  Download,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TimelineVisual } from "@/components/time-tracking"
import {
  getTimeTrackingPeriod,
  getTodayTimeRecords,
  getCurrentProfile,
  getCurrentCompany,
} from "@/lib/supabase/queries"
import { cn, formatDate } from "@/lib/utils"
import type { TimeTrackingDaily, TimeRecord } from "@/types/database"

type FilterPeriod = "week" | "month" | "custom"
type StatusFilter = "all" | "approved" | "pending" | "adjusted"

export default function HistoricoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Auth state
  const [employeeId, setEmployeeId] = React.useState<string | null>(null)
  const [companyId, setCompanyId] = React.useState<string | null>(null)

  // Data state
  const [dailyRecords, setDailyRecords] = React.useState<TimeTrackingDaily[]>([])
  const [selectedDayRecords, setSelectedDayRecords] = React.useState<TimeRecord[]>([])
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)

  // Filter state
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [periodFilter, setPeriodFilter] = React.useState<FilterPeriod>("month")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Adjustment request state
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = React.useState(false)
  const [selectedAdjustmentDate, setSelectedAdjustmentDate] = React.useState<Date | null>(null)

  // Load user info
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const [profileResult, companyResult] = await Promise.all([
          getCurrentProfile(),
          getCurrentCompany(),
        ])

        if (!profileResult.data || !companyResult.data) {
          setError("Erro ao carregar perfil ou empresa")
          return
        }

        setEmployeeId(profileResult.data.id)
        setCompanyId(companyResult.data.id)
      } catch (err) {
        setError("Erro ao carregar dados do usuario")
        console.error(err)
      }
    }

    loadUser()
  }, [])

  // Load records when employee ID or date range changes
  React.useEffect(() => {
    if (!employeeId) return

    const loadRecords = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getTimeTrackingPeriod(
          employeeId,
          format(dateRange.from, "yyyy-MM-dd"),
          format(dateRange.to, "yyyy-MM-dd")
        )

        if (result.error) {
          setError(result.error.message)
        } else {
          setDailyRecords(result.data || [])
        }
      } catch (err) {
        setError("Erro ao carregar historico")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecords()
  }, [employeeId, dateRange])

  // Load specific day records when date is selected
  React.useEffect(() => {
    if (!employeeId || !selectedDate) {
      setSelectedDayRecords([])
      return
    }

    const loadDayRecords = async () => {
      try {
        const result = await getTodayTimeRecords(employeeId)
        if (result.data) {
          // Filter by selected date
          const filtered = result.data.filter((record) => {
            const recordDate = format(parseISO(record.recorded_at), "yyyy-MM-dd")
            const selected = format(selectedDate, "yyyy-MM-dd")
            return recordDate === selected
          })
          setSelectedDayRecords(filtered)
        }
      } catch (err) {
        console.error("Erro ao carregar registros do dia:", err)
      }
    }

    loadDayRecords()
  }, [employeeId, selectedDate])

  // Update date range when period filter changes
  React.useEffect(() => {
    const now = new Date()
    switch (periodFilter) {
      case "week":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        setDateRange({ from: weekStart, to: now })
        break
      case "month":
        setDateRange({
          from: startOfMonth(currentMonth),
          to: endOfMonth(currentMonth),
        })
        break
      // custom is handled by calendar
    }
  }, [periodFilter, currentMonth])

  // Filter records by status
  const filteredRecords = React.useMemo(() => {
    if (statusFilter === "all") return dailyRecords
    return dailyRecords.filter((record) => record.status === statusFilter)
  }, [dailyRecords, statusFilter])

  // Summary stats
  const summary = React.useMemo(() => {
    const totals = {
      workedMinutes: 0,
      overtimeMinutes: 0,
      missingMinutes: 0,
      daysWorked: 0,
      pendingDays: 0,
    }

    filteredRecords.forEach((record) => {
      totals.workedMinutes += record.worked_minutes
      totals.overtimeMinutes += record.overtime_minutes
      totals.missingMinutes += record.missing_minutes
      if (record.worked_minutes > 0) totals.daysWorked++
      if (record.status === "pending") totals.pendingDays++
    })

    return totals
  }, [filteredRecords])

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60)
    const mins = Math.abs(minutes) % 60
    const sign = minutes < 0 ? "-" : ""
    return `${sign}${hours}h ${mins}min`
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1)
    if (next <= new Date()) {
      setCurrentMonth(next)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleRequestAdjustment = (date: Date) => {
    setSelectedAdjustmentDate(date)
    setAdjustmentDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Aprovado</Badge>
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      case "adjusted":
        return <Badge variant="outline">Ajustado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calendar day styling
  const getDayClassName = (day: Date): string => {
    const dateStr = format(day, "yyyy-MM-dd")
    const record = dailyRecords.find((r) => r.date === dateStr)

    if (!record) return ""

    if (record.status === "approved") return "bg-green-100 dark:bg-green-950"
    if (record.status === "pending") return "bg-yellow-100 dark:bg-yellow-950"
    if (record.status === "adjusted") return "bg-blue-100 dark:bg-blue-950"
    if (record.is_manually_adjusted) return "bg-amber-100 dark:bg-amber-950"

    return ""
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historico de Ponto</h1>
          <p className="text-muted-foreground">Consulte seus registros anteriores</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historico de Ponto</h1>
          <p className="text-muted-foreground">Consulte seus registros anteriores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Download className="size-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar and Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              Periodo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <Label>Filtrar por</Label>
              <Select
                value={periodFilter}
                onValueChange={(v) => setPeriodFilter(v as FilterPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Ultima semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month Navigation */}
            {periodFilter === "month" && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="font-medium capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={addMonths(currentMonth, 1) > new Date()}
                  aria-label="Proximo mes"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}

            {/* Custom Date Picker */}
            {periodFilter === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 size-4" />
                    {dateRange.from && dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                      </>
                    ) : (
                      "Selecione o periodo"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Mini Calendar for Day Selection */}
            <div className="border rounded-lg p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                disabled={{ after: new Date() }}
                modifiers={{
                  hasRecord: (day) =>
                    dailyRecords.some((r) => r.date === format(day, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  hasRecord: "font-bold",
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="adjusted">Ajustados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records List and Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Horas trabalhadas</p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">
                  {formatMinutes(summary.workedMinutes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Horas extras</p>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">
                  {formatMinutes(summary.overtimeMinutes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Horas faltantes</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">
                  {formatMinutes(summary.missingMinutes)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Dias trabalhados</p>
                <p className="text-2xl font-bold tabular-nums">{summary.daysWorked}</p>
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Timeline */}
          {selectedDate && (
            <TimelineVisual
              entries={selectedDayRecords}
              expectedHours={8}
              date={selectedDate}
            />
          )}

          {/* Records List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Registros
              </CardTitle>
              <CardDescription>
                {filteredRecords.length} registro(s) encontrado(s)
                {summary.pendingDays > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {summary.pendingDays} pendente(s)
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado para o periodo selecionado
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border",
                        selectedDate &&
                          format(selectedDate, "yyyy-MM-dd") === record.date &&
                          "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">
                            {format(parseISO(record.date), "EEE", { locale: ptBR })}
                          </p>
                          <p className="text-lg font-bold tabular-nums">
                            {format(parseISO(record.date), "dd")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.date), "MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Entrada:</span>
                            <span className="font-medium tabular-nums">
                              {record.clock_in
                                ? format(parseISO(record.clock_in), "HH:mm")
                                : "--:--"}
                            </span>
                            <span className="text-muted-foreground">Saida:</span>
                            <span className="font-medium tabular-nums">
                              {record.clock_out
                                ? format(parseISO(record.clock_out), "HH:mm")
                                : "--:--"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm mt-1">
                            <span className="text-green-600">
                              {formatMinutes(record.worked_minutes)}
                            </span>
                            {record.overtime_minutes > 0 && (
                              <span className="text-blue-600">
                                +{formatMinutes(record.overtime_minutes)} extra
                              </span>
                            )}
                            {record.missing_minutes > 0 && (
                              <span className="text-red-600">
                                -{formatMinutes(record.missing_minutes)} falta
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {record.status !== "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRequestAdjustment(parseISO(record.date))
                            }
                          >
                            <FileText className="size-4 mr-1" />
                            Solicitar Ajuste
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Adjustment Request Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
            <DialogDescription>
              {selectedAdjustmentDate && (
                <>
                  Solicitando ajuste para o dia{" "}
                  {formatDate(selectedAdjustmentDate, "dd/MM/yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Informacao</AlertTitle>
              <AlertDescription>
                Sua solicitacao sera enviada para aprovacao do gestor. Voce sera
                notificado quando houver uma resposta.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Motivo do ajuste</Label>
              <textarea
                id="adjustment-reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descreva o motivo da solicitacao de ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement adjustment request submission
                setAdjustmentDialogOpen(false)
              }}
            >
              Enviar Solicitacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
