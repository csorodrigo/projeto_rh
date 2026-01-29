'use client';

import { FilterBuilder } from '@/components/reports/FilterBuilder';
import type { ReportType, ReportFilter } from '@/types/reports';
import { REPORT_TYPE_FIELDS } from '@/types/reports';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FiltersStepProps {
  type: ReportType;
  filters: ReportFilter[];
  onFiltersChange: (filters: ReportFilter[]) => void;
}

export function FiltersStep({ type, filters, onFiltersChange }: FiltersStepProps) {
  const availableFields = REPORT_TYPE_FIELDS[type] || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Configure Filtros Avançados</h3>
        <p className="text-sm text-muted-foreground">
          Adicione filtros para limitar os dados que aparecerão no relatório
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Os filtros são opcionais. Se nenhum filtro for configurado, todos os dados do tipo
          selecionado serão incluídos no relatório.
        </AlertDescription>
      </Alert>

      <FilterBuilder
        filters={filters}
        availableFields={availableFields}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
}
