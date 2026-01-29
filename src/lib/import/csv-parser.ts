/**
 * CSV Parser for employee import
 */

import Papa from 'papaparse';
import type { ParsedEmployee } from './types';

export interface CSVParseResult {
  data: ParsedEmployee[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Parse CSV file and return employees
 */
export async function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const errors: Array<{ row: number; message: string }> = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize header names
        const headerMap: Record<string, string> = {
          'nome': 'name',
          'nome completo': 'name',
          'cpf': 'cpf',
          'email': 'personal_email',
          'email pessoal': 'personal_email',
          'data de nascimento': 'birth_date',
          'nascimento': 'birth_date',
          'data de admissão': 'hire_date',
          'admissão': 'hire_date',
          'data admissão': 'hire_date',
          'cargo': 'position',
          'departamento': 'department',
          'salário': 'base_salary',
          'salário base': 'base_salary',
          'salario': 'base_salary',
          'status': 'status',
          'telefone': 'personal_phone',
          'telefone pessoal': 'personal_phone',
          'phone': 'personal_phone',
        };

        const normalized = header.toLowerCase().trim();
        return headerMap[normalized] || header;
      },
      complete: (results) => {
        const employees: ParsedEmployee[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Skip empty rows
            if (!row.name && !row.cpf) {
              return;
            }

            const employee: ParsedEmployee = {
              name: row.name?.trim() || '',
              cpf: row.cpf?.replace(/\D/g, '') || '',
              personal_email: row.personal_email?.trim() || undefined,
              birth_date: parseBrazilianDate(row.birth_date),
              hire_date: parseBrazilianDate(row.hire_date),
              position: row.position?.trim() || '',
              department: row.department?.trim() || undefined,
              base_salary: parseFloat(
                String(row.base_salary || '0')
                  .replace(/[^\d,.-]/g, '')
                  .replace(',', '.')
              ) || undefined,
              status: normalizeStatus(row.status),
              personal_phone: row.personal_phone?.replace(/\D/g, '') || undefined,
              row: index + 2, // +2 because of header and 0-index
            };

            employees.push(employee);
          } catch (error) {
            errors.push({
              row: index + 2,
              message: error instanceof Error ? error.message : 'Erro ao processar linha',
            });
          }
        });

        // Add parse errors
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach((error: any) => {
            errors.push({
              row: error.row + 2,
              message: error.message,
            });
          });
        }

        resolve({ data: employees, errors });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [{ row: 0, message: `Erro ao ler arquivo: ${error.message}` }],
        });
      },
    });
  });
}

/**
 * Parse Brazilian date format (DD/MM/YYYY) to ISO (YYYY-MM-DD)
 */
function parseBrazilianDate(dateStr: string): string {
  if (!dateStr) return '';

  // Remove any extra whitespace
  dateStr = dateStr.trim();

  // Try DD/MM/YYYY format
  const brFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(brFormat);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  // Try YYYY-MM-DD format (already ISO)
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (isoFormat.test(dateStr)) {
    return dateStr;
  }

  // Try DD-MM-YYYY format
  const dashFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
  const dashMatch = dateStr.match(dashFormat);

  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${year}-${month}-${day}`;
  }

  return dateStr; // Return as is if format is unknown
}

/**
 * Normalize status values
 */
function normalizeStatus(status: string): 'active' | 'inactive' | 'terminated' | 'on_leave' {
  if (!status) return 'active';

  const normalized = status.toLowerCase().trim();

  const statusMap: Record<string, 'active' | 'inactive' | 'terminated' | 'on_leave'> = {
    'ativo': 'active',
    'active': 'active',
    'ativa': 'active',
    'inativo': 'inactive',
    'inactive': 'inactive',
    'inativa': 'inactive',
    'desligado': 'terminated',
    'terminated': 'terminated',
    'demitido': 'terminated',
    'afastado': 'on_leave',
    'on_leave': 'on_leave',
    'licença': 'on_leave',
  };

  return statusMap[normalized] || 'active';
}

/**
 * Generate example CSV content
 */
export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'cpf',
    'personal_email',
    'birth_date',
    'hire_date',
    'position',
    'department',
    'base_salary',
    'status',
    'personal_phone',
  ];

  const examples = [
    [
      'João Silva',
      '12345678901',
      'joao@email.com',
      '15/01/1990',
      '01/01/2024',
      'Desenvolvedor',
      'TI',
      '5000.00',
      'active',
      '11999999999',
    ],
    [
      'Maria Santos',
      '98765432100',
      'maria@email.com',
      '20/05/1985',
      '01/02/2024',
      'Analista RH',
      'RH',
      '4500.00',
      'active',
      '11988888888',
    ],
  ];

  return [
    headers.join(','),
    ...examples.map(row => row.join(',')),
  ].join('\n');
}
