"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react"
import type { Job } from "@/types/recruitment"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ApplyModal } from "./ApplyModal"
import { JobShareButton } from "./JobShareButton"

interface JobDetailsContentProps {
  job: Job & { company?: { name: string; logo_url: string | null } }
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Tempo Integral",
  part_time: "Meio Período",
  contract: "Contrato",
  temporary: "Temporário",
  internship: "Estágio",
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  on_site: "Presencial",
  remote: "Remoto",
  hybrid: "Híbrido",
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  entry: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
  lead: "Líder",
  executive: "Executivo",
}

export function JobDetailsContent({ job }: JobDetailsContentProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  const publishedDate = job.published_at
    ? format(new Date(job.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{job.title}</h1>
              {job.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{job.company.name}</span>
                </div>
              )}
            </div>

            <JobShareButton jobId={job.id} jobTitle={job.title} />
          </div>

          {/* Key Info Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {job.department && (
              <Badge variant="secondary" className="gap-1">
                <Building2 className="h-3 w-3" />
                {job.department}
              </Badge>
            )}

            {job.location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </Badge>
            )}

            {job.location_type && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {LOCATION_TYPE_LABELS[job.location_type]}
              </Badge>
            )}

            {job.job_type && (
              <Badge variant="secondary" className="gap-1">
                <Briefcase className="h-3 w-3" />
                {JOB_TYPE_LABELS[job.job_type]}
              </Badge>
            )}

            {job.experience_level && (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
              </Badge>
            )}

            {publishedDate && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Publicado em {publishedDate}
              </Badge>
            )}
          </div>

          {/* Salary */}
          {job.show_salary && job.salary_min && job.salary_max && (
            <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-6">
              <DollarSign className="h-5 w-5" />
              <span>
                R$ {job.salary_min.toLocaleString('pt-BR')} - R$ {job.salary_max.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Apply Button */}
          <div className="flex gap-3">
            <Button size="lg" onClick={() => setApplyModalOpen(true)} className="gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Candidatar-se
            </Button>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sobre a Vaga</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Responsabilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.responsibilities.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.requirements.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Nice to Have */}
        {job.nice_to_have && job.nice_to_have.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Diferenciais</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.nice_to_have.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.benefits.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Bottom CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Interessado nesta vaga?</h3>
                <p className="text-sm text-muted-foreground">
                  Candidate-se agora e faça parte do nosso time!
                </p>
              </div>
              <Button size="lg" onClick={() => setApplyModalOpen(true)} className="gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Candidatar-se
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        jobId={job.id}
        jobTitle={job.title}
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
      />
    </div>
  )
}
