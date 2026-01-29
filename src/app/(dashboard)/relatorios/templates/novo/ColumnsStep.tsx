'use client';

import { useEffect } from 'react';
import { FieldSelector } from '@/components/reports/FieldSelector';
import type { ReportType, ReportColumn } from '@/types/reports';
import { REPORT_TYPE_FIELDS, DEFAULT_CONFIGS } from '@/types/reports';

interface ColumnsStepProps {
  type: ReportType;
  columns: ReportColumn[];
  onColumnsChange: (columns: ReportColumn[]) => void;
}

export function ColumnsStep({ type, columns, onColumnsChange }: ColumnsStepProps) {
  // Inicializar com colunas padrão se estiver vazio
  useEffect(() => {
    if (columns.length === 0) {
      const defaultConfig = DEFAULT_CONFIGS[type];
      if (defaultConfig?.columns) {
        onColumnsChange(defaultConfig.columns as ReportColumn[]);
      }
    }
  }, [type]); // Não incluir columns para evitar loop

  const availableFields = REPORT_TYPE_FIELDS[type] || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Selecione os Campos do Relatório</h3>
        <p className="text-sm text-muted-foreground">
          Escolha quais informações aparecerão no relatório e organize a ordem arrastando os campos
        </p>
      </div>

      <FieldSelector
        availableFields={availableFields}
        selectedColumns={columns}
        onColumnsChange={onColumnsChange}
      />

      {columns.filter(c => c.visible).length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <strong>{columns.filter(c => c.visible).length}</strong> campos selecionados para o
          relatório
        </div>
      )}
    </div>
  );
}
