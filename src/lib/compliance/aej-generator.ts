/**
 * AEJ Generator - Arquivo Eletronico de Jornada
 *
 * Gera arquivo AEJ conforme Portaria 671 do MTE
 * O AEJ consolida as jornadas de trabalho por periodo com:
 * - Identificacao do empregador
 * - Identificacao do trabalhador (PIS)
 * - Periodo de apuracao
 * - Jornada prevista x realizada
 * - Horas extras, faltas, DSR
 */

import type { Company, Employee, TimeTrackingDaily, WorkSchedule } from '@/types/database'
import {
  type MonthlyJourneyResult,
  type MonetaryValues,
  calculateMonthlyJourney,
  calculateMonetaryValues,
  minutesToDecimalHours,
  formatMinutesAsTime,
  countSundaysAndHolidays,
  type DailyTimeRecord,
  CLT_CONSTANTS,
} from './clt-calculations'

// Encoding do arquivo
export type AEJEncoding = 'ISO-8859-1' | 'UTF-8'

/**
 * Configuracao para geracao do AEJ
 */
export interface AEJConfig {
  /** Encoding do arquivo (padrao: UTF-8) */
  encoding?: AEJEncoding
  /** Incluir detalhamento diario */
  includeDaily?: boolean
  /** Incluir calculos monetarios */
  includeMonetary?: boolean
  /** Formato de saida (txt ou csv) */
  format?: 'txt' | 'csv'
}

/**
 * Dados para geracao do AEJ
 */
export interface AEJData {
  company: Company
  employees: Employee[]
  dailyRecords: TimeTrackingDaily[]
  workSchedules: WorkSchedule[]
  holidays: Date[]
  startDate: Date
  endDate: Date
}

/**
 * Registro de jornada consolidada por funcionario
 */
export interface EmployeeJourneyRecord {
  employee: Employee
  journeyResult: MonthlyJourneyResult
  monetaryValues?: MonetaryValues
  schedule?: WorkSchedule
}

/**
 * Resultado da geracao do AEJ
 */
export interface AEJResult {
  content: string
  filename: string
  totalEmployees: number
  period: string
  encoding: AEJEncoding
  records: EmployeeJourneyRecord[]
}

/**
 * Classe para geracao de arquivos AEJ
 */
export class AEJGenerator {
  private config: Required<AEJConfig>

  constructor(config: AEJConfig = {}) {
    this.config = {
      encoding: config.encoding ?? 'UTF-8',
      includeDaily: config.includeDaily ?? false,
      includeMonetary: config.includeMonetary ?? true,
      format: config.format ?? 'txt',
    }
  }

  /**
   * Gera o arquivo AEJ completo
   */
  public generate(data: AEJData): AEJResult {
    const records: EmployeeJourneyRecord[] = []
    const period = this.formatPeriod(data.startDate, data.endDate)

    // Processa cada funcionario
    for (const employee of data.employees) {
      // Filtra registros do funcionario
      const employeeRecords = data.dailyRecords.filter(
        r => r.employee_id === employee.id
      )

      // Converte para DailyTimeRecord
      const dailyRecords = this.convertToDailyRecords(
        employeeRecords,
        data.startDate,
        data.endDate,
        data.holidays
      )

      // Busca escala do funcionario
      const schedule = data.workSchedules.find(
        s => s.employee_id === employee.id || s.is_default
      )

      // Calcula jornada
      const weeklyHours = employee.weekly_hours ?? CLT_CONSTANTS.WEEKLY_HOURS
      const journeyResult = calculateMonthlyJourney(dailyRecords, weeklyHours)

      // Calcula valores monetarios se configurado
      let monetaryValues: MonetaryValues | undefined
      if (this.config.includeMonetary && employee.salary) {
        const sundaysAndHolidays = countSundaysAndHolidays(
          data.startDate,
          data.endDate,
          data.holidays
        )
        monetaryValues = calculateMonetaryValues(
          employee.salary,
          journeyResult,
          sundaysAndHolidays,
          weeklyHours
        )
      }

      records.push({
        employee,
        journeyResult,
        monetaryValues,
        schedule,
      })
    }

    // Gera conteudo no formato especificado
    const content = this.config.format === 'csv'
      ? this.generateCSV(data.company, records, data.startDate, data.endDate)
      : this.generateTXT(data.company, records, data.startDate, data.endDate)

    // Gera nome do arquivo
    const startStr = this.formatDateFile(data.startDate)
    const endStr = this.formatDateFile(data.endDate)
    const cnpj = this.cleanDocument(data.company.cnpj || '')
    const ext = this.config.format === 'csv' ? 'csv' : 'txt'
    const filename = `AEJ_${cnpj}_${startStr}_${endStr}.${ext}`

    return {
      content,
      filename,
      totalEmployees: records.length,
      period,
      encoding: this.config.encoding,
      records,
    }
  }

  /**
   * Gera conteudo no formato TXT
   */
  private generateTXT(
    company: Company,
    records: EmployeeJourneyRecord[],
    startDate: Date,
    endDate: Date
  ): string {
    const lines: string[] = []
    const separator = '='.repeat(100)

    // Cabecalho
    lines.push(separator)
    lines.push('ARQUIVO ELETRONICO DE JORNADA - AEJ')
    lines.push(`Portaria 671/2021 MTE`)
    lines.push(separator)
    lines.push('')

    // Dados do empregador
    lines.push('IDENTIFICACAO DO EMPREGADOR')
    lines.push('-'.repeat(50))
    lines.push(`Razao Social: ${company.name}`)
    lines.push(`CNPJ: ${this.formatCNPJ(company.cnpj || '')}`)
    lines.push(`Endereco: ${this.formatAddress(company.address)}`)
    lines.push('')

    // Periodo de apuracao
    lines.push('PERIODO DE APURACAO')
    lines.push('-'.repeat(50))
    lines.push(`Data Inicial: ${this.formatDate(startDate)}`)
    lines.push(`Data Final: ${this.formatDate(endDate)}`)
    lines.push(`Total de Funcionarios: ${records.length}`)
    lines.push('')

    // Registros por funcionario
    lines.push(separator)
    lines.push('REGISTROS DE JORNADA POR TRABALHADOR')
    lines.push(separator)

    for (const record of records) {
      lines.push('')
      lines.push(this.generateEmployeeSection(record))
    }

    // Resumo geral
    lines.push('')
    lines.push(separator)
    lines.push('RESUMO GERAL')
    lines.push(separator)
    lines.push(this.generateSummary(records))

    // Rodape
    lines.push('')
    lines.push(separator)
    lines.push(`Arquivo gerado em: ${this.formatDateTime(new Date())}`)
    lines.push(`Sistema: RH-RICKGAY`)
    lines.push(separator)

    return lines.join('\r\n')
  }

  /**
   * Gera secao de um funcionario
   */
  private generateEmployeeSection(record: EmployeeJourneyRecord): string {
    const lines: string[] = []
    const { employee, journeyResult, monetaryValues, schedule } = record

    // Identificacao do trabalhador
    lines.push('-'.repeat(80))
    lines.push(`TRABALHADOR: ${employee.name}`)
    lines.push('-'.repeat(80))
    lines.push(`PIS/PASEP: ${this.formatPIS(employee.pis || '')}`)
    lines.push(`CPF: ${this.formatCPF(employee.cpf)}`)
    lines.push(`Matricula: ${employee.employee_number}`)
    lines.push(`Cargo: ${employee.position}`)
    lines.push(`Departamento: ${employee.department || 'N/A'}`)
    lines.push(`Data Admissao: ${this.formatDate(new Date(employee.hire_date))}`)
    lines.push(`Jornada Semanal: ${employee.weekly_hours || CLT_CONSTANTS.WEEKLY_HOURS}h`)
    lines.push('')

    // Jornada resumida
    lines.push('JORNADA DO PERIODO')
    lines.push(`  Dias Uteis no Periodo: ${journeyResult.totalWorkdays}`)
    lines.push(`  Dias Trabalhados: ${journeyResult.totalWorkedDays}`)
    lines.push(`  Faltas: ${journeyResult.absenceDays} dias`)
    lines.push('')
    lines.push(`  Horas Trabalhadas: ${formatMinutesAsTime(journeyResult.totalWorkedMinutes)} (${minutesToDecimalHours(journeyResult.totalWorkedMinutes).toFixed(2)}h)`)
    lines.push(`  Horas Extras 50%: ${formatMinutesAsTime(journeyResult.totalOvertime50Minutes)} (${minutesToDecimalHours(journeyResult.totalOvertime50Minutes).toFixed(2)}h)`)
    lines.push(`  Horas Extras 100%: ${formatMinutesAsTime(journeyResult.totalOvertime100Minutes)} (${minutesToDecimalHours(journeyResult.totalOvertime100Minutes).toFixed(2)}h)`)
    lines.push(`  Horas Noturnas: ${formatMinutesAsTime(journeyResult.totalNightMinutes)} (${minutesToDecimalHours(journeyResult.totalNightMinutes).toFixed(2)}h)`)
    lines.push(`  Horas Faltantes: ${formatMinutesAsTime(journeyResult.totalMissingMinutes)} (${minutesToDecimalHours(journeyResult.totalMissingMinutes).toFixed(2)}h)`)
    lines.push(`  Saldo Banco Horas: ${formatMinutesAsTime(journeyResult.timeBankBalance)}`)

    // Valores monetarios
    if (monetaryValues) {
      lines.push('')
      lines.push('VALORES CALCULADOS')
      lines.push(`  Salario Base: ${this.formatCurrency(monetaryValues.baseSalary)}`)
      lines.push(`  Valor Hora: ${this.formatCurrency(monetaryValues.hourlyRate)}`)
      lines.push(`  Horas Extras 50%: ${this.formatCurrency(monetaryValues.overtime50Value)}`)
      lines.push(`  Horas Extras 100%: ${this.formatCurrency(monetaryValues.overtime100Value)}`)
      lines.push(`  Adicional Noturno: ${this.formatCurrency(monetaryValues.nightShiftValue)}`)
      lines.push(`  DSR s/ HE: ${this.formatCurrency(monetaryValues.dsrValue)}`)
      lines.push(`  Total Adicionais: ${this.formatCurrency(monetaryValues.totalEarnings)}`)
      lines.push(`  Desconto Faltas: ${this.formatCurrency(monetaryValues.absenceDeduction)}`)
    }

    // Detalhamento diario
    if (this.config.includeDaily && journeyResult.dailyDetails.length > 0) {
      lines.push('')
      lines.push('DETALHAMENTO DIARIO')
      lines.push('  Data       | Trabalhado | HE 50% | HE 100% | Noturno | Falta    | Obs')
      lines.push('  ' + '-'.repeat(75))

      for (const daily of journeyResult.dailyDetails) {
        const dateStr = this.formatDate(daily.date)
        const worked = formatMinutesAsTime(daily.netWorkedMinutes)
        const he50 = formatMinutesAsTime(daily.overtime50Minutes)
        const he100 = formatMinutesAsTime(daily.overtime100Minutes)
        const night = formatMinutesAsTime(daily.nightMinutes)
        const missing = formatMinutesAsTime(daily.missingMinutes)
        const obs = daily.warnings.length > 0 ? daily.warnings[0] : ''

        lines.push(`  ${dateStr} | ${worked.padStart(10)} | ${he50.padStart(6)} | ${he100.padStart(7)} | ${night.padStart(7)} | ${missing.padStart(8)} | ${obs}`)
      }
    }

    return lines.join('\r\n')
  }

  /**
   * Gera resumo geral
   */
  private generateSummary(records: EmployeeJourneyRecord[]): string {
    const totals = records.reduce(
      (acc, r) => ({
        workedMinutes: acc.workedMinutes + r.journeyResult.totalWorkedMinutes,
        overtime50: acc.overtime50 + r.journeyResult.totalOvertime50Minutes,
        overtime100: acc.overtime100 + r.journeyResult.totalOvertime100Minutes,
        nightMinutes: acc.nightMinutes + r.journeyResult.totalNightMinutes,
        missingMinutes: acc.missingMinutes + r.journeyResult.totalMissingMinutes,
        absenceDays: acc.absenceDays + r.journeyResult.absenceDays,
        overtime50Value: acc.overtime50Value + (r.monetaryValues?.overtime50Value ?? 0),
        overtime100Value: acc.overtime100Value + (r.monetaryValues?.overtime100Value ?? 0),
        nightShiftValue: acc.nightShiftValue + (r.monetaryValues?.nightShiftValue ?? 0),
        dsrValue: acc.dsrValue + (r.monetaryValues?.dsrValue ?? 0),
        absenceDeduction: acc.absenceDeduction + (r.monetaryValues?.absenceDeduction ?? 0),
      }),
      {
        workedMinutes: 0,
        overtime50: 0,
        overtime100: 0,
        nightMinutes: 0,
        missingMinutes: 0,
        absenceDays: 0,
        overtime50Value: 0,
        overtime100Value: 0,
        nightShiftValue: 0,
        dsrValue: 0,
        absenceDeduction: 0,
      }
    )

    const lines: string[] = []
    lines.push(`Total Funcionarios: ${records.length}`)
    lines.push(`Total Faltas: ${totals.absenceDays} dias`)
    lines.push('')
    lines.push('TOTAIS DE HORAS:')
    lines.push(`  Trabalhadas: ${formatMinutesAsTime(totals.workedMinutes)} (${minutesToDecimalHours(totals.workedMinutes).toFixed(2)}h)`)
    lines.push(`  Extras 50%: ${formatMinutesAsTime(totals.overtime50)} (${minutesToDecimalHours(totals.overtime50).toFixed(2)}h)`)
    lines.push(`  Extras 100%: ${formatMinutesAsTime(totals.overtime100)} (${minutesToDecimalHours(totals.overtime100).toFixed(2)}h)`)
    lines.push(`  Noturnas: ${formatMinutesAsTime(totals.nightMinutes)} (${minutesToDecimalHours(totals.nightMinutes).toFixed(2)}h)`)
    lines.push(`  Faltantes: ${formatMinutesAsTime(totals.missingMinutes)} (${minutesToDecimalHours(totals.missingMinutes).toFixed(2)}h)`)

    if (this.config.includeMonetary) {
      lines.push('')
      lines.push('TOTAIS FINANCEIROS:')
      lines.push(`  Horas Extras 50%: ${this.formatCurrency(totals.overtime50Value)}`)
      lines.push(`  Horas Extras 100%: ${this.formatCurrency(totals.overtime100Value)}`)
      lines.push(`  Adicional Noturno: ${this.formatCurrency(totals.nightShiftValue)}`)
      lines.push(`  DSR: ${this.formatCurrency(totals.dsrValue)}`)
      lines.push(`  Descontos Faltas: ${this.formatCurrency(totals.absenceDeduction)}`)
      const totalAdditional = totals.overtime50Value + totals.overtime100Value +
                             totals.nightShiftValue + totals.dsrValue
      lines.push(`  TOTAL ADICIONAIS: ${this.formatCurrency(totalAdditional)}`)
    }

    return lines.join('\r\n')
  }

  /**
   * Gera conteudo no formato CSV
   */
  private generateCSV(
    company: Company,
    records: EmployeeJourneyRecord[],
    startDate: Date,
    endDate: Date
  ): string {
    const lines: string[] = []

    // Cabecalho CSV
    const headers = [
      'PIS',
      'CPF',
      'Nome',
      'Matricula',
      'Cargo',
      'Departamento',
      'Data Admissao',
      'Jornada Semanal',
      'Dias Uteis',
      'Dias Trabalhados',
      'Faltas',
      'Horas Trabalhadas',
      'HE 50%',
      'HE 100%',
      'Horas Noturnas',
      'Horas Faltantes',
      'Saldo Banco Horas',
    ]

    if (this.config.includeMonetary) {
      headers.push(
        'Salario Base',
        'Valor Hora',
        'Valor HE 50%',
        'Valor HE 100%',
        'Adicional Noturno',
        'DSR',
        'Total Adicionais',
        'Desconto Faltas'
      )
    }

    lines.push(headers.join(';'))

    // Dados
    for (const record of records) {
      const { employee, journeyResult, monetaryValues } = record

      const row = [
        this.cleanDocument(employee.pis || ''),
        this.cleanDocument(employee.cpf),
        employee.name,
        employee.employee_number,
        employee.position,
        employee.department || '',
        this.formatDateISO(new Date(employee.hire_date)),
        (employee.weekly_hours || CLT_CONSTANTS.WEEKLY_HOURS).toString(),
        journeyResult.totalWorkdays.toString(),
        journeyResult.totalWorkedDays.toString(),
        journeyResult.absenceDays.toString(),
        minutesToDecimalHours(journeyResult.totalWorkedMinutes).toFixed(2),
        minutesToDecimalHours(journeyResult.totalOvertime50Minutes).toFixed(2),
        minutesToDecimalHours(journeyResult.totalOvertime100Minutes).toFixed(2),
        minutesToDecimalHours(journeyResult.totalNightMinutes).toFixed(2),
        minutesToDecimalHours(journeyResult.totalMissingMinutes).toFixed(2),
        minutesToDecimalHours(journeyResult.timeBankBalance).toFixed(2),
      ]

      if (this.config.includeMonetary && monetaryValues) {
        row.push(
          monetaryValues.baseSalary.toFixed(2),
          monetaryValues.hourlyRate.toFixed(2),
          monetaryValues.overtime50Value.toFixed(2),
          monetaryValues.overtime100Value.toFixed(2),
          monetaryValues.nightShiftValue.toFixed(2),
          monetaryValues.dsrValue.toFixed(2),
          monetaryValues.totalEarnings.toFixed(2),
          monetaryValues.absenceDeduction.toFixed(2)
        )
      }

      lines.push(row.join(';'))
    }

    return lines.join('\r\n')
  }

  /**
   * Converte registros do banco para DailyTimeRecord
   */
  private convertToDailyRecords(
    records: TimeTrackingDaily[],
    startDate: Date,
    endDate: Date,
    holidays: Date[]
  ): DailyTimeRecord[] {
    const result: DailyTimeRecord[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const record = records.find(r => r.date === dateStr)
      const dayOfWeek = current.getDay()

      const isHoliday = record?.is_holiday ||
        holidays.some(h => h.toDateString() === current.toDateString())

      const dailyRecord: DailyTimeRecord = {
        date: new Date(current),
        clockIn: record?.clock_in ? new Date(`${dateStr}T${record.clock_in}`) : null,
        clockOut: record?.clock_out ? new Date(`${dateStr}T${record.clock_out}`) : null,
        breakStart: record?.break_start ? new Date(`${dateStr}T${record.break_start}`) : null,
        breakEnd: record?.break_end ? new Date(`${dateStr}T${record.break_end}`) : null,
        additionalBreaks: record?.additional_breaks?.map(b => ({
          start: new Date(`${dateStr}T${b.start}`),
          end: new Date(`${dateStr}T${b.end}`),
        })),
        isWorkday: record?.is_workday ?? (dayOfWeek !== 0 && dayOfWeek !== 6),
        isHoliday,
        isSunday: dayOfWeek === 0,
      }

      result.push(dailyRecord)
      current.setDate(current.getDate() + 1)
    }

    return result
  }

  /**
   * Formata periodo
   */
  private formatPeriod(startDate: Date, endDate: Date): string {
    return `${this.formatDate(startDate)} a ${this.formatDate(endDate)}`
  }

  /**
   * Formata data para DD/MM/AAAA
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Formata data para AAAA-MM-DD (ISO)
   */
  private formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Formata data para DDMMAAAA (nome de arquivo)
   */
  private formatDateFile(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}${month}${year}`
  }

  /**
   * Formata data e hora
   */
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${dateStr} ${hours}:${minutes}`
  }

  /**
   * Formata CNPJ
   */
  private formatCNPJ(cnpj: string): string {
    const clean = this.cleanDocument(cnpj).padStart(14, '0')
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
  }

  /**
   * Formata CPF
   */
  private formatCPF(cpf: string): string {
    const clean = this.cleanDocument(cpf).padStart(11, '0')
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
  }

  /**
   * Formata PIS
   */
  private formatPIS(pis: string): string {
    if (!pis) return 'N/A'
    const clean = this.cleanDocument(pis).padStart(11, '0')
    return `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8, 10)}-${clean.slice(10)}`
  }

  /**
   * Formata endereco
   */
  private formatAddress(address: Company['address']): string {
    if (!address) return 'N/A'
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zip_code,
    ].filter(Boolean)
    return parts.join(', ')
  }

  /**
   * Formata valor monetario
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  /**
   * Remove caracteres nao numericos
   */
  private cleanDocument(doc: string): string {
    return doc.replace(/\D/g, '')
  }

  /**
   * Converte conteudo para o encoding especificado
   */
  public encodeContent(content: string): Buffer {
    if (this.config.encoding === 'ISO-8859-1') {
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
 * Funcao utilitaria para gerar AEJ de forma simplificada
 */
export function generateAEJ(data: AEJData, config?: AEJConfig): AEJResult {
  const generator = new AEJGenerator(config)
  return generator.generate(data)
}
