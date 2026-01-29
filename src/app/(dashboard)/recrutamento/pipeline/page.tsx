'use client';

import React, { useState, useMemo } from 'react';
import { Filter, Search, Star, Tag, Calendar, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/recruitment/KanbanBoard';
import { CandidateDetailModal } from '@/components/recruitment/CandidateDetailModal';
import { useKanban } from '@/hooks/use-kanban';
import { applicationToKanbanCard } from '@/lib/recruitment/kanban-utils';
import type { KanbanCandidate, KanbanFilters } from '@/types/recruitment';

export default function PipelinePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<KanbanCandidate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Hook do Kanban (todas as vagas)
  const {
    stages,
    applications,
    filters,
    setFilters,
    stats,
    moveApplication,
    updateRating,
    isLoading,
    refetch,
  } = useKanban({
    enableRealtime: true,
  });

  // Converter aplicações para cards do Kanban
  const candidates = useMemo(() => {
    return applications.map((app) => applicationToKanbanCard(app));
  }, [applications]);

  // Agrupar candidatos por estágio
  const candidatesByStage = useMemo(() => {
    const grouped: Record<string, KanbanCandidate[]> = {};

    stages.forEach((stage) => {
      grouped[stage.id] = candidates.filter((c) => c.current_stage === stage.id);
    });

    return grouped;
  }, [candidates, stages]);

  // Handlers
  const handleMoveCandidate = async (
    candidateId: string,
    fromStage: string,
    toStage: string
  ) => {
    await moveApplication(candidateId, fromStage, toStage);
  };

  const handleCandidateClick = (candidate: KanbanCandidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  const handleUpdateRating = async (candidateId: string, rating: number) => {
    await updateRating(candidateId, rating);
  };

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search });
  };

  const handleRatingFilter = (rating: string) => {
    setFilters({
      ...filters,
      minRating: rating === 'all' ? undefined : parseInt(rating),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pipeline de Candidatos</h1>
            <p className="text-muted-foreground">
              Gerencie candidatos através do processo seletivo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Atualizar
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Adicionar Candidato
            </Button>
          </div>
        </div>

        {/* Filtros e Estatísticas */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar candidato por nome ou email..."
              className="pl-9"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filtro de Rating */}
          <Select
            value={filters.minRating?.toString() || 'all'}
            onValueChange={handleRatingFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Star className="size-4 mr-2" />
              <SelectValue placeholder="Filtrar por rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ratings</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4+ estrelas</SelectItem>
              <SelectItem value="3">3+ estrelas</SelectItem>
              <SelectItem value="2">2+ estrelas</SelectItem>
              <SelectItem value="1">1+ estrelas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtros Avançados */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4 mr-2" />
                Filtros
                {(filters.tags?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5">
                    {filters.tags?.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Filtros Avançados</h4>
                  <p className="text-sm text-muted-foreground">
                    Refine a busca de candidatos
                  </p>
                </div>

                <Separator />

                {/* Filtro por tags */}
                <div className="space-y-2">
                  <Label className="text-sm">Tags</Label>
                  <div className="text-sm text-muted-foreground">
                    Filtro por tags em desenvolvimento
                  </div>
                </div>

                {/* Filtro por data */}
                <div className="space-y-2">
                  <Label className="text-sm">Período de candidatura</Label>
                  <div className="text-sm text-muted-foreground">
                    Filtro por data em desenvolvimento
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters({})}
                >
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Estatísticas */}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Total: {stats.total}
            </Badge>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="min-w-[320px]">
                <CardContent className="p-4 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <KanbanBoard
            stages={stages}
            candidatesByStage={candidatesByStage}
            onMoveCandidate={handleMoveCandidate}
            onCandidateClick={handleCandidateClick}
          />
        )}
      </div>

      {/* Modal de Detalhes do Candidato */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onUpdateRating={handleUpdateRating}
      />
    </div>
  );
}
