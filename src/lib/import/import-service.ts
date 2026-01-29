/**
 * Service for importing employees in batches
 */

import { createClient } from '@/lib/supabase/client';
import type { ParsedEmployee, ImportResult } from './types';

const BATCH_SIZE = 50;

/**
 * Import employees in batches
 */
export async function importEmployees(
  employees: ParsedEmployee[],
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const supabase = createClient();
  const results: ImportResult = {
    success: [],
    failed: [],
    total: employees.length,
    successCount: 0,
    failedCount: 0,
  };

  // Get current user session to get company_id
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      ...results,
      failed: employees.map(emp => ({
        employee: emp,
        error: 'Usuário não autenticado',
        row: emp.row,
      })),
      failedCount: employees.length,
    };
  }

  // Import in batches
  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);

    try {
      // Prepare data for insertion
      const dataToInsert = batch.map(emp => {
        // Remove the row field as it's not part of the database schema
        const { row, ...employeeData } = emp;

        return {
          ...employeeData,
          company_id: session.user.id, // Use user ID as company_id for now
          status: emp.status || 'active',
        };
      });

      const { data, error } = await supabase
        .from('employees')
        .insert(dataToInsert)
        .select();

      if (error) {
        // If batch fails, try to insert individually to identify which records failed
        for (const emp of batch) {
          const { row, ...employeeData } = emp;

          const { data: individualData, error: individualError } = await supabase
            .from('employees')
            .insert({
              ...employeeData,
              company_id: session.user.id,
              status: emp.status || 'active',
            })
            .select()
            .single();

          if (individualError) {
            results.failed.push({
              employee: emp,
              error: individualError.message,
              row: emp.row,
            });
            results.failedCount++;
          } else if (individualData) {
            results.success.push(emp);
            results.successCount++;
          }
        }
      } else if (data) {
        results.success.push(...batch);
        results.successCount += batch.length;
      }
    } catch (error) {
      // If something goes wrong with the batch, mark all as failed
      batch.forEach(emp => {
        results.failed.push({
          employee: emp,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          row: emp.row,
        });
        results.failedCount++;
      });
    }

    // Update progress
    if (onProgress) {
      const progress = Math.min(i + BATCH_SIZE, employees.length);
      onProgress(progress, employees.length);
    }
  }

  return results;
}

/**
 * Generate error report CSV
 */
export function generateErrorReport(result: ImportResult): string {
  const headers = ['Linha', 'Nome', 'CPF', 'Erro'];

  const rows = result.failed.map(item => {
    return [
      item.row || '-',
      item.employee.name || '-',
      item.employee.cpf || '-',
      item.error,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download error report
 */
export function downloadErrorReport(result: ImportResult): void {
  const csvContent = generateErrorReport(result);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `erros-importacao-${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
