/**
 * Página de Geração de AEJ (Arquivo Eletrônico de Jornada) para e-Social
 *
 * Permite gerar relatório AEJ em formato XML conforme layout e-Social
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AEJXMLGenerator,
  type AEJXMLData,
  type AEJXMLConfig,
  type AEJXMLResult,
} from '@/lib/compliance'
import {
  getTimeRecordsForAEJ,
  validateCompanyForAEJ,
} from '@/lib/supabase/queries/compliance'

export default function AEJPage() {

  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<AEJXMLResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Estado do formulário
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [environment, setEnvironment] = useState<'1' | '2'>('2') // 1=Produção, 2=Homologação

  // Gerar anos disponíveis (últimos 3 anos + ano atual + próximo ano)
  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return year.toString()
  })

  // Meses do ano
  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  /**
   * Valida se a empresa está pronta para gerar AEJ
   */
  const handleValidate = async () => {
    setValidating(true)
    setValidationErrors([])

    try {
      // TODO: Buscar company_id do usuário logado
      const companyId = 'company-uuid' // Placeholder

      const validation = await validateCompanyForAEJ(companyId)

      if (!validation.valid) {
        setValidationErrors(validation.errors)
        toast({
          title: 'Validação Falhou',
          description: `${validation.errors.length} erro(s) encontrado(s)`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Validação OK',
          description: 'Empresa está pronta para gerar AEJ',
        })
      }
    } catch (error) {
      console.error('Erro ao validar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao validar dados da empresa',
        variant: 'destructive',
      })
    } finally {
      setValidating(false)
    }
  }

  /**
   * Gera o arquivo AEJ XML
   */
  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    setValidationErrors([])

    try {
      // TODO: Buscar company_id do usuário logado
      const companyId = 'company-uuid' // Placeholder

      // 1. Validar empresa
      const validation = await validateCompanyForAEJ(companyId)
      if (!validation.valid) {
        setValidationErrors(validation.errors)
        toast({
          title: 'Validação Falhou',
          description: 'Corrija os erros antes de gerar o AEJ',
          variant: 'destructive',
        })
        return
      }

      // 2. Definir período
      const referenceMonth = `${selectedYear}-${selectedMonth}`
      const year = parseInt(selectedYear)
      const month = parseInt(selectedMonth)

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0) // Último dia do mês

      // 3. Buscar dados
      const data = await getTimeRecordsForAEJ(
        companyId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      if (!data.company) {
        throw new Error('Empresa não encontrada')
      }

      if (data.employees.length === 0) {
        throw new Error('Nenhum funcionário ativo encontrado')
      }

      // 4. Configurar gerador
      const config: AEJXMLConfig = {
        environment,
        processVersion: '1.0.0',
        includeOvertimeDetails: true,
        includeMonetaryValues: true,
      }

      // 5. Gerar XML
      const generator = new AEJXMLGenerator(config)

      const aejData: AEJXMLData = {
        company: data.company,
        employees: data.employees,
        dailyRecords: data.dailyRecords,
        workSchedules: data.workSchedules,
        holidays: data.holidays,
        startDate,
        endDate,
        referenceMonth,
      }

      const generatedResult = generator.generate(aejData)

      // 6. Validar XML
      const xmlValidation = generator.validateXML(generatedResult.xml)
      if (!xmlValidation.valid) {
        throw new Error(`XML inválido: ${xmlValidation.errors.join(', ')}`)
      }

      setResult(generatedResult)

      toast({
        title: 'AEJ Gerado',
        description: `${generatedResult.totalEmployees} funcionário(s) processado(s)`,
      })
    } catch (error) {
      console.error('Erro ao gerar AEJ:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar AEJ',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Faz download do arquivo XML
   */
  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Download Iniciado',
      description: result.filename,
    })
  }

  /**
   * Visualiza preview do XML
   */
  const handlePreview = () => {
    if (!result) return

    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write('<pre>' + result.xml.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>')
      newWindow.document.title = result.filename
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerar AEJ - e-Social</h1>
        <p className="text-muted-foreground mt-2">
          Arquivo Eletrônico de Jornada em formato XML conforme layout e-Social
        </p>
      </div>

      {/* Card de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>
            Selecione o período e ambiente para gerar o AEJ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ano */}
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mês */}
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ambiente */}
            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as '1' | '2')}>
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Produção</SelectItem>
                  <SelectItem value="2">Homologação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleValidate}
              variant="outline"
              disabled={validating || loading}
            >
              {validating ? 'Validando...' : 'Validar Dados'}
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={loading || validating}
            >
              {loading ? 'Gerando...' : 'Gerar AEJ'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Erros de Validação */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Erros encontrados:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              AEJ Gerado com Sucesso
            </CardTitle>
            <CardDescription>
              Arquivo pronto para download e envio ao e-Social
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Nome do Arquivo</div>
                <div className="font-medium">{result.filename}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Período</div>
                <div className="font-medium">{result.period}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Funcionários</div>
                <div className="font-medium">{result.totalEmployees}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">ID do Evento</div>
                <div className="font-medium text-xs">{result.eventId}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download XML
              </Button>

              <Button onClick={handlePreview} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o AEJ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            O Arquivo Eletrônico de Jornada (AEJ) é um relatório em formato XML que consolida
            as informações de jornada de trabalho conforme exigido pelo e-Social.
          </p>
          <p>
            <strong>Evento gerado:</strong> S-1200 (Remuneração de trabalhador vinculado ao RGPS)
          </p>
          <p>
            <strong>Informações incluídas:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Identificação do empregador e trabalhadores</li>
            <li>Jornada contratual de trabalho</li>
            <li>Itens de remuneração (salário, horas extras, adicionais)</li>
            <li>Descontos (faltas, atrasos)</li>
          </ul>
          <p className="mt-4">
            <strong>Ambiente de Homologação:</strong> Use para testes antes de enviar para produção.
            Os dados serão enviados para o ambiente de teste do e-Social.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
