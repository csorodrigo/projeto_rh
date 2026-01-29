'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CandidateCard } from './CandidateCard';
import type { KanbanCandidate, PipelineStage } from '@/types/recruitment';

interface KanbanColumnProps {
  stage: PipelineStage;
  candidates: KanbanCandidate[];
  onCandidateClick?: (candidate: KanbanCandidate) => void;
  onAddCandidate?: (stageId: string) => void;
}

export function KanbanColumn({
  stage,
  candidates,
  onCandidateClick,
  onAddCandidate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const candidateIds = candidates.map((c) => c.application_id);

  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px] w-full">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-4 rounded-t-lg"
        style={{
          backgroundColor: stage.color + '20', // 20 = opacity 12%
          borderTop: `3px solid ${stage.color}`,
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge
            variant="secondary"
            className="size-6 flex items-center justify-center p-0 text-xs"
            style={{
              backgroundColor: stage.color + '40',
              color: stage.color,
            }}
          >
            {candidates.length}
          </Badge>
        </div>

        {onAddCandidate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onAddCandidate(stage.id)}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {/* Column Content - Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-3 bg-muted/30 rounded-b-lg border-2 border-dashed transition-all duration-200',
          'min-h-[200px] max-h-[calc(100vh-280px)]',
          isOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-transparent'
        )}
      >
        <ScrollArea className="h-full pr-2">
          <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {candidates.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Nenhum candidato
                </div>
              ) : (
                candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.application_id}
                    candidate={candidate}
                    stageId={stage.id}
                    onClick={onCandidateClick}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
}
