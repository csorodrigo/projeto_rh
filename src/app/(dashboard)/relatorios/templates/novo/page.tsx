'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createTemplate } from '@/lib/supabase/queries/report-templates';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ReportType, ReportFormat, ReportColumn, ReportFilter, ReportConfig } from '@/types/reports';
import { REPORT_TYPE_FIELDS } from '@/types/reports';

// Steps
import { BasicConfigStep } from './BasicConfigStep';
import { ColumnsStep } from './ColumnsStep';
import { FiltersStep } from './FiltersStep';
import { PreviewStep } from './PreviewStep';

const STEPS = [
  { id: 1, name: 'Configuração Básica', description: 'Nome, tipo e formato' },
  { id: 2, name: 'Seleção de Colunas', description: 'Escolha os campos do relatório' },
  { id: 3, name: 'Filtros', description: 'Configure filtros avançados' },
  { id: 4, name: 'Preview', description: 'Revise e salve' },
];

export default function NovoTemplatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReportType>('employees');
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && type && format;
      case 2:
        return columns.filter(c => c.visible).length > 0;
      case 3:
        return true; // Filtros são opcionais
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const supabase = createClient();

      // Obter usuário e empresa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        toast.error('Empresa não encontrada');
        return;
      }

      // Criar configuração
      const config: ReportConfig = {
        columns,
        filters,
        includeHeaders: true,
      };

      // Criar template
      const template = await createTemplate({
        company_id: profile.company_id,
        name,
        description: description || undefined,
        type,
        config,
        format,
        created_by: user.id,
      });

      toast.success('Template criado com sucesso!');
      router.push('/relatorios/templates');
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/relatorios/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Novo Template de Relatório</h1>
        <p className="text-muted-foreground mt-2">
          Configure um relatório personalizado em 4 etapas simples
        </p>
      </div>

      {/* Steps indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium transition-colors',
                    currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <BasicConfigStep
              name={name}
              description={description}
              type={type}
              format={format}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onTypeChange={setType}
              onFormatChange={setFormat}
            />
          )}

          {currentStep === 2 && (
            <ColumnsStep
              type={type}
              columns={columns}
              onColumnsChange={setColumns}
            />
          )}

          {currentStep === 3 && (
            <FiltersStep
              type={type}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          {currentStep === 4 && (
            <PreviewStep
              name={name}
              description={description}
              type={type}
              format={format}
              columns={columns}
              filters={filters}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Voltar
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || !canGoNext()}>
              {saving ? 'Salvando...' : 'Salvar Template'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
