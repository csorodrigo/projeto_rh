/**
 * PDF Export Functions
 * Export data to PDF format using jsPDF and autoTable
 */

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Employee } from "@/lib/supabase/queries/employees"
import type { TimeRecord, AbsenceWithEmployee } from "@/types/database"
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  formatMinutes,
  translateEmployeeStatus,
  translateAbsenceType,
  translateAbsenceStatus,
  translateTimeEntryType,
  generateFilename,
} from "./formatters"

/**
 * Add header to PDF
 */
function addHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  companyName?: string
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Company name (top right)
  if (companyName) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(companyName, pageWidth - 15, 15, { align: "right" })
  }

  // Title
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text(title, 15, 25)

  // Subtitle
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 15, 32)
  }

  // Generation date
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Gerado em: ${formatDateTime(new Date())}`,
    15,
    subtitle ? 38 : 32
  )

  // Line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(15, subtitle ? 42 : 36, pageWidth - 15, subtitle ? 42 : 36)
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )
  }
}

/**
 * Export time records to PDF
 */
export function exportTimeRecordsPDF(
  employee: { name: string; department?: string; position?: string },
  records: TimeRecord[],
  period: { start: string; end: string },
  companyName?: string
) {
  if (!records || records.length === 0) {
    throw new Error("Nenhum registro de ponto para exportar")
  }

  const doc = new jsPDF()

  // Add header
  addHeader(
    doc,
    "Relatório de Ponto",
    `${employee.name} - ${formatDate(period.start)} a ${formatDate(period.end)}`,
    companyName
  )

  // Employee info
  const startY = 50
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Funcionário: ${employee.name}`, 15, startY)
  if (employee.department) {
    doc.text(`Departamento: ${employee.department}`, 15, startY + 6)
  }
  if (employee.position) {
    doc.text(`Cargo: ${employee.position}`, 15, startY + 12)
  }

  // Group records by date
  const recordsByDate = records.reduce((acc, record) => {
    const date = formatDate(record.date)
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(record)
    return acc
  }, {} as Record<string, TimeRecord[]>)

  // Create table data
  const tableData = Object.entries(recordsByDate).flatMap(([date, dayRecords]) => {
    return dayRecords.map((record, index) => [
      index === 0 ? date : "", // Show date only on first record
      formatTime(record.timestamp),
      translateTimeEntryType(record.type),
      record.notes || "-",
    ])
  })

  // Add table
  autoTable(doc, {
    startY: employee.position ? startY + 18 : startY + 12,
    head: [["Data", "Hora", "Tipo", "Observações"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 40 },
      3: { cellWidth: "auto" },
    },
  })

  // Add footer
  addFooter(doc)

  // Download
  const filename = generateFilename(`ponto_${employee.name}`, "pdf")
  doc.save(filename)

  return filename
}

/**
 * Export absences to PDF
 */
export function exportAbsencesPDF(
  absences: AbsenceWithEmployee[],
  period: { start: string; end: string },
  companyName?: string,
  filters?: { type?: string; status?: string }
) {
  if (!absences || absences.length === 0) {
    throw new Error("Nenhuma ausência para exportar")
  }

  const doc = new jsPDF()

  // Build subtitle with filters
  let subtitle = `Período: ${formatDate(period.start)} a ${formatDate(period.end)}`
  if (filters?.type || filters?.status) {
    const filterParts = []
    if (filters.type) filterParts.push(`Tipo: ${translateAbsenceType(filters.type)}`)
    if (filters.status) filterParts.push(`Status: ${translateAbsenceStatus(filters.status)}`)
    subtitle += ` | Filtros: ${filterParts.join(", ")}`
  }

  // Add header
  addHeader(doc, "Relatório de Ausências", subtitle, companyName)

  // Create table data
  const tableData = absences.map((absence) => {
    // Calculate duration
    const startDate = new Date(absence.start_date)
    const endDate = new Date(absence.end_date)
    const durationDays =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return [
      absence.employee_name || "-",
      translateAbsenceType(absence.type),
      formatDate(absence.start_date),
      formatDate(absence.end_date),
      durationDays.toString(),
      translateAbsenceStatus(absence.status),
    ]
  })

  // Add table
  autoTable(doc, {
    startY: 50,
    head: [["Funcionário", "Tipo", "Início", "Fim", "Dias", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [234, 88, 12], // Orange
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 30 },
    },
  })

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY || 50
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total de ausências: ${absences.length}`, 15, finalY + 10)

  // Count by status
  const statusCounts = absences.reduce((acc, absence) => {
    acc[absence.status] = (acc[absence.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  let summaryY = finalY + 16
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(
      `${translateAbsenceStatus(status)}: ${count}`,
      20,
      summaryY
    )
    summaryY += 6
  })

  // Add footer
  addFooter(doc)

  // Download
  const filename = generateFilename("ausencias", "pdf")
  doc.save(filename)

  return filename
}

/**
 * Export employees list to PDF
 */
export function exportEmployeesPDF(
  employees: Employee[],
  companyName?: string,
  filters?: { status?: string; department?: string }
) {
  if (!employees || employees.length === 0) {
    throw new Error("Nenhum funcionário para exportar")
  }

  const doc = new jsPDF()

  // Build subtitle with filters
  let subtitle = `Total: ${employees.length} funcionário(s)`
  if (filters?.status || filters?.department) {
    const filterParts = []
    if (filters.status) filterParts.push(`Status: ${translateEmployeeStatus(filters.status)}`)
    if (filters.department) filterParts.push(`Departamento: ${filters.department}`)
    subtitle += ` | Filtros: ${filterParts.join(", ")}`
  }

  // Add header
  addHeader(doc, "Lista de Funcionários", subtitle, companyName)

  // Create table data
  const tableData = employees.map((emp) => [
    emp.full_name || emp.name || "-",
    emp.department || "-",
    emp.position || "-",
    formatDate(emp.hire_date),
    translateEmployeeStatus(emp.status),
  ])

  // Add table
  autoTable(doc, {
    startY: 50,
    head: [["Nome", "Departamento", "Cargo", "Admissão", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94], // Green
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  })

  // Summary by status
  const finalY = (doc as any).lastAutoTable.finalY || 50
  const statusCounts = employees.reduce((acc, emp) => {
    acc[emp.status] = (acc[emp.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text("Resumo por Status:", 15, finalY + 10)

  let summaryY = finalY + 16
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(
      `${translateEmployeeStatus(status)}: ${count}`,
      20,
      summaryY
    )
    summaryY += 6
  })

  // Add footer
  addFooter(doc)

  // Download
  const filename = generateFilename("funcionarios", "pdf")
  doc.save(filename)

  return filename
}

/**
 * Export time summary to PDF
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

export function exportTimeSummaryPDF(
  records: TimeSummaryRecord[],
  period: { start: string; end: string },
  companyName?: string
) {
  if (!records || records.length === 0) {
    throw new Error("Nenhum dado para exportar")
  }

  const doc = new jsPDF()

  // Add header
  addHeader(
    doc,
    "Resumo de Ponto",
    `Período: ${formatDate(period.start)} a ${formatDate(period.end)}`,
    companyName
  )

  // Create table data
  const tableData = records.map((record) => [
    record.employeeName,
    record.department || "-",
    formatMinutes(record.totalWorked),
    formatMinutes(record.bankBalance),
    formatMinutes(record.overtime),
    record.absences.toString(),
  ])

  // Add table
  autoTable(doc, {
    startY: 50,
    head: [["Funcionário", "Depto", "Horas Trab.", "Banco", "Extras", "Ausências"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [147, 51, 234], // Purple
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20, halign: "center" },
    },
  })

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 50
  const totals = records.reduce(
    (acc, record) => ({
      worked: acc.worked + record.totalWorked,
      bank: acc.bank + record.bankBalance,
      overtime: acc.overtime + record.overtime,
      absences: acc.absences + record.absences,
    }),
    { worked: 0, bank: 0, overtime: 0, absences: 0 }
  )

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text("Totais:", 15, finalY + 10)
  doc.text(`Horas trabalhadas: ${formatMinutes(totals.worked)}`, 20, finalY + 16)
  doc.text(`Banco de horas: ${formatMinutes(totals.bank)}`, 20, finalY + 22)
  doc.text(`Horas extras: ${formatMinutes(totals.overtime)}`, 20, finalY + 28)
  doc.text(`Ausências: ${totals.absences}`, 20, finalY + 34)

  // Add footer
  addFooter(doc)

  // Download
  const filename = generateFilename("resumo_ponto", "pdf")
  doc.save(filename)

  return filename
}
