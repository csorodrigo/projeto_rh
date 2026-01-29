/**
 * CSV Export Functions
 * Export data to CSV format using PapaParse
 */

import Papa from "papaparse"
import type { Employee } from "@/lib/supabase/queries/employees"
import type { TimeRecord, AbsenceWithEmployee } from "@/types/database"
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  formatMinutes,
  formatCPF,
  formatPhone,
  formatBoolean,
  translateEmployeeStatus,
  translateAbsenceType,
  translateAbsenceStatus,
  translateTimeEntryType,
  generateFilename,
} from "./formatters"

/**
 * Download CSV file
 */
function downloadCSV(content: string, filename: string) {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export employees to CSV
 */
export function exportEmployeesToCSV(employees: Employee[]) {
  if (!employees || employees.length === 0) {
    throw new Error("Nenhum funcionário para exportar")
  }

  // Prepare data
  const data = employees.map((emp) => ({
    "Nome": emp.full_name || emp.name || "-",
    "CPF": formatCPF(emp.cpf),
    "Email Pessoal": emp.personal_email || "-",
    "Email Corporativo": emp.company_email || "-",
    "Telefone": formatPhone(emp.personal_phone),
    "Data de Nascimento": formatDate(emp.date_of_birth),
    "Cargo": emp.position || "-",
    "Departamento": emp.department || "-",
    "Data de Admissão": formatDate(emp.hire_date),
    "Salário": formatCurrency(emp.salary),
    "Tipo de Contrato": emp.contract_type || "-",
    "Status": translateEmployeeStatus(emp.status),
  }))

  // Convert to CSV
  const csv = Papa.unparse(data, {
    delimiter: ";", // Use semicolon for Excel compatibility
    header: true,
    quotes: true,
  })

  // Download
  const filename = generateFilename("funcionarios", "csv")
  downloadCSV(csv, filename)

  return filename
}

/**
 * Export time records to CSV
 */
export function exportTimeRecordsToCSV(records: TimeRecord[], employeeName?: string) {
  if (!records || records.length === 0) {
    throw new Error("Nenhum registro de ponto para exportar")
  }

  // Prepare data
  const data = records.map((record) => ({
    "Data": formatDate(record.date),
    "Hora": formatTime(record.timestamp),
    "Tipo": translateTimeEntryType(record.type),
    "Funcionário": employeeName || "-",
    "Origem": record.source === "web" ? "Web" : record.source === "mobile" ? "Mobile" : "Sistema",
    "Observações": record.notes || "-",
  }))

  // Convert to CSV
  const csv = Papa.unparse(data, {
    delimiter: ";",
    header: true,
    quotes: true,
  })

  // Download
  const filename = generateFilename("ponto", "csv")
  downloadCSV(csv, filename)

  return filename
}

/**
 * Export absences to CSV
 */
export function exportAbsencesToCSV(absences: AbsenceWithEmployee[]) {
  if (!absences || absences.length === 0) {
    throw new Error("Nenhuma ausência para exportar")
  }

  // Prepare data
  const data = absences.map((absence) => {
    // Calculate duration in days
    const startDate = new Date(absence.start_date)
    const endDate = new Date(absence.end_date)
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      "Funcionário": absence.employee_name || "-",
      "Departamento": absence.employee_department || "-",
      "Tipo": translateAbsenceType(absence.type),
      "Status": translateAbsenceStatus(absence.status),
      "Data Início": formatDate(absence.start_date),
      "Data Fim": formatDate(absence.end_date),
      "Duração (dias)": durationDays,
      "Motivo": absence.reason || "-",
      "Observações": absence.notes || "-",
      "Solicitado em": formatDateTime(absence.created_at),
      "Aprovado/Rejeitado em": absence.reviewed_at ? formatDateTime(absence.reviewed_at) : "-",
      "Revisor": absence.reviewed_by || "-",
    }
  })

  // Convert to CSV
  const csv = Papa.unparse(data, {
    delimiter: ";",
    header: true,
    quotes: true,
  })

  // Download
  const filename = generateFilename("ausencias", "csv")
  downloadCSV(csv, filename)

  return filename
}

/**
 * Export time summary to CSV (for period reports)
 */
export interface TimeSummaryRecord {
  employeeName: string
  department?: string
  totalWorked: number // minutes
  totalBreak: number // minutes
  bankBalance: number // minutes
  overtime: number // minutes
  absences: number // count
}

export function exportTimeSummaryToCSV(
  records: TimeSummaryRecord[],
  period: { start: string; end: string }
) {
  if (!records || records.length === 0) {
    throw new Error("Nenhum dado para exportar")
  }

  // Prepare data
  const data = records.map((record) => ({
    "Funcionário": record.employeeName,
    "Departamento": record.department || "-",
    "Horas Trabalhadas": formatMinutes(record.totalWorked),
    "Horas de Pausa": formatMinutes(record.totalBreak),
    "Banco de Horas": formatMinutes(record.bankBalance),
    "Horas Extras": formatMinutes(record.overtime),
    "Ausências": record.absences,
    "Período": `${formatDate(period.start)} a ${formatDate(period.end)}`,
  }))

  // Convert to CSV
  const csv = Papa.unparse(data, {
    delimiter: ";",
    header: true,
    quotes: true,
  })

  // Download
  const filename = generateFilename("resumo_ponto", "csv")
  downloadCSV(csv, filename)

  return filename
}

/**
 * Generic CSV export for any data
 */
export function exportGenericCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columnMapping?: Record<keyof T, string>
) {
  if (!data || data.length === 0) {
    throw new Error("Nenhum dado para exportar")
  }

  // Apply column mapping if provided
  let processedData = data
  if (columnMapping) {
    processedData = data.map((row) => {
      const newRow: Record<string, any> = {}
      Object.keys(row).forEach((key) => {
        const newKey = columnMapping[key as keyof T] || key
        newRow[newKey] = row[key]
      })
      return newRow as T
    })
  }

  // Convert to CSV
  const csv = Papa.unparse(processedData, {
    delimiter: ";",
    header: true,
    quotes: true,
  })

  // Download
  const fullFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`
  downloadCSV(csv, fullFilename)

  return fullFilename
}
