'use client';

import React, { useState } from 'react';
import { GripVertical, Plus, Trash2, Palette } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PipelineStage } from '@/types/recruitment';
import { cn } from '@/lib/utils';

interface StageConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  onSave: (stages: PipelineStage[]) => void;
}

interface SortableStageItemProps {
  stage: PipelineStage;
  onUpdate: (id: string, updates: Partial<PipelineStage>) => void;
  onDelete: (id: string) => void;
}

const PRESET_COLORS = [
  '#64748b', // slate
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#10b981', // emerald
  '#22c55e', // green
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

function SortableStageItem({ stage, onUpdate, onDelete }: SortableStageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-card border rounded-lg',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="size-5 text-muted-foreground" />
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <Palette className="size-4 text-muted-foreground" />
        <div className="flex gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onUpdate(stage.id, { color })}
              className={cn(
                'size-6 rounded-full border-2 transition-all',
                stage.color === color
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Stage Name */}
      <div className="flex-1">
        <Input
          value={stage.name}
          onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
          placeholder="Nome do estágio"
          className="h-9"
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(stage.id)}
        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function StageConfigModal({ open, onOpenChange, stages, onSave }: StageConfigModalProps) {
  const [localStages, setLocalStages] = useState<PipelineStage[]>(stages);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);

        // Atualizar a ordem
        return reordered.map((stage, index) => ({
          ...stage,
          order: index + 1,
        }));
      });
    }
  };

  const handleUpdateStage = (id: string, updates: Partial<PipelineStage>) => {
    setLocalStages((prev) =>
      prev.map((stage) => (stage.id === id ? { ...stage, ...updates } : stage))
    );
  };

  const handleDeleteStage = (id: string) => {
    setLocalStages((prev) => {
      const filtered = prev.filter((stage) => stage.id !== id);
      // Reordenar
      return filtered.map((stage, index) => ({
        ...stage,
        order: index + 1,
      }));
    });
  };

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `stage_${Date.now()}`,
      name: 'Novo Estágio',
      order: localStages.length + 1,
      color: PRESET_COLORS[localStages.length % PRESET_COLORS.length],
    };

    setLocalStages((prev) => [...prev, newStage]);
  };

  const handleSave = () => {
    onSave(localStages);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalStages(stages);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Estágios do Pipeline</DialogTitle>
          <DialogDescription>
            Personalize os estágios do processo seletivo. Arraste para reordenar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localStages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localStages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onUpdate={handleUpdateStage}
                      onDelete={handleDeleteStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>

          <Button variant="outline" onClick={handleAddStage} className="w-full">
            <Plus className="size-4 mr-2" />
            Adicionar Estágio
          </Button>

          <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Dicas:</p>
            <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
              <li>Arraste os estágios para reordenar o pipeline</li>
              <li>Escolha cores diferentes para cada estágio</li>
              <li>Estágios não podem ser deletados se tiverem candidatos</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
