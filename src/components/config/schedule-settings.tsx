"use client"

import * as React from "react"
import { Plus, Clock, Edit2, Trash2, Save } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WorkSchedule {
  id: string
  name: string
  weekDays: {
    day: string
    start: string
    end: string
    breakStart?: string
    breakEnd?: string
    active: boolean
  }[]
  tolerance: number
  overtimeStart: number
}

const WEEK_DAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
]

export function ScheduleSettings() {
  const [schedules, setSchedules] = React.useState<WorkSchedule[]>([
    {
      id: "1",
      name: "Jornada Comercial",
      weekDays: [
        {
          day: "Segunda a Sexta",
          start: "08:00",
          end: "17:00",
          breakStart: "12:00",
          breakEnd: "13:00",
          active: true,
        },
      ],
      tolerance: 10,
      overtimeStart: 30,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [tolerance, setTolerance] = React.useState(10)
  const [overtimeStart, setOvertimeStart] = React.useState(30)
  const [nightShiftStart, setNightShiftStart] = React.useState("22:00")

  const handleSaveTolerances = () => {
    toast.success("Configurações de tolerância salvas!")
  }

  return (
    <div className="space-y-6">
      {/* Lista de Jornadas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Jornadas de Trabalho</h3>
          <p className="text-sm text-muted-foreground">
            Configure os horários de trabalho da empresa
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Nova Jornada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Jornada de Trabalho</DialogTitle>
              <DialogDescription>
                Configure os horários de trabalho por dia da semana
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Jornada</Label>
                <Input placeholder="Ex: Jornada Comercial" />
              </div>
              <div className="space-y-3">
                {WEEK_DAYS.map(day => (
                  <div
                    key={day.value}
                    className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] gap-2 items-center"
                  >
                    <Label className="text-sm">{day.label}</Label>
                    <Input type="time" placeholder="Entrada" />
                    <Input type="time" placeholder="Saída" />
                    <Input type="time" placeholder="Intervalo início" />
                    <Input type="time" placeholder="Intervalo fim" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  <Save className="mr-2 size-4" />
                  Salvar Jornada
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Jornadas */}
      <div className="grid gap-4 md:grid-cols-2">
        {schedules.map(schedule => (
          <Card key={schedule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{schedule.name}</CardTitle>
                  <CardDescription>
                    Tolerância: {schedule.tolerance} min | Hora Extra:{" "}
                    {schedule.overtimeStart} min
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8">
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule.weekDays.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{day.day}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {day.start} - {day.end}
                      </Badge>
                      {day.breakStart && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {day.breakStart} - {day.breakEnd}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configurações de Tolerância */}
      <Card>
        <CardHeader>
          <CardTitle>Tolerâncias e Regras</CardTitle>
          <CardDescription>
            Configure as regras de marcação de ponto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tolerance">
                Tolerância de Atraso (minutos)
              </Label>
              <Input
                id="tolerance"
                type="number"
                value={tolerance}
                onChange={e => setTolerance(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Atrasos dentro deste limite não serão computados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime">
                Hora Extra - Início (minutos após jornada)
              </Label>
              <Input
                id="overtime"
                type="number"
                value={overtimeStart}
                onChange={e => setOvertimeStart(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Tempo adicional para considerar como hora extra
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="night-shift">Hora Noturna - Início</Label>
              <Input
                id="night-shift"
                type="time"
                value={nightShiftStart}
                onChange={e => setNightShiftStart(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Horário de início do adicional noturno
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="break-min">Intervalo Mínimo (minutos)</Label>
              <Input id="break-min" type="number" defaultValue="60" />
              <p className="text-xs text-muted-foreground">
                Tempo mínimo obrigatório de intervalo
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveTolerances}>
              <Save className="mr-2 size-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banco de Horas */}
      <Card>
        <CardHeader>
          <CardTitle>Banco de Horas</CardTitle>
          <CardDescription>
            Configure as regras do banco de horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank-enabled">Sistema de Banco de Horas</Label>
              <Select defaultValue="enabled">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Habilitado</SelectItem>
                  <SelectItem value="disabled">Desabilitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-limit">Limite Mensal (horas)</Label>
              <Input id="bank-limit" type="number" defaultValue="10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-validity">Validade (meses)</Label>
              <Input id="bank-validity" type="number" defaultValue="12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-compensation">Compensação</Label>
              <Select defaultValue="automatic">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="approval">Com Aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
