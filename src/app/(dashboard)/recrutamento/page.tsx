"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  RefreshCw,
  AlertCircle,
  FileX,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

import { Job, JobStatus, JobFilters as JobFiltersType } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { JobCard } from "@/components/recruitment/JobCard"
import { JobStats } from "@/components/recruitment/JobStats"
import { JobFilters } from "@/components/recruitment/JobFilters"
import { Skeleton } from "@/components/ui/skeleton"

// Mock data - Replace with actual API calls
const mockStats = {
  total_jobs: 12,
  open_jobs: 8,
  paused_jobs: 2,
  closed_jobs: 2,
  total_applications: 145,
  applications_this_week: 23,
  in_process: 67,
  avg_time_to_hire: 21,
}

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
    requirements: ["React", "Node.js", "TypeScript", "5+ anos de experiência"],
    benefits: ["Vale refeição", "Plano de saúde", "Home office"],
    salary_min: 8000,
    salary_max: 12000,
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
    description: "Procuramos um designer criativo e estratégico...",
    requirements: ["Figma", "Adobe XD", "Portfolio", "3+ anos de experiência"],
    benefits: ["Vale refeição", "Plano de saúde", "Day off no aniversário"],
    salary_min: 6000,
    salary_max: 9000,
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
    description: "Buscamos um profissional para gerenciar campanhas digitais...",
    requirements: ["Google Ads", "Facebook Ads", "Analytics", "2+ anos"],
    benefits: ["Vale refeição", "Vale transporte", "Plano de saúde"],
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
    description: "Oportunidade para estudantes de RH...",
    requirements: ["Cursando RH ou Psicologia", "Conhecimento em Excel"],
    benefits: ["Vale refeição", "Vale transporte", "Seguro de vida"],
    positions: 2,
    positions_filled: 1,
    publish_internal: true,
    publish_external: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_by: "user-1",
    applications_count: 45,
  },
]

export default function RecrutamentoPage() {
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recrutamento</h1>
            <p className="text-muted-foreground">
              Gerencie vagas e processos seletivos
            </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Recrutamento</h1>
          <p className="text-muted-foreground">
            Gerencie vagas e processos seletivos
          </p>
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

      {/* Stats */}
      <JobStats stats={mockStats} isLoading={isLoading} />

      {/* Filters and Quick Actions */}
      <div className="flex items-center justify-between">
        <JobFilters
          filters={filters}
          onFiltersChange={setFilters}
          departments={departments}
        />
        <Button variant="outline" size="sm" asChild>
          <Link href="/recrutamento/vagas">
            <TrendingUp className="mr-2 size-4" />
            Ver Todas as Vagas
          </Link>
        </Button>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-6 w-full mb-1" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <FileX className="size-16 text-muted-foreground opacity-20 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma vaga encontrada</p>
            <p className="text-sm text-muted-foreground mb-6">
              {filters.status || filters.department || filters.job_type || filters.location_type
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira vaga"}
            </p>
            {!filters.status &&
              !filters.department &&
              !filters.job_type &&
              !filters.location_type && (
                <Button asChild>
                  <Link href="/recrutamento/vagas/nova">
                    <Plus className="mr-2 size-4" />
                    Criar Primeira Vaga
                  </Link>
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={handleStatusChange}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* View All Link */}
      {!isLoading && filteredJobs.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/recrutamento/vagas">Ver Todas as Vagas</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
