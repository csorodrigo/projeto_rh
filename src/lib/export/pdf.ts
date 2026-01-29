/**
 * PDF Export Functions
 * Export data to PDF format using jsPDF and autoTable
 */

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
async function addHeader(
  doc: any,
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

  // Current date
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(`Gerado em: ${formatDateTime(new Date())}`, 15, subtitle ? 38 : 32)
}

/**
 * Add footer with page numbers
 */
async function addFooter(doc: any) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
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
export async function exportTimeRecordsPDF(
  records: TimeRecord[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): Promise<void> {
  // Dynamic import to avoid Turbopack issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  await addHeader(
    doc,
    options?.title || "Relatório de Registros de Ponto",
    options?.subtitle,
    options?.companyName
  )

  const tableData = records.map((record) => [
    record.employee?.name || "-",
    formatDate(new Date(record.date)),
    translateTimeEntryType(record.type),
    formatTime(record.time),
    record.notes || "-",
  ])

  autoTable(doc, {
    head: [["Funcionário", "Data", "Tipo", "Hora", "Observações"]],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  await addFooter(doc)

  const filename = options?.filename || generateFilename("registros_ponto", "pdf")
  doc.save(filename)
}

/**
 * Export absences to PDF
 */
export async function exportAbsencesPDF(
  absences: AbsenceWithEmployee[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): Promise<void> {
  // Dynamic import to avoid Turbopack issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  await addHeader(
    doc,
    options?.title || "Relatório de Ausências",
    options?.subtitle,
    options?.companyName
  )

  const tableData = absences.map((absence) => [
    absence.employee?.name || "-",
    translateAbsenceType(absence.type),
    formatDate(new Date(absence.start_date)),
    formatDate(new Date(absence.end_date)),
    translateAbsenceStatus(absence.status),
    absence.reason || "-",
  ])

  autoTable(doc, {
    head: [
      ["Funcionário", "Tipo", "Data Início", "Data Fim", "Status", "Motivo"],
    ],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  await addFooter(doc)

  const filename = options?.filename || generateFilename("ausencias", "pdf")
  doc.save(filename)
}

/**
 * Export employees to PDF
 */
export async function exportEmployeesPDF(
  employees: Employee[],
  options?: {
    filename?: string
    title?: string
    subtitle?: string
    companyName?: string
  }
): Promise<void> {
  // Dynamic import to avoid Turbopack issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  await addHeader(
    doc,
    options?.title || "Relatório de Funcionários",
    options?.subtitle,
    options?.companyName
  )

  const tableData = employees.map((emp) => [
    emp.name,
    emp.email || "-",
    emp.department || "-",
    emp.job_title || "-",
    translateEmployeeStatus(emp.status),
    emp.hire_date ? formatDate(new Date(emp.hire_date)) : "-",
  ])

  autoTable(doc, {
    head: [
      ["Nome", "Email", "Departamento", "Cargo", "Status", "Data Admissão"],
    ],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  await addFooter(doc)

  const filename = options?.filename || generateFilename("funcionarios", "pdf")
  doc.save(filename)
}

/**
 * Export time summary to PDF
 */
export async function exportTimeSummaryPDF(
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
): Promise<void> {
  // Dynamic import to avoid Turbopack issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  await addHeader(
    doc,
    options?.title || `Relatório de Ponto - ${data.employee.name}`,
    `Período: ${formatDate(data.period.start)} a ${formatDate(data.period.end)}`,
    options?.companyName
  )

  // Summary section
  let yPos = 45
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo do Período", 15, yPos)

  yPos += 7
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const summaryItems = [
    `Horas Trabalhadas: ${formatMinutes(data.summary.totalWorkedMinutes)}`,
    `Horas Esperadas: ${formatMinutes(data.summary.totalExpectedMinutes)}`,
    `Horas Extras: ${formatMinutes(data.summary.totalOvertimeMinutes)}`,
    `Horas de Ausência: ${formatMinutes(data.summary.totalAbsenceMinutes)}`,
    `Dias Presentes: ${data.summary.presentDays}`,
    `Dias Ausentes: ${data.summary.absentDays}`,
  ]

  summaryItems.forEach((item) => {
    doc.text(item, 15, yPos)
    yPos += 6
  })

  // Records table
  yPos += 5
  const tableData = data.records.map((record) => [
    formatDate(new Date(record.date)),
    translateTimeEntryType(record.type),
    formatTime(record.time),
    record.notes || "-",
  ])

  autoTable(doc, {
    head: [["Data", "Tipo", "Hora", "Observações"]],
    body: tableData,
    startY: yPos,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  })

  await addFooter(doc)

  const filename =
    options?.filename ||
    generateFilename(
      `ponto_${data.employee.name.toLowerCase().replace(/\s+/g, "_")}`,
      "pdf"
    )
  doc.save(filename)
}
