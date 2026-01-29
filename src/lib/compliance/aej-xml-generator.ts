/**
 * AEJ XML Generator - Arquivo Eletrônico de Jornada para e-Social
 *
 * Gera arquivo XML conforme layout e-Social S-1200 (Remuneração)
 * e S-1210 (Pagamentos de Rendimentos do Trabalho)
 *
 * Referência: Manual de Orientação do eSocial - Versão S-1.2
 * Evento: S-1200 - Remuneração de trabalhador vinculado ao Regime Geral de Previd. Social
 */

import type { Company, Employee, TimeTrackingDaily, WorkSchedule } from '@/types/database'
import {
  type MonthlyJourneyResult,
  type DailyTimeRecord,
  calculateMonthlyJourney,
  calculateMonetaryValues,
  minutesToDecimalHours,
  formatMinutesAsTime,
  countSundaysAndHolidays,
  CLT_CONSTANTS,
} from './clt-calculations'

/**
 * Tipo de ambiente do e-Social
 */
export type ESocialEnvironment = '1' | '2' // 1=Produção, 2=Homologação

/**
 * Tipo de processo de emissão
 */
export type ProcessEmissionType = '1' | '2' // 1=Aplicativo empregador, 2=Aplicativo governamental

/**
 * Configuração para geração do AEJ XML
 */
export interface AEJXMLConfig {
  /** Ambiente do e-Social (1=Produção, 2=Homologação) */
  environment: ESocialEnvironment
  /** Versão do processo/sistema */
  processVersion: string
  /** Incluir detalhamento de horas extras */
  includeOvertimeDetails?: boolean
  /** Incluir valores monetários */
  includeMonetaryValues?: boolean
}

/**
 * Dados para geração do AEJ XML
 */
export interface AEJXMLData {
  company: Company
  employees: Employee[]
  dailyRecords: TimeTrackingDaily[]
  workSchedules: WorkSchedule[]
  holidays: Date[]
  startDate: Date
  endDate: Date
  referenceMonth: string // Formato: YYYY-MM
}

/**
 * Horário contratual de trabalho
 */
export interface ContractualSchedule {
  code: string
  description: string
  entryTime: string // HH:MM
  exitTime: string // HH:MM
  durationMinutes: number
  flexibleSchedule: boolean
  workDays: number[] // 1=Seg, 7=Dom
}

/**
 * Registro de jornada de trabalho para XML
 */
export interface WorkJourneyRecord {
  employee: Employee
  schedule: ContractualSchedule
  journeyResult: MonthlyJourneyResult
  dailyDetails: Array<{
    date: Date
    dayOfWeek: number
    isWorkday: boolean
    isHoliday: boolean
    clockIn: string | null
    clockOut: string | null
    breakStart: string | null
    breakEnd: string | null
    workedMinutes: number
    overtime50Minutes: number
    overtime100Minutes: number
    nightMinutes: number
  }>
}

/**
 * Resultado da geração do AEJ XML
 */
export interface AEJXMLResult {
  xml: string
  filename: string
  eventId: string
  totalEmployees: number
  period: string
  receiptNumber: string
}

/**
 * Classe para geração de arquivos AEJ em formato XML (e-Social)
 */
export class AEJXMLGenerator {
  private config: Required<AEJXMLConfig>

  constructor(config: AEJXMLConfig) {
    this.config = {
      environment: config.environment,
      processVersion: config.processVersion || '1.0.0',
      includeOvertimeDetails: config.includeOvertimeDetails ?? true,
      includeMonetaryValues: config.includeMonetaryValues ?? true,
    }
  }

  /**
   * Gera o arquivo AEJ XML completo
   */
  public generate(data: AEJXMLData): AEJXMLResult {
    const eventId = this.generateEventId(data.company, data.referenceMonth)
    const receiptNumber = this.generateReceiptNumber()

    // Processa registros de jornada de cada funcionário
    const journeyRecords = this.processEmployeeJourneys(data)

    // Gera XML
    const xml = this.generateXML(data, journeyRecords, eventId)

    // Gera nome do arquivo
    const filename = this.generateFilename(data.company, data.referenceMonth)

    return {
      xml,
      filename,
      eventId,
      totalEmployees: journeyRecords.length,
      period: `${data.referenceMonth}`,
      receiptNumber,
    }
  }

  /**
   * Processa jornadas de trabalho dos funcionários
   */
  private processEmployeeJourneys(data: AEJXMLData): WorkJourneyRecord[] {
    const records: WorkJourneyRecord[] = []

    for (const employee of data.employees) {
      // Filtra registros do funcionário
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

      // Busca escala do funcionário
      const workSchedule = data.workSchedules.find(
        s => s.employee_id === employee.id || s.is_default
      )

      // Calcula jornada
      const weeklyHours = employee.weekly_hours ?? CLT_CONSTANTS.WEEKLY_HOURS
      const journeyResult = calculateMonthlyJourney(dailyRecords, weeklyHours)

      // Cria schedule contratual
      const schedule = this.createContractualSchedule(employee, workSchedule, weeklyHours)

      // Detalhes diários
      const dailyDetails = dailyRecords.map(dr => ({
        date: dr.date,
        dayOfWeek: dr.date.getDay(),
        isWorkday: dr.isWorkday ?? false,
        isHoliday: dr.isHoliday ?? false,
        clockIn: dr.clockIn ? this.formatTime(dr.clockIn) : null,
        clockOut: dr.clockOut ? this.formatTime(dr.clockOut) : null,
        breakStart: dr.breakStart ? this.formatTime(dr.breakStart) : null,
        breakEnd: dr.breakEnd ? this.formatTime(dr.breakEnd) : null,
        workedMinutes: this.calculateWorkedMinutes(dr),
        overtime50Minutes: 0, // Calculado posteriormente
        overtime100Minutes: 0,
        nightMinutes: 0,
      }))

      records.push({
        employee,
        schedule,
        journeyResult,
        dailyDetails,
      })
    }

    return records
  }

  /**
   * Gera o XML do AEJ
   */
  private generateXML(
    data: AEJXMLData,
    journeyRecords: WorkJourneyRecord[],
    eventId: string
  ): string {
    const lines: string[] = []

    // XML Declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>')

    // Root element com namespace
    lines.push('<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">')

    // Evento S-1200 (Remuneração)
    lines.push(`  <evtRemun Id="${eventId}">`)

    // Identificação do evento
    lines.push(this.generateEventIdentification(data.referenceMonth))

    // Identificação do empregador
    lines.push(this.generateEmployerIdentification(data.company))

    // Informações de remuneração (inclui jornada)
    for (const record of journeyRecords) {
      lines.push(this.generateWorkerRemuneration(record, data))
    }

    lines.push('  </evtRemun>')
    lines.push('</eSocial>')

    return lines.join('\n')
  }

  /**
   * Gera identificação do evento
   */
  private generateEventIdentification(referenceMonth: string): string {
    const lines: string[] = []

    lines.push('    <ideEvento>')
    lines.push(`      <indRetif>1</indRetif>`) // 1=Original, 2=Retificação
    lines.push(`      <nrRecibo></nrRecibo>`) // Vazio para original
    lines.push(`      <indApuracao>1</indApuracao>`) // 1=Mensal
    lines.push(`      <perApur>${referenceMonth}</perApur>`) // YYYY-MM
    lines.push(`      <tpAmb>${this.config.environment}</tpAmb>`)
    lines.push(`      <procEmi>1</procEmi>`) // 1=Aplicativo empregador
    lines.push(`      <verProc>${this.escapeXml(this.config.processVersion)}</verProc>`)
    lines.push('    </ideEvento>')

    return lines.join('\n')
  }

  /**
   * Gera identificação do empregador
   */
  private generateEmployerIdentification(company: Company): string {
    const lines: string[] = []
    const cnpj = this.cleanDocument(company.cnpj || '')

    lines.push('    <ideEmpregador>')
    lines.push(`      <tpInsc>1</tpInsc>`) // 1=CNPJ
    lines.push(`      <nrInsc>${cnpj}</nrInsc>`)
    lines.push('    </ideEmpregador>')

    return lines.join('\n')
  }

  /**
   * Gera informações de remuneração do trabalhador (inclui jornada)
   */
  private generateWorkerRemuneration(
    record: WorkJourneyRecord,
    data: AEJXMLData
  ): string {
    const lines: string[] = []
    const { employee, schedule, journeyResult, dailyDetails } = record

    lines.push('    <ideTrabalhador>')
    lines.push(`      <cpfTrab>${this.cleanDocument(employee.cpf)}</cpfTrab>`)

    // Informações de remuneração
    lines.push('      <infoComplem>')
    lines.push('        <nmTrab>' + this.escapeXml(employee.name) + '</nmTrab>')
    lines.push('        <dtNascto>' + this.formatDateXML(new Date(employee.birth_date || '1990-01-01')) + '</dtNascto>')

    // Sucessão de vínculos (não aplicável)
    lines.push('      </infoComplem>')

    // Remuneração do período
    lines.push('      <remunPerApur>')
    lines.push(`        <matricula>${this.escapeXml(employee.employee_number)}</matricula>`)
    lines.push(`        <codCateg>101</codCateg>`) // 101=Empregado CLT

    // Itens de remuneração
    lines.push(this.generateRemunerationItems(record))

    // Informações de jornada de trabalho
    if (this.config.includeOvertimeDetails) {
      lines.push(this.generateWorkJourneyInfo(record))
    }

    lines.push('      </remunPerApur>')
    lines.push('    </ideTrabalhador>')

    return lines.join('\n')
  }

  /**
   * Gera itens de remuneração
   */
  private generateRemunerationItems(record: WorkJourneyRecord): string {
    const lines: string[] = []
    const { employee, journeyResult } = record

    // Salário base
    if (employee.salary) {
      lines.push('        <itensRemun>')
      lines.push(`          <codRubr>1000</codRubr>`) // 1000=Salário
      lines.push(`          <ideTabRubr>01</ideTabRubr>`)
      lines.push(`          <qtdRubr>1.00</qtdRubr>`)
      lines.push(`          <fatorRubr>1.00</fatorRubr>`)
      lines.push(`          <vrRubr>${employee.salary.toFixed(2)}</vrRubr>`)
      lines.push('        </itensRemun>')
    }

    // Horas extras 50%
    if (journeyResult.totalOvertime50Minutes > 0 && this.config.includeMonetaryValues) {
      const he50Hours = minutesToDecimalHours(journeyResult.totalOvertime50Minutes)
      const monthlyHours = 220 // 220 horas mensais padrão
      const hourlyRate = employee.salary ? employee.salary / monthlyHours : 0
      const he50Value = he50Hours * hourlyRate * 1.5

      lines.push('        <itensRemun>')
      lines.push(`          <codRubr>2001</codRubr>`) // 2001=HE 50%
      lines.push(`          <ideTabRubr>01</ideTabRubr>`)
      lines.push(`          <qtdRubr>${he50Hours.toFixed(2)}</qtdRubr>`)
      lines.push(`          <fatorRubr>1.50</fatorRubr>`)
      lines.push(`          <vrRubr>${he50Value.toFixed(2)}</vrRubr>`)
      lines.push('        </itensRemun>')
    }

    // Horas extras 100%
    if (journeyResult.totalOvertime100Minutes > 0 && this.config.includeMonetaryValues) {
      const he100Hours = minutesToDecimalHours(journeyResult.totalOvertime100Minutes)
      const monthlyHours = 220 // 220 horas mensais padrão
      const hourlyRate = employee.salary ? employee.salary / monthlyHours : 0
      const he100Value = he100Hours * hourlyRate * 2

      lines.push('        <itensRemun>')
      lines.push(`          <codRubr>2002</codRubr>`) // 2002=HE 100%
      lines.push(`          <ideTabRubr>01</ideTabRubr>`)
      lines.push(`          <qtdRubr>${he100Hours.toFixed(2)}</qtdRubr>`)
      lines.push(`          <fatorRubr>2.00</fatorRubr>`)
      lines.push(`          <vrRubr>${he100Value.toFixed(2)}</vrRubr>`)
      lines.push('        </itensRemun>')
    }

    // Adicional noturno
    if (journeyResult.totalNightMinutes > 0 && this.config.includeMonetaryValues) {
      const nightHours = minutesToDecimalHours(journeyResult.totalNightMinutes)
      const monthlyHours = 220 // 220 horas mensais padrão
      const hourlyRate = employee.salary ? employee.salary / monthlyHours : 0
      const nightShiftAddition = 0.20 // 20% de adicional noturno
      const nightValue = nightHours * hourlyRate * nightShiftAddition

      lines.push('        <itensRemun>')
      lines.push(`          <codRubr>3001</codRubr>`) // 3001=Adicional Noturno
      lines.push(`          <ideTabRubr>01</ideTabRubr>`)
      lines.push(`          <qtdRubr>${nightHours.toFixed(2)}</qtdRubr>`)
      lines.push(`          <fatorRubr>${nightShiftAddition.toFixed(2)}</fatorRubr>`)
      lines.push(`          <vrRubr>${nightValue.toFixed(2)}</vrRubr>`)
      lines.push('        </itensRemun>')
    }

    // Descontos por faltas
    if (journeyResult.absenceDays > 0 && this.config.includeMonetaryValues && employee.salary) {
      const dailyRate = employee.salary / 30
      const absenceValue = dailyRate * journeyResult.absenceDays

      lines.push('        <itensRemun>')
      lines.push(`          <codRubr>9001</codRubr>`) // 9001=Desconto Falta
      lines.push(`          <ideTabRubr>01</ideTabRubr>`)
      lines.push(`          <qtdRubr>${journeyResult.absenceDays.toFixed(2)}</qtdRubr>`)
      lines.push(`          <fatorRubr>1.00</fatorRubr>`)
      lines.push(`          <vrRubr>-${absenceValue.toFixed(2)}</vrRubr>`)
      lines.push('        </itensRemun>')
    }

    return lines.join('\n')
  }

  /**
   * Gera informações de jornada de trabalho
   */
  private generateWorkJourneyInfo(record: WorkJourneyRecord): string {
    const lines: string[] = []
    const { schedule, journeyResult, dailyDetails } = record

    lines.push('        <infoHorContratual>')
    lines.push('          <ideHorContratual>')
    lines.push(`            <codHorContrat>${schedule.code}</codHorContrat>`)
    lines.push('          </ideHorContratual>')

    lines.push('          <dadosHorContratual>')
    lines.push(`            <hrEntr>${schedule.entryTime}</hrEntr>`)
    lines.push(`            <hrSaida>${schedule.exitTime}</hrSaida>`)
    lines.push(`            <durJornada>${schedule.durationMinutes}</durJornada>`)
    lines.push(`            <perHorFlexivel>${schedule.flexibleSchedule ? 'S' : 'N'}</perHorFlexivel>`)
    lines.push('          </dadosHorContratual>')

    // Horários por dia da semana
    if (schedule.workDays.length > 0) {
      lines.push('          <horarioIntervalo>')
      for (const day of schedule.workDays) {
        lines.push('            <diaHorario>')
        lines.push(`              <diaSem>${day}</diaSem>`)
        lines.push(`              <hrEntr>${schedule.entryTime}</hrEntr>`)
        lines.push(`              <hrSaida>${schedule.exitTime}</hrSaida>`)
        lines.push('            </diaHorario>')
      }
      lines.push('          </horarioIntervalo>')
    }

    lines.push('        </infoHorContratual>')

    // Totalização de horas
    lines.push('        <infoAgNocivo>')
    lines.push('          <grauExp>1</grauExp>') // 1=Não exposto
    lines.push('        </infoAgNocivo>')

    return lines.join('\n')
  }

  /**
   * Cria schedule contratual baseado nos dados do funcionário
   */
  private createContractualSchedule(
    employee: Employee,
    workSchedule: WorkSchedule | undefined,
    weeklyHours: number
  ): ContractualSchedule {
    const dailyHours = weeklyHours / 5 // Assume 5 dias úteis
    const dailyMinutes = Math.round(dailyHours * 60)

    // Horário padrão se não tiver escala definida
    const defaultStart = '08:00'
    const defaultEnd = this.addMinutesToTime(defaultStart, dailyMinutes + 60) // +60 para intervalo

    return {
      code: employee.employee_number || '001',
      description: `Jornada ${weeklyHours}h semanais`,
      entryTime: defaultStart,
      exitTime: defaultEnd,
      durationMinutes: dailyMinutes,
      flexibleSchedule: false,
      workDays: [1, 2, 3, 4, 5], // Segunda a sexta
    }
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
   * Calcula minutos trabalhados no dia
   */
  private calculateWorkedMinutes(record: DailyTimeRecord): number {
    if (!record.clockIn || !record.clockOut) return 0

    const totalMinutes = Math.floor(
      (record.clockOut.getTime() - record.clockIn.getTime()) / (1000 * 60)
    )

    // Subtrai intervalos
    let breakMinutes = 0
    if (record.breakStart && record.breakEnd) {
      breakMinutes += Math.floor(
        (record.breakEnd.getTime() - record.breakStart.getTime()) / (1000 * 60)
      )
    }

    if (record.additionalBreaks) {
      for (const br of record.additionalBreaks) {
        if (br.start && br.end) {
          breakMinutes += Math.floor(
            (br.end.getTime() - br.start.getTime()) / (1000 * 60)
          )
        }
      }
    }

    return Math.max(0, totalMinutes - breakMinutes)
  }

  /**
   * Gera ID único do evento
   */
  private generateEventId(company: Company, referenceMonth: string): string {
    const cnpj = this.cleanDocument(company.cnpj || '')
    const timestamp = Date.now().toString().slice(-8)
    const month = referenceMonth.replace('-', '')
    return `ID${cnpj}${month}${timestamp}`
  }

  /**
   * Gera número de recibo
   */
  private generateReceiptNumber(): string {
    return `R${Date.now()}`
  }

  /**
   * Gera nome do arquivo
   */
  private generateFilename(company: Company, referenceMonth: string): string {
    const cnpj = this.cleanDocument(company.cnpj || '')
    const month = referenceMonth.replace('-', '')
    return `AEJ_${cnpj}_${month}.xml`
  }

  /**
   * Formata data para XML (YYYY-MM-DD)
   */
  private formatDateXML(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Formata hora (HH:MM)
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  /**
   * Adiciona minutos a uma hora no formato HH:MM
   */
  private addMinutesToTime(time: string, minutesToAdd: number): string {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + minutesToAdd
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMinutes = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
  }

  /**
   * Limpa documento (remove caracteres não numéricos)
   */
  private cleanDocument(doc: string): string {
    return doc.replace(/\D/g, '')
  }

  /**
   * Escapa caracteres especiais XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Valida XML gerado
   */
  public validateXML(xml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validações básicas
    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      errors.push('XML declaration missing')
    }

    if (!xml.includes('<eSocial')) {
      errors.push('eSocial root element missing')
    }

    if (!xml.includes('</eSocial>')) {
      errors.push('eSocial closing tag missing')
    }

    if (!xml.includes('<evtRemun')) {
      errors.push('evtRemun event missing')
    }

    // Verifica balanceamento de tags básicas
    const openTags = xml.match(/<(\w+)[^>]*>/g) || []
    const closeTags = xml.match(/<\/(\w+)>/g) || []

    if (openTags.length !== closeTags.length) {
      errors.push('Unbalanced tags detected')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

/**
 * Função utilitária para gerar AEJ XML de forma simplificada
 */
export function generateAEJXML(
  data: AEJXMLData,
  config: AEJXMLConfig
): AEJXMLResult {
  const generator = new AEJXMLGenerator(config)
  return generator.generate(data)
}
