"use client"

import * as React from "react"
import Link from "next/link"
import {
  MapPin,
  Briefcase,
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Archive,
  Play,
  Pause,
  XCircle,
} from "lucide-react"
import { Job, JobStatus } from "@/lib/types/recruitment"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface JobCardProps {
  job: Job
  onStatusChange?: (jobId: string, status: JobStatus) => void
  onDuplicate?: (jobId: string) => void
  onArchive?: (jobId: string) => void
}

const statusConfig = {
  open: {
    label: "Aberta",
    variant: "default" as const,
    color: "bg-green-500",
  },
  paused: {
    label: "Pausada",
    variant: "secondary" as const,
    color: "bg-yellow-500",
  },
  closed: {
    label: "Fechada",
    variant: "outline" as const,
    color: "bg-gray-500",
  },
  draft: {
    label: "Rascunho",
    variant: "outline" as const,
    color: "bg-gray-400",
  },
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

export function JobCard({ job, onStatusChange, onDuplicate, onArchive }: JobCardProps) {
  const statusInfo = statusConfig[job.status]
  const applicationsCount = job.applications_count || 0

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <div className={cn("size-2 rounded-full", statusInfo.color)} />
            </div>
            <CardTitle className="text-xl mb-1">
              <Link
                href={`/recrutamento/vagas/${job.id}`}
                className="hover:text-primary transition-colors"
              >
                {job.title}
              </Link>
            </CardTitle>
            <CardDescription>{job.department}</CardDescription>
          </div>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
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
                <DropdownMenuItem onClick={() => onDuplicate?.(job.id)}>
                  <Copy className="mr-2 size-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {job.status === "open" && (
                  <DropdownMenuItem onClick={() => onStatusChange?.(job.id, "paused")}>
                    <Pause className="mr-2 size-4" />
                    Pausar
                  </DropdownMenuItem>
                )}
                {job.status === "paused" && (
                  <DropdownMenuItem onClick={() => onStatusChange?.(job.id, "open")}>
                    <Play className="mr-2 size-4" />
                    Reabrir
                  </DropdownMenuItem>
                )}
                {(job.status === "open" || job.status === "paused") && (
                  <DropdownMenuItem onClick={() => onStatusChange?.(job.id, "closed")}>
                    <XCircle className="mr-2 size-4" />
                    Fechar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onArchive?.(job.id)}
                >
                  <Archive className="mr-2 size-4" />
                  Arquivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <span>{locationTypeLabels[job.location_type]}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-4" />
            <span>{jobTypeLabels[job.job_type]}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span>
              {applicationsCount} candidato{applicationsCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span>{new Date(job.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {/* Progress */}
        {job.positions > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vagas preenchidas</span>
              <span className="font-medium">
                {job.positions_filled} / {job.positions}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${(job.positions_filled / job.positions) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/recrutamento/vagas/${job.id}`}>Ver Detalhes</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={`/recrutamento/vagas/${job.id}/candidatos`}>Ver Candidatos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
