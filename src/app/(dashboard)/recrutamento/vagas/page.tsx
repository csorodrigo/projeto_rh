"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  Copy,
  Archive,
  MoreHorizontal,
  Play,
  Pause,
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"

import { Job, JobStatus, JobFilters as JobFiltersType } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { JobFilters } from "@/components/recruitment/JobFilters"

// Mock data
const mockJobs: Job[] = [
  {
    id: "1",
    company_id: "company-1",
    title: "Desenvolvedor Full Stack Sênior",
    department: "Tecnologia",
    location: "São Paulo, SP",
    location_type: "hybrid",
    job_type: "full_time",
    status: "open",
    description: "Buscamos um desenvolvedor full stack experiente...",
    requirements: ["React", "Node.js", "TypeScript"],
    benefits: ["Vale refeição", "Plano de saúde"],
    positions: 2,
    positions_filled: 0,
    publish_internal: true,
    publish_external: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "user-1",
    applications_count: 32,
  },
  {
    id: "2",
    company_id: "company-1",
    title: "Designer UX/UI",
    department: "Design",
    location: "São Paulo, SP",
    location_type: "remote",
    job_type: "full_time",
    status: "open",
    description: "Procuramos um designer criativo...",
    requirements: ["Figma", "Adobe XD"],
    benefits: ["Vale refeição"],
    positions: 1,
    positions_filled: 0,
    publish_internal: true,
    publish_external: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_by: "user-1",
    applications_count: 18,
  },
  {
    id: "3",
    company_id: "company-1",
    title: "Analista de Marketing Digital",
    department: "Marketing",
    location: "São Paulo, SP",
    location_type: "onsite",
    job_type: "full_time",
    status: "paused",
    description: "Buscamos um profissional...",
    requirements: ["Google Ads"],
    benefits: [],
    positions: 1,
    positions_filled: 0,
    publish_internal: true,
    publish_external: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_by: "user-1",
    applications_count: 12,
  },
  {
    id: "4",
    company_id: "company-1",
    title: "Estagiário de RH",
    department: "Recursos Humanos",
    location: "São Paulo, SP",
    location_type: "hybrid",
    job_type: "internship",
    status: "open",
    description: "Oportunidade para estudantes...",
    requirements: ["Cursando RH"],
    benefits: ["Vale transporte"],
    positions: 2,
    positions_filled: 1,
    publish_internal: true,
    publish_external: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_by: "user-1",
    applications_count: 45,
  },
  {
    id: "5",
    company_id: "company-1",
    title: "Analista Financeiro",
    department: "Financeiro",
    location: "São Paulo, SP",
    location_type: "onsite",
    job_type: "full_time",
    status: "closed",
    description: "Analista para área financeira...",
    requirements: ["Excel avançado"],
    benefits: [],
    positions: 1,
    positions_filled: 1,
    publish_internal: true,
    publish_external: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    closed_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    created_by: "user-1",
    applications_count: 28,
  },
]

const statusConfig = {
  open: { label: "Aberta", variant: "default" as const },
  paused: { label: "Pausada", variant: "secondary" as const },
  closed: { label: "Fechada", variant: "outline" as const },
  draft: { label: "Rascunho", variant: "outline" as const },
}

const jobTypeLabels = {
  full_time: "Tempo Integral",
  part_time: "Meio Período",
  contract: "Contrato",
  temporary: "Temporário",
  internship: "Estágio",
}

export default function VagasListPage() {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<Job[]>(mockJobs)
  const [filteredJobs, setFilteredJobs] = React.useState<Job[]>(mockJobs)
  const [filters, setFilters] = React.useState<JobFiltersType>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Apply filters
  React.useEffect(() => {
    let result = [...jobs]

    if (filters.status && filters.status.length > 0) {
      result = result.filter((job) => filters.status?.includes(job.status))
    }

    if (filters.department && filters.department.length > 0) {
      result = result.filter((job) => filters.department?.includes(job.department))
    }

    if (filters.job_type && filters.job_type.length > 0) {
      result = result.filter((job) => filters.job_type?.includes(job.job_type))
    }

    if (filters.location_type && filters.location_type.length > 0) {
      result = result.filter((job) => filters.location_type?.includes(job.location_type))
    }

    setFilteredJobs(result)
  }, [jobs, filters])

  const fetchJobs = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setJobs(mockJobs)
    } catch (err) {
      setError("Erro ao carregar vagas")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    try {
      // TODO: Implement API call
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status, updated_at: new Date().toISOString() }
            : job
        )
      )
      toast.success("Status da vaga atualizado")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao atualizar status")
    }
  }

  const handleDuplicate = async (jobId: string) => {
    try {
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return

      // TODO: Implement API call
      const newJob = {
        ...job,
        id: `${Date.now()}`,
        title: `${job.title} (Cópia)`,
        status: "draft" as JobStatus,
        positions_filled: 0,
        applications_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setJobs((prev) => [newJob, ...prev])
      toast.success("Vaga duplicada com sucesso")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao duplicar vaga")
    }
  }

  const handleArchive = async (jobId: string) => {
    try {
      // TODO: Implement API call
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
      toast.success("Vaga arquivada com sucesso")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao arquivar vaga")
    }
  }

  const departments = React.useMemo(
    () => Array.from(new Set(jobs.map((job) => job.department))),
    [jobs]
  )

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="min-w-[200px]">
            <Link
              href={`/recrutamento/vagas/${job.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {job.title}
            </Link>
            <p className="text-sm text-muted-foreground">{job.location}</p>
          </div>
        )
      },
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Departamento" />,
      cell: ({ row }) => <span>{row.getValue("department")}</span>,
    },
    {
      accessorKey: "job_type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.getValue("job_type") as keyof typeof jobTypeLabels
        return <span className="text-sm">{jobTypeLabels[type]}</span>
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig
        const config = statusConfig[status]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "applications_count",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidatos" />,
      cell: ({ row }) => {
        const count = row.getValue("applications_count") as number
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-medium">{count}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criada em" />,
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return new Date(date).toLocaleDateString("pt-BR")
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const job = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/recrutamento/vagas/${job.id}`}>
                  <Eye className="mr-2 size-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/recrutamento/vagas/${job.id}/editar`}>
                  <Edit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/recrutamento/vagas/${job.id}/candidatos`}>
                  <Users className="mr-2 size-4" />
                  Ver Candidatos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/recrutamento/vagas/${job.id}/pipeline`}>
                  <TrendingUp className="mr-2 size-4" />
                  Ver Pipeline
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(job.id)}>
                <Copy className="mr-2 size-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {job.status === "open" && (
                <DropdownMenuItem onClick={() => handleStatusChange(job.id, "paused")}>
                  <Pause className="mr-2 size-4" />
                  Pausar
                </DropdownMenuItem>
              )}
              {job.status === "paused" && (
                <DropdownMenuItem onClick={() => handleStatusChange(job.id, "open")}>
                  <Play className="mr-2 size-4" />
                  Reabrir
                </DropdownMenuItem>
              )}
              {(job.status === "open" || job.status === "paused") && (
                <DropdownMenuItem onClick={() => handleStatusChange(job.id, "closed")}>
                  <XCircle className="mr-2 size-4" />
                  Fechar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleArchive(job.id)}
              >
                <Archive className="mr-2 size-4" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vagas</h1>
            <p className="text-muted-foreground">Lista completa de vagas</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao carregar vagas</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchJobs}>
              <RefreshCw className="mr-2 size-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vagas</h1>
          <p className="text-muted-foreground">Lista completa de vagas de emprego</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs} disabled={isLoading}>
            <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/recrutamento/vagas/nova">
              <Plus className="mr-2 size-4" />
              Nova Vaga
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Vagas</CardTitle>
          <CardDescription>
            Gerencie todas as vagas abertas, pausadas e fechadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredJobs}
            searchKey="title"
            searchPlaceholder="Buscar por título da vaga..."
            isLoading={isLoading}
            emptyMessage="Nenhuma vaga encontrada"
            emptyDescription="Comece criando sua primeira vaga"
            toolbar={
              <JobFilters
                filters={filters}
                onFiltersChange={setFilters}
                departments={departments}
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
