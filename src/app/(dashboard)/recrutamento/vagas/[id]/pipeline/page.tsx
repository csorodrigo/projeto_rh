'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Filter, Search, Star, ArrowLeft, Plus, Settings } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/recruitment/KanbanBoard';
import { CandidateDetailModal } from '@/components/recruitment/CandidateDetailModal';
import { useKanban } from '@/hooks/use-kanban';
import { applicationToKanbanCard } from '@/lib/recruitment/kanban-utils';
import type { KanbanCandidate } from '@/types/recruitment';

export default function JobPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [selectedCandidate, setSelectedCandidate] = useState<KanbanCandidate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Hook do Kanban para esta vaga específica
  const {
    job,
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
    jobId,
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

  const handleBack = () => {
    router.push('/recrutamento/vagas');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {isLoading ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{job?.title || 'Carregando...'}</h1>
                  {job?.code && (
                    <Badge variant="secondary" className="text-sm">
                      {job.code}
                    </Badge>
                  )}
                  {job?.status && (
                    <Badge
                      variant={job.status === 'open' ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {job.status === 'open' && 'Aberta'}
                      {job.status === 'paused' && 'Pausada'}
                      {job.status === 'closed' && 'Fechada'}
                      {job.status === 'draft' && 'Rascunho'}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-muted-foreground">Pipeline de candidatos desta vaga</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="size-4 mr-2" />
              Configurar Estágios
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Adicionar Candidato
            </Button>
          </div>
        </div>

        {/* Informações da Vaga */}
        {job && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                {job.department && (
                  <div>
                    <span className="text-muted-foreground">Departamento:</span>
                    <span className="ml-2 font-medium">{job.department}</span>
                  </div>
                )}
                {job.location && (
                  <div>
                    <span className="text-muted-foreground">Local:</span>
                    <span className="ml-2 font-medium">{job.location}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Vagas:</span>
                  <span className="ml-2 font-medium">
                    {job.positions_filled}/{job.positions_available}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

          {/* Estatísticas */}
          <div className="ml-auto flex items-center gap-4">
            {/* Estatísticas por estágio */}
            <div className="flex items-center gap-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm"
                  style={{
                    backgroundColor: stage.color + '20',
                  }}
                >
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium">{stats.byStage[stage.id] || 0}</span>
                </div>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

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
