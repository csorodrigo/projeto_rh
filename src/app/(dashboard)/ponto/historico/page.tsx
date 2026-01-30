"use client"

import * as React from "react"
import {
  CalendarDays,
  Clock,
  Download,
  Loader2,
  AlertCircle,
  TrendingUp,
  CalendarCheck,
  CalendarX,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
  eachDayOfInterval,
} from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HistoryCard } from "@/components/time-tracking"
import {
  getEmployeeTimeRecords,
  getCurrentProfile,
  getCurrentCompany,
} from "@/lib/supabase/queries"
import { cn, formatDate } from "@/lib/utils"
import type { TimeRecord } from "@/types/database"
import type { DateRange } from "react-day-picker"
import { ExportButton } from "@/components/export"
import { exportTimeRecordsToCSV, exportTimeRecordsPDF } from "@/lib/export"

type FilterPeriod = "today" | "week" | "month" | "custom"

interface DayRecords {
  date: Date
  records: TimeRecord[]
  workedMinutes: number
  status: "complete" | "incomplete" | "no_records"
}

export default function HistoricoPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Auth state
  const [employeeId, setEmployeeId] = React.useState<string | null>(null)
  const [employeeName, setEmployeeName] = React.useState<string>("Funcionário")

  // Data state
  const [records, setRecords] = React.useState<TimeRecord[]>([])
  const [dayRecords, setDayRecords] = React.useState<DayRecords[]>([])

  // Filter state
  const [periodFilter, setPeriodFilter] = React.useState<FilterPeriod>("week")
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: startOfWeek(new Date(), { locale: ptBR }),
    to: endOfWeek(new Date(), { locale: ptBR }),
  })
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>()

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(0)
  const itemsPerPage = 7

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

        const empId = profileResult.data.employee_id
        if (!empId) {
          setError("Funcionário não vinculado. Entre em contato com RH.")
          return
        }

        setEmployeeId(empId)

        // Get employee name from profile
        if (profileResult.data.full_name) {
          setEmployeeName(profileResult.data.full_name)
        }
      } catch (err) {
        setError("Erro ao carregar dados do usuario")
        console.error(err)
      }
    }

    loadUser()
  }, [])

  // Update date range when period filter changes
  React.useEffect(() => {
    const now = new Date()
    switch (periodFilter) {
      case "today":
        setDateRange({ from: startOfDay(now), to: endOfDay(now) })
        break
      case "week":
        setDateRange({
          from: startOfWeek(now, { locale: ptBR }),
          to: endOfWeek(now, { locale: ptBR }),
        })
        break
      case "month":
        setDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now),
        })
        break
      // custom is handled separately
    }
    setCurrentPage(0)
  }, [periodFilter])

  // Handle custom date range selection
  React.useEffect(() => {
    if (periodFilter === "custom" && customDateRange?.from && customDateRange?.to) {
      setDateRange({
        from: startOfDay(customDateRange.from),
        to: endOfDay(customDateRange.to),
      })
      setCurrentPage(0)
    }
  }, [customDateRange, periodFilter])

  // Load records when employee ID or date range changes
  React.useEffect(() => {
    if (!employeeId) return

    const loadRecords = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getEmployeeTimeRecords(
          employeeId,
          format(dateRange.from, "yyyy-MM-dd"),
          format(dateRange.to, "yyyy-MM-dd")
        )

        if (result.error) {
          setError(result.error.message)
        } else {
          setRecords(result.data || [])
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

  // Process records by day
  React.useEffect(() => {
    if (records.length === 0) {
      // Create empty days for the range
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
      const emptyDays: DayRecords[] = days.map((day) => ({
        date: day,
        records: [],
        workedMinutes: 0,
        status: "no_records" as const,
      }))
      setDayRecords(emptyDays)
      return
    }

    // Group records by date
    const recordsByDate = new Map<string, TimeRecord[]>()
    records.forEach((record) => {
      const date = format(parseISO(record.recorded_at), "yyyy-MM-dd")
      if (!recordsByDate.has(date)) {
        recordsByDate.set(date, [])
      }
      recordsByDate.get(date)!.push(record)
    })

    // Create day records for all days in range
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
    const processed: DayRecords[] = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayRecords = recordsByDate.get(dateStr) || []

      // Calculate worked minutes and status
      let workedMinutes = 0
      let hasIncomplete = false

      if (dayRecords.length > 0) {
        // Group into pairs
        let lastClockIn: TimeRecord | null = null

        dayRecords.forEach((record) => {
          if (record.record_type === "clock_in" || record.record_type === "break_end") {
            if (lastClockIn) {
              // Previous clock_in without clock_out
              hasIncomplete = true
            }
            lastClockIn = record
          } else if (record.record_type === "clock_out" || record.record_type === "break_start") {
            if (lastClockIn) {
              const start = new Date(lastClockIn.recorded_at).getTime()
              const end = new Date(record.recorded_at).getTime()
              workedMinutes += Math.round((end - start) / 1000 / 60)
              lastClockIn = null
            }
          }
        })

        // Check if last record is incomplete
        if (lastClockIn) {
          hasIncomplete = true
        }
      }

      return {
        date: day,
        records: dayRecords,
        workedMinutes,
        status:
          dayRecords.length === 0
            ? "no_records"
            : hasIncomplete
              ? "incomplete"
              : "complete",
      }
    })

    setDayRecords(processed)
  }, [records, dateRange])

  // Summary stats
  const summary = React.useMemo(() => {
    const totalWorked = dayRecords.reduce((sum, day) => sum + day.workedMinutes, 0)
    const daysWithRecords = dayRecords.filter((day) => day.records.length > 0).length
    const daysWithoutRecords = dayRecords.filter((day) => day.records.length === 0).length
    const avgMinutesPerDay = daysWithRecords > 0 ? Math.round(totalWorked / daysWithRecords) : 0

    return {
      totalWorked,
      avgMinutesPerDay,
      daysWithRecords,
      daysWithoutRecords,
    }
  }, [dayRecords])

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  // Paginated records
  const paginatedDays = React.useMemo(() => {
    const start = currentPage * itemsPerPage
    const end = start + itemsPerPage
    return dayRecords.slice(start, end)
  }, [dayRecords, currentPage])

  const totalPages = Math.ceil(dayRecords.length / itemsPerPage)

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
          <ExportButton
            onExportCSV={() => exportTimeRecordsToCSV(records, employeeName)}
            onExportPDF={async () => {
              const dateRangeStr = `${dateRange.from.toLocaleDateString('pt-BR')} - ${dateRange.to.toLocaleDateString('pt-BR')}`
              await exportTimeRecordsPDF(records, {
                title: `Histórico de Ponto - ${employeeName}`,
                subtitle: dateRangeStr,
              })
            }}
            disabled={records.length === 0}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Period Filter */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={periodFilter}
                onValueChange={(v) => setPeriodFilter(v as FilterPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Picker */}
            {periodFilter === "custom" && (
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {formatDate(customDateRange.from)} -{" "}
                            {formatDate(customDateRange.to)}
                          </>
                        ) : (
                          formatDate(customDateRange.from)
                        )
                      ) : (
                        "Selecione o período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                      disabled={{ after: new Date() }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Current Range Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>
              Exibindo: {formatDate(dateRange.from, "dd/MM/yyyy")} até{" "}
              {formatDate(dateRange.to, "dd/MM/yyyy")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total de horas</p>
            </div>
            <p className="text-2xl font-bold text-green-600 tabular-nums">
              {formatMinutes(summary.totalWorked)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Média por dia</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 tabular-nums">
              {formatMinutes(summary.avgMinutesPerDay)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dias com registro</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{summary.daysWithRecords}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarX className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dias sem registro</p>
            </div>
            <p className="text-2xl font-bold text-red-600 tabular-nums">
              {summary.daysWithoutRecords}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedDays.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum registro encontrado</p>
                <p className="text-sm">Tente selecionar um período diferente</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedDays.map((day, index) => (
              <HistoryCard
                key={format(day.date, "yyyy-MM-dd")}
                date={day.date}
                records={day.records}
                expectedHours={8}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage + 1} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
