'use client';

import { useState } from 'react';
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
import { GripVertical, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ReportColumn, FieldDefinition } from '@/types/reports';

interface FieldSelectorProps {
  availableFields: FieldDefinition[];
  selectedColumns: ReportColumn[];
  onColumnsChange: (columns: ReportColumn[]) => void;
}

interface SortableFieldProps {
  column: ReportColumn;
  isSelected: boolean;
  onToggle: () => void;
  onVisibilityToggle?: () => void;
}

function SortableField({ column, isSelected, onToggle, onVisibilityToggle }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
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
        'flex items-center gap-2 p-3 rounded-md border bg-card',
        isDragging && 'opacity-50 shadow-lg',
        !column.visible && 'opacity-60'
      )}
    >
      {isSelected && (
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Checkbox checked={isSelected} onCheckedChange={onToggle} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{column.label}</p>
        <p className="text-xs text-muted-foreground truncate">{column.field}</p>
      </div>

      {isSelected && onVisibilityToggle && (
        <Button variant="ghost" size="icon" onClick={onVisibilityToggle}>
          {column.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
}

export function FieldSelector({
  availableFields,
  selectedColumns,
  onColumnsChange,
}: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedColumns.findIndex(col => col.id === active.id);
      const newIndex = selectedColumns.findIndex(col => col.id === over.id);

      onColumnsChange(arrayMove(selectedColumns, oldIndex, newIndex));
    }
  };

  const toggleField = (field: FieldDefinition) => {
    const isSelected = selectedColumns.some(col => col.field === field.field);

    if (isSelected) {
      onColumnsChange(selectedColumns.filter(col => col.field !== field.field));
    } else {
      const newColumn: ReportColumn = {
        id: field.field,
        field: field.field,
        label: field.label,
        type: field.type as any,
        visible: true,
      };
      onColumnsChange([...selectedColumns, newColumn]);
    }
  };

  const toggleVisibility = (columnId: string) => {
    onColumnsChange(
      selectedColumns.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const selectAll = () => {
    const allColumns = availableFields.map(
      field =>
        ({
          id: field.field,
          field: field.field,
          label: field.label,
          type: field.type,
          visible: true,
        } as ReportColumn)
    );
    onColumnsChange(allColumns);
  };

  const clearAll = () => {
    onColumnsChange([]);
  };

  const moveAllToSelected = () => {
    const availableNotSelected = availableFields.filter(
      field => !selectedColumns.some(col => col.field === field.field)
    );

    const newColumns = availableNotSelected.map(
      field =>
        ({
          id: field.field,
          field: field.field,
          label: field.label,
          type: field.type,
          visible: true,
        } as ReportColumn)
    );

    onColumnsChange([...selectedColumns, ...newColumns]);
  };

  const filteredFields = availableFields.filter(
    field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableNotSelected = filteredFields.filter(
    field => !selectedColumns.some(col => col.field === field.field)
  );

  const selectedColumnsFiltered = selectedColumns
    .map(col => {
      const field = availableFields.find(f => f.field === col.field);
      return field ? { column: col, field } : null;
    })
    .filter(Boolean) as Array<{ column: ReportColumn; field: FieldDefinition }>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Campos Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Campos Disponíveis</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={moveAllToSelected}
                disabled={availableNotSelected.length === 0}
              >
                Adicionar Todos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Buscar campos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mt-2 w-full px-3 py-2 text-sm border rounded-md"
          />
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {availableNotSelected.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todos os campos foram selecionados
            </p>
          ) : (
            availableNotSelected.map(field => {
              const column: ReportColumn = {
                id: field.field,
                field: field.field,
                label: field.label,
                type: field.type as any,
                visible: true,
              };

              return (
                <SortableField
                  key={field.field}
                  column={column}
                  isSelected={false}
                  onToggle={() => toggleField(field)}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Campos Selecionados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Campos Selecionados ({selectedColumns.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={selectedColumns.length === 0}
            >
              Limpar Todos
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar. Use o ícone de olho para ocultar campos.
          </p>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {selectedColumns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum campo selecionado
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedColumns.map(col => col.id)}
                strategy={verticalListSortingStrategy}
              >
                {selectedColumnsFiltered.map(({ column, field }) => (
                  <SortableField
                    key={column.id}
                    column={column}
                    isSelected={true}
                    onToggle={() => toggleField(field)}
                    onVisibilityToggle={() => toggleVisibility(column.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
