/**
 * Data Formatters for Export
 * Formats data for export to CSV and PDF
 */

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return "-"
  }
}

/**
 * Format date and time to Brazilian format (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch {
    return "-"
  }
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "-"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "HH:mm", { locale: ptBR })
  } catch {
    return "-"
  }
}

/**
 * Format currency to Brazilian format (R$ X.XXX,XX)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Format minutes to hours (Xh Ymin)
 */
export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "0h 0min"
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${hours}h ${mins}min`
}

/**
 * Translate employee status to Portuguese
 */
export function translateEmployeeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    on_leave: "Afastado",
    terminated: "Desligado",
  }
  return statusMap[status] || status
}

/**
 * Translate absence type to Portuguese
 */
export function translateAbsenceType(type: string): string {
  const typeMap: Record<string, string> = {
    vacation: "Férias",
    medical: "Atestado Médico",
    personal: "Falta Pessoal",
    leave: "Licença",
    unpaid: "Falta Não Justificada",
  }
  return typeMap[type] || type
}

/**
 * Translate absence status to Portuguese
 */
export function translateAbsenceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Rejeitada",
    in_progress: "Em Andamento",
    completed: "Concluída",
    cancelled: "Cancelada",
  }
  return statusMap[status] || status
}

/**
 * Translate time entry type to Portuguese
 */
export function translateTimeEntryType(type: string): string {
  const typeMap: Record<string, string> = {
    clock_in: "Entrada",
    clock_out: "Saída",
    break_start: "Início Pausa",
    break_end: "Fim Pausa",
  }
  return typeMap[type] || type
}

/**
 * Format boolean to Sim/Não
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "Não"
  return value ? "Sim" : "Não"
}

/**
 * Format CPF
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-"
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return cpf
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

/**
 * Format phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return phone
}

/**
 * Sanitize text for CSV (escape quotes and commas)
 */
export function sanitizeCSV(text: string | null | undefined): string {
  if (!text) return ""
  // Escape double quotes by doubling them
  return text.replace(/"/g, '""')
}

/**
 * Generate filename with date
 */
export function generateFilename(type: string, extension: string): string {
  const date = format(new Date(), "yyyy-MM-dd_HHmmss")
  return `relatorio_${type}_${date}.${extension}`
}
