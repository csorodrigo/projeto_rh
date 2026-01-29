"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Copy,
  Archive,
  Play,
  Pause,
  XCircle,
  Eye,
  Building2,
} from "lucide-react"
import { toast } from "sonner"

import { Job, JobStatus } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

// Mock data
const mockJob: Job = {
  id: "1",
  company_id: "company-1",
  title: "Desenvolvedor Full Stack Sênior",
  department: "Tecnologia",
  location: "São Paulo, SP",
  location_type: "hybrid",
  job_type: "full_time",
  status: "open",
  description:
    "Buscamos um desenvolvedor full stack experiente para liderar projetos de alta complexidade. Você trabalhará com tecnologias modernas como React, Node.js e TypeScript, e terá a oportunidade de impactar diretamente nossos produtos. O profissional ideal é apaixonado por tecnologia, tem forte senso de ownership e busca constantemente aprender e compartilhar conhecimento com o time.",
  requirements: [
    "React e TypeScript",
    "Node.js e Express",
    "PostgreSQL ou MongoDB",
    "5+ anos de experiência",
    "Conhecimento em AWS",
    "Inglês técnico",
  ],
  benefits: [
    "Vale refeição R$ 30/dia",
    "Plano de saúde Unimed",
    "Home office flexível",
    "Auxílio educação R$ 500/mês",
    "Day off no aniversário",
    "Gympass",
  ],
  salary_min: 8000,
  salary_max: 12000,
  positions: 2,
  positions_filled: 0,
  publish_internal: true,
  publish_external: true,
  created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  created_by: "user-1",
  applications_count: 32,
  hiring_manager: {
    id: "manager-1",
    name: "João Silva",
    email: "joao.silva@empresa.com",
  },
}

const statusConfig = {
  open: { label: "Aberta", variant: "default" as const, color: "bg-green-500" },
  paused: { label: "Pausada", variant: "secondary" as const, color: "bg-yellow-500" },
  closed: { label: "Fechada", variant: "outline" as const, color: "bg-gray-500" },
  draft: { label: "Rascunho", variant: "outline" as const, color: "bg-gray-400" },
}

const jobTypeLabels = {
  full_time: "Tempo Integral",
  part_time: "Meio Período",
  contract: "Contrato",
  temporary: "Temporário",
  internship: "Estágio",
}

const locationTypeLabels = {
  onsite: "Presencial",
  remote: "Remoto",
  hybrid: "Híbrido",
}

// Mock activities
const mockActivities = [
  {
    id: "1",
    type: "status_change",
    description: "Status alterado para Aberta",
    user: "Admin Usuario",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "2",
    type: "application",
    description: "Novo candidato: Maria Santos",
    user: "Sistema",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "3",
    type: "edit",
    description: "Descrição da vaga atualizada",
    user: "Admin Usuario",
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "4",
    type: "created",
    description: "Vaga criada",
    user: "Admin Usuario",
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

export default function VagaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string

  const [job, setJob] = React.useState<Job | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setJob(mockJob)
      } catch (err) {
        console.error("Error fetching job:", err)
        setError("Erro ao carregar vaga")
      } finally {
        setIsLoading(false)
      }
    }

    if (jobId) {
      fetchJob()
    }
  }, [jobId])

  const handleStatusChange = async (status: JobStatus) => {
    if (!job) return

    try {
      // TODO: Implement API call
      setJob({ ...job, status, updated_at: new Date().toISOString() })
      toast.success("Status da vaga atualizado")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao atualizar status")
    }
  }

  const handleDuplicate = async () => {
    try {
      // TODO: Implement API call
      toast.success("Vaga duplicada com sucesso")
      router.push("/recrutamento/vagas")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao duplicar vaga")
    }
  }

  const handleArchive = async () => {
    try {
      // TODO: Implement API call
      toast.success("Vaga arquivada com sucesso")
      router.push("/recrutamento/vagas")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao arquivar vaga")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-96" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/recrutamento/vagas">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vaga não encontrada</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-lg font-medium mb-2">Vaga não encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              A vaga que você está procurando não existe ou foi removida.
            </p>
            <Button asChild>
              <Link href="/recrutamento/vagas">Voltar para Vagas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[job.status]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/recrutamento/vagas">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="size-4" />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                Criada em {new Date(job.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/recrutamento/vagas/${jobId}/editar`}>
              <Edit className="mr-2 size-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">Mais ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 size-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {job.status === "open" && (
                <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
                  <Pause className="mr-2 size-4" />
                  Pausar
                </DropdownMenuItem>
              )}
              {job.status === "paused" && (
                <DropdownMenuItem onClick={() => handleStatusChange("open")}>
                  <Play className="mr-2 size-4" />
                  Reabrir
                </DropdownMenuItem>
              )}
              {(job.status === "open" || job.status === "paused") && (
                <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
                  <XCircle className="mr-2 size-4" />
                  Fechar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleArchive}
              >
                <Archive className="mr-2 size-4" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.applications_count}</div>
            <p className="text-xs text-muted-foreground">Total de inscritos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas</CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.positions_filled} / {job.positions}
            </div>
            <p className="text-xs text-muted-foreground">Preenchidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">
              {jobTypeLabels[job.job_type]}
            </div>
            <p className="text-xs text-muted-foreground">
              {locationTypeLabels[job.location_type]}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixa Salarial</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">
              {job.salary_min && job.salary_max
                ? `R$ ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                : "Não informado"}
            </div>
            <p className="text-xs text-muted-foreground">Por mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Eye className="mr-2 size-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <Users className="mr-2 size-4" />
            Candidatos
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <TrendingUp className="mr-2 size-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 size-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição da Vaga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requisitos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Hiring Manager</p>
                  <p className="text-sm text-muted-foreground">
                    {job.hiring_manager?.name || "Não atribuído"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Publicação</p>
                  <div className="flex flex-wrap gap-2">
                    {job.publish_internal && (
                      <Badge variant="secondary">Interna</Badge>
                    )}
                    {job.publish_external && (
                      <Badge variant="secondary">Externa</Badge>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Última Atualização</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.updated_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Candidates Tab */}
        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Candidatos</CardTitle>
              <CardDescription>
                Lista de todos os candidatos inscritos nesta vaga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10">
                <Users className="size-16 text-muted-foreground opacity-20 mb-4" />
                <p className="text-lg font-medium mb-2">
                  {job.applications_count} candidato
                  {job.applications_count !== 1 ? "s" : ""} inscrito
                  {job.applications_count !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Visualize e gerencie os candidatos no módulo de Candidatos
                </p>
                <Button asChild>
                  <Link href={`/recrutamento/vagas/${jobId}/candidatos`}>
                    Ver Candidatos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Recrutamento</CardTitle>
              <CardDescription>
                Visualize o fluxo dos candidatos através das etapas do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10">
                <TrendingUp className="size-16 text-muted-foreground opacity-20 mb-4" />
                <p className="text-lg font-medium mb-2">Pipeline Kanban</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Acompanhe os candidatos em cada etapa do processo seletivo
                </p>
                <Button asChild>
                  <Link href={`/recrutamento/vagas/${jobId}/pipeline`}>
                    Ver Pipeline
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>
                Todas as alterações e eventos relacionados a esta vaga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>
                            {new Date(activity.timestamp).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < mockActivities.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
