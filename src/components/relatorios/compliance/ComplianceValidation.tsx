"use client"

import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export interface ValidationIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  count?: number
  details?: string
}

export interface ComplianceValidationData {
  allEmployeesHavePis: boolean
  allRecordsComplete: boolean
  hasViolations: boolean
  issues: ValidationIssue[]
  stats: {
    totalEmployees: number
    employeesWithPis: number
    completeRecords: number
    totalRecords: number
    violations: number
  }
}

interface ComplianceValidationProps {
  validation: ComplianceValidationData | null
  isLoading?: boolean
}

export function ComplianceValidation({ validation, isLoading }: ComplianceValidationProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validação de conformidade</CardTitle>
          <CardDescription>Carregando validação...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Verificando dados...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validação de conformidade</CardTitle>
          <CardDescription>
            Gere um relatório para verificar a conformidade dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Selecione um período e gere um relatório para ver o status de conformidade
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { allEmployeesHavePis, allRecordsComplete, hasViolations, issues, stats } = validation

  const getIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validação de conformidade</CardTitle>
        <CardDescription>
          Status de conformidade dos dados do período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist principal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getIcon(allEmployeesHavePis)}
              <div>
                <p className="font-medium">Todos funcionários com PIS cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  {stats.employeesWithPis} de {stats.totalEmployees} funcionários
                </p>
              </div>
            </div>
            {allEmployeesHavePis && (
              <Badge variant="default" className="bg-green-500">Conforme</Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getIcon(allRecordsComplete)}
              <div>
                <p className="font-medium">Registros de ponto completos</p>
                <p className="text-sm text-muted-foreground">
                  {stats.completeRecords} de {stats.totalRecords} registros completos
                </p>
              </div>
            </div>
            {allRecordsComplete && (
              <Badge variant="default" className="bg-green-500">Conforme</Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getIcon(!hasViolations)}
              <div>
                <p className="font-medium">Sem violações encontradas</p>
                <p className="text-sm text-muted-foreground">
                  {stats.violations} violações detectadas
                </p>
              </div>
            </div>
            {!hasViolations && (
              <Badge variant="default" className="bg-green-500">Conforme</Badge>
            )}
          </div>
        </div>

        {/* Issues detalhadas */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-3">Problemas encontrados</h4>
            {issues.map((issue) => (
              <Alert
                key={issue.id}
                variant={issue.type === 'error' ? 'destructive' : 'default'}
                className={
                  issue.type === 'warning'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : issue.type === 'info'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : ''
                }
              >
                <div className="flex items-start gap-2">
                  {issue.type === 'error' && <XCircle className="h-4 w-4 mt-0.5" />}
                  {issue.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5" />}
                  {issue.type === 'info' && <Info className="h-4 w-4 mt-0.5" />}
                  <div className="flex-1">
                    <AlertTitle className="text-sm font-semibold flex items-center gap-2">
                      {issue.message}
                      {issue.count && (
                        <Badge variant="outline" className="ml-2">
                          {issue.count} ocorrência{issue.count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </AlertTitle>
                    {issue.details && (
                      <AlertDescription className="text-sm mt-1">
                        {issue.details}
                      </AlertDescription>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Status geral */}
        {allEmployeesHavePis && allRecordsComplete && !hasViolations && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Sistema em conformidade</AlertTitle>
            <AlertDescription>
              Todos os requisitos para geração de relatórios AFD e AEJ estão atendidos.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
