"use client"

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface ComplianceHistoryItem {
  id: string
  type: 'afd' | 'aej'
  generatedAt: Date
  startDate: Date
  endDate: Date
  status: 'success' | 'error' | 'processing'
  filename: string
  totalEmployees?: number
  totalRecords?: number
  errorMessage?: string
}

interface ComplianceHistoryProps {
  history: ComplianceHistoryItem[]
  onDownload: (item: ComplianceHistoryItem) => Promise<void>
}

export function ComplianceHistory({ history, onDownload }: ComplianceHistoryProps) {
  const handleDownload = async (item: ComplianceHistoryItem) => {
    try {
      await onDownload(item)
      toast.success('Arquivo baixado com sucesso')
    } catch (error) {
      toast.error('Erro ao baixar arquivo')
      console.error(error)
    }
  }

  const getStatusBadge = (status: ComplianceHistoryItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Sucesso
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Erro
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Processando
          </Badge>
        )
    }
  }

  const getTypeBadge = (type: 'afd' | 'aej') => {
    return (
      <Badge variant="outline">
        <FileText className="mr-1 h-3 w-3" />
        {type.toUpperCase()}
      </Badge>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de relatórios</CardTitle>
          <CardDescription>
            Seus últimos 10 relatórios gerados aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhum relatório gerado ainda
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de relatórios</CardTitle>
        <CardDescription>
          Últimos 10 relatórios gerados - clique para baixar novamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Gerado em</TableHead>
                <TableHead>Dados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="text-sm">
                    {format(item.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                    {' - '}
                    {format(item.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(item.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.totalEmployees && (
                      <span>{item.totalEmployees} func.</span>
                    )}
                    {item.totalRecords && (
                      <span className="ml-2">{item.totalRecords} reg.</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(item)}
                      disabled={item.status !== 'success'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
