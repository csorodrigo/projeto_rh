"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Job, JobFormData } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import { JobForm } from "@/components/recruitment/JobForm"
import { Card, CardContent } from "@/components/ui/card"
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
    "Buscamos um desenvolvedor full stack experiente para liderar projetos de alta complexidade. Você trabalhará com tecnologias modernas e terá a oportunidade de impactar diretamente nossos produtos.",
  requirements: [
    "React e TypeScript",
    "Node.js e Express",
    "PostgreSQL ou MongoDB",
    "5+ anos de experiência",
    "Conhecimento em AWS",
  ],
  benefits: [
    "Vale refeição",
    "Plano de saúde",
    "Home office",
    "Auxílio educação",
    "Day off no aniversário",
  ],
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
}

export default function EditarVagaPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string

  const [job, setJob] = React.useState<Job | null>(null)
  const [isLoadingJob, setIsLoadingJob] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchJob = async () => {
      setIsLoadingJob(true)
      setError(null)

      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        setJob(mockJob)
      } catch (err) {
        console.error("Error fetching job:", err)
        setError("Erro ao carregar vaga")
        toast.error("Erro ao carregar vaga")
      } finally {
        setIsLoadingJob(false)
      }
    }

    if (jobId) {
      fetchJob()
    }
  }, [jobId])

  const handleSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)

    try {
      // TODO: Implement API call to update job
      console.log("Updating job:", { id: jobId, ...data })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Vaga atualizada com sucesso!")
      router.push(`/recrutamento/vagas/${jobId}`)
    } catch (error) {
      console.error("Error updating job:", error)
      toast.error("Erro ao atualizar vaga. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">Editar Vaga</h1>
            <p className="text-muted-foreground">Vaga não encontrada</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-lg font-medium mb-2">Vaga não encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              A vaga que você está tentando editar não existe ou foi removida.
            </p>
            <Button asChild>
              <Link href="/recrutamento/vagas">Voltar para Vagas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recrutamento/vagas/${jobId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Vaga</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
      </div>

      {/* Form */}
      <JobForm
        initialData={{
          title: job.title,
          department: job.department,
          location: job.location,
          location_type: job.location_type,
          job_type: job.job_type,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          positions: job.positions,
          hiring_manager_id: job.hiring_manager_id,
          publish_internal: job.publish_internal,
          publish_external: job.publish_external,
          status: job.status,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Salvar Alterações"
      />
    </div>
  )
}
