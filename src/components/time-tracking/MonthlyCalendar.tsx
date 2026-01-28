"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Coffee,
  Sun,
  CalendarDays,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type DayStatus =
  | "complete" // Full day worked
  | "incomplete" // Partial day
  | "overtime" // Worked overtime
  | "absent" // Did not work (unjustified)
  | "vacation" // On vacation
  | "sick_leave" // Sick leave
  | "holiday" // Holiday
  | "weekend" // Weekend (not scheduled)
  | "future" // Future date
  | "today" // Current day

interface DayData {
  date: Date
  status: DayStatus
  workedMinutes?: number
  expectedMinutes?: number
  overtimeMinutes?: number
  clockIn?: string | null
  clockOut?: string | null
  breakMinutes?: number
  notes?: string | null
  absenceType?: string | null
}

interface MonthlyCalendarProps {
  month?: Date
  daysData: DayData[]
  onDayClick?: (day: DayData) => void
  onMonthChange?: (month: Date) => void
  isLoading?: boolean
  className?: string
}

const statusConfig: Record<
  DayStatus,
  {
    label: string
    icon: React.ElementType
    color: string
    bgColor: string
    dotColor: string
  }
> = {
  complete: {
    label: "Completo",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900",
    dotColor: "bg-green-500",
  },
  incomplete: {
    label: "Incompleto",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900",
    dotColor: "bg-amber-500",
  },
  overtime: {
    label: "Hora extra",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900",
    dotColor: "bg-blue-500",
  },
  absent: {
    label: "Falta",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900",
    dotColor: "bg-red-500",
  },
  vacation: {
    label: "Ferias",
    icon: Sun,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 dark:hover:bg-purple-900",
    dotColor: "bg-purple-500",
  },
  sick_leave: {
    label: "Atestado",
    icon: Coffee,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950 hover:bg-orange-200 dark:hover:bg-orange-900",
    dotColor: "bg-orange-500",
  },
  holiday: {
    label: "Feriado",
    icon: CalendarDays,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-950 hover:bg-pink-200 dark:hover:bg-pink-900",
    dotColor: "bg-pink-500",
  },
  weekend: {
    label: "Fim de semana",
    icon: Sun,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50 hover:bg-muted",
    dotColor: "bg-muted-foreground/30",
  },
  future: {
    label: "Futuro",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-transparent hover:bg-muted/50",
    dotColor: "bg-transparent",
  },
  today: {
    label: "Hoje",
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20 ring-2 ring-primary",
    dotColor: "bg-primary",
  },
}

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export function MonthlyCalendar({
  month = new Date(),
  daysData,
  onDayClick,
  onMonthChange,
  isLoading = false,
  className,
}: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month)
  const [selectedDay, setSelectedDay] = React.useState<DayData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Get days in month
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add padding days from previous month
    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      const paddingDate = new Date(year, month, -i)
      days.push(paddingDate)
    }

    // Add days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // Add padding days for next month
    const endPadding = 42 - days.length // 6 rows x 7 days
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)

  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(Math.abs(mins) / 60)
    const minutes = Math.abs(mins) % 60
    const sign = mins < 0 ? "-" : ""
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const getDayData = (date: Date): DayData | undefined => {
    return daysData.find(
      (d) =>
        d.date.getDate() === date.getDate() &&
        d.date.getMonth() === date.getMonth() &&
        d.date.getFullYear() === date.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handlePreviousMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    )
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    )
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const handleDayClick = (date: Date, dayData?: DayData) => {
    if (!isCurrentMonth(date)) return

    const data: DayData = dayData || {
      date,
      status: isToday(date) ? "today" : "future",
    }

    setSelectedDay(data)
    setIsDialogOpen(true)
    onDayClick?.(data)
  }

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
  }

  // Calculate monthly summary
  const monthlySummary = React.useMemo(() => {
    const monthDays = daysData.filter(
      (d) =>
        d.date.getMonth() === currentMonth.getMonth() &&
        d.date.getFullYear() === currentMonth.getFullYear()
    )

    return {
      totalWorked: monthDays.reduce((sum, d) => sum + (d.workedMinutes || 0), 0),
      totalExpected: monthDays.reduce((sum, d) => sum + (d.expectedMinutes || 0), 0),
      totalOvertime: monthDays.reduce((sum, d) => sum + (d.overtimeMinutes || 0), 0),
      completeDays: monthDays.filter((d) => d.status === "complete").length,
      incompleteDays: monthDays.filter((d) => d.status === "incomplete").length,
      absentDays: monthDays.filter((d) => d.status === "absent").length,
      vacationDays: monthDays.filter(
        (d) => d.status === "vacation" || d.status === "sick_leave"
      ).length,
    }
  }, [daysData, currentMonth])

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" aria-hidden="true" />
                Calendario Mensal
              </CardTitle>
              <CardDescription className="capitalize">
                {formatMonthYear(currentMonth)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Proximo mes"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monthly Summary */}
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="rounded-lg bg-green-100 dark:bg-green-950 p-2">
              <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                {monthlySummary.completeDays}
              </p>
              <p className="text-xs text-muted-foreground">Completos</p>
            </div>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-950 p-2">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {monthlySummary.incompleteDays}
              </p>
              <p className="text-xs text-muted-foreground">Incompletos</p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-950 p-2">
              <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                {monthlySummary.absentDays}
              </p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-2">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {formatMinutes(monthlySummary.totalOvertime)}
              </p>
              <p className="text-xs text-muted-foreground">Extras</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-lg border">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "p-2 text-center text-xs font-medium text-muted-foreground",
                    index === 0 || index === 6 ? "text-muted-foreground/60" : ""
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((date, index) => {
                const dayData = getDayData(date)
                const inCurrentMonth = isCurrentMonth(date)
                const today = isToday(date)

                // Determine status
                let status: DayStatus = "future"
                if (dayData) {
                  status = dayData.status
                } else if (!inCurrentMonth) {
                  status = "future"
                } else if (today) {
                  status = "today"
                } else if (date.getDay() === 0 || date.getDay() === 6) {
                  status = "weekend"
                } else if (date < new Date()) {
                  status = "absent" // Default for past days without data
                }

                const config = statusConfig[status]
                const Icon = config.icon

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "relative aspect-square p-1 text-center transition-colors",
                          "border-b border-r last:border-r-0 [&:nth-child(7n)]:border-r-0",
                          inCurrentMonth
                            ? config.bgColor
                            : "bg-muted/20 text-muted-foreground/40",
                          !inCurrentMonth && "cursor-default",
                          "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        )}
                        onClick={() => handleDayClick(date, dayData)}
                        disabled={!inCurrentMonth}
                        aria-label={`${date.getDate()} de ${date.toLocaleDateString("pt-BR", { month: "long" })}, ${config.label}`}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium",
                            inCurrentMonth ? config.color : "text-muted-foreground/40",
                            today && "font-bold"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {/* Status Indicator */}
                        {inCurrentMonth && status !== "future" && status !== "weekend" && (
                          <span
                            className={cn(
                              "absolute bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full",
                              config.dotColor
                            )}
                            aria-hidden="true"
                          />
                        )}

                        {/* Worked hours indicator for days with data */}
                        {dayData && dayData.workedMinutes !== undefined && dayData.workedMinutes > 0 && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] tabular-nums text-muted-foreground">
                            {Math.floor(dayData.workedMinutes / 60)}h
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {inCurrentMonth && (
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium flex items-center gap-1.5">
                            <Icon className="size-3.5" aria-hidden="true" />
                            {config.label}
                          </p>
                          {dayData && (
                            <>
                              {dayData.workedMinutes !== undefined && (
                                <p className="text-muted-foreground">
                                  Trabalhado: {formatMinutes(dayData.workedMinutes)}
                                </p>
                              )}
                              {dayData.clockIn && (
                                <p className="text-muted-foreground">
                                  Entrada: {dayData.clockIn}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs" role="list" aria-label="Legenda">
            {(
              [
                "complete",
                "incomplete",
                "overtime",
                "absent",
                "vacation",
                "holiday",
              ] as DayStatus[]
            ).map((status) => {
              const config = statusConfig[status]
              return (
                <div key={status} className="flex items-center gap-1.5" role="listitem">
                  <span
                    className={cn("size-2.5 rounded-full", config.dotColor)}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.date.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
            <DialogDescription>
              {selectedDay && statusConfig[selectedDay.status].label}
            </DialogDescription>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("gap-1.5", statusConfig[selectedDay.status].color)}
                >
                  {React.createElement(statusConfig[selectedDay.status].icon, {
                    className: "size-3.5",
                    "aria-hidden": true,
                  })}
                  {statusConfig[selectedDay.status].label}
                </Badge>
              </div>

              {/* Time Details */}
              {selectedDay.workedMinutes !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Trabalhado</p>
                    <p className="text-lg font-bold tabular-nums">
                      {formatMinutes(selectedDay.workedMinutes)}
                    </p>
                  </div>
                  {selectedDay.expectedMinutes !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Esperado</p>
                      <p className="text-lg font-bold tabular-nums">
                        {formatMinutes(selectedDay.expectedMinutes)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Clock In/Out */}
              {(selectedDay.clockIn || selectedDay.clockOut) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedDay.clockIn && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Entrada</p>
                      <p className="font-medium tabular-nums">{selectedDay.clockIn}</p>
                    </div>
                  )}
                  {selectedDay.clockOut && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Saida</p>
                      <p className="font-medium tabular-nums">{selectedDay.clockOut}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Break Time */}
              {selectedDay.breakMinutes !== undefined && selectedDay.breakMinutes > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Intervalo</p>
                  <p className="font-medium tabular-nums">
                    {formatMinutes(selectedDay.breakMinutes)}
                  </p>
                </div>
              )}

              {/* Overtime */}
              {selectedDay.overtimeMinutes !== undefined && selectedDay.overtimeMinutes > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hora extra</p>
                  <p className="font-medium tabular-nums text-blue-600 dark:text-blue-400">
                    +{formatMinutes(selectedDay.overtimeMinutes)}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedDay.notes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Observacoes</p>
                  <p className="text-sm">{selectedDay.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
