import { createClient } from '@/lib/supabase/server';
import type {
  ReportConfig,
  ReportFilter,
  ReportResult,
  ReportType,
  ReportFormat,
  ExportConfig,
  FilterOperator,
} from '@/types/reports';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears } from 'date-fns';

export class ReportTemplateEngine {
  private supabase = createClient();

  /**
   * Gera um relatório baseado no template e período
   */
  async generateReport(
    templateId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ReportResult> {
    const startTime = Date.now();

    // Buscar template
    const { data: template, error } = await this.supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      throw new Error('Template não encontrado');
    }

    const config = template.config as ReportConfig;

    // Buscar dados baseado no tipo de relatório
    let data = await this.fetchDataByType(template.type, template.company_id, dateRange);

    // Aplicar filtros
    if (config.filters && config.filters.length > 0) {
      data = this.applyFilters(data, config.filters);
    }

    // Aplicar ordenação
    if (config.sort) {
      data = this.applySort(data, config.sort.field, config.sort.direction);
    }

    // Aplicar limite
    if (config.limit) {
      data = data.slice(0, config.limit);
    }

    // Aplicar colunas selecionadas
    const visibleColumns = config.columns.filter(col => col.visible);
    const filteredData = this.applyColumns(data, visibleColumns);

    const processingTime = Date.now() - startTime;

    return {
      data: filteredData,
      columns: visibleColumns,
      recordCount: filteredData.length,
      generatedAt: new Date(),
      dateRange,
    };
  }

  /**
   * Busca dados baseado no tipo de relatório
   */
  private async fetchDataByType(
    type: ReportType,
    companyId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    let query;

    switch (type) {
      case 'employees':
        query = this.supabase
          .from('employees')
          .select('*')
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('hire_date', dateRange.start.toISOString())
            .lte('hire_date', dateRange.end.toISOString());
        }
        break;

      case 'time_records':
        query = this.supabase
          .from('time_records')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('date', dateRange.start.toISOString().split('T')[0])
            .lte('date', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      case 'absences':
        query = this.supabase
          .from('absences')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('start_date', dateRange.start.toISOString().split('T')[0])
            .lte('start_date', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      case 'payroll':
        query = this.supabase
          .from('payroll_records')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('period_start', dateRange.start.toISOString().split('T')[0])
            .lte('period_end', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      case 'evaluations':
        query = this.supabase
          .from('evaluations')
          .select(`
            *,
            employee:employees(name, department, position),
            evaluator:employees!evaluations_evaluator_id_fkey(name)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('evaluation_date', dateRange.start.toISOString().split('T')[0])
            .lte('evaluation_date', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      case 'health':
        query = this.supabase
          .from('health_records')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('exam_date', dateRange.start.toISOString().split('T')[0])
            .lte('exam_date', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      case 'documents':
        query = this.supabase
          .from('employee_documents')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('created_at', dateRange.start.toISOString())
            .lte('created_at', dateRange.end.toISOString());
        }
        break;

      case 'pdi':
        query = this.supabase
          .from('pdi_goals')
          .select(`
            *,
            employee:employees(name, department, position)
          `)
          .eq('company_id', companyId);

        if (dateRange) {
          query = query
            .gte('start_date', dateRange.start.toISOString().split('T')[0])
            .lte('start_date', dateRange.end.toISOString().split('T')[0]);
        }
        break;

      default:
        throw new Error(`Tipo de relatório não suportado: ${type}`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transformar dados para formato flat quando há relacionamentos
    return (data || []).map(record => this.flattenRecord(record));
  }

  /**
   * Achatar registros com relacionamentos
   */
  private flattenRecord(record: any): any {
    const flat: any = { ...record };

    // Se há um objeto employee, trazer os campos para o nível raiz
    if (record.employee) {
      flat.employee_name = record.employee.name;
      flat.department = record.employee.department;
      flat.position = record.employee.position;
      delete flat.employee;
    }

    // Se há um objeto evaluator
    if (record.evaluator) {
      flat.evaluator_name = record.evaluator.name;
      delete flat.evaluator;
    }

    return flat;
  }

  /**
   * Aplica filtros aos dados
   */
  applyFilters(data: any[], filters: ReportFilter[]): any[] {
    if (!filters || filters.length === 0) return data;

    return data.filter(record => {
      let result = true;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        const value = this.getNestedValue(record, filter.field);
        const matches = this.evaluateFilter(value, filter.operator, filter.value);

        if (i === 0) {
          result = matches;
        } else {
          const prevFilter = filters[i - 1];
          if (prevFilter.logic === 'AND') {
            result = result && matches;
          } else if (prevFilter.logic === 'OR') {
            result = result || matches;
          }
        }
      }

      return result;
    });
  }

  /**
   * Avalia um filtro individual
   */
  private evaluateFilter(value: any, operator: FilterOperator, filterValue: any): boolean {
    // Normalizar valores para comparação
    const normalizedValue = value?.toString().toLowerCase();
    const normalizedFilterValue = filterValue?.toString().toLowerCase();

    switch (operator) {
      case 'equals':
        return value === filterValue;

      case 'not_equals':
        return value !== filterValue;

      case 'contains':
        return normalizedValue?.includes(normalizedFilterValue) ?? false;

      case 'not_contains':
        return !normalizedValue?.includes(normalizedFilterValue) ?? true;

      case 'starts_with':
        return normalizedValue?.startsWith(normalizedFilterValue) ?? false;

      case 'ends_with':
        return normalizedValue?.endsWith(normalizedFilterValue) ?? false;

      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);

      case 'not_in':
        return Array.isArray(filterValue) && !filterValue.includes(value);

      case 'greater_than':
        return Number(value) > Number(filterValue);

      case 'greater_than_or_equal':
        return Number(value) >= Number(filterValue);

      case 'less_than':
        return Number(value) < Number(filterValue);

      case 'less_than_or_equal':
        return Number(value) <= Number(filterValue);

      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const numValue = Number(value);
          return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
        }
        return false;

      case 'is_null':
        return value === null || value === undefined;

      case 'is_not_null':
        return value !== null && value !== undefined;

      default:
        return false;
    }
  }

  /**
   * Obtém valor aninhado de um objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Aplica ordenação aos dados
   */
  private applySort(data: any[], field: string, direction: 'asc' | 'desc'): any[] {
    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, field);
      const bValue = this.getNestedValue(b, field);

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (aValue === null || aValue === undefined) {
        comparison = 1;
      } else if (bValue === null || bValue === undefined) {
        comparison = -1;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : 1;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Aplica seleção de colunas aos dados
   */
  applyColumns(data: any[], columns: any[]): any[] {
    const fields = columns.map(col => col.field);
    return data.map(record => {
      const filtered: any = {};
      fields.forEach(field => {
        filtered[field] = this.getNestedValue(record, field);
      });
      return filtered;
    });
  }

  /**
   * Calcula range de datas baseado no período
   */
  static getDateRangeFromPeriod(period: string): { start: Date; end: Date } {
    const now = new Date();

    switch (period) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };

      case 'yesterday':
        return {
          start: startOfDay(subDays(now, 1)),
          end: endOfDay(subDays(now, 1)),
        };

      case 'last_week':
        const lastWeekStart = subWeeks(startOfWeek(now), 1);
        return {
          start: lastWeekStart,
          end: endOfWeek(lastWeekStart),
        };

      case 'current_week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
        };

      case 'last_month':
        const lastMonthStart = subMonths(startOfMonth(now), 1);
        return {
          start: lastMonthStart,
          end: endOfMonth(lastMonthStart),
        };

      case 'current_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };

      case 'last_quarter':
        const lastQuarterStart = subQuarters(startOfQuarter(now), 1);
        return {
          start: lastQuarterStart,
          end: endOfQuarter(lastQuarterStart),
        };

      case 'current_quarter':
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now),
        };

      case 'last_year':
        const lastYearStart = subYears(startOfYear(now), 1);
        return {
          start: lastYearStart,
          end: endOfYear(lastYearStart),
        };

      case 'current_year':
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };

      default:
        // Default: último mês
        const defaultStart = subMonths(startOfMonth(now), 1);
        return {
          start: defaultStart,
          end: endOfMonth(defaultStart),
        };
    }
  }
}
