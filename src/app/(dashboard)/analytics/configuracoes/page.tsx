/**
 * AI Configuration Page
 * Configurações de IA e Automações
 */

import { Metadata } from 'next'
import { Settings, Bot, Zap, Brain, FileText, Bell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export const metadata: Metadata = {
  title: 'Configurações de IA | RH System',
  description: 'Configure chatbot, automações e insights de IA',
}

export default function AIConfigPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações de IA</h1>
            <p className="text-muted-foreground">
              Configure o assistente virtual e automações inteligentes
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chatbot" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chatbot">
            <Bot className="h-4 w-4 mr-2" />
            Chatbot
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="h-4 w-4 mr-2" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="training">
            <FileText className="h-4 w-4 mr-2" />
            Treinamento
          </TabsTrigger>
        </TabsList>

        {/* Chatbot Tab */}
        <TabsContent value="chatbot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Chatbot</CardTitle>
              <CardDescription>
                Configure o comportamento do assistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Chatbot */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chatbot-enabled">Habilitar Chatbot</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar ou desativar o assistente virtual
                  </p>
                </div>
                <Switch id="chatbot-enabled" defaultChecked />
              </div>

              <Separator />

              {/* AI Provider */}
              <div className="space-y-2">
                <Label htmlFor="ai-provider">Provedor de IA</Label>
                <Select defaultValue="openai">
                  <SelectTrigger id="ai-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="local">Local (Regras)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Escolha o modelo de IA para processar mensagens
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Criatividade</Label>
                  <span className="text-sm text-muted-foreground">0.7</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={[0.7]}
                />
                <p className="text-xs text-muted-foreground">
                  Controla o quão criativas são as respostas (0 = conservador, 1 = criativo)
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-tokens">Tamanho Máximo da Resposta</Label>
                  <span className="text-sm text-muted-foreground">1000 tokens</span>
                </div>
                <Slider
                  id="max-tokens"
                  min={100}
                  max={2000}
                  step={100}
                  defaultValue={[1000]}
                />
                <p className="text-xs text-muted-foreground">
                  Limite de tamanho para cada resposta do chatbot
                </p>
              </div>

              <Separator />

              {/* Rate Limiting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="rate-limit">Limite de Taxa</Label>
                  <p className="text-sm text-muted-foreground">
                    Máximo de 20 mensagens por minuto por usuário
                  </p>
                </div>
                <Switch id="rate-limit" defaultChecked />
              </div>

              {/* Streaming */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streaming">Respostas em Tempo Real</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir respostas conforme são geradas
                  </p>
                </div>
                <Switch id="streaming" defaultChecked />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Automação</CardTitle>
              <CardDescription>
                Configure ações automáticas baseadas em eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Automation */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="automation-enabled">Habilitar Automações</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar sistema de automações
                  </p>
                </div>
                <Switch id="automation-enabled" defaultChecked />
              </div>

              <Separator />

              {/* Automation Rules */}
              <div className="space-y-4">
                <h4 className="font-semibold">Regras Ativas</h4>

                {AUTOMATION_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{rule.name}</h5>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Ativa
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Executada {rule.executionCount}x • {rule.successRate}% sucesso
                      </p>
                    </div>
                    <Switch defaultChecked={rule.enabled} />
                  </div>
                ))}
              </div>

              {/* Add Rule Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Insights</CardTitle>
              <CardDescription>
                Configure como insights são gerados e exibidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Insights */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="insights-enabled">Habilitar Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Gerar insights automáticos
                  </p>
                </div>
                <Switch id="insights-enabled" defaultChecked />
              </div>

              <Separator />

              {/* Update Frequency */}
              <div className="space-y-2">
                <Label htmlFor="update-frequency">Frequência de Atualização</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="update-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Tempo Real</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence">Limite de Confiança</Label>
                  <span className="text-sm text-muted-foreground">70%</span>
                </div>
                <Slider
                  id="confidence"
                  min={0}
                  max={100}
                  step={5}
                  defaultValue={[70]}
                />
                <p className="text-xs text-muted-foreground">
                  Mostrar apenas insights com confiança acima deste valor
                </p>
              </div>

              <Separator />

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas Críticos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre insights críticos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sugestões Semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo semanal de sugestões
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treinamento da IA</CardTitle>
              <CardDescription>
                Treine o chatbot com documentos e políticas da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de treinamento em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Em breve você poderá fazer upload de documentos para treinar a IA
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Mock Automation Rules Data
 */
const AUTOMATION_RULES = [
  {
    id: '1',
    name: 'Pesquisa de Satisfação - 90 Dias',
    description: 'Enviar pesquisa quando funcionário completar 90 dias',
    enabled: true,
    executionCount: 45,
    successRate: 98,
  },
  {
    id: '2',
    name: 'Alerta de Ausências Consecutivas',
    description: 'Notificar RH sobre 3+ dias de ausência',
    enabled: true,
    executionCount: 12,
    successRate: 100,
  },
  {
    id: '3',
    name: 'Alerta de Horas Extras Excessivas',
    description: 'Alertar gestor sobre mais de 20h extras no mês',
    enabled: true,
    executionCount: 8,
    successRate: 100,
  },
  {
    id: '4',
    name: 'Parabéns por Aniversário de Empresa',
    description: 'Enviar mensagem no aniversário de empresa',
    enabled: true,
    executionCount: 156,
    successRate: 99,
  },
  {
    id: '5',
    name: 'Renovação de ASO',
    description: 'Alertar 30 dias antes do vencimento',
    enabled: true,
    executionCount: 23,
    successRate: 95,
  },
]
