'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ReportType, ReportFormat } from '@/types/reports';
import { FileText, FileSpreadsheet, FileType } from 'lucide-react';

interface BasicConfigStepProps {
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTypeChange: (value: ReportType) => void;
  onFormatChange: (value: ReportFormat) => void;
}

const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  {
    value: 'employees',
    label: 'Funcionários',
    description: 'Dados cadastrais dos funcionários',
  },
  {
    value: 'time_records',
    label: 'Registro de Ponto',
    description: 'Entradas, saídas e horas trabalhadas',
  },
  {
    value: 'absences',
    label: 'Ausências',
    description: 'Férias, atestados e faltas',
  },
  {
    value: 'payroll',
    label: 'Folha de Pagamento',
    description: 'Salários, bônus e descontos',
  },
  {
    value: 'evaluations',
    label: 'Avaliações',
    description: 'Avaliações de desempenho',
  },
  {
    value: 'health',
    label: 'Saúde',
    description: 'Exames e registros de saúde',
  },
  {
    value: 'documents',
    label: 'Documentos',
    description: 'Documentos dos funcionários',
  },
  {
    value: 'pdi',
    label: 'PDI',
    description: 'Planos de Desenvolvimento Individual',
  },
];

const FORMAT_OPTIONS: Array<{
  value: ReportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Formato universal, compatível com Excel e planilhas',
    icon: FileType,
  },
  {
    value: 'xlsx',
    label: 'Excel',
    description: 'Planilha do Excel com formatação',
    icon: FileSpreadsheet,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Documento formatado, pronto para impressão',
    icon: FileText,
  },
];

export function BasicConfigStep({
  name,
  description,
  type,
  format,
  onNameChange,
  onDescriptionChange,
  onTypeChange,
  onFormatChange,
}: BasicConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome do Template <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: Relatório Mensal de Funcionários"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Escolha um nome descritivo para identificar o template facilmente
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Descreva o propósito deste relatório..."
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">
          Tipo de Relatório <span className="text-destructive">*</span>
        </Label>
        <Select value={type} onValueChange={value => onTypeChange(value as ReportType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map(reportType => (
              <SelectItem key={reportType.value} value={reportType.value}>
                <div>
                  <div className="font-medium">{reportType.label}</div>
                  <div className="text-xs text-muted-foreground">{reportType.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define quais dados estarão disponíveis no relatório
        </p>
      </div>

      <div className="space-y-3">
        <Label>
          Formato de Saída <span className="text-destructive">*</span>
        </Label>
        <RadioGroup value={format} onValueChange={value => onFormatChange(value as ReportFormat)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FORMAT_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className="relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {format === option.value && (
                    <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
