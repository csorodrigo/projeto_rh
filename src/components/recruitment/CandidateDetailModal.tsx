'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  FileText,
  MessageSquare,
  Activity,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { KanbanCandidate } from '@/types/recruitment';
import { getInitials, formatTimeInStage } from '@/lib/recruitment/kanban-utils';

interface CandidateDetailModalProps {
  candidate: KanbanCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRating?: (candidateId: string, rating: number) => void;
  onAddComment?: (candidateId: string, comment: string, rating?: number) => void;
}

export function CandidateDetailModal({
  candidate,
  open,
  onOpenChange,
  onUpdateRating,
  onAddComment,
}: CandidateDetailModalProps) {
  const [comment, setComment] = useState('');
  const [commentRating, setCommentRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  if (!candidate) return null;

  const handleUpdateRating = (rating: number) => {
    setSelectedRating(rating);
    onUpdateRating?.(candidate.application_id, rating);
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onAddComment?.(candidate.application_id, comment, commentRating || undefined);
      setComment('');
      setCommentRating(0);
    }
  };

  const appliedDate = format(new Date(candidate.applied_at), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={candidate.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{candidate.name}</h2>
              {candidate.current_position && (
                <p className="text-sm text-muted-foreground">{candidate.current_position}</p>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do candidato {candidate.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="resume">Currículo</TabsTrigger>
            <TabsTrigger value="activity">Atividades</TabsTrigger>
            <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="profile" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Informações de Contato */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Informações de Contato</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <span>{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span>{candidate.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Skills */}
                {candidate.skills.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Habilidades</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Tags */}
                {candidate.tags.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span>Candidatou-se em {appliedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <span>Tempo no estágio: {formatTimeInStage(candidate.time_in_stage)}</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {candidate.rating && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Avaliação Atual</h3>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-5 ${
                              star <= (candidate.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium ml-2">{candidate.rating}/5</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Currículo */}
          <TabsContent value="resume" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              {candidate.resume_url ? (
                <div className="space-y-4">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-4 mr-2" />
                      Abrir Currículo
                    </a>
                  </Button>
                  <div className="text-sm text-muted-foreground text-center">
                    Visualize o currículo completo do candidato
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Nenhum currículo anexado
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab: Atividades */}
          <TabsContent value="activity" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground text-center py-8">
                  Timeline de atividades em desenvolvimento
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Avaliação */}
          <TabsContent value="evaluation" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Avaliar candidato */}
                <div>
                  <Label className="text-sm font-semibold">Avaliar Candidato</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleUpdateRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`size-6 ${
                            star <= (selectedRating || candidate.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Adicionar comentário */}
                <div className="space-y-3">
                  <Label htmlFor="comment" className="text-sm font-semibold">
                    Adicionar Comentário
                  </Label>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Avaliação do comentário (opcional)
                    </Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCommentRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`size-5 ${
                              star <= commentRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    id="comment"
                    placeholder="Adicione suas observações sobre este candidato..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />

                  <Button
                    onClick={handleSubmitComment}
                    disabled={!comment.trim()}
                    className="w-full"
                  >
                    <MessageSquare className="size-4 mr-2" />
                    Adicionar Comentário
                  </Button>
                </div>

                <Separator />

                {/* Lista de comentários */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">
                    Comentários e Avaliações
                  </Label>
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
