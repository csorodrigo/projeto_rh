"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { listAbsences, approveAbsence, rejectAbsence, getCurrentProfile } from "@/lib/supabase/queries"
import type { AbsenceWithEmployee, AbsenceType, AbsenceStatus } from "@/types/database"

// Configuração de cores por tipo de ausência
const absenceColors: Record<AbsenceType, { bg: string; border: string; text: string }> = {
  vacation: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  vacation_advance: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  vacation_sold: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  sick_leave: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
  maternity_leave: { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" },
  paternity_leave: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
  adoption_leave: { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
  bereavement: { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700" },
  marriage_leave: { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" },
  jury_duty: { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-700" },
  military_service: { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-700" },
  election_duty: { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-700" },
  blood_donation: { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
  union_leave: { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-700" },
  medical_appointment: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
  prenatal: { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" },
  child_sick: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
  legal_obligation: { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-700" },
  study_leave: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
  unjustified: { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
  time_bank: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
  compensatory: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
  other: { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700" },
}

// Labels para tipos de ausência
const absenceTypeLabels: Record<AbsenceType, string> = {
  vacation: "Férias",
  vacation_advance: "Férias Antecipadas",
  vacation_sold: "Férias Vendidas",
  sick_leave: "Licença Médica",
  maternity_leave: "Licença Maternidade",
  paternity_leave: "Licença Paternidade",
  adoption_leave: "Licença Adoção",
  bereavement: "Luto",
  marriage_leave: "Casamento",
  jury_duty: "Júri",
  military_service: "Serviço Militar",
  election_duty: "Mesário",
  blood_donation: "Doação de Sangue",
  union_leave: "Licença Sindical",
  medical_appointment: "Consulta Médica",
  prenatal: "Pré-natal",
  child_sick: "Filho Doente",
  legal_obligation: "Obrigação Legal",
  study_leave: "Licença Estudos",
  unjustified: "Falta Injustificada",
  time_bank: "Banco de Horas",
  compensatory: "Folga Compensatória",
  other: "Outro",
}

// Labels para status
const statusLabels: Record<AbsenceStatus, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  in_progress: "Em Andamento",
  completed: "Concluído",
}

interface DayAbsence {
  date: Date
  absences: AbsenceWithEmployee[]
}

interface MonthStats {
  totalDays: number
  byType: Record<AbsenceType, number>
  byStatus: Record<AbsenceStatus, number>
}

export default function AbsencesCalendarPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isLoading, setIsLoading] = React.useState(true)
  const [absences, setAbsences] = React.useState<AbsenceWithEmployee[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)

  // Filtros
  const [selectedType, setSelectedType] = React.useState<AbsenceType | "all">("all")
  const [selectedStatus, setSelectedStatus] = React.useState<AbsenceStatus | "all">("all")

  // Sheet para mobile
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Modal de detalhes do dia
  const [selectedDay, setSelectedDay] = React.useState<DayAbsence | null>(null)
  const [dayModalOpen, setDayModalOpen] = React.useState(false)

  // Carregar perfil e company_id
  React.useEffect(() => {
    async function loadProfile() {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao carregar perfil")
        return
      }
      setCompanyId(profileResult.data.company_id)
    }
    loadProfile()
  }, [])

  // Carregar ausências do mês
  React.useEffect(() => {
    async function loadAbsences() {
      if (!companyId) return

      setIsLoading(true)
      try {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)

        const result = await listAbsences(
          companyId,
          {
            startDate: format(monthStart, "yyyy-MM-dd"),
            endDate: format(monthEnd, "yyyy-MM-dd"),
          },
          { page: 1, perPage: 1000 }
        )

        if (result.error) {
          toast.error("Erro ao carregar ausências")
          return
        }

        setAbsences(result.data || [])
      } catch {
        toast.error("Erro ao carregar ausências")
      } finally {
        setIsLoading(false)
      }
    }

    loadAbsences()
  }, [companyId, currentMonth])

  // Filtrar ausências
  const filteredAbsences = React.useMemo(() => {
    return absences.filter((absence) => {
      if (selectedType !== "all" && absence.type !== selectedType) return false
      if (selectedStatus !== "all" && absence.status !== selectedStatus) return false
      return true
    })
  }, [absences, selectedType, selectedStatus])

  // Gerar dias do mês
  const daysInMonth = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [currentMonth])

  // Mapear ausências por dia
  const absencesByDay = React.useMemo(() => {
    const map = new Map<string, AbsenceWithEmployee[]>()

    filteredAbsences.forEach((absence) => {
      const start = new Date(absence.start_date)
      const end = new Date(absence.end_date)

      daysInMonth.forEach((day) => {
        if (day >= start && day <= end) {
          const key = format(day, "yyyy-MM-dd")
          const existing = map.get(key) || []
          map.set(key, [...existing, absence])
        }
      })
    })

    return map
  }, [filteredAbsences, daysInMonth])

  // Calcular estatísticas do mês
  const monthStats = React.useMemo((): MonthStats => {
    const stats: MonthStats = {
      totalDays: 0,
      byType: {} as Record<AbsenceType, number>,
      byStatus: {} as Record<AbsenceStatus, number>,
    }

    filteredAbsences.forEach((absence) => {
      const start = new Date(absence.start_date)
      const end = new Date(absence.end_date)
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Calcular dias dentro do mês
      let days = 0
      let current = start > monthStart ? start : monthStart
      const last = end < monthEnd ? end : monthEnd

      while (current <= last) {
        days++
        current = new Date(current.setDate(current.getDate() + 1))
      }

      stats.totalDays += days
      stats.byType[absence.type] = (stats.byType[absence.type] || 0) + days
      stats.byStatus[absence.status] = (stats.byStatus[absence.status] || 0) + 1
    })

    return stats
  }, [filteredAbsences, currentMonth])

  // Handlers
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDayClick = (date: Date) => {
    const key = format(date, "yyyy-MM-dd")
    const dayAbsences = absencesByDay.get(key) || []

    if (dayAbsences.length === 0) return

    setSelectedDay({ date, absences: dayAbsences })
    setDayModalOpen(true)
  }

  const handleApprove = async (absenceId: string) => {
    const result = await approveAbsence(absenceId)
    if (result.error) {
      toast.error("Erro ao aprovar: " + result.error.message)
      return
    }

    toast.success("Ausência aprovada")

    // Atualizar lista local
    setAbsences((prev) =>
      prev.map((a) => (a.id === absenceId ? { ...a, status: "approved" as AbsenceStatus } : a))
    )

    // Atualizar modal se estiver aberto
    if (selectedDay) {
      setSelectedDay({
        ...selectedDay,
        absences: selectedDay.absences.map((a) =>
          a.id === absenceId ? { ...a, status: "approved" as AbsenceStatus } : a
        ),
      })
    }
  }

  const handleReject = async (absenceId: string) => {
    const reason = prompt("Motivo da rejeição:")
    if (!reason) return

    const result = await rejectAbsence(absenceId, reason)
    if (result.error) {
      toast.error("Erro ao rejeitar: " + result.error.message)
      return
    }

    toast.success("Ausência rejeitada")

    // Atualizar lista local
    setAbsences((prev) =>
      prev.map((a) => (a.id === absenceId ? { ...a, status: "rejected" as AbsenceStatus } : a))
    )

    // Atualizar modal se estiver aberto
    if (selectedDay) {
      setSelectedDay({
        ...selectedDay,
        absences: selectedDay.absences.map((a) =>
          a.id === absenceId ? { ...a, status: "rejected" as AbsenceStatus } : a
        ),
      })
    }
  }

  const handleViewDetails = (absenceId: string) => {
    router.push(`/ausencias/${absenceId}`)
  }

  // Renderizar dia do calendário
  const renderDay = (date: Date) => {
    const key = format(date, "yyyy-MM-dd")
    const dayAbsences = absencesByDay.get(key) || []
    const isCurrentMonth = isSameMonth(date, currentMonth)
    const isTodayDate = isToday(date)

    return (
      <button
        key={key}
        onClick={() => handleDayClick(date)}
        className={cn(
          "relative min-h-20 border p-2 text-left transition-colors hover:bg-accent",
          !isCurrentMonth && "bg-muted/50 text-muted-foreground",
          isTodayDate && "ring-2 ring-primary ring-inset",
          dayAbsences.length > 0 && "cursor-pointer"
        )}
      >
        <div className="text-sm font-medium">{format(date, "d")}</div>

        {dayAbsences.length > 0 && (
          <div className="mt-1 space-y-1">
            {dayAbsences.slice(0, 3).map((absence, idx) => {
              const colors = absenceColors[absence.type]
              return (
                <div
                  key={`${absence.id}-${idx}`}
                  className={cn(
                    "text-xs px-1 py-0.5 rounded border-l-2 truncate",
                    colors.bg,
                    colors.border,
                    colors.text
                  )}
                  title={`${absence.employee_name} - ${absenceTypeLabels[absence.type]}`}
                >
                  <span className="hidden sm:inline">{absence.employee_name}</span>
                  <span className="sm:hidden">{absence.employee_name?.split(" ")[0]}</span>
                </div>
              )
            })}

            {dayAbsences.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayAbsences.length - 3} mais
              </div>
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Ausências</h1>
          <p className="text-muted-foreground">Visualização mensal das ausências da equipe</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="size-4" />
          </Button>

          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="size-4" />
          </Button>

          <Button onClick={() => router.push("/ausencias/novo")}>
            <Plus className="mr-2 size-4" />
            Nova Solicitação
          </Button>

          {/* Botão de filtros para mobile */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <Filter className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendário Principal */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-7 border-t">
                  {/* Cabeçalho dos dias da semana */}
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <div
                      key={day}
                      className="border-r border-b bg-muted p-2 text-center text-sm font-medium last:border-r-0"
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day[0]}</span>
                    </div>
                  ))}

                  {/* Dias do mês */}
                  {daysInMonth.map((date) => renderDay(date))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com estatísticas e filtros - Desktop */}
        <div className="hidden lg:block lg:w-80 space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Ausência</label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AbsenceType | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="sick_leave">Licença Médica</SelectItem>
                    <SelectItem value="time_bank">Banco de Horas</SelectItem>
                    <SelectItem value="compensatory">Folga</SelectItem>
                    <SelectItem value="unjustified">Falta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AbsenceStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedType("all")
                  setSelectedStatus("all")
                }}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>

          {/* Estatísticas do Mês */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas do Mês</CardTitle>
              <CardDescription>
                {filteredAbsences.length} ausência(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de dias</span>
                <span className="text-2xl font-bold">{monthStats.totalDays}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Tipo</p>
                {Object.entries(monthStats.byType)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => {
                    const colors = absenceColors[type as AbsenceType]
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-3 rounded border", colors.bg, colors.border)} />
                          <span>{absenceTypeLabels[type as AbsenceType]}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Status</p>
                {Object.entries(monthStats.byStatus)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span>{statusLabels[status as AbsenceStatus]}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Legenda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: "vacation" as AbsenceType, label: "Férias" },
                { type: "sick_leave" as AbsenceType, label: "Atestado" },
                { type: "time_bank" as AbsenceType, label: "Folga" },
                { type: "unjustified" as AbsenceType, label: "Falta" },
              ].map(({ type, label }) => {
                const colors = absenceColors[type]
                return (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className={cn("size-4 rounded border-2", colors.bg, colors.border)} />
                    <span>{label}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheet para filtros em mobile */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros e Estatísticas</SheetTitle>
            <SheetDescription>
              {filteredAbsences.length} ausência(s) no mês
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Filtros */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Ausência</label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AbsenceType | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="sick_leave">Licença Médica</SelectItem>
                    <SelectItem value="time_bank">Banco de Horas</SelectItem>
                    <SelectItem value="compensatory">Folga</SelectItem>
                    <SelectItem value="unjustified">Falta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as AbsenceStatus | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Estatísticas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de dias</span>
                <span className="text-2xl font-bold">{monthStats.totalDays}</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Por Status</p>
                {Object.entries(monthStats.byStatus)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span>{statusLabels[status as AbsenceStatus]}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de detalhes do dia */}
      <Dialog open={dayModalOpen} onOpenChange={setDayModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ausências - {selectedDay && format(selectedDay.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>
              {selectedDay?.absences.length} ausência(s) neste dia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDay?.absences.map((absence) => {
              const colors = absenceColors[absence.type]
              return (
                <Card key={absence.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header com funcionário */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={absence.employee_photo_url || undefined} />
                            <AvatarFallback>
                              {absence.employee_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{absence.employee_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {absence.employee_department || "Sem departamento"}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            absence.status === "approved"
                              ? "default"
                              : absence.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {statusLabels[absence.status]}
                        </Badge>
                      </div>

                      {/* Tipo e período */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="size-4 text-muted-foreground" />
                          <span className={cn("text-sm font-medium px-2 py-1 rounded", colors.bg, colors.text)}>
                            {absenceTypeLabels[absence.type]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="size-4" />
                          <span>
                            {format(new Date(absence.start_date), "dd/MM/yyyy")} até{" "}
                            {format(new Date(absence.end_date), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>

                      {/* Motivo */}
                      {absence.reason && (
                        <div className="text-sm">
                          <p className="font-medium mb-1">Motivo:</p>
                          <p className="text-muted-foreground">{absence.reason}</p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(absence.id)}
                        >
                          <User className="mr-2 size-4" />
                          Ver Detalhes
                        </Button>

                        {absence.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(absence.id)}
                            >
                              <CheckCircle2 className="mr-2 size-4" />
                              Aprovar
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(absence.id)}
                            >
                              <XCircle className="mr-2 size-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDayModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
