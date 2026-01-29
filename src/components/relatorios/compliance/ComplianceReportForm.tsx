"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'

interface PreviewData {
  totalEmployees: number
  totalRecords: number
  employeesWithoutPis: number
  incompleteRecords: number
}

interface ComplianceReportFormProps {
  onGenerate: (type: 'afd' | 'aej', dateRange: DateRange) => Promise<void>
  onDownload: (type: 'afd' | 'aej', dateRange: DateRange) => Promise<void>
}

export function ComplianceReportForm({ onGenerate, onDownload }: ComplianceReportFormProps) {
  const [activeTab, setActiveTab] = useState<'afd' | 'aej'>('afd')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  const handlePreview = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Selecione um período')
      return
    }

    setIsGenerating(true)
    try {
      // Simular preview dos dados
      // Em produção, fazer chamada para API
      await new Promise(resolve => setTimeout(resolve, 1000))

      setPreview({
        totalEmployees: 45,
        totalRecords: 1234,
        employeesWithoutPis: 2,
        incompleteRecords: 5,
      })

      toast.success('Preview carregado com sucesso')
    } catch (error) {
      toast.error('Erro ao carregar preview')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Selecione um período')
      return
    }

    setIsGenerating(true)
    try {
      await onGenerate(activeTab, dateRange)
      toast.success(`Relatório ${activeTab.toUpperCase()} gerado com sucesso`)
      await handlePreview()
    } catch (error) {
      toast.error('Erro ao gerar relatório')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Selecione um período')
      return
    }

    setIsDownloading(true)
    try {
      await onDownload(activeTab, dateRange)
      toast.success(`Relatório ${activeTab.toUpperCase()} baixado com sucesso`)
    } catch (error) {
      toast.error('Erro ao baixar relatório')
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleção de relatório</CardTitle>
        <CardDescription>
          Escolha o tipo de relatório e período para gerar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'afd' | 'aej')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="afd">
              <FileText className="mr-2 h-4 w-4" />
              AFD - Arquivo Fonte de Dados
            </TabsTrigger>
            <TabsTrigger value="aej">
              <FileText className="mr-2 h-4 w-4" />
              AEJ - Arquivo Eletrônico de Jornada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="afd" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">AFD - Arquivo Fonte de Dados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Arquivo com todas as marcações de ponto do período selecionado,
                conforme Portaria 671/2021 do MTE. Formato: arquivo de texto (.txt)
                com 99 posições fixas por linha.
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Identificação do empregador (CNPJ)</li>
                <li>Identificação do REP (Registrador Eletrônico de Ponto)</li>
                <li>Marcações de entrada/saída de cada funcionário</li>
                <li>Ajustes e inclusões de marcações (se houver)</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="aej" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">AEJ - Arquivo Eletrônico de Jornada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Relatório consolidado das jornadas de trabalho por período,
                com cálculos de horas extras, faltas e valores. Formato: texto (.txt) ou CSV.
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Jornada prevista vs. realizada por funcionário</li>
                <li>Horas extras 50% e 100%</li>
                <li>Horas noturnas e banco de horas</li>
                <li>Faltas e descontos</li>
                <li>Valores monetários calculados</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Seleção de período */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Selecione o período"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            onClick={handlePreview}
            disabled={isGenerating || !dateRange?.from || !dateRange?.to}
            variant="outline"
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Visualizar Dados'
            )}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !dateRange?.from || !dateRange?.to}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Relatório'
            )}
          </Button>
        </div>

        {/* Preview dos dados */}
        {preview && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Preview dos dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Funcionários:</span>
                  <span className="ml-2 font-semibold">{preview.totalEmployees}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Registros:</span>
                  <span className="ml-2 font-semibold">{preview.totalRecords}</span>
                </div>
                {preview.employeesWithoutPis > 0 && (
                  <div className="text-destructive">
                    <span className="text-muted-foreground">Sem PIS:</span>
                    <span className="ml-2 font-semibold">{preview.employeesWithoutPis}</span>
                  </div>
                )}
                {preview.incompleteRecords > 0 && (
                  <div className="text-amber-600">
                    <span className="text-muted-foreground">Incompletos:</span>
                    <span className="ml-2 font-semibold">{preview.incompleteRecords}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de download */}
        {preview && (
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="default"
            className="w-full"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar {activeTab.toUpperCase()} {activeTab === 'afd' ? '(.txt)' : '(.txt/.csv)'}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
