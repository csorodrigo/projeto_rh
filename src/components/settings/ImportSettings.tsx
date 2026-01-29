"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { ImportSettings as ImportSettingsType, ColumnMapping } from '@/lib/supabase/queries/settings'

interface ImportSettingsProps {
  settings: ImportSettingsType
  onChange: (settings: ImportSettingsType) => void
}

export function ImportSettings({ settings, onChange }: ImportSettingsProps) {
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(settings.columnMappings)
  const [rules, setRules] = useState(settings.validationRules)
  const [autoApprove, setAutoApprove] = useState(settings.autoApprove)
  const [newAlternativeName, setNewAlternativeName] = useState<Record<string, string>>({})

  useEffect(() => {
    onChange({
      columnMappings,
      validationRules: rules,
      autoApprove,
    })
  }, [columnMappings, rules, autoApprove])

  const updateMapping = (field: string, names: string[]) => {
    setColumnMappings(prev =>
      prev.map(m => (m.field === field ? { ...m, alternativeNames: names } : m))
    )
  }

  const addAlternativeName = (field: string) => {
    const name = newAlternativeName[field]?.trim()
    if (!name) return

    const mapping = columnMappings.find(m => m.field === field)
    if (!mapping) return

    if (!mapping.alternativeNames.includes(name)) {
      updateMapping(field, [...mapping.alternativeNames, name])
    }
    setNewAlternativeName(prev => ({ ...prev, [field]: '' }))
  }

  const removeAlternativeName = (field: string, name: string) => {
    const mapping = columnMappings.find(m => m.field === field)
    if (!mapping) return

    updateMapping(
      field,
      mapping.alternativeNames.filter(n => n !== name)
    )
  }

  const updateRule = (key: keyof typeof rules, value: boolean) => {
    setRules(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Mapeamento de Colunas */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamento Padrão de Colunas</CardTitle>
          <CardDescription>
            Configure nomes alternativos para colunas de importação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {columnMappings.map(mapping => (
            <div key={mapping.field} className="space-y-2">
              <div>
                <Label className="text-base">{mapping.label}</Label>
                <p className="text-sm text-muted-foreground">{mapping.field}</p>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar nome alternativo..."
                    value={newAlternativeName[mapping.field] || ''}
                    onChange={e =>
                      setNewAlternativeName(prev => ({
                        ...prev,
                        [mapping.field]: e.target.value,
                      }))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAlternativeName(mapping.field)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addAlternativeName(mapping.field)}
                    disabled={!newAlternativeName[mapping.field]?.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                {mapping.alternativeNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mapping.alternativeNames.map(name => (
                      <Badge key={name} variant="secondary" className="gap-1">
                        {name}
                        <button
                          type="button"
                          onClick={() => removeAlternativeName(mapping.field, name)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Aceitar também estes nomes de coluna durante a importação
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validações Customizadas */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Validação</CardTitle>
          <CardDescription>
            Configure regras de validação para importação de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>CPF obrigatório</Label>
              <p className="text-sm text-muted-foreground">
                Bloquear importação se CPF ausente ou inválido
              </p>
            </div>
            <Switch
              checked={rules.cpfRequired}
              onCheckedChange={v => updateRule('cpfRequired', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email obrigatório</Label>
              <p className="text-sm text-muted-foreground">
                Bloquear importação se email ausente ou inválido
              </p>
            </div>
            <Switch
              checked={rules.emailRequired}
              onCheckedChange={v => updateRule('emailRequired', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloquear duplicados</Label>
              <p className="text-sm text-muted-foreground">
                Rejeitar linhas com CPF/email já cadastrado
              </p>
            </div>
            <Switch
              checked={rules.blockDuplicates}
              onCheckedChange={v => updateRule('blockDuplicates', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-aprovação */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-aprovação</CardTitle>
          <CardDescription>
            Configure aprovação automática para importações pequenas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aprovar automaticamente</Label>
              <p className="text-sm text-muted-foreground">
                Importações com menos de X linhas não precisam aprovação
              </p>
            </div>
            <Switch
              checked={autoApprove.enabled}
              onCheckedChange={v =>
                setAutoApprove(prev => ({ ...prev, enabled: v }))
              }
            />
          </div>

          {autoApprove.enabled && (
            <div className="space-y-2">
              <Label>Limite de linhas</Label>
              <Input
                type="number"
                value={autoApprove.threshold}
                onChange={e =>
                  setAutoApprove(prev => ({
                    ...prev,
                    threshold: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Importações com até {autoApprove.threshold} linhas serão aprovadas automaticamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
