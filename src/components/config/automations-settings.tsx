"use client"

import { useState } from 'react'
import { Bell, Mail, Calendar, FileText, Users, Clock } from 'lucide-react'
import { AutomationCard } from '@/components/config/automation-card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Automation {
  id: string
  icon: typeof Bell
  title: string
  description: string
  enabled: boolean
}

export function AutomationsSettings() {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: 'email-ausencia',
      icon: Mail,
      title: 'Notificação de ausências por e-mail',
      description: 'Enviar e-mail automático quando um funcionário registrar uma ausência ou solicitar férias.',
      enabled: true,
    },
    {
      id: 'lembrete-ponto',
      icon: Clock,
      title: 'Lembrete de registro de ponto',
      description: 'Enviar notificação para funcionários que esqueceram de registrar entrada ou saída.',
      enabled: true,
    },
    {
      id: 'aprovacao-ausencia',
      icon: Calendar,
      title: 'Aprovação automática de ausências',
      description: 'Aprovar automaticamente ausências de meio período quando houver saldo disponível.',
      enabled: false,
    },
    {
      id: 'aniversario',
      icon: Users,
      title: 'Mensagem de aniversário',
      description: 'Enviar mensagem automática de felicitações no dia do aniversário do funcionário.',
      enabled: true,
    },
    {
      id: 'documentos-vencimento',
      icon: FileText,
      title: 'Alerta de documentos vencidos',
      description: 'Notificar RH quando documentos de funcionários estiverem próximos do vencimento (30 dias).',
      enabled: true,
    },
    {
      id: 'relatorio-mensal',
      icon: Bell,
      title: 'Relatório mensal automático',
      description: 'Gerar e enviar relatório consolidado de ponto e ausências no último dia de cada mês.',
      enabled: false,
    },
  ])

  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (id: string, enabled: boolean) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, enabled } : auto
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    // TODO: Salvar no backend
    toast.success('Automações atualizadas com sucesso')
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Automações</h2>
        <p className="text-sm text-muted-foreground">
          Configure ações automáticas do sistema
        </p>
      </div>

      <div className="space-y-4">
        {automations.map((automation) => (
          <AutomationCard
            key={automation.id}
            icon={automation.icon}
            title={automation.title}
            description={automation.description}
            enabled={automation.enabled}
            onToggle={(enabled) => handleToggle(automation.id, enabled)}
          />
        ))}
      </div>

      {hasChanges && (
        <div className="flex justify-end sticky bottom-6">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  )
}
