"use client";

import { Activity, ActivityWithUser } from "@/types/recruitment";
import {
  getActivityIcon,
  formatActivityDescription,
  formatRelativeTime,
  formatFullDate,
} from "@/lib/recruitment/candidate-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateTimelineProps {
  activities: ActivityWithUser[];
  maxHeight?: string;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function CandidateTimeline({
  activities,
  maxHeight = "600px",
  showLoadMore = false,
  onLoadMore,
  isLoading = false,
}: CandidateTimelineProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set()
  );

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma atividade registrada</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea style={{ maxHeight }}>
        <div className="relative space-y-6 pr-4">
          {/* Linha vertical */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const isExpanded = expandedActivities.has(activity.id);
            const hasComment = Boolean(activity.comment);

            return (
              <div key={activity.id} className="relative flex gap-4">
                {/* Ícone */}
                <div
                  className={cn(
                    "relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-background",
                    getActivityIconColor(activity.type)
                  )}
                >
                  <Icon className="size-4 text-white" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 space-y-2 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      {/* Descrição */}
                      <p className="text-sm font-medium leading-none">
                        {formatActivityDescription(activity)}
                      </p>

                      {/* Autor e tempo */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.performer && (
                          <>
                            <Avatar className="size-4">
                              <AvatarImage
                                src={activity.performer.avatar_url || undefined}
                                alt={activity.performer.name}
                              />
                              <AvatarFallback className="text-[8px]">
                                {activity.performer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {activity.performer.name}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span
                          title={formatFullDate(activity.created_at)}
                          className="cursor-help"
                        >
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Badge de tipo */}
                    <Badge variant="outline" className="text-xs">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>

                  {/* Comentário expansível */}
                  {hasComment && (
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "rounded-lg bg-muted p-3 text-sm",
                          !isExpanded && "line-clamp-2"
                        )}
                      >
                        {activity.comment}
                      </div>
                      {activity.comment && activity.comment.length > 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(activity.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-1 size-3" />
                              Mostrar menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 size-3" />
                              Mostrar mais
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Detalhes específicos */}
                  {activity.details && (
                    <div className="text-xs text-muted-foreground">
                      {renderActivityDetails(activity)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Load more */}
      {showLoadMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Carregando..." : "Carregar mais atividades"}
          </Button>
        </div>
      )}
    </div>
  );
}

function getActivityIconColor(type: string): string {
  const colorMap: Record<string, string> = {
    status_change: "bg-blue-500",
    comment: "bg-gray-500",
    interview_scheduled: "bg-purple-500",
    interview_completed: "bg-green-500",
    rating: "bg-yellow-500",
    document_uploaded: "bg-indigo-500",
    email_sent: "bg-cyan-500",
    call_logged: "bg-orange-500",
    assessment_completed: "bg-emerald-500",
    offer_sent: "bg-pink-500",
    offer_accepted: "bg-green-600",
    offer_rejected: "bg-red-500",
  };

  return colorMap[type] || "bg-gray-500";
}

function getActivityTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    status_change: "Mudança de Status",
    comment: "Comentário",
    interview_scheduled: "Entrevista Agendada",
    interview_completed: "Entrevista Concluída",
    rating: "Avaliação",
    document_uploaded: "Documento",
    email_sent: "Email",
    call_logged: "Ligação",
    assessment_completed: "Teste",
    offer_sent: "Proposta",
    offer_accepted: "Aceite",
    offer_rejected: "Recusa",
  };

  return labelMap[type] || "Atividade";
}

function renderActivityDetails(activity: Activity): React.ReactNode {
  if (!activity.details) return null;

  const details = activity.details as Record<string, any>;

  return (
    <div className="space-y-1">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="font-medium capitalize">
            {key.replace(/_/g, " ")}:
          </span>
          <span>{String(value)}</span>
        </div>
      ))}
    </div>
  );
}
