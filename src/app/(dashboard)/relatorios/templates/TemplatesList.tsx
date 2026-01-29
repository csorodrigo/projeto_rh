'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { listTemplates, getMyTemplates, getFavoriteTemplates, getSharedWithMeTemplates } from '@/lib/supabase/queries/report-templates';
import { TemplateCard } from './TemplateCard';
import type { ReportTemplate } from '@/types/reports';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TemplatesListProps {
  filter: 'all' | 'favorites' | 'mine' | 'shared' | 'scheduled';
}

export function TemplatesList({ filter }: TemplatesListProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Obter usuário e profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        setError('Empresa não encontrada');
        return;
      }

      let data: ReportTemplate[] = [];

      switch (filter) {
        case 'all':
          data = await listTemplates({ company_id: profile.company_id });
          break;

        case 'favorites':
          data = await getFavoriteTemplates(user.id, profile.company_id);
          break;

        case 'mine':
          data = await getMyTemplates(user.id, profile.company_id);
          break;

        case 'shared':
          data = await getSharedWithMeTemplates(user.id);
          break;

        case 'scheduled':
          const all = await listTemplates({ company_id: profile.company_id });
          data = all.filter(t => t.schedule?.active);
          break;
      }

      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTemplates();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="h-64 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {filter === 'favorites' && 'Você ainda não favoritou nenhum template'}
          {filter === 'mine' && 'Você ainda não criou nenhum template'}
          {filter === 'shared' && 'Nenhum template foi compartilhado com você'}
          {filter === 'scheduled' && 'Nenhum template está agendado'}
          {filter === 'all' && 'Nenhum template encontrado'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
}
