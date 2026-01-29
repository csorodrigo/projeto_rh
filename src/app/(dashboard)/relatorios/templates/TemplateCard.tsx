'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Star, Clock, Play, Edit, Trash2, Copy, Share2, MoreVertical, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { favoriteTemplate, unfavoriteTemplate, deleteTemplate, duplicateTemplate } from '@/lib/supabase/queries/report-templates';
import { toast } from 'sonner';
import type { ReportTemplate } from '@/types/reports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TemplateCardProps {
  template: ReportTemplate;
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  employees: 'Funcionários',
  time_records: 'Registro de Ponto',
  absences: 'Ausências',
  payroll: 'Folha de Pagamento',
  evaluations: 'Avaliações',
  health: 'Saúde',
  documents: 'Documentos',
  pdi: 'PDI',
  custom: 'Personalizado',
};

const FORMAT_LABELS: Record<string, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
};

export function TemplateCard({ template, onRefresh }: TemplateCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(template.is_favorite || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      if (isFavorite) {
        await unfavoriteTemplate(template.id, user.id);
        toast.success('Template removido dos favoritos');
      } else {
        await favoriteTemplate(template.id, user.id);
        toast.success('Template adicionado aos favoritos');
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      // Download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${template.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const newName = `${template.name} (Cópia)`;
      await duplicateTemplate(template.id, newName, user.id);

      toast.success('Template duplicado com sucesso');
      onRefresh();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error('Erro ao duplicar template');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTemplate(template.id);
      toast.success('Template excluído com sucesso');
      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir template');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {template.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                className="flex-shrink-0"
              >
                <Star
                  className={`h-4 w-4 ${
                    isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/relatorios/templates/${template.id}/compartilhar`}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{TYPE_LABELS[template.type]}</Badge>
              <Badge variant="outline">{FORMAT_LABELS[template.format]}</Badge>
              {template.categories?.map(cat => (
                <Badge key={cat.id} variant="secondary" style={{ backgroundColor: cat.color }}>
                  {cat.name}
                </Badge>
              ))}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Criado por {template.created_by_user?.name || 'Desconhecido'}</p>
              <p className="text-xs">
                {format(new Date(template.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {template.schedule && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Agendado:{' '}
                  {template.schedule.frequency === 'daily' && 'Diário'}
                  {template.schedule.frequency === 'weekly' && 'Semanal'}
                  {template.schedule.frequency === 'monthly' && 'Mensal'}
                  {template.schedule.frequency === 'custom' && 'Personalizado'}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href={`/relatorios/templates/${template.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {!template.schedule && (
            <Button variant="outline" asChild size="sm">
              <Link href={`/relatorios/templates/${template.id}/agendar`}>
                <Calendar className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template &quot;{template.name}&quot;? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
