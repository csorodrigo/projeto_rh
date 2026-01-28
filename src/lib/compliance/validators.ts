/**
 * Validators - Validacao de arquivos AFD e dados de compliance
 *
 * Implementa validacoes de:
 * - Estrutura e integridade do arquivo AFD
 * - Sequencia de NSR
 * - Digitos verificadores (PIS, CNPJ, CPF)
 * - Regras de negocio CLT
 */

import type {
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  ValidationErrorCode,
  AFDRecordType,
} from './types'

// ============================================================================
// Constants
// ============================================================================

/** Tamanho fixo de cada registro AFD */
const AFD_RECORD_LENGTH = 99

/** Regex para validar data no formato DDMMAAAA */
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])(\d{4})$/

/** Regex para validar hora no formato HHMM */
const TIME_REGEX = /^([01][0-9]|2[0-3])([0-5][0-9])$/

// ============================================================================
// Document Validators
// ============================================================================

/**
 * Valida um CNPJ
 * @param cnpj CNPJ a validar (apenas digitos)
 */
export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '')

  if (clean.length !== 14) return false

  // Rejeita CNPJs com todos os digitos iguais
  if (/^(\d)\1+$/.test(clean)) return false

  // Calcula primeiro digito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(clean[12], 10) !== digit) return false

  // Calcula segundo digito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i], 10) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(clean[13], 10) !== digit) return false

  return true
}

/**
 * Valida um CPF
 * @param cpf CPF a validar (apenas digitos)
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')

  if (clean.length !== 11) return false

  // Rejeita CPFs com todos os digitos iguais
  if (/^(\d)\1+$/.test(clean)) return false

  // Calcula primeiro digito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (parseInt(clean[9], 10) !== digit) return false

  // Calcula segundo digito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (parseInt(clean[10], 10) !== digit) return false

  return true
}

/**
 * Valida um PIS/PASEP
 * @param pis PIS a validar (apenas digitos)
 */
export function validatePIS(pis: string): boolean {
  const clean = pis.replace(/\D/g, '')

  if (clean.length !== 11) return false

  // Rejeita PIS com todos os digitos iguais
  if (/^(\d)\1+$/.test(clean)) return false

  // Pesos para calculo
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder

  return checkDigit === parseInt(clean[10], 10)
}

/**
 * Valida uma data no formato DDMMAAAA
 */
export function validateDateDDMMAAAA(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false

  const day = parseInt(date.substring(0, 2), 10)
  const month = parseInt(date.substring(2, 4), 10)
  const year = parseInt(date.substring(4, 8), 10)

  // Verifica se a data e valida
  const dateObj = new Date(year, month - 1, day)
  return (
    dateObj.getDate() === day &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getFullYear() === year
  )
}

/**
 * Valida uma hora no formato HHMM
 */
export function validateTimeHHMM(time: string): boolean {
  return TIME_REGEX.test(time)
}

// ============================================================================
// AFD Structure Validators
// ============================================================================

/**
 * Extrai o tipo de registro de uma linha AFD
 */
function getRecordType(line: string): AFDRecordType | null {
  const type = parseInt(line.charAt(0), 10)
  if ([1, 2, 3, 4, 5, 9].includes(type)) {
    return type as AFDRecordType
  }
  return null
}

/**
 * Extrai o NSR de uma linha AFD
 */
function getNSR(line: string): number | null {
  const nsrStr = line.substring(1, 10)
  const nsr = parseInt(nsrStr, 10)
  return isNaN(nsr) ? null : nsr
}

/**
 * Valida um registro de cabecalho (Tipo 1)
 */
function validateType1(line: string, lineNumber: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Extrai campos
  const identifierType = line.charAt(10)
  const cnpj = line.substring(11, 25)
  const companyName = line.substring(37, 187).trim()
  const startDate = line.substring(204, 212)
  const endDate = line.substring(212, 220)

  // Valida tipo de identificador
  if (!['1', '2'].includes(identifierType)) {
    issues.push({
      code: 'INVALID_RECORD_TYPE',
      severity: 'error',
      message: `Tipo de identificador invalido: ${identifierType}. Esperado: 1 (CNPJ) ou 2 (CPF)`,
      line: lineNumber,
      field: 'identifierType',
      foundValue: identifierType,
      expectedValue: '1 ou 2',
    })
  }

  // Valida CNPJ (se tipo = 1)
  if (identifierType === '1') {
    const cleanCNPJ = cnpj.replace(/^0+/, '') || '0'
    if (cleanCNPJ !== '0' && !validateCNPJ(cnpj)) {
      issues.push({
        code: 'INVALID_CNPJ',
        severity: 'error',
        message: `CNPJ invalido: ${cnpj}`,
        line: lineNumber,
        field: 'cnpj',
        foundValue: cnpj,
      })
    }
  }

  // Valida razao social
  if (!companyName || companyName.length < 2) {
    issues.push({
      code: 'INVALID_RECORD_TYPE',
      severity: 'warning',
      message: 'Razao social vazia ou muito curta',
      line: lineNumber,
      field: 'companyName',
      foundValue: companyName,
    })
  }

  // Valida datas
  if (!validateDateDDMMAAAA(startDate)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data de inicio invalida: ${startDate}`,
      line: lineNumber,
      field: 'startDate',
      foundValue: startDate,
    })
  }

  if (!validateDateDDMMAAAA(endDate)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data de fim invalida: ${endDate}`,
      line: lineNumber,
      field: 'endDate',
      foundValue: endDate,
    })
  }

  return issues
}

/**
 * Valida um registro de marcacao (Tipo 3)
 */
function validateType3(line: string, lineNumber: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Extrai campos
  const pis = line.substring(10, 22)
  const date = line.substring(22, 30)
  const time = line.substring(30, 34)

  // Valida PIS
  if (!validatePIS(pis)) {
    issues.push({
      code: 'INVALID_PIS',
      severity: 'error',
      message: `PIS invalido: ${pis}`,
      line: lineNumber,
      field: 'pis',
      foundValue: pis,
    })
  }

  // Valida data
  if (!validateDateDDMMAAAA(date)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data de marcacao invalida: ${date}`,
      line: lineNumber,
      field: 'date',
      foundValue: date,
    })
  }

  // Valida hora
  if (!validateTimeHHMM(time)) {
    issues.push({
      code: 'INVALID_TIME',
      severity: 'error',
      message: `Hora de marcacao invalida: ${time}`,
      line: lineNumber,
      field: 'time',
      foundValue: time,
    })
  }

  return issues
}

/**
 * Valida um registro de ajuste (Tipo 4)
 */
function validateType4(line: string, lineNumber: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Extrai campos
  const originalDate = line.substring(10, 18)
  const originalTime = line.substring(18, 22)
  const adjustedDate = line.substring(22, 30)
  const adjustedTime = line.substring(30, 34)
  const pis = line.substring(34, 46)

  // Valida datas
  if (!validateDateDDMMAAAA(originalDate)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data original invalida: ${originalDate}`,
      line: lineNumber,
      field: 'originalDate',
      foundValue: originalDate,
    })
  }

  if (!validateDateDDMMAAAA(adjustedDate)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data ajustada invalida: ${adjustedDate}`,
      line: lineNumber,
      field: 'adjustedDate',
      foundValue: adjustedDate,
    })
  }

  // Valida horas
  if (!validateTimeHHMM(originalTime)) {
    issues.push({
      code: 'INVALID_TIME',
      severity: 'error',
      message: `Hora original invalida: ${originalTime}`,
      line: lineNumber,
      field: 'originalTime',
      foundValue: originalTime,
    })
  }

  if (!validateTimeHHMM(adjustedTime)) {
    issues.push({
      code: 'INVALID_TIME',
      severity: 'error',
      message: `Hora ajustada invalida: ${adjustedTime}`,
      line: lineNumber,
      field: 'adjustedTime',
      foundValue: adjustedTime,
    })
  }

  // Valida PIS
  if (!validatePIS(pis)) {
    issues.push({
      code: 'INVALID_PIS',
      severity: 'error',
      message: `PIS invalido: ${pis}`,
      line: lineNumber,
      field: 'pis',
      foundValue: pis,
    })
  }

  return issues
}

/**
 * Valida um registro de inclusao (Tipo 5)
 */
function validateType5(line: string, lineNumber: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Extrai campos
  const date = line.substring(10, 18)
  const time = line.substring(18, 22)
  const pis = line.substring(22, 34)

  // Valida data
  if (!validateDateDDMMAAAA(date)) {
    issues.push({
      code: 'INVALID_DATE',
      severity: 'error',
      message: `Data de inclusao invalida: ${date}`,
      line: lineNumber,
      field: 'date',
      foundValue: date,
    })
  }

  // Valida hora
  if (!validateTimeHHMM(time)) {
    issues.push({
      code: 'INVALID_TIME',
      severity: 'error',
      message: `Hora de inclusao invalida: ${time}`,
      line: lineNumber,
      field: 'time',
      foundValue: time,
    })
  }

  // Valida PIS
  if (!validatePIS(pis)) {
    issues.push({
      code: 'INVALID_PIS',
      severity: 'error',
      message: `PIS invalido: ${pis}`,
      line: lineNumber,
      field: 'pis',
      foundValue: pis,
    })
  }

  return issues
}

// ============================================================================
// Main AFD Validator
// ============================================================================

/**
 * Valida a integridade completa de um arquivo AFD
 * @param content Conteudo do arquivo AFD
 */
export function validateAFDIntegrity(content: string): ValidationResult {
  const issues: ValidationIssue[] = []
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)

  // Estatisticas
  const stats = {
    totalRecords: lines.length,
    recordsByType: {} as Record<number, number>,
    uniqueEmployees: new Set<string>(),
    dateRange: {
      start: null as Date | null,
      end: null as Date | null,
    },
  }

  // Rastreamento de NSR
  const seenNSRs = new Set<number>()
  let lastNSR = 0
  let hasHeader = false
  let hasTrailer = false
  let trailerCount = 0

  // Processa cada linha
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1

    // Verifica tamanho da linha
    if (line.length !== AFD_RECORD_LENGTH) {
      issues.push({
        code: 'INVALID_RECORD_LENGTH',
        severity: 'error',
        message: `Linha ${lineNumber} tem ${line.length} caracteres. Esperado: ${AFD_RECORD_LENGTH}`,
        line: lineNumber,
        foundValue: line.length.toString(),
        expectedValue: AFD_RECORD_LENGTH.toString(),
      })
      continue
    }

    // Extrai tipo de registro
    const recordType = getRecordType(line)
    if (recordType === null) {
      issues.push({
        code: 'INVALID_RECORD_TYPE',
        severity: 'error',
        message: `Tipo de registro invalido na linha ${lineNumber}`,
        line: lineNumber,
        foundValue: line.charAt(0),
        expectedValue: '1, 2, 3, 4, 5 ou 9',
      })
      continue
    }

    // Contabiliza tipo
    stats.recordsByType[recordType] = (stats.recordsByType[recordType] || 0) + 1

    // Extrai e valida NSR (exceto trailer)
    if (recordType !== 9) {
      const nsr = getNSR(line)
      if (nsr === null) {
        issues.push({
          code: 'INVALID_NSR_SEQUENCE',
          severity: 'error',
          message: `NSR invalido na linha ${lineNumber}`,
          line: lineNumber,
        })
      } else {
        // Verifica duplicidade
        if (seenNSRs.has(nsr)) {
          issues.push({
            code: 'DUPLICATE_NSR',
            severity: 'error',
            message: `NSR duplicado: ${nsr} na linha ${lineNumber}`,
            line: lineNumber,
            nsr,
          })
        } else {
          seenNSRs.add(nsr)
        }

        // Verifica sequencia
        if (lastNSR > 0 && nsr !== lastNSR + 1) {
          issues.push({
            code: 'INVALID_NSR_SEQUENCE',
            severity: 'warning',
            message: `NSR fora de sequencia: ${nsr} (esperado: ${lastNSR + 1}) na linha ${lineNumber}`,
            line: lineNumber,
            nsr,
            foundValue: nsr.toString(),
            expectedValue: (lastNSR + 1).toString(),
          })
        }

        lastNSR = nsr
      }
    }

    // Validacoes especificas por tipo
    switch (recordType) {
      case 1:
        hasHeader = true
        if (lineNumber !== 1) {
          issues.push({
            code: 'INVALID_RECORD_TYPE',
            severity: 'warning',
            message: 'Registro de cabecalho (Tipo 1) nao esta na primeira linha',
            line: lineNumber,
          })
        }
        issues.push(...validateType1(line, lineNumber))
        break

      case 2:
        // Tipo 2 (REP) - validacao basica ja feita
        break

      case 3:
        issues.push(...validateType3(line, lineNumber))
        // Coleta PIS para estatisticas
        const pis3 = line.substring(10, 22)
        stats.uniqueEmployees.add(pis3)
        // Coleta data para range
        const date3 = line.substring(22, 30)
        if (validateDateDDMMAAAA(date3)) {
          const day = parseInt(date3.substring(0, 2), 10)
          const month = parseInt(date3.substring(2, 4), 10) - 1
          const year = parseInt(date3.substring(4, 8), 10)
          const dateObj = new Date(year, month, day)
          if (!stats.dateRange.start || dateObj < stats.dateRange.start) {
            stats.dateRange.start = dateObj
          }
          if (!stats.dateRange.end || dateObj > stats.dateRange.end) {
            stats.dateRange.end = dateObj
          }
        }
        break

      case 4:
        issues.push(...validateType4(line, lineNumber))
        break

      case 5:
        issues.push(...validateType5(line, lineNumber))
        break

      case 9:
        hasTrailer = true
        trailerCount = parseInt(line.substring(1, 10), 10)
        if (lineNumber !== lines.length) {
          issues.push({
            code: 'INVALID_RECORD_TYPE',
            severity: 'warning',
            message: 'Registro de trailer (Tipo 9) nao esta na ultima linha',
            line: lineNumber,
          })
        }
        break
    }
  }

  // Verifica cabecalho e trailer
  if (!hasHeader) {
    issues.push({
      code: 'MISSING_HEADER',
      severity: 'error',
      message: 'Arquivo nao possui registro de cabecalho (Tipo 1)',
    })
  }

  if (!hasTrailer) {
    issues.push({
      code: 'MISSING_TRAILER',
      severity: 'error',
      message: 'Arquivo nao possui registro de trailer (Tipo 9)',
    })
  }

  // Verifica contagem do trailer
  if (hasTrailer && trailerCount !== lines.length) {
    issues.push({
      code: 'INCONSISTENT_TOTALS',
      severity: 'error',
      message: `Contagem no trailer (${trailerCount}) difere do numero de linhas (${lines.length})`,
      foundValue: trailerCount.toString(),
      expectedValue: lines.length.toString(),
    })
  }

  // Verifica se ha registros de ponto
  if ((stats.recordsByType[3] || 0) === 0) {
    issues.push({
      code: 'EMPTY_PERIOD',
      severity: 'warning',
      message: 'Arquivo nao possui registros de marcacao de ponto (Tipo 3)',
    })
  }

  // Monta resumo
  const summary = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }

  return {
    isValid: summary.errors === 0,
    issues,
    summary,
    stats: {
      totalRecords: stats.totalRecords,
      recordsByType: stats.recordsByType,
      uniqueEmployees: stats.uniqueEmployees.size,
      dateRange: stats.dateRange,
    },
  }
}

/**
 * Valida uma sequencia de registros de ponto para um dia
 * Verifica se a ordem entrada/intervalo/saida esta correta
 */
export function validateClockSequence(
  records: Array<{ type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'; time: Date }>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const sorted = [...records].sort((a, b) => a.time.getTime() - b.time.getTime())

  // Estado esperado
  type State = 'not_started' | 'working' | 'break' | 'finished'
  let state: State = 'not_started'
  let lastTime: Date | null = null

  const validTransitions: Record<State, string[]> = {
    not_started: ['clock_in'],
    working: ['break_start', 'clock_out'],
    break: ['break_end'],
    finished: [], // Pode ter novo clock_in no mesmo dia
  }

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i]

    // Verifica transicao valida
    if (!validTransitions[state].includes(record.type)) {
      issues.push({
        code: 'INVALID_CLOCK_SEQUENCE',
        severity: 'error',
        message: `Sequencia invalida: ${record.type} apos estado ${state}`,
        context: {
          recordIndex: i,
          currentState: state,
          recordType: record.type,
          time: record.time.toISOString(),
        },
      })
    }

    // Verifica sobreposicao
    if (lastTime && record.time <= lastTime) {
      issues.push({
        code: 'OVERLAPPING_RECORDS',
        severity: 'error',
        message: `Horario ${record.time.toISOString()} sobrepoe ou igual ao anterior ${lastTime.toISOString()}`,
        context: {
          recordIndex: i,
          recordType: record.type,
        },
      })
    }

    // Atualiza estado
    switch (record.type) {
      case 'clock_in':
        state = 'working'
        break
      case 'break_start':
        state = 'break'
        break
      case 'break_end':
        state = 'working'
        break
      case 'clock_out':
        state = 'finished'
        break
    }

    lastTime = record.time
  }

  return issues
}

/**
 * Valida se a jornada diaria nao excede o limite legal
 * CLT: maximo 10h diarias (8h + 2h extras)
 */
export function validateDailyLimit(
  workedMinutes: number,
  maxMinutes: number = 600 // 10 horas
): ValidationIssue | null {
  if (workedMinutes > maxMinutes) {
    return {
      code: 'EXCEEDS_DAILY_LIMIT',
      severity: 'warning',
      message: `Jornada de ${Math.floor(workedMinutes / 60)}h${workedMinutes % 60}min excede limite de ${Math.floor(maxMinutes / 60)}h diarias`,
      foundValue: workedMinutes.toString(),
      expectedValue: `<= ${maxMinutes}`,
    }
  }
  return null
}

/**
 * Valida se o intervalo minimo foi respeitado
 * CLT: minimo 1h para jornadas > 6h
 */
export function validateBreakDuration(
  workedMinutes: number,
  breakMinutes: number
): ValidationIssue | null {
  // Para jornadas > 6h, intervalo minimo de 60min
  if (workedMinutes > 360 && breakMinutes < 60) {
    return {
      code: 'MISSING_BREAK',
      severity: 'warning',
      message: `Intervalo de ${breakMinutes}min insuficiente para jornada de ${Math.floor(workedMinutes / 60)}h${workedMinutes % 60}min. Minimo: 60min`,
      foundValue: breakMinutes.toString(),
      expectedValue: '>= 60',
    }
  }

  // Para jornadas entre 4h e 6h, intervalo minimo de 15min
  if (workedMinutes > 240 && workedMinutes <= 360 && breakMinutes < 15) {
    return {
      code: 'MISSING_BREAK',
      severity: 'warning',
      message: `Intervalo de ${breakMinutes}min insuficiente para jornada de ${Math.floor(workedMinutes / 60)}h${workedMinutes % 60}min. Minimo: 15min`,
      foundValue: breakMinutes.toString(),
      expectedValue: '>= 15',
    }
  }

  return null
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calcula o checksum SHA-256 de um conteudo
 */
export async function calculateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Formata um resultado de validacao para exibicao
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []

  lines.push('='.repeat(60))
  lines.push('RESULTADO DA VALIDACAO AFD')
  lines.push('='.repeat(60))
  lines.push('')

  // Status
  lines.push(`Status: ${result.isValid ? 'VALIDO' : 'INVALIDO'}`)
  lines.push(`Erros: ${result.summary.errors}`)
  lines.push(`Avisos: ${result.summary.warnings}`)
  lines.push(`Informacoes: ${result.summary.info}`)
  lines.push('')

  // Estatisticas
  if (result.stats) {
    lines.push('-'.repeat(40))
    lines.push('ESTATISTICAS')
    lines.push('-'.repeat(40))
    lines.push(`Total de registros: ${result.stats.totalRecords}`)
    lines.push(`Funcionarios unicos: ${result.stats.uniqueEmployees}`)

    if (result.stats.dateRange.start && result.stats.dateRange.end) {
      lines.push(`Periodo: ${result.stats.dateRange.start.toLocaleDateString('pt-BR')} a ${result.stats.dateRange.end.toLocaleDateString('pt-BR')}`)
    }

    lines.push('Registros por tipo:')
    for (const [type, count] of Object.entries(result.stats.recordsByType)) {
      const typeName = {
        '1': 'Cabecalho',
        '2': 'REP',
        '3': 'Marcacao',
        '4': 'Ajuste',
        '5': 'Inclusao',
        '9': 'Trailer',
      }[type] || 'Desconhecido'
      lines.push(`  Tipo ${type} (${typeName}): ${count}`)
    }
    lines.push('')
  }

  // Problemas
  if (result.issues.length > 0) {
    lines.push('-'.repeat(40))
    lines.push('PROBLEMAS ENCONTRADOS')
    lines.push('-'.repeat(40))

    // Agrupa por severidade
    const bySevertity: Record<ValidationSeverity, ValidationIssue[]> = {
      error: [],
      warning: [],
      info: [],
    }

    for (const issue of result.issues) {
      bySevertity[issue.severity].push(issue)
    }

    // Erros primeiro
    if (bySevertity.error.length > 0) {
      lines.push('')
      lines.push('[ERROS]')
      for (const issue of bySevertity.error) {
        lines.push(`  - ${issue.message}`)
        if (issue.line) lines.push(`    Linha: ${issue.line}`)
        if (issue.field) lines.push(`    Campo: ${issue.field}`)
        if (issue.foundValue) lines.push(`    Valor: ${issue.foundValue}`)
      }
    }

    // Depois avisos
    if (bySevertity.warning.length > 0) {
      lines.push('')
      lines.push('[AVISOS]')
      for (const issue of bySevertity.warning) {
        lines.push(`  - ${issue.message}`)
        if (issue.line) lines.push(`    Linha: ${issue.line}`)
      }
    }

    // Por ultimo informacoes
    if (bySevertity.info.length > 0) {
      lines.push('')
      lines.push('[INFO]')
      for (const issue of bySevertity.info) {
        lines.push(`  - ${issue.message}`)
      }
    }
  }

  lines.push('')
  lines.push('='.repeat(60))

  return lines.join('\n')
}

/**
 * Cria um issue de validacao
 */
export function createValidationIssue(
  code: ValidationErrorCode,
  severity: ValidationSeverity,
  message: string,
  details?: Partial<ValidationIssue>
): ValidationIssue {
  return {
    code,
    severity,
    message,
    ...details,
  }
}
