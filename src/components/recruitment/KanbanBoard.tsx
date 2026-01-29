'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard';
import type { KanbanCandidate, PipelineStage } from '@/types/recruitment';

interface KanbanBoardProps {
  stages: PipelineStage[];
  candidatesByStage: Record<string, KanbanCandidate[]>;
  onMoveCandidate: (candidateId: string, fromStage: string, toStage: string) => void;
  onCandidateClick?: (candidate: KanbanCandidate) => void;
  onAddCandidate?: (stageId: string) => void;
  className?: string;
}

export function KanbanBoard({
  stages,
  candidatesByStage,
  onMoveCandidate,
  onCandidateClick,
  onAddCandidate,
  className,
}: KanbanBoardProps) {
  const [activeCandidate, setActiveCandidate] = useState<KanbanCandidate | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Configurar sensores de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento para ativar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const candidate = active.data.current?.candidate as KanbanCandidate;
    const stageId = active.data.current?.stageId as string;

    setActiveCandidate(candidate);
    setActiveStageId(stageId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCandidate(null);
    setActiveStageId(null);

    if (!over) return;

    const fromStageId = active.data.current?.stageId as string;
    const toStageId = over.id as string;

    // Não fazer nada se soltar no mesmo estágio
    if (fromStageId === toStageId) return;

    const candidateId = active.id as string;

    // Executar callback de movimentação
    onMoveCandidate(candidateId, fromStageId, toStageId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className={cn('w-full whitespace-nowrap', className)}>
        <div className="flex gap-4 p-1">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              candidates={candidatesByStage[stage.id] || []}
              onCandidateClick={onCandidateClick}
              onAddCandidate={onAddCandidate}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Drag Overlay - Card sendo arrastado */}
      <DragOverlay>
        {activeCandidate && activeStageId ? (
          <div className="rotate-3 scale-105 opacity-90">
            <CandidateCard
              candidate={activeCandidate}
              stageId={activeStageId}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
