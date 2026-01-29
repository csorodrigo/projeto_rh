"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import type { NotificationPreferences } from '@/lib/supabase/queries/settings'

interface NotificationSettingsProps {
  preferences: NotificationPreferences
  onChange: (preferences: NotificationPreferences) => void
}

const notificationTypes = [
  {
    id: 'import_complete',
    label: 'Importação concluída',
    description: 'Quando uma importação for processada',
  },
  {
    id: 'approval_needed',
    label: 'Aprovação necessária',
    description: 'Quando você precisa aprovar algo',
  },
  {
    id: 'approval_approved',
    label: 'Aprovação concedida',
    description: 'Quando sua solicitação for aprovada',
  },
  {
    id: 'approval_rejected',
    label: 'Aprovação rejeitada',
    description: 'Quando sua solicitação for rejeitada',
  },
  {
    id: 'workflow_assigned',
    label: 'Tarefa atribuída',
    description: 'Quando uma tarefa for atribuída a você',
  },
  {
    id: 'sla_warning',
    label: 'Alerta de SLA',
    description: 'Quando um prazo estiver próximo de vencer',
  },
  {
    id: 'report_ready',
    label: 'Relatório pronto',
    description: 'Quando um relatório for gerado',
  },
]

export function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState(preferences.preferences)
  const [doNotDisturb, setDoNotDisturb] = useState(preferences.doNotDisturb)
  const [digest, setDigest] = useState(preferences.digest)

  useEffect(() => {
    onChange({
      ...preferences,
      preferences: prefs,
      doNotDisturb,
      digest,
    })
  }, [prefs, doNotDisturb, digest])

  const updatePreference = (
    type: string,
    channel: 'inApp' | 'email',
    value: boolean
  ) => {
    setPrefs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value,
      },
    }))
  }

  const sendTestNotification = async () => {
    toast.success('Notificação de teste enviada!', {
      description: 'Verifique seus canais de notificação configurados',
    })
  }

  return (
    <div className="space-y-6">
      {/* Preferências por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais notificações receber e por qual canal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">In-app</TableHead>
                <TableHead className="text-center">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationTypes.map(type => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={prefs[type.id]?.inApp ?? true}
                      onCheckedChange={v => updatePreference(type.id, 'inApp', v)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={prefs[type.id]?.email ?? false}
                      onCheckedChange={v => updatePreference(type.id, 'email', v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Horário de Notificações</CardTitle>
          <CardDescription>
            Configure quando você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo "Não incomodar"</Label>
              <p className="text-sm text-muted-foreground">
                Não enviar notificações fora do horário
              </p>
            </div>
            <Switch
              checked={doNotDisturb.enabled}
              onCheckedChange={v =>
                setDoNotDisturb(prev => ({ ...prev, enabled: v }))
              }
            />
          </div>

          {doNotDisturb.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={doNotDisturb.start}
                  onChange={e =>
                    setDoNotDisturb(prev => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={doNotDisturb.end}
                  onChange={e =>
                    setDoNotDisturb(prev => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digest */}
      <Card>
        <CardHeader>
          <CardTitle>Digest de Notificações</CardTitle>
          <CardDescription>
            Agrupe notificações similares para reduzir interrupções
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frequência de agrupamento</Label>
            <Select
              value={digest.frequency}
              onValueChange={v =>
                setDigest(prev => ({
                  ...prev,
                  frequency: v as NotificationPreferences['digest']['frequency'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Tempo real (sem agrupamento)</SelectItem>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="daily">Diário (manhã)</SelectItem>
                <SelectItem value="weekly">Semanal (segunda-feira)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Agrupar notificações similares para enviar em lote
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Testar Notificações</CardTitle>
          <CardDescription>
            Envie uma notificação de teste para verificar suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={sendTestNotification}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Notificação de Teste
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
