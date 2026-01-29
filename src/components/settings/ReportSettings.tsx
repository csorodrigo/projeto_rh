"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Star } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ReportDefaults } from '@/lib/supabase/queries/settings'

interface ReportSettingsProps {
  defaults: ReportDefaults
  onChange: (defaults: ReportDefaults) => void
  favoriteTemplates: any[]
  activeSchedules: any[]
  onGenerateReport: (templateId: string) => void
  onUnfavorite: (templateId: string) => void
  onDisableSchedule: (scheduleId: string) => Promise<void>
}

export function ReportSettings({
  defaults,
  onChange,
  favoriteTemplates,
  activeSchedules,
  onGenerateReport,
  onUnfavorite,
  onDisableSchedule,
}: ReportSettingsProps) {
  const [reportDefaults, setReportDefaults] = useState(defaults)

  useEffect(() => {
    onChange(reportDefaults)
  }, [reportDefaults])

  const updateDefaults = (
    field: keyof ReportDefaults,
    value: string
  ) => {
    setReportDefaults(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDisableSchedule = async (scheduleId: string) => {
    try {
      await onDisableSchedule(scheduleId)
      toast.success('Agendamento desativado com sucesso')
    } catch (error) {
      toast.error('Erro ao desativar agendamento')
    }
  }

  return (
    <div className="space-y-6">
      {/* Destino Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Destino de Relatórios</CardTitle>
          <CardDescription>
            Configure como você deseja receber relatórios gerados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Destino padrão</Label>
            <RadioGroup
              value={reportDefaults.destination}
              onValueChange={v =>
                updateDefaults('destination', v as ReportDefaults['destination'])
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="download" id="download" />
                <Label htmlFor="download" className="font-normal cursor-pointer">
                  Download direto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="font-normal cursor-pointer">
                  Enviar por email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="storage" id="storage" />
                <Label htmlFor="storage" className="font-normal cursor-pointer">
                  Salvar no storage
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Formato padrão</Label>
            <Select
              value={reportDefaults.format}
              onValueChange={v => updateDefaults('format', v as ReportDefaults['format'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Favoritos */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Favoritos</CardTitle>
          <CardDescription>
            Acesso rápido aos seus templates mais usados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteTemplates.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum template favoritado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {favoriteTemplates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onGenerateReport(template.id)}
                    >
                      Gerar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUnfavorite(template.id)}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Ativos</CardTitle>
          <CardDescription>
            Relatórios configurados para geração automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSchedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum agendamento ativo
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSchedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.template.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.frequency}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(schedule.next_run),
                        "dd/MM/yyyy 'às' HH:mm"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisableSchedule(schedule.id)}
                      >
                        Desativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
