'use client';

import React from 'react';
import { Mail, Phone, MapPin, Star, Clock, FileText, ExternalLink } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { KanbanCandidate } from '@/types/recruitment';
import { getInitials, formatTimeInStage, getTimeAlertColor } from '@/lib/recruitment/kanban-utils';

interface CandidateCardProps {
  candidate: KanbanCandidate;
  stageId: string;
  onClick?: (candidate: KanbanCandidate) => void;
}

export function CandidateCard({ candidate, stageId, onClick }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.application_id,
    data: {
      stageId,
      candidate,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Não abrir modal se estiver clicando em link de currículo
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    onClick?.(candidate);
  };

  const timeInStageFormatted = formatTimeInStage(candidate.time_in_stage);
  const timeAlertColor = getTimeAlertColor(candidate.time_in_stage);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'cursor-grab active:cursor-grabbing border-l-4 transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5',
        isDragging && 'opacity-50 scale-95 shadow-2xl',
        'border-l-blue-500'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header com Avatar e Nome */}
        <div className="flex items-start gap-3">
          <Avatar className="size-10 flex-shrink-0">
            <AvatarImage src={candidate.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{candidate.name}</h4>
            {candidate.current_position && (
              <p className="text-xs text-muted-foreground truncate">
                {candidate.current_position}
              </p>
            )}
          </div>

          {/* Rating */}
          {candidate.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{candidate.rating}</span>
            </div>
          )}
        </div>

        {/* Contato */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="size-3 flex-shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>

          {candidate.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-3 flex-shrink-0" />
              <span className="truncate">{candidate.phone}</span>
            </div>
          )}

          {candidate.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3 flex-shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                +{candidate.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {candidate.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {candidate.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{candidate.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer com tempo e ações */}
        <div className="flex items-center justify-between pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1.5 text-xs', timeAlertColor)}>
                  <Clock className="size-3" />
                  <span>{timeInStageFormatted}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tempo neste estágio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Ações rápidas */}
          <div className="flex items-center gap-1">
            {candidate.resume_url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-3" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver currículo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.(candidate);
                    }}
                  >
                    <ExternalLink className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver detalhes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
