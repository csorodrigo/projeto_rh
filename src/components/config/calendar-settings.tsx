"use client"

import * as React from "react"
import { Plus, Calendar as CalendarIcon, Download, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Holiday {
  id: string
  name: string
  date: Date
  isActive: boolean
  isRecurring: boolean
}

export function CalendarSettings() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([
    {
      id: "1",
      name: "Ano Novo",
      date: new Date(2024, 0, 1),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "2",
      name: "Carnaval",
      date: new Date(2024, 1, 13),
      isActive: true,
      isRecurring: false,
    },
    {
      id: "3",
      name: "Sexta-feira Santa",
      date: new Date(2024, 2, 29),
      isActive: true,
      isRecurring: false,
    },
    {
      id: "4",
      name: "Tiradentes",
      date: new Date(2024, 3, 21),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "5",
      name: "Dia do Trabalho",
      date: new Date(2024, 4, 1),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "6",
      name: "Independência do Brasil",
      date: new Date(2024, 8, 7),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "7",
      name: "Nossa Senhora Aparecida",
      date: new Date(2024, 9, 12),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "8",
      name: "Finados",
      date: new Date(2024, 10, 2),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "9",
      name: "Proclamação da República",
      date: new Date(2024, 10, 15),
      isActive: true,
      isRecurring: true,
    },
    {
      id: "10",
      name: "Natal",
      date: new Date(2024, 11, 25),
      isActive: true,
      isRecurring: true,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newHoliday, setNewHoliday] = React.useState({
    name: "",
    date: new Date(),
    isRecurring: false,
  })

  const handleToggleHoliday = (id: string) => {
    setHolidays(prev =>
      prev.map(h => (h.id === id ? { ...h, isActive: !h.isActive } : h))
    )
    toast.success("Feriado atualizado!")
  }

  const handleDeleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id))
    toast.success("Feriado removido!")
  }

  const handleAddHoliday = () => {
    const holiday: Holiday = {
      id: Date.now().toString(),
      name: newHoliday.name,
      date: newHoliday.date,
      isActive: true,
      isRecurring: newHoliday.isRecurring,
    }
    setHolidays(prev => [...prev, holiday])
    setIsDialogOpen(false)
    setNewHoliday({ name: "", date: new Date(), isRecurring: false })
    toast.success("Feriado adicionado!")
  }

  const handleImportNationalHolidays = () => {
    toast.success("Feriados nacionais importados!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Calendário de Feriados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os feriados e dias não úteis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportNationalHolidays}>
            <Download className="mr-2 size-4" />
            Importar Nacionais
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Novo Feriado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Feriado</DialogTitle>
                <DialogDescription>
                  Configure um novo feriado ou data especial
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="holiday-name">Nome do Feriado</Label>
                  <Input
                    id="holiday-name"
                    placeholder="Ex: Dia da Empresa"
                    value={newHoliday.name}
                    onChange={e =>
                      setNewHoliday(prev => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHoliday.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {newHoliday.date ? (
                          format(newHoliday.date, "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newHoliday.date}
                        onSelect={date =>
                          date &&
                          setNewHoliday(prev => ({ ...prev, date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Feriado Recorrente</Label>
                    <p className="text-xs text-muted-foreground">
                      Repetir anualmente
                    </p>
                  </div>
                  <Switch
                    checked={newHoliday.isRecurring}
                    onCheckedChange={checked =>
                      setNewHoliday(prev => ({ ...prev, isRecurring: checked }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddHoliday}
                    disabled={!newHoliday.name}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Feriados */}
      <Card>
        <CardHeader>
          <CardTitle>Feriados Cadastrados</CardTitle>
          <CardDescription>
            {holidays.filter(h => h.isActive).length} de {holidays.length}{" "}
            feriados ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holidays
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map(holiday => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-md flex items-center justify-center font-semibold text-sm",
                        holiday.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {format(holiday.date, "dd/MM")}
                    </div>
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(holiday.date, "EEEE, dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                        {holiday.isRecurring && " • Recorrente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={holiday.isActive}
                      onCheckedChange={() => handleToggleHoliday(holiday.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Calendário</CardTitle>
          <CardDescription>
            Personalize o comportamento do calendário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Considerar Sábados como Dia Útil</Label>
              <p className="text-xs text-muted-foreground">
                Sábados contarão para cálculo de dias úteis
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compensação em Feriados</Label>
              <p className="text-xs text-muted-foreground">
                Permitir trabalho em feriados com compensação
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificar Feriados Próximos</Label>
              <p className="text-xs text-muted-foreground">
                Enviar notificações 3 dias antes
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
