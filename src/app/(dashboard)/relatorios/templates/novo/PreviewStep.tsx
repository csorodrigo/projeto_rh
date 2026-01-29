'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportType, ReportFormat, ReportColumn, ReportFilter } from '@/types/reports';
import { FileText, Filter, Columns } from 'lucide-react';

interface PreviewStepProps {
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  columns: ReportColumn[];
  filters: ReportFilter[];
}

const TYPE_LABELS: Record<ReportType, string> = {
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

const FORMAT_LABELS: Record<ReportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'Igual a',
  not_equals: 'Diferente de',
  contains: 'Contém',
  not_contains: 'Não contém',
  starts_with: 'Começa com',
  ends_with: 'Termina com',
  in: 'Está em',
  not_in: 'Não está em',
  greater_than: 'Maior que',
  greater_than_or_equal: 'Maior ou igual a',
  less_than: 'Menor que',
  less_than_or_equal: 'Menor ou igual a',
  between: 'Entre',
  is_null: 'É nulo',
  is_not_null: 'Não é nulo',
};

export function PreviewStep({
  name,
  description,
  type,
  format,
  columns,
  filters,
}: PreviewStepProps) {
  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Revise a Configuração</h3>
        <p className="text-sm text-muted-foreground">
          Confira todas as configurações antes de salvar o template
        </p>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Nome</div>
            <div className="text-base mt-1">{name}</div>
          </div>

          {description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Descrição</div>
              <div className="text-base mt-1">{description}</div>
            </div>
          )}

          <div className="flex gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Tipo</div>
              <Badge className="mt-1">{TYPE_LABELS[type]}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Formato</div>
              <Badge variant="outline" className="mt-1">
                {FORMAT_LABELS[format]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colunas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Columns className="h-4 w-4" />
            Colunas Selecionadas ({visibleColumns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {visibleColumns.map(col => (
              <Badge key={col.id} variant="secondary">
                {col.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros ({filters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum filtro configurado</p>
          ) : (
            <div className="space-y-2">
              {filters.map((filter, index) => (
                <div key={filter.id} className="text-sm">
                  {index > 0 && filters[index - 1].logic && (
                    <div className="text-xs text-muted-foreground font-medium mb-1">
                      {filters[index - 1].logic}
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Badge variant="outline">{filter.field}</Badge>
                    <span className="text-muted-foreground">
                      {OPERATOR_LABELS[filter.operator] || filter.operator}
                    </span>
                    {filter.operator !== 'is_null' && filter.operator !== 'is_not_null' && (
                      <Badge>{Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p className="font-medium">Seu template está pronto!</p>
            <p className="text-muted-foreground">
              Ao salvar, você poderá:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Gerar relatórios a qualquer momento</li>
              <li>Agendar geração automática</li>
              <li>Compartilhar com outros usuários</li>
              <li>Editar ou duplicar o template</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
