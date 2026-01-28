"use client"

import * as React from "react"
import {
  Clock,
  Save,
  Loader2,
  MapPin,
  Calendar,
  Timer,
  AlertCircle,
  Plus,
  Trash2,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getCurrentProfile } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"

// Types
interface WorkScheduleConfig {
  id: string
  name: string
  description: string | null
  schedule_type: 'fixed' | 'shift' | 'flexible' | 'intermittent' | 'remote' | 'hybrid'
  weekly_hours: number
  daily_hours: number
  break_duration_minutes: number
  tolerance_minutes: number
  time_bank_enabled: boolean
  is_default: boolean
  is_active: boolean
  overtime_rules: {
    daily_limit_minutes?: number
    weekly_limit_minutes?: number
    multiplier_50?: number
    multiplier_100?: number
    requires_approval?: boolean
    auto_approve_limit?: number
  }
  night_shift_config: {
    start_time?: string
    end_time?: string
    multiplier?: number
    hour_reduction?: boolean
  }
  flexibility_config: {
    core_hours_start?: string
    core_hours_end?: string
    flex_window_start?: string
    flex_window_end?: string
    min_daily_hours?: number
  }
}

interface ScheduleWeekday {
  id: string
  schedule_id: string
  weekday: string
  is_workday: boolean
  start_time: string | null
  end_time: string | null
  break_start: string | null
  break_end: string | null
  expected_hours: number | null
}

const WEEKDAYS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terca-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' },
]

const SCHEDULE_TYPES = [
  { value: 'fixed', label: 'Jornada Fixa' },
  { value: 'shift', label: 'Turno/Escala' },
  { value: 'flexible', label: 'Horario Flexivel' },
  { value: 'hybrid', label: 'Hibrido' },
  { value: 'remote', label: 'Remoto' },
]

export default function PontoConfiguracoesPage() {
  // Lazy initialization of Supabase client to avoid SSR issues
  const supabaseRef = React.useRef<ReturnType<typeof createClient> | null>(null)
  const getSupabase = React.useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [schedules, setSchedules] = React.useState<WorkScheduleConfig[]>([])
  const [selectedSchedule, setSelectedSchedule] = React.useState<WorkScheduleConfig | null>(null)
  const [weekdays, setWeekdays] = React.useState<ScheduleWeekday[]>([])

  // Form state for general settings
  const [generalConfig, setGeneralConfig] = React.useState({
    tolerance_minutes: 10,
    break_duration_minutes: 60,
    overtime_daily_limit: 120,
    overtime_weekly_limit: 600,
    overtime_multiplier_50: 1.5,
    overtime_multiplier_100: 2.0,
    overtime_requires_approval: true,
    overtime_auto_approve_limit: 30,
    night_shift_start: "22:00",
    night_shift_end: "05:00",
    night_shift_multiplier: 1.2,
    time_bank_enabled: true,
    geolocation_enabled: false,
    geolocation_radius: 100,
  })

  // Load data
  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          setIsLoading(false)
          return
        }

        const cid = profileResult.data.company_id
        setCompanyId(cid)

        // Load work schedules
        const { data: schedulesData, error: schedulesError } = await getSupabase()
          .from('work_schedules')
          .select('*')
          .eq('company_id', cid)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('name')

        if (schedulesError) {
          console.error('Error loading schedules:', schedulesError)
        } else if (schedulesData && schedulesData.length > 0) {
          const typedSchedules = schedulesData as unknown as WorkScheduleConfig[]
          setSchedules(typedSchedules)
          const defaultSchedule = typedSchedules.find(s => s.is_default) || typedSchedules[0]
          setSelectedSchedule(defaultSchedule)

          // Update general config from default schedule
          if (defaultSchedule) {
            const schedule = defaultSchedule as WorkScheduleConfig
            setGeneralConfig(prev => ({
              ...prev,
              tolerance_minutes: schedule.tolerance_minutes || 10,
              break_duration_minutes: schedule.break_duration_minutes || 60,
              overtime_daily_limit: schedule.overtime_rules?.daily_limit_minutes || 120,
              overtime_weekly_limit: schedule.overtime_rules?.weekly_limit_minutes || 600,
              overtime_multiplier_50: schedule.overtime_rules?.multiplier_50 || 1.5,
              overtime_multiplier_100: schedule.overtime_rules?.multiplier_100 || 2.0,
              overtime_requires_approval: schedule.overtime_rules?.requires_approval ?? true,
              overtime_auto_approve_limit: schedule.overtime_rules?.auto_approve_limit || 30,
              night_shift_start: schedule.night_shift_config?.start_time || "22:00",
              night_shift_end: schedule.night_shift_config?.end_time || "05:00",
              night_shift_multiplier: schedule.night_shift_config?.multiplier || 1.2,
              time_bank_enabled: schedule.time_bank_enabled ?? true,
            }))

            // Load weekdays for selected schedule
            loadWeekdays(defaultSchedule.id)
          }
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error("Erro ao carregar configuracoes")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [getSupabase])

  const loadWeekdays = async (scheduleId: string) => {
    const { data, error } = await getSupabase()
      .from('schedule_weekdays')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('weekday')

    if (error) {
      console.error('Error loading weekdays:', error)
    } else {
      setWeekdays(data as ScheduleWeekday[] || [])
    }
  }

  const handleScheduleSelect = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule) {
      setSelectedSchedule(schedule)
      await loadWeekdays(scheduleId)
    }
  }

  const handleSaveGeneralConfig = async () => {
    if (!companyId || !selectedSchedule) return

    setIsSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (getSupabase() as any)
        .from('work_schedules')
        .update({
          tolerance_minutes: generalConfig.tolerance_minutes,
          break_duration_minutes: generalConfig.break_duration_minutes,
          time_bank_enabled: generalConfig.time_bank_enabled,
          overtime_rules: {
            daily_limit_minutes: generalConfig.overtime_daily_limit,
            weekly_limit_minutes: generalConfig.overtime_weekly_limit,
            multiplier_50: generalConfig.overtime_multiplier_50,
            multiplier_100: generalConfig.overtime_multiplier_100,
            requires_approval: generalConfig.overtime_requires_approval,
            auto_approve_limit: generalConfig.overtime_auto_approve_limit,
          },
          night_shift_config: {
            start_time: generalConfig.night_shift_start,
            end_time: generalConfig.night_shift_end,
            multiplier: generalConfig.night_shift_multiplier,
            hour_reduction: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSchedule.id)

      if (error) {
        throw error
      }

      toast.success("Configuracoes salvas com sucesso!")

      // Update local state
      setSchedules(prev => prev.map(s =>
        s.id === selectedSchedule.id
          ? {
              ...s,
              tolerance_minutes: generalConfig.tolerance_minutes,
              break_duration_minutes: generalConfig.break_duration_minutes,
              time_bank_enabled: generalConfig.time_bank_enabled,
            }
          : s
      ))
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error("Erro ao salvar configuracoes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!companyId) return

    setIsSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (getSupabase() as any)
        .from('work_schedules')
        .insert({
          company_id: companyId,
          name: 'Nova Jornada',
          schedule_type: 'fixed',
          weekly_hours: 44,
          daily_hours: 8,
          break_duration_minutes: 60,
          tolerance_minutes: 10,
          is_default: schedules.length === 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Jornada criada!")
      setSchedules(prev => [...prev, data as WorkScheduleConfig])
      setSelectedSchedule(data as WorkScheduleConfig)
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error("Erro ao criar jornada")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateWeekday = async (weekdayData: ScheduleWeekday) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (getSupabase() as any)
        .from('schedule_weekdays')
        .upsert({
          ...weekdayData,
          schedule_id: selectedSchedule?.id,
        })

      if (error) throw error

      toast.success("Horario atualizado!")
      if (selectedSchedule) {
        await loadWeekdays(selectedSchedule.id)
      }
    } catch (error) {
      console.error('Error updating weekday:', error)
      toast.error("Erro ao atualizar horario")
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes de Ponto</h1>
        <p className="text-muted-foreground">
          Configure as regras de marcacao de ponto e jornadas de trabalho
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:flex lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Clock className="size-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Jornadas</span>
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-2">
            <Timer className="size-4" />
            <span className="hidden sm:inline">Hora Extra</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="gap-2">
            <MapPin className="size-4" />
            <span className="hidden sm:inline">Localizacao</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes Gerais</CardTitle>
              <CardDescription>
                Defina os parametros basicos de marcacao de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tolerance">Tolerancia de Atraso (minutos)</Label>
                  <Input
                    id="tolerance"
                    type="number"
                    min={0}
                    max={30}
                    value={generalConfig.tolerance_minutes}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      tolerance_minutes: parseInt(e.target.value) || 0
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo permitido de atraso sem desconto (art. 58 CLT: ate 10 min)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="break">Intervalo Minimo (minutos)</Label>
                  <Input
                    id="break"
                    type="number"
                    min={15}
                    max={120}
                    value={generalConfig.break_duration_minutes}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      break_duration_minutes: parseInt(e.target.value) || 60
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Duracao minima do intervalo intrajornada (CLT: 1h para +6h)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Adicional Noturno</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="night_start">Inicio Hora Noturna</Label>
                    <Input
                      id="night_start"
                      type="time"
                      value={generalConfig.night_shift_start}
                      onChange={(e) => setGeneralConfig(prev => ({
                        ...prev,
                        night_shift_start: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="night_end">Fim Hora Noturna</Label>
                    <Input
                      id="night_end"
                      type="time"
                      value={generalConfig.night_shift_end}
                      onChange={(e) => setGeneralConfig(prev => ({
                        ...prev,
                        night_shift_end: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="night_mult">Adicional (%)</Label>
                    <Input
                      id="night_mult"
                      type="number"
                      step="0.01"
                      value={(generalConfig.night_shift_multiplier - 1) * 100}
                      onChange={(e) => setGeneralConfig(prev => ({
                        ...prev,
                        night_shift_multiplier: 1 + (parseFloat(e.target.value) || 0) / 100
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      CLT: minimo 20%
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Banco de Horas</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar sistema de banco de horas
                  </p>
                </div>
                <Switch
                  checked={generalConfig.time_bank_enabled}
                  onCheckedChange={(checked) => setGeneralConfig(prev => ({
                    ...prev,
                    time_bank_enabled: checked
                  }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralConfig} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Salvar Configuracoes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules */}
        <TabsContent value="schedules">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Schedule List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jornadas</CardTitle>
                <CardDescription>
                  Selecione ou crie uma jornada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedules.map((schedule) => (
                  <Button
                    key={schedule.id}
                    variant={selectedSchedule?.id === schedule.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleScheduleSelect(schedule.id)}
                  >
                    <Clock className="mr-2 size-4" />
                    {schedule.name}
                    {schedule.is_default && (
                      <Badge variant="secondary" className="ml-auto">
                        Padrao
                      </Badge>
                    )}
                  </Button>
                ))}

                <Separator className="my-2" />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCreateSchedule}
                  disabled={isSaving}
                >
                  <Plus className="mr-2 size-4" />
                  Nova Jornada
                </Button>
              </CardContent>
            </Card>

            {/* Schedule Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedSchedule?.name || "Selecione uma jornada"}
                </CardTitle>
                <CardDescription>
                  Configure os horarios de trabalho por dia da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSchedule ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome da Jornada</Label>
                        <Input
                          value={selectedSchedule.name}
                          onChange={(e) => setSelectedSchedule(prev =>
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={selectedSchedule.schedule_type}
                          onValueChange={(value) => setSelectedSchedule(prev =>
                            prev ? { ...prev, schedule_type: value as WorkScheduleConfig['schedule_type'] } : null
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEDULE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4">Horarios por Dia</h4>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden border rounded-lg">
                            <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dia</TableHead>
                            <TableHead>Trabalho</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Saida</TableHead>
                            <TableHead>Int. Inicio</TableHead>
                            <TableHead>Int. Fim</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {WEEKDAYS.map((day) => {
                            const weekdayData = weekdays.find(w => w.weekday === day.value)
                            return (
                              <TableRow key={day.value}>
                                <TableCell className="font-medium">
                                  {day.label}
                                </TableCell>
                                <TableCell>
                                  <Switch
                                    checked={weekdayData?.is_workday ?? (day.value !== 'sunday')}
                                    onCheckedChange={(checked) => {
                                      const newData: ScheduleWeekday = {
                                        id: weekdayData?.id || crypto.randomUUID(),
                                        schedule_id: selectedSchedule.id,
                                        weekday: day.value,
                                        is_workday: checked,
                                        start_time: weekdayData?.start_time || '08:00',
                                        end_time: weekdayData?.end_time || '17:00',
                                        break_start: weekdayData?.break_start || '12:00',
                                        break_end: weekdayData?.break_end || '13:00',
                                        expected_hours: 8,
                                      }
                                      handleUpdateWeekday(newData)
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    className="w-full min-w-[100px] max-w-[120px]"
                                    defaultValue={weekdayData?.start_time || '08:00'}
                                    disabled={!weekdayData?.is_workday && day.value === 'sunday'}
                                    onBlur={(e) => {
                                      if (weekdayData) {
                                        handleUpdateWeekday({
                                          ...weekdayData,
                                          start_time: e.target.value,
                                        })
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    className="w-full min-w-[100px] max-w-[120px]"
                                    defaultValue={weekdayData?.end_time || '17:00'}
                                    disabled={!weekdayData?.is_workday && day.value === 'sunday'}
                                    onBlur={(e) => {
                                      if (weekdayData) {
                                        handleUpdateWeekday({
                                          ...weekdayData,
                                          end_time: e.target.value,
                                        })
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    className="w-full min-w-[100px] max-w-[120px]"
                                    defaultValue={weekdayData?.break_start || '12:00'}
                                    disabled={!weekdayData?.is_workday && day.value === 'sunday'}
                                    onBlur={(e) => {
                                      if (weekdayData) {
                                        handleUpdateWeekday({
                                          ...weekdayData,
                                          break_start: e.target.value,
                                        })
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="time"
                                    className="w-full min-w-[100px] max-w-[120px]"
                                    defaultValue={weekdayData?.break_end || '13:00'}
                                    disabled={!weekdayData?.is_workday && day.value === 'sunday'}
                                    onBlur={(e) => {
                                      if (weekdayData) {
                                        handleUpdateWeekday({
                                          ...weekdayData,
                                          break_end: e.target.value,
                                        })
                                      }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto size-10 opacity-50 mb-2" />
                    <p>Selecione ou crie uma jornada para configurar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overtime Settings */}
        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes de Hora Extra</CardTitle>
              <CardDescription>
                Defina as regras para calculo e aprovacao de horas extras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ot_daily">Limite Diario (minutos)</Label>
                  <Input
                    id="ot_daily"
                    type="number"
                    min={0}
                    value={generalConfig.overtime_daily_limit}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      overtime_daily_limit: parseInt(e.target.value) || 0
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximo de hora extra diaria permitida (CLT: 2h)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot_weekly">Limite Semanal (minutos)</Label>
                  <Input
                    id="ot_weekly"
                    type="number"
                    min={0}
                    value={generalConfig.overtime_weekly_limit}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      overtime_weekly_limit: parseInt(e.target.value) || 0
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximo de hora extra semanal permitida
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot_50">Adicional 50% (multiplicador)</Label>
                  <Input
                    id="ot_50"
                    type="number"
                    step="0.1"
                    min={1}
                    value={generalConfig.overtime_multiplier_50}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      overtime_multiplier_50: parseFloat(e.target.value) || 1.5
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hora extra em dias uteis (CLT: minimo 50%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot_100">Adicional 100% (multiplicador)</Label>
                  <Input
                    id="ot_100"
                    type="number"
                    step="0.1"
                    min={1}
                    value={generalConfig.overtime_multiplier_100}
                    onChange={(e) => setGeneralConfig(prev => ({
                      ...prev,
                      overtime_multiplier_100: parseFloat(e.target.value) || 2.0
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hora extra em domingos e feriados
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir Aprovacao</Label>
                    <p className="text-sm text-muted-foreground">
                      Hora extra precisa de aprovacao do gestor
                    </p>
                  </div>
                  <Switch
                    checked={generalConfig.overtime_requires_approval}
                    onCheckedChange={(checked) => setGeneralConfig(prev => ({
                      ...prev,
                      overtime_requires_approval: checked
                    }))}
                  />
                </div>

                {generalConfig.overtime_requires_approval && (
                  <div className="space-y-2">
                    <Label htmlFor="ot_auto">Auto-aprovar ate (minutos)</Label>
                    <Input
                      id="ot_auto"
                      type="number"
                      min={0}
                      max={120}
                      className="w-40"
                      value={generalConfig.overtime_auto_approve_limit}
                      onChange={(e) => setGeneralConfig(prev => ({
                        ...prev,
                        overtime_auto_approve_limit: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Horas extras abaixo deste limite sao aprovadas automaticamente
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralConfig} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Salvar Configuracoes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Settings */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes de Localizacao</CardTitle>
              <CardDescription>
                Configure a validacao por geolocalizacao para marcacao de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-muted-foreground" />
                    <Label className="text-base">Validacao por Geolocalizacao</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Exigir que o funcionario esteja em local autorizado para marcar ponto
                  </p>
                </div>
                <Switch
                  checked={generalConfig.geolocation_enabled}
                  onCheckedChange={(checked) => setGeneralConfig(prev => ({
                    ...prev,
                    geolocation_enabled: checked
                  }))}
                />
              </div>

              {generalConfig.geolocation_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="geo_radius">Raio de Tolerancia (metros)</Label>
                    <Input
                      id="geo_radius"
                      type="number"
                      min={10}
                      max={1000}
                      className="w-40"
                      value={generalConfig.geolocation_radius}
                      onChange={(e) => setGeneralConfig(prev => ({
                        ...prev,
                        geolocation_radius: parseInt(e.target.value) || 100
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Distancia maxima do local de trabalho permitida
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Configuracao de Locais</p>
                        <p className="text-sm text-muted-foreground">
                          Para adicionar locais autorizados, acesse a pagina de Funcionarios
                          e configure o local de trabalho de cada colaborador.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralConfig} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Salvar Configuracoes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
