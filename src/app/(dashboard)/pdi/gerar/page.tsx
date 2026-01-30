"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  User,
  Target,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Calendar,
  Brain,
  Lightbulb,
  Copy,
  Save,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getCurrentProfile, listEmployees, createPDI } from "@/lib/supabase/queries"
import type { Employee } from "@/types/database"

interface GeneratedObjective {
  id: string
  title: string
  description: string
  target_date: string
  status: string
  progress: number
  category: string
}

interface GeneratedPDI {
  title: string
  description: string
  objectives: GeneratedObjective[]
  competencies: string[]
  resources: string[]
}

const competencyOptions = [
  { value: "comunicacao", label: "Comunicacao" },
  { value: "lideranca", label: "Lideranca" },
  { value: "trabalho_equipe", label: "Trabalho em Equipe" },
  { value: "resolucao_problemas", label: "Resolucao de Problemas" },
  { value: "gestao_tempo", label: "Gestao de Tempo" },
  { value: "pensamento_critico", label: "Pensamento Critico" },
  { value: "adaptabilidade", label: "Adaptabilidade" },
  { value: "inovacao", label: "Inovacao" },
  { value: "negociacao", label: "Negociacao" },
  { value: "planejamento", label: "Planejamento Estrategico" },
  { value: "tecnica", label: "Competencias Tecnicas" },
  { value: "relacionamento", label: "Relacionamento Interpessoal" },
]

const categoryColors: Record<string, { bg: string; text: string }> = {
  tecnica: { bg: "bg-blue-100", text: "text-blue-700" },
  comportamental: { bg: "bg-purple-100", text: "text-purple-700" },
  lideranca: { bg: "bg-orange-100", text: "text-orange-700" },
  comunicacao: { bg: "bg-green-100", text: "text-green-700" },
}

export default function GerarPDIPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")
  const [selectedCompetencies, setSelectedCompetencies] = React.useState<string[]>([])
  const [additionalContext, setAdditionalContext] = React.useState("")
  const [targetMonths, setTargetMonths] = React.useState("6")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [generatedPDI, setGeneratedPDI] = React.useState<GeneratedPDI | null>(null)

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  React.useEffect(() => {
    async function loadEmployees() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          return
        }

        const companyId = profileResult.data.company_id
        const result = await listEmployees(companyId, { status: "active" })

        if (result.data) {
          setEmployees(result.data)
        }
      } catch {
        toast.error("Erro ao carregar funcionarios")
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const toggleCompetency = (value: string) => {
    setSelectedCompetencies((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value]
    )
  }

  const handleGenerate = async () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um funcionario")
      return
    }

    if (selectedCompetencies.length === 0) {
      toast.error("Selecione pelo menos uma competencia a desenvolver")
      return
    }

    setIsGenerating(true)
    setGeneratedPDI(null)

    try {
      // Simula geracao com IA - em producao, chamar API de IA
      await new Promise((resolve) => setTimeout(resolve, 2500))

      const employee = employees.find((e) => e.id === selectedEmployeeId)
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + parseInt(targetMonths))

      // Gerar PDI simulado baseado nas competencias selecionadas
      const objectives: GeneratedObjective[] = selectedCompetencies.slice(0, 4).map((comp, index) => {
        const competency = competencyOptions.find((c) => c.value === comp)
        const objectiveDate = new Date()
        objectiveDate.setMonth(objectiveDate.getMonth() + (index + 1) * Math.ceil(parseInt(targetMonths) / 4))

        return {
          id: `obj_${index + 1}`,
          title: `Desenvolver ${competency?.label || comp}`,
          description: generateObjectiveDescription(comp),
          target_date: objectiveDate.toISOString().split("T")[0],
          status: "pending",
          progress: 0,
          category: index % 2 === 0 ? "tecnica" : "comportamental",
        }
      })

      const generated: GeneratedPDI = {
        title: `PDI - ${employee?.full_name || "Funcionario"} - ${new Date().getFullYear()}`,
        description: `Plano de Desenvolvimento Individual focado em: ${selectedCompetencies
          .map((c) => competencyOptions.find((opt) => opt.value === c)?.label)
          .filter(Boolean)
          .join(", ")}. ${additionalContext}`.trim(),
        objectives,
        competencies: selectedCompetencies.map(
          (c) => competencyOptions.find((opt) => opt.value === c)?.label || c
        ),
        resources: generateResources(selectedCompetencies),
      }

      setGeneratedPDI(generated)
      toast.success("PDI gerado com sucesso!")
    } catch {
      toast.error("Erro ao gerar PDI")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedPDI || !selectedEmployeeId) return

    setIsSaving(true)
    try {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao carregar perfil")
        return
      }

      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + parseInt(targetMonths))

      const result = await createPDI({
        company_id: profileResult.data.company_id,
        employee_id: selectedEmployeeId,
        title: generatedPDI.title,
        description: generatedPDI.description,
        start_date: new Date().toISOString().split("T")[0],
        target_date: targetDate.toISOString().split("T")[0],
        objectives: generatedPDI.objectives,
        created_by: profileResult.data.id,
      })

      if (result.error) {
        toast.error("Erro ao salvar PDI")
        return
      }

      toast.success("PDI salvo com sucesso!")
      router.push("/pdi")
    } catch {
      toast.error("Erro ao salvar PDI")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pdi">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="size-8 text-primary" />
            Gerar PDI com IA
          </h1>
          <p className="text-muted-foreground">
            Use inteligencia artificial para criar um PDI personalizado
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Selecionar Funcionario
              </CardTitle>
              <CardDescription>
                Escolha o funcionario para quem deseja gerar o PDI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionario" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.position} - {employee.department || "Sem departamento"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEmployee && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cargo:</span>{" "}
                      <span className="font-medium">{selectedEmployee.position}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Departamento:</span>{" "}
                      <span className="font-medium">{selectedEmployee.department || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Admissao:</span>{" "}
                      <span className="font-medium">
                        {new Date(selectedEmployee.hire_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Competencias a Desenvolver
              </CardTitle>
              <CardDescription>
                Selecione as competencias que o funcionario precisa desenvolver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {competencyOptions.map((comp) => (
                  <Badge
                    key={comp.value}
                    variant={selectedCompetencies.includes(comp.value) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleCompetency(comp.value)}
                  >
                    {selectedCompetencies.includes(comp.value) && (
                      <CheckCircle2 className="mr-1 size-3" />
                    )}
                    {comp.label}
                  </Badge>
                ))}
              </div>
              {selectedCompetencies.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedCompetencies.length} competencia(s) selecionada(s)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Configuracoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetMonths">Duracao do PDI (meses)</Label>
                <Select value={targetMonths} onValueChange={setTargetMonths}>
                  <SelectTrigger id="targetMonths">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="9">9 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">Contexto Adicional (opcional)</Label>
                <Textarea
                  id="context"
                  placeholder="Adicione informacoes relevantes sobre o funcionario, objetivos especificos, feedback recebido, etc."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedEmployeeId || selectedCompetencies.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Gerando PDI com IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-5" />
                Gerar PDI com IA
              </>
            )}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {!generatedPDI ? (
            <Card className="h-full min-h-[500px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Brain className="mx-auto size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Preview do PDI</h3>
                <p className="text-muted-foreground max-w-sm">
                  Selecione um funcionario e as competencias a desenvolver, depois clique em
                  &quot;Gerar PDI com IA&quot; para visualizar o plano.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="size-5 text-yellow-500" />
                      PDI Gerado
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(generatedPDI, null, 2))
                          toast.success("Copiado para a area de transferencia")
                        }}
                      >
                        <Copy className="mr-2 size-4" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Titulo</Label>
                    <p className="font-medium">{generatedPDI.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Descricao</Label>
                    <p className="text-sm">{generatedPDI.description}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Competencias</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedPDI.competencies.map((comp, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="size-5" />
                    Objetivos ({generatedPDI.objectives.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedPDI.objectives.map((obj, index) => {
                    const catStyle = categoryColors[obj.category] || categoryColors.tecnica
                    return (
                      <div key={obj.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {index + 1}
                            </span>
                            <h4 className="font-medium">{obj.title}</h4>
                          </div>
                          <Badge className={`${catStyle.bg} ${catStyle.text} text-xs`}>
                            {obj.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{obj.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          Meta: {new Date(obj.target_date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="size-5" />
                    Recursos Sugeridos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedPDI.resources.map((resource, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-5" />
                    Salvar PDI
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateObjectiveDescription(competency: string): string {
  const descriptions: Record<string, string> = {
    comunicacao:
      "Aprimorar habilidades de comunicacao verbal e escrita, focando em clareza, objetividade e adaptacao ao publico-alvo.",
    lideranca:
      "Desenvolver capacidades de lideranca, incluindo delegacao efetiva, feedback construtivo e motivacao de equipes.",
    trabalho_equipe:
      "Fortalecer colaboracao com colegas, participando ativamente de projetos em grupo e contribuindo para um ambiente positivo.",
    resolucao_problemas:
      "Aperfeicoar analise critica e capacidade de propor solucoes criativas e eficazes para desafios do dia a dia.",
    gestao_tempo:
      "Melhorar organizacao e priorizacao de tarefas, utilizando ferramentas e tecnicas de produtividade.",
    pensamento_critico:
      "Desenvolver capacidade de analise profunda, questionamento construtivo e tomada de decisao baseada em dados.",
    adaptabilidade:
      "Aumentar flexibilidade para lidar com mudancas, aprendendo rapidamente novas ferramentas e processos.",
    inovacao:
      "Estimular pensamento inovador, propondo melhorias nos processos existentes e novas abordagens para desafios.",
    negociacao:
      "Aprimorar tecnicas de negociacao, buscando acordos que beneficiem todas as partes envolvidas.",
    planejamento:
      "Desenvolver visao estrategica e capacidade de planejamento de longo prazo alinhado aos objetivos da empresa.",
    tecnica:
      "Aprofundar conhecimentos tecnicos especificos da area de atuacao atraves de cursos e pratica.",
    relacionamento:
      "Fortalecer habilidades de relacionamento interpessoal, empatia e construcao de networking.",
  }

  return descriptions[competency] || "Desenvolver esta competencia atraves de treinamentos e pratica."
}

function generateResources(competencies: string[]): string[] {
  const allResources: Record<string, string[]> = {
    comunicacao: [
      "Curso de Comunicacao Assertiva",
      "Workshop de Apresentacoes Eficazes",
      "Livro: 'Como Fazer Amigos e Influenciar Pessoas'",
    ],
    lideranca: [
      "Programa de Desenvolvimento de Lideres",
      "Mentoria com gestor senior",
      "Livro: 'Os 7 Habitos das Pessoas Altamente Eficazes'",
    ],
    trabalho_equipe: [
      "Dinamicas de team building",
      "Treinamento em metodologias ageis",
      "Participacao em projetos cross-funcionais",
    ],
    resolucao_problemas: [
      "Curso de Design Thinking",
      "Treinamento em analise de causa raiz",
      "Workshop de criatividade",
    ],
    gestao_tempo: [
      "Curso de Produtividade Pessoal",
      "Ferramenta de gestao de tarefas",
      "Tecnica Pomodoro e GTD",
    ],
  }

  const resources: string[] = []
  competencies.forEach((comp) => {
    if (allResources[comp]) {
      resources.push(...allResources[comp].slice(0, 2))
    }
  })

  if (resources.length === 0) {
    resources.push(
      "Treinamentos especificos da area",
      "Mentoria com profissional experiente",
      "Participacao em projetos desafiadores"
    )
  }

  return [...new Set(resources)].slice(0, 6)
}
