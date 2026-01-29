/**
 * PDF Export Functions - TEMPORARILY DISABLED
 * Export data to PDF format using jsPDF and autoTable
 *
 * NOTE: PDF export is temporarily disabled due to Turbopack build issues.
 * Use CSV or Excel export instead.
 */

import type { Employee } from "@/lib/supabase/queries/employees"
import type { TimeRecord, AbsenceWithEmployee } from "@/types/database"

const PDF_DISABLED_MESSAGE = 'Exportação PDF temporariamente desabilitada. Use CSV ou Excel.';

/**
 * Export time records to PDF
 * @throws Error indicating PDF export is disabled
 */
export function exportTimeRecordsPDF(
  records: TimeRecord[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): void {
  throw new Error(PDF_DISABLED_MESSAGE);
}

/**
 * Export absences to PDF
 * @throws Error indicating PDF export is disabled
 */
export function exportAbsencesPDF(
  absences: AbsenceWithEmployee[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): void {
  throw new Error(PDF_DISABLED_MESSAGE);
}

/**
 * Export employees to PDF
 * @throws Error indicating PDF export is disabled
 */
export function exportEmployeesPDF(
  employees: Employee[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): void {
  throw new Error(PDF_DISABLED_MESSAGE);
}

/**
 * Export time summary to PDF
 * @throws Error indicating PDF export is disabled
 */
export function exportTimeSummaryPDF(
  data: {
    employee: Employee
    period: {
      start: Date
      end: Date
    }
    summary: {
      totalWorkedMinutes: number
      totalExpectedMinutes: number
      totalOvertimeMinutes: number
      totalAbsenceMinutes: number
      presentDays: number
      absentDays: number
    }
    records: TimeRecord[]
  },
  options?: {
    filename?: string
    title?: string
    companyName?: string
  }
): void {
  throw new Error(PDF_DISABLED_MESSAGE);
}
