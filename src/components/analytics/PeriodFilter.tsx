/**
 * Period Filter Component
 * Fase 8 - Diferenciação
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AnalyticsPeriod } from '@/types/analytics';

interface PeriodFilterProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  className?: string;
}

type PeriodPreset = {
  label: string;
  getValue: () => AnalyticsPeriod;
};

export function PeriodFilter({
  value,
  onChange,
  className = '',
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(
    value.startDate
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(value.endDate);

  const today = new Date();

  const presets: PeriodPreset[] = [
    {
      label: 'Últimos 7 dias',
      getValue: () => ({
        startDate: subDays(today, 7),
        endDate: today,
        label: 'Últimos 7 dias',
      }),
    },
    {
      label: 'Últimos 30 dias',
      getValue: () => ({
        startDate: subDays(today, 30),
        endDate: today,
        label: 'Últimos 30 dias',
      }),
    },
    {
      label: 'Últimos 90 dias',
      getValue: () => ({
        startDate: subDays(today, 90),
        endDate: today,
        label: 'Últimos 90 dias',
      }),
    },
    {
      label: 'Últimos 6 meses',
      getValue: () => ({
        startDate: subMonths(today, 6),
        endDate: today,
        label: 'Últimos 6 meses',
      }),
    },
    {
      label: 'Último ano',
      getValue: () => ({
        startDate: subMonths(today, 12),
        endDate: today,
        label: 'Último ano',
      }),
    },
    {
      label: 'Este ano',
      getValue: () => ({
        startDate: startOfYear(today),
        endDate: today,
        label: 'Este ano',
      }),
    },
    {
      label: 'Ano passado',
      getValue: () => {
        const lastYear = new Date(today.getFullYear() - 1, 0, 1);
        return {
          startDate: startOfYear(lastYear),
          endDate: endOfYear(lastYear),
          label: 'Ano passado',
        };
      },
    },
  ];

  const handlePresetClick = (preset: PeriodPreset) => {
    const newPeriod = preset.getValue();
    onChange(newPeriod);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        startDate: customStart,
        endDate: customEnd,
        label: `${format(customStart, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEnd, 'dd/MM/yyyy', { locale: ptBR })}`,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            {/* Presets */}
            <div className="border-r p-3 space-y-1 w-48">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Períodos rápidos
              </p>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Período customizado
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Data inicial
                  </label>
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    disabled={(date) =>
                      date > today || (customEnd ? date > customEnd : false)
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Data final
                  </label>
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    disabled={(date) =>
                      date > today || (customStart ? date < customStart : false)
                    }
                    locale={ptBR}
                  />
                </div>

                <Button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full"
                >
                  Aplicar período
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Comparison Period Selector
 * Para comparar dois períodos
 */
interface ComparisonPeriodSelectorProps {
  currentPeriod: AnalyticsPeriod;
  comparisonType: 'period-over-period' | 'year-over-year';
  onComparisonTypeChange: (
    type: 'period-over-period' | 'year-over-year'
  ) => void;
  className?: string;
}

export function ComparisonPeriodSelector({
  currentPeriod,
  comparisonType,
  onComparisonTypeChange,
  className = '',
}: ComparisonPeriodSelectorProps) {
  const getPreviousPeriod = (): AnalyticsPeriod => {
    const duration =
      currentPeriod.endDate.getTime() - currentPeriod.startDate.getTime();

    if (comparisonType === 'year-over-year') {
      // Mesmo período do ano anterior
      const startDate = new Date(currentPeriod.startDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      const endDate = new Date(currentPeriod.endDate);
      endDate.setFullYear(endDate.getFullYear() - 1);

      return {
        startDate,
        endDate,
        label: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      };
    } else {
      // Período anterior de mesma duração
      const endDate = new Date(
        currentPeriod.startDate.getTime() - 24 * 60 * 60 * 1000
      );
      const startDate = new Date(endDate.getTime() - duration);

      return {
        startDate,
        endDate,
        label: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      };
    }
  };

  const previousPeriod = getPreviousPeriod();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <Button
          variant={comparisonType === 'period-over-period' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onComparisonTypeChange('period-over-period')}
        >
          Período anterior
        </Button>
        <Button
          variant={comparisonType === 'year-over-year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onComparisonTypeChange('year-over-year')}
        >
          Ano anterior
        </Button>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Período atual:</span>
          <span className="font-medium">{currentPeriod.label}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Comparando com:</span>
          <span className="font-medium">{previousPeriod.label}</span>
        </div>
      </div>
    </div>
  );
}
