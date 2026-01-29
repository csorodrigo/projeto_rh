'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { ReportFilter, FilterOperator, FilterLogic, FieldDefinition } from '@/types/reports';

interface FilterBuilderProps {
  filters: ReportFilter[];
  availableFields: FieldDefinition[];
  onFiltersChange: (filters: ReportFilter[]) => void;
}

const OPERATORS: Array<{ value: FilterOperator; label: string; types: string[] }> = [
  { value: 'equals', label: 'Igual a', types: ['string', 'number', 'date', 'boolean', 'enum'] },
  { value: 'not_equals', label: 'Diferente de', types: ['string', 'number', 'date', 'boolean', 'enum'] },
  { value: 'contains', label: 'Contém', types: ['string'] },
  { value: 'not_contains', label: 'Não contém', types: ['string'] },
  { value: 'starts_with', label: 'Começa com', types: ['string'] },
  { value: 'ends_with', label: 'Termina com', types: ['string'] },
  { value: 'in', label: 'Está em', types: ['string', 'number', 'enum'] },
  { value: 'not_in', label: 'Não está em', types: ['string', 'number', 'enum'] },
  { value: 'greater_than', label: 'Maior que', types: ['number', 'date'] },
  { value: 'greater_than_or_equal', label: 'Maior ou igual a', types: ['number', 'date'] },
  { value: 'less_than', label: 'Menor que', types: ['number', 'date'] },
  { value: 'less_than_or_equal', label: 'Menor ou igual a', types: ['number', 'date'] },
  { value: 'between', label: 'Entre', types: ['number', 'date'] },
  { value: 'is_null', label: 'É nulo', types: ['string', 'number', 'date', 'boolean'] },
  { value: 'is_not_null', label: 'Não é nulo', types: ['string', 'number', 'date', 'boolean'] },
];

export function FilterBuilder({
  filters,
  availableFields,
  onFiltersChange,
}: FilterBuilderProps) {
  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: crypto.randomUUID(),
      field: availableFields[0]?.field || '',
      operator: 'equals',
      value: '',
      logic: filters.length > 0 ? 'AND' : undefined,
    };

    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    onFiltersChange(
      filters.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = availableFields.find(f => f.field === fieldName);
    if (!field) return OPERATORS;

    return OPERATORS.filter(op => op.types.includes(field.type));
  };

  const renderValueInput = (filter: ReportFilter) => {
    const field = availableFields.find(f => f.field === filter.field);
    if (!field) return null;

    // Operadores sem valor
    if (filter.operator === 'is_null' || filter.operator === 'is_not_null') {
      return null;
    }

    // Enum com select
    if (field.type === 'enum' && field.options) {
      if (filter.operator === 'in' || filter.operator === 'not_in') {
        return (
          <Select
            value={filter.value?.[0] || ''}
            onValueChange={value => {
              updateFilter(filter.id, { value: [value] });
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <Select
          value={filter.value || ''}
          onValueChange={value => updateFilter(filter.id, { value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Between - dois inputs
    if (filter.operator === 'between') {
      const values = Array.isArray(filter.value) ? filter.value : ['', ''];
      return (
        <div className="flex gap-2 flex-1">
          <Input
            type={field.type === 'date' ? 'date' : 'number'}
            value={values[0] || ''}
            onChange={e =>
              updateFilter(filter.id, {
                value: [e.target.value, values[1]],
              })
            }
            placeholder="Mínimo"
          />
          <Input
            type={field.type === 'date' ? 'date' : 'number'}
            value={values[1] || ''}
            onChange={e =>
              updateFilter(filter.id, {
                value: [values[0], e.target.value],
              })
            }
            placeholder="Máximo"
          />
        </div>
      );
    }

    // Input normal
    const inputType = field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text';

    return (
      <Input
        type={inputType}
        value={filter.value || ''}
        onChange={e => updateFilter(filter.id, { value: e.target.value })}
        placeholder="Valor"
        className="flex-1"
      />
    );
  };

  if (filters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Nenhum filtro adicionado</p>
        <Button onClick={addFilter} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Filtro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filters.map((filter, index) => (
        <Card key={filter.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Lógica AND/OR */}
              {index > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Operador lógico:</Label>
                  <Select
                    value={filters[index - 1].logic || 'AND'}
                    onValueChange={value =>
                      updateFilter(filters[index - 1].id, {
                        logic: value as FilterLogic,
                      })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">E</SelectItem>
                      <SelectItem value="OR">OU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro */}
              <div className="flex gap-2 items-start">
                {/* Campo */}
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Campo</Label>
                  <Select
                    value={filter.field}
                    onValueChange={value => {
                      const field = availableFields.find(f => f.field === value);
                      const operators = getOperatorsForField(value);
                      updateFilter(filter.id, {
                        field: value,
                        operator: operators[0]?.value || 'equals',
                        value: '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields
                        .filter(f => f.filterable)
                        .map(field => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operador */}
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Operador</Label>
                  <Select
                    value={filter.operator}
                    onValueChange={value =>
                      updateFilter(filter.id, {
                        operator: value as FilterOperator,
                        value: '',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsForField(filter.field).map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor */}
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Valor</Label>
                  {renderValueInput(filter)}
                </div>

                {/* Remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(filter.id)}
                  className="mt-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={addFilter} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Filtro
      </Button>
    </div>
  );
}
