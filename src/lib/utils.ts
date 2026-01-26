import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Brazilian format
export function formatDate(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

// Format relative time (e.g., "há 2 horas")
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

// Format CPF (000.000.000-00)
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "")
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

// Format CNPJ (00.000.000/0000-00)
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "")
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

// Format phone ((00) 00000-0000)
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
}

// Format CEP (00000-000)
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, "")
  return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2")
}

// Format currency (R$ 1.234,56)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Format time (HH:mm)
export function formatTime(time: string | Date): string {
  const d = typeof time === "string" ? parseISO(time) : time
  return format(d, "HH:mm")
}

// Calculate work hours between two times
export function calculateWorkHours(
  clockIn: string | Date,
  clockOut: string | Date,
  breakMinutes = 0
): number {
  const start = typeof clockIn === "string" ? parseISO(clockIn) : clockIn
  const end = typeof clockOut === "string" ? parseISO(clockOut) : clockOut
  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = diffMs / 1000 / 60 - breakMinutes
  return Math.max(0, diffMinutes / 60)
}

// Validate CPF
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false

  return true
}

// Validate CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  const calcDigit = (str: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(str.charAt(i)) * weights[i]
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const firstDigit = calcDigit(cleaned, firstWeights)
  const secondDigit = calcDigit(cleaned, secondWeights)

  return (
    firstDigit === parseInt(cleaned.charAt(12)) &&
    secondDigit === parseInt(cleaned.charAt(13))
  )
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

// Sleep helper
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
