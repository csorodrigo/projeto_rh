/**
 * AFD Generator - Arquivo Fonte de Dados
 *
 * Gera arquivo AFD conforme Portaria 671 do MTE (antiga Portaria 1510)
 * O AFD e um arquivo de texto com registros de 99 posicoes fixas.
 *
 * Tipos de Registro:
 * - Tipo 1: Cabecalho (dados do empregador)
 * - Tipo 2: Identificacao do REP (Registrador Eletronico de Ponto)
 * - Tipo 3: Marcacoes de ponto (NSR + PIS + Data + Hora)
 * - Tipo 4: Ajustes de marcacoes
 * - Tipo 5: Inclusao de marcacoes
 * - Tipo 9: Trailer (rodape)
 */

import type { Company, Employee, TimeTrackingDaily, TimeRecord } from '@/types/database'

// Configuracao de encoding
export type AFDEncoding = 'ISO-8859-1' | 'UTF-8'

/**
 * Configuracao para geracao do AFD
 */
export interface AFDConfig {
  /** Encoding do arquivo (padrao: UTF-8) */
  encoding?: AFDEncoding
  /** Versao do leiaute AFD (2 = Portaria 671) */
  layoutVersion?: number
  /** Numero de fabricacao do REP */
  repNumber?: string
  /** Tipo de REP (1=REP-C, 2=REP-A, 3=REP-P) */
  repType?: 1 | 2 | 3
  /** Responsavel tecnico */
  technicalResponsible?: string
  /** CNPJ/CPF do responsavel tecnico */
  technicalResponsibleDoc?: string
}

/**
 * Dados para geracao do AFD
 */
export interface AFDData {
  company: Company
  employees: Employee[]
  timeRecords: TimeRecord[]
  dailyRecords: TimeTrackingDaily[]
  adjustments?: TimeAdjustment[]
  inclusions?: TimeInclusion[]
  startDate: Date
  endDate: Date
}

/**
 * Ajuste de marcacao (Tipo 4)
 */
export interface TimeAdjustment {
  nsr: number
  originalDateTime: Date
  adjustedDateTime: Date
  employeePis: string
  reason: string
  adjustedBy: string
  adjustedAt: Date
}

/**
 * Inclusao de marcacao (Tipo 5)
 */
export interface TimeInclusion {
  nsr: number
  dateTime: Date
  employeePis: string
  reason: string
  includedBy: string
  includedAt: Date
}

/**
 * Resultado da geracao do AFD
 */
export interface AFDResult {
  content: string
  filename: string
  totalRecords: number
  encoding: AFDEncoding
}

/**
 * Classe para geracao de arquivos AFD
 */
export class AFDGenerator {
  private config: Required<AFDConfig>
  private nsrCounter: number = 0

  constructor(config: AFDConfig = {}) {
    this.config = {
      encoding: config.encoding ?? 'UTF-8',
      layoutVersion: config.layoutVersion ?? 2,
      repNumber: config.repNumber ?? '000000000000000000',
      repType: config.repType ?? 3, // REP-P (programa)
      technicalResponsible: config.technicalResponsible ?? '',
      technicalResponsibleDoc: config.technicalResponsibleDoc ?? '',
    }
  }

  /**
   * Gera o arquivo AFD completo
   */
  public generate(data: AFDData): AFDResult {
    this.nsrCounter = 0
    const lines: string[] = []

    // Registro Tipo 1 - Cabecalho
    lines.push(this.generateType1(data.company, data.startDate, data.endDate))

    // Registro Tipo 2 - REP
    lines.push(this.generateType2(data.company))

    // Registro Tipo 3 - Marcacoes de ponto
    const sortedRecords = [...data.timeRecords].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    for (const record of sortedRecords) {
      const employee = data.employees.find(e => e.id === record.employee_id)
      if (employee?.pis) {
        lines.push(this.generateType3(record, employee.pis))
      }
    }

    // Registro Tipo 4 - Ajustes
    if (data.adjustments) {
      for (const adjustment of data.adjustments) {
        lines.push(this.generateType4(adjustment))
      }
    }

    // Registro Tipo 5 - Inclusoes
    if (data.inclusions) {
      for (const inclusion of data.inclusions) {
        lines.push(this.generateType5(inclusion))
      }
    }

    // Registro Tipo 9 - Trailer
    lines.push(this.generateType9(lines.length))

    const content = lines.join('\r\n')

    // Gera nome do arquivo
    const startStr = this.formatDate(data.startDate).replace(/\//g, '')
    const endStr = this.formatDate(data.endDate).replace(/\//g, '')
    const cnpj = this.cleanDocument(data.company.cnpj || '')
    const filename = `AFD_${cnpj}_${startStr}_${endStr}.txt`

    return {
      content,
      filename,
      totalRecords: lines.length,
      encoding: this.config.encoding,
    }
  }

  /**
   * Registro Tipo 1 - Cabecalho
   * Posicoes: 99 caracteres
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (1)         | N       |
   * | 2   | 9   | NSR sequencial               | N       |
   * | 11  | 1   | Tipo identificador (1=CNPJ)  | N       |
   * | 12  | 14  | CNPJ do empregador           | N       |
   * | 26  | 12  | CEI (se houver)              | N       |
   * | 38  | 150 | Razao social                 | A       |
   * | 188 | 17  | Numero fabricacao REP        | A       |
   * | 205 | 8   | Data inicio periodo          | N       |
   * | 213 | 8   | Data fim periodo             | N       |
   * | 221 | 8   | Data/hora geracao            | N       |
   */
  private generateType1(company: Company, startDate: Date, endDate: Date): string {
    const nsr = this.getNextNSR()

    // Monta a linha
    let line = ''
    line += '1'                                               // Tipo (pos 1)
    line += this.padLeft(nsr.toString(), 9, '0')              // NSR (pos 2-10)
    line += '1'                                               // Tipo identificador (pos 11)
    line += this.cleanDocument(company.cnpj || '').padStart(14, '0') // CNPJ (pos 12-25)
    line += ''.padEnd(12, ' ')                                // CEI vazio (pos 26-37)
    line += this.padRight(company.name || '', 150, ' ')       // Razao social (pos 38-187)
    line += this.padRight(this.config.repNumber, 17, '0')     // REP (pos 188-204)
    line += this.formatDateAFD(startDate)                     // Data inicio (pos 205-212)
    line += this.formatDateAFD(endDate)                       // Data fim (pos 213-220)
    line += this.formatDateTimeAFD(new Date())                // Geracao (pos 221-234)

    // Preenche ate 99 posicoes
    return this.padRight(line, 99, ' ')
  }

  /**
   * Registro Tipo 2 - Identificacao do REP
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (2)         | N       |
   * | 2   | 9   | NSR sequencial               | N       |
   * | 11  | 17  | Numero fabricacao REP        | A       |
   * | 28  | 1   | Tipo REP                     | N       |
   * | 29  | 150 | Marca/Modelo                 | A       |
   * | 179 | 25  | Versao firmware              | A       |
   */
  private generateType2(company: Company): string {
    const nsr = this.getNextNSR()

    let line = ''
    line += '2'                                               // Tipo
    line += this.padLeft(nsr.toString(), 9, '0')              // NSR
    line += this.padRight(this.config.repNumber, 17, '0')     // Fabricacao REP
    line += this.config.repType.toString()                    // Tipo REP
    line += this.padRight('RH-RICKGAY WEB', 150, ' ')         // Marca/Modelo
    line += this.padRight('1.0.0', 25, ' ')                   // Versao

    return this.padRight(line, 99, ' ')
  }

  /**
   * Registro Tipo 3 - Marcacoes de ponto
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (3)         | N       |
   * | 2   | 9   | NSR sequencial               | N       |
   * | 11  | 12  | PIS do empregado             | N       |
   * | 23  | 8   | Data da marcacao             | N       |
   * | 31  | 4   | Hora da marcacao             | N       |
   */
  private generateType3(record: TimeRecord, pis: string): string {
    const nsr = this.getNextNSR()
    const recordDate = new Date(record.recorded_at)

    let line = ''
    line += '3'                                               // Tipo
    line += this.padLeft(nsr.toString(), 9, '0')              // NSR
    line += this.cleanDocument(pis).padStart(12, '0')         // PIS
    line += this.formatDateAFD(recordDate)                    // Data
    line += this.formatTimeAFD(recordDate)                    // Hora

    return this.padRight(line, 99, ' ')
  }

  /**
   * Registro Tipo 4 - Ajuste de marcacao
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (4)         | N       |
   * | 2   | 9   | NSR sequencial               | N       |
   * | 11  | 8   | Data original                | N       |
   * | 19  | 4   | Hora original                | N       |
   * | 23  | 8   | Data ajustada                | N       |
   * | 31  | 4   | Hora ajustada                | N       |
   * | 35  | 12  | PIS                          | N       |
   */
  private generateType4(adjustment: TimeAdjustment): string {
    const nsr = this.getNextNSR()

    let line = ''
    line += '4'                                               // Tipo
    line += this.padLeft(nsr.toString(), 9, '0')              // NSR
    line += this.formatDateAFD(adjustment.originalDateTime)   // Data original
    line += this.formatTimeAFD(adjustment.originalDateTime)   // Hora original
    line += this.formatDateAFD(adjustment.adjustedDateTime)   // Data ajustada
    line += this.formatTimeAFD(adjustment.adjustedDateTime)   // Hora ajustada
    line += this.cleanDocument(adjustment.employeePis).padStart(12, '0') // PIS

    return this.padRight(line, 99, ' ')
  }

  /**
   * Registro Tipo 5 - Inclusao de marcacao
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (5)         | N       |
   * | 2   | 9   | NSR sequencial               | N       |
   * | 11  | 8   | Data inclusao                | N       |
   * | 19  | 4   | Hora inclusao                | N       |
   * | 23  | 12  | PIS                          | N       |
   */
  private generateType5(inclusion: TimeInclusion): string {
    const nsr = this.getNextNSR()

    let line = ''
    line += '5'                                               // Tipo
    line += this.padLeft(nsr.toString(), 9, '0')              // NSR
    line += this.formatDateAFD(inclusion.dateTime)            // Data
    line += this.formatTimeAFD(inclusion.dateTime)            // Hora
    line += this.cleanDocument(inclusion.employeePis).padStart(12, '0') // PIS

    return this.padRight(line, 99, ' ')
  }

  /**
   * Registro Tipo 9 - Trailer
   *
   * | Pos | Tam | Descricao                    | Formato |
   * |-----|-----|------------------------------|---------|
   * | 1   | 1   | Tipo de registro (9)         | N       |
   * | 2   | 9   | Qtd total de registros       | N       |
   */
  private generateType9(totalRecords: number): string {
    let line = ''
    line += '9'                                               // Tipo
    line += this.padLeft((totalRecords + 1).toString(), 9, '0') // Total registros (incluindo trailer)

    return this.padRight(line, 99, ' ')
  }

  /**
   * Obtem o proximo NSR (Numero Sequencial de Registro)
   */
  private getNextNSR(): number {
    return ++this.nsrCounter
  }

  /**
   * Formata data para o formato AFD (DDMMAAAA)
   */
  private formatDateAFD(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    return `${day}${month}${year}`
  }

  /**
   * Formata hora para o formato AFD (HHMM)
   */
  private formatTimeAFD(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}${minutes}`
  }

  /**
   * Formata data e hora para o formato AFD (DDMMAAAAHHMM)
   */
  private formatDateTimeAFD(date: Date): string {
    return this.formatDateAFD(date) + this.formatTimeAFD(date)
  }

  /**
   * Formata data para exibicao (DD/MM/AAAA)
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    return `${day}/${month}/${year}`
  }

  /**
   * Remove caracteres nao numericos de um documento (CPF, CNPJ, PIS)
   */
  private cleanDocument(doc: string): string {
    return doc.replace(/\D/g, '')
  }

  /**
   * Preenche a esquerda com um caractere
   */
  private padLeft(str: string, length: number, char: string): string {
    return str.padStart(length, char)
  }

  /**
   * Preenche a direita com um caractere
   */
  private padRight(str: string, length: number, char: string): string {
    // Remove acentos e caracteres especiais
    const normalized = this.normalizeString(str)
    return normalized.substring(0, length).padEnd(length, char)
  }

  /**
   * Remove acentos e caracteres especiais
   */
  private normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x00-\x7F]/g, '')
  }

  /**
   * Converte o conteudo para o encoding especificado
   */
  public encodeContent(content: string): Buffer {
    if (this.config.encoding === 'ISO-8859-1') {
      // Para ISO-8859-1, precisamos converter manualmente
      const buffer = Buffer.alloc(content.length)
      for (let i = 0; i < content.length; i++) {
        buffer[i] = content.charCodeAt(i) & 0xFF
      }
      return buffer
    }
    return Buffer.from(content, 'utf-8')
  }
}

/**
 * Funcao utilitaria para gerar AFD de forma simplificada
 */
export function generateAFD(data: AFDData, config?: AFDConfig): AFDResult {
  const generator = new AFDGenerator(config)
  return generator.generate(data)
}

/**
 * Valida um PIS
 */
export function validatePIS(pis: string): boolean {
  const cleanPis = pis.replace(/\D/g, '')

  if (cleanPis.length !== 11) {
    return false
  }

  // Multiplica cada digito por seu peso
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanPis[i], 10) * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder

  return checkDigit === parseInt(cleanPis[10], 10)
}

/**
 * Formata um PIS para exibicao (XXX.XXXXX.XX-X)
 */
export function formatPIS(pis: string): string {
  const cleanPis = pis.replace(/\D/g, '').padStart(11, '0')
  return `${cleanPis.slice(0, 3)}.${cleanPis.slice(3, 8)}.${cleanPis.slice(8, 10)}-${cleanPis.slice(10)}`
}
