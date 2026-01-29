"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { WorkflowRules, DepartmentRule } from '@/lib/supabase/queries/settings'

interface WorkflowSettingsProps {
  rules: WorkflowRules
  onChange: (rules: WorkflowRules) => void
  departments: Array<{ id: string; name: string }>
  managers: Array<{ id: string; name: string }>
  hrManagers: Array<{ id: string; name: string }>
  activeDelegations: any[]
  onRevokeDelegation: (id: string) => Promise<void>
}

export function WorkflowSettings({
  rules,
  onChange,
  departments,
  managers,
  hrManagers,
  activeDelegations,
  onRevokeDelegation,
}: WorkflowSettingsProps) {
  const [workflowRules, setWorkflowRules] = useState(rules.rules)
  const [sla, setSLA] = useState(rules.sla)

  useEffect(() => {
    onChange({
      ...rules,
      rules: workflowRules,
      sla,
    })
  }, [workflowRules, sla])

  const updateRule = (
    deptId: string,
    field: keyof DepartmentRule,
    value: string | number
  ) => {
    setWorkflowRules(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [field]: value,
      },
    }))
  }

  const handleRevokeDelegation = async (id: string) => {
    try {
      await onRevokeDelegation(id)
      toast.success('Delegação revogada com sucesso')
    } catch (error) {
      toast.error('Erro ao revogar delegação')
    }
  }

  return (
    <div className="space-y-6">
      {/* Regras por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Aprovação</CardTitle>
          <CardDescription>
            Configure workflow de aprovação por departamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departamento</TableHead>
                <TableHead>Aprovador Nível 1</TableHead>
                <TableHead>Aprovador Nível 2</TableHead>
                <TableHead>SLA (horas)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <Select
                      value={workflowRules[dept.id]?.level1 || ''}
                      onValueChange={v => updateRule(dept.id, 'level1', v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={workflowRules[dept.id]?.level2 || 'none'}
                      onValueChange={v => updateRule(dept.id, 'level2', v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {hrManagers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={workflowRules[dept.id]?.sla ?? 24}
                      onChange={e =>
                        updateRule(dept.id, 'sla', parseInt(e.target.value) || 24)
                      }
                      className="w-20"
                      min="1"
                      max="168"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SLA e Escalonamento */}
      <Card>
        <CardHeader>
          <CardTitle>SLA e Escalonamento</CardTitle>
          <CardDescription>
            Configure alertas e escalonamento automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar alertas de SLA</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando aprovação estiver atrasada
              </p>
            </div>
            <Switch
              checked={sla.alertsEnabled}
              onCheckedChange={v => setSLA(prev => ({ ...prev, alertsEnabled: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Escalonamento automático</Label>
              <p className="text-sm text-muted-foreground">
                Escalar para superior se SLA vencer
              </p>
            </div>
            <Switch
              checked={sla.escalateEnabled}
              onCheckedChange={v => setSLA(prev => ({ ...prev, escalateEnabled: v }))}
            />
          </div>

          {sla.escalateEnabled && (
            <div className="space-y-2">
              <Label>Escalar após (horas)</Label>
              <Input
                type="number"
                value={sla.escalateAfter}
                onChange={e =>
                  setSLA(prev => ({
                    ...prev,
                    escalateAfter: parseInt(e.target.value) || 24,
                  }))
                }
                min="1"
                max="168"
              />
              <p className="text-sm text-muted-foreground">
                Tempo após vencimento do SLA para escalar automaticamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegações Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Delegações Ativas</CardTitle>
          <CardDescription>
            Delegações de aprovação temporárias em vigor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeDelegations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma delegação ativa no momento
            </p>
          ) : (
            <div className="space-y-2">
              {activeDelegations.map(delegation => (
                <div
                  key={delegation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={delegation.from_user.avatar_url} />
                      <AvatarFallback>
                        {delegation.from_user.nome
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{delegation.from_user.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Delegou para {delegation.to_user.nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {format(new Date(delegation.start_date), 'dd/MM')} -{' '}
                      {format(new Date(delegation.end_date), 'dd/MM')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeDelegation(delegation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
