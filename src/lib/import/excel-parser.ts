/**
 * Excel Parser for employee import
 */

import * as XLSX from 'xlsx';
import type { ParsedEmployee } from './types';

export interface ExcelParseResult {
  data: ParsedEmployee[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Parse Excel file (.xlsx or .xls) and return employees
 */
export async function parseExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            data: [],
            errors: [{ row: 0, message: 'Não foi possível ler o arquivo' }],
          });
          return;
        }

        // Read workbook
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            data: [],
            errors: [{ row: 0, message: 'Arquivo Excel vazio' }],
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false, // Get formatted strings instead of raw values
          defval: '', // Default value for empty cells
        }) as any[][];

        if (jsonData.length === 0) {
          resolve({
            data: [],
            errors: [{ row: 0, message: 'Planilha vazia' }],
          });
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map((h: any) => normalizeHeader(String(h)));

        // Parse data rows
        const employees: ParsedEmployee[] = [];
        const errors: Array<{ row: number; message: string }> = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNum = i + 1;

          try {
            // Skip empty rows
            if (!row || row.every((cell: any) => !cell)) {
              continue;
            }

            // Map row data to employee object
            const rowData: Record<string, any> = {};
            headers.forEach((header: string, index: number) => {
              rowData[header] = row[index] || '';
            });

            // Skip if no name and no CPF
            if (!rowData.name && !rowData.cpf) {
              continue;
            }

            const employee: ParsedEmployee = {
              name: String(rowData.name || '').trim(),
              cpf: String(rowData.cpf || '').replace(/\D/g, ''),
              personal_email: rowData.personal_email ? String(rowData.personal_email).trim() : undefined,
              birth_date: parseExcelDate(rowData.birth_date),
              hire_date: parseExcelDate(rowData.hire_date),
              position: String(rowData.position || '').trim(),
              department: rowData.department ? String(rowData.department).trim() : undefined,
              base_salary: parseFloat(
                String(rowData.base_salary || '0')
                  .replace(/[^\d,.-]/g, '')
                  .replace(',', '.')
              ) || undefined,
              status: normalizeStatus(rowData.status),
              personal_phone: rowData.personal_phone ? String(rowData.personal_phone).replace(/\D/g, '') : undefined,
              row: rowNum,
            };

            employees.push(employee);
          } catch (error) {
            errors.push({
              row: rowNum,
              message: error instanceof Error ? error.message : 'Erro ao processar linha',
            });
          }
        }

        resolve({ data: employees, errors });
      } catch (error) {
        resolve({
          data: [],
          errors: [
            {
              row: 0,
              message: `Erro ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        errors: [{ row: 0, message: 'Erro ao ler arquivo' }],
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Normalize header names
 */
function normalizeHeader(header: string): string {
  const headerMap: Record<string, string> = {
    'nome': 'name',
    'nome completo': 'name',
    'cpf': 'cpf',
    'email': 'personal_email',
    'email pessoal': 'personal_email',
    'e-mail': 'personal_email',
    'data de nascimento': 'birth_date',
    'nascimento': 'birth_date',
    'dt. nascimento': 'birth_date',
    'data de admissão': 'hire_date',
    'admissão': 'hire_date',
    'data admissão': 'hire_date',
    'dt. admissão': 'hire_date',
    'cargo': 'position',
    'função': 'position',
    'departamento': 'department',
    'depto': 'department',
    'setor': 'department',
    'salário': 'base_salary',
    'salário base': 'base_salary',
    'salario': 'base_salary',
    'remuneração': 'base_salary',
    'status': 'status',
    'situação': 'status',
    'telefone': 'personal_phone',
    'telefone pessoal': 'personal_phone',
    'tel': 'personal_phone',
    'celular': 'personal_phone',
  };

  const normalized = header.toLowerCase().trim();
  return headerMap[normalized] || header;
}

/**
 * Parse Excel date value to ISO format (YYYY-MM-DD)
 */
function parseExcelDate(value: any): string {
  if (!value) return '';

  // If it's already a string in DD/MM/YYYY format
  if (typeof value === 'string') {
    const brFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.trim().match(brFormat);

    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    // Try YYYY-MM-DD format
    const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoFormat.test(value.trim())) {
      return value.trim();
    }

    // Try DD-MM-YYYY format
    const dashFormat = /^(\d{2})-(\d{2})-(\d{4})$/;
    const dashMatch = value.trim().match(dashFormat);

    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      return `${year}-${month}-${day}`;
    }
  }

  // If it's an Excel serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return String(value);
}

/**
 * Normalize status values
 */
function normalizeStatus(status: any): 'active' | 'inactive' | 'terminated' | 'on_leave' {
  if (!status) return 'active';

  const normalized = String(status).toLowerCase().trim();

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
    'licenca': 'on_leave',
  };

  return statusMap[normalized] || 'active';
}
