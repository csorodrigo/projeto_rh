"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Briefcase, Clock, Building2, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import type { Job } from "@/types/recruitment"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PublicJobCardProps {
  job: Job
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

export function PublicJobCard({ job }: PublicJobCardProps) {
  const isNew = job.published_at && new Date(job.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const publishedDate = job.published_at
    ? formatDistanceToNow(new Date(job.published_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : null

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <Link href={`/vagas/${job.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isNew && (
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Nova
                  </Badge>
                )}
                {job.featured && (
                  <Badge variant="secondary">
                    Destaque
                  </Badge>
                )}
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {job.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {job.department && (
                  <span className="inline-flex items-center gap-1 mr-3">
                    <Building2 className="h-3 w-3" />
                    {job.department}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {job.location && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </Badge>
            )}

            {job.location_type && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {LOCATION_TYPE_LABELS[job.location_type]}
              </Badge>
            )}

            {job.job_type && (
              <Badge variant="outline" className="gap-1">
                <Briefcase className="h-3 w-3" />
                {JOB_TYPE_LABELS[job.job_type]}
              </Badge>
            )}

            {publishedDate && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Publicado {publishedDate}
              </Badge>
            )}
          </div>

          {job.show_salary && job.salary_min && job.salary_max && (
            <div className="mt-4 text-sm font-medium text-primary">
              R$ {job.salary_min.toLocaleString('pt-BR')} - R$ {job.salary_max.toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button variant="ghost" className="gap-2 group-hover:gap-3 transition-all">
            Ver detalhes
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Link>
    </Card>
  )
}
