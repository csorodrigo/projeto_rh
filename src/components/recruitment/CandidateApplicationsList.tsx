"use client";

import { ApplicationWithJob } from "@/types/recruitment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getStatusColor,
  getStatusLabel,
  formatRelativeTime,
  formatFullDate,
  getSourceBadge,
} from "@/lib/recruitment/candidate-utils";
import { ExternalLink, MapPin, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CandidateApplicationsListProps {
  applications: ApplicationWithJob[];
  onApplicationClick?: (applicationId: string) => void;
}

export function CandidateApplicationsList({
  applications,
  onApplicationClick,
}: CandidateApplicationsListProps) {
  if (applications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Este candidato ainda não aplicou para nenhuma vaga
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onClick={() => onApplicationClick?.(application.id)}
        />
      ))}
    </div>
  );
}

interface ApplicationCardProps {
  application: ApplicationWithJob;
  onClick?: () => void;
}

function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const statusColor = getStatusColor(application.status);
  const sourceBadge = getSourceBadge(application.source);

  return (
    <Card
      className={cn(
        "p-4 transition-shadow hover:shadow-md",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{application.job_title}</h3>
              <Link
                href={`/recrutamento/vagas/${application.job_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </Link>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Briefcase className="size-3" />
                <span>{application.job_department}</span>
              </div>
              {application.job?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span>{application.job.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              statusColor === "blue" && "border-blue-500 text-blue-700 dark:text-blue-400",
              statusColor === "yellow" && "border-yellow-500 text-yellow-700 dark:text-yellow-400",
              statusColor === "purple" && "border-purple-500 text-purple-700 dark:text-purple-400",
              statusColor === "green" && "border-green-500 text-green-700 dark:text-green-400",
              statusColor === "emerald" && "border-emerald-500 text-emerald-700 dark:text-emerald-400",
              statusColor === "red" && "border-red-500 text-red-700 dark:text-red-400",
              statusColor === "gray" && "border-gray-500 text-gray-700 dark:text-gray-400"
            )}
          >
            {getStatusLabel(application.status)}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Aplicado em</p>
            <p className="font-medium" title={formatFullDate(application.applied_at)}>
              {formatRelativeTime(application.applied_at)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Origem</p>
            <Badge variant="secondary" className="w-fit text-xs">
              {sourceBadge.label}
            </Badge>
          </div>

          {application.current_stage_id && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estágio Atual</p>
              <p className="font-medium">
                {getStageName(application.job?.pipeline_stages, application.current_stage_id)}
              </p>
            </div>
          )}

          {application.overall_rating && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avaliação</p>
              <div className="flex items-center gap-1">
                <span className="font-medium">{application.overall_rating}</span>
                <span className="text-xs text-muted-foreground">/ 5</span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline de datas importantes */}
        {hasImportantDates(application) && (
          <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
            {application.interview_scheduled_at && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Entrevista: {formatRelativeTime(application.interview_scheduled_at)}</span>
              </div>
            )}
            {application.offer_sent_at && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Proposta: {formatRelativeTime(application.offer_sent_at)}</span>
              </div>
            )}
            {application.hired_at && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Contratado: {formatRelativeTime(application.hired_at)}</span>
              </div>
            )}
          </div>
        )}

        {/* Rejection reason */}
        {application.status === "rejected" && application.rejection_reason && (
          <div className="rounded-md bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <p className="font-medium">Motivo da rejeição:</p>
            <p className="text-xs">{application.rejection_reason}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function getStageName(stages: any[] | undefined, stageId: string): string {
  if (!stages) return "N/A";
  const stage = stages.find((s) => s.id === stageId);
  return stage?.name || "N/A";
}

function hasImportantDates(application: ApplicationWithJob): boolean {
  return Boolean(
    application.interview_scheduled_at ||
      application.offer_sent_at ||
      application.hired_at
  );
}
