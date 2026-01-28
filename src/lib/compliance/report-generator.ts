/**
 * Report Generator - Geracao de relatorios de compliance
 *
 * Implementa geracao de:
 * - Espelho de ponto (PDF/HTML)
 * - Relatorio de horas extras
 * - Relatorio de faltas/atrasos
 * - Extrato de banco de horas
 */

import type { Company, Employee, TimeTrackingDaily, WorkSchedule } from '@/types/database'
import type {
  ReportFormat,
  ReportResult,
  TimeMirrorReportConfig,
  TimeMirrorReportData,
  OvertimeReportConfig,
  OvertimeReportData,
  AbsencesReportConfig,
  AbsencesReportData,
  DailyJourneyDetail,
} from './types'
import {
  formatMinutesAsTime,
  minutesToDecimalHours,
  calculateDailyJourney,
  calculateMonthlyJourney,
  calculateMonetaryValues,
  countSundaysAndHolidays,
  type DailyTimeRecord,
  CLT_CONSTANTS,
} from './clt-calculations'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formata data para exibicao (DD/MM/AAAA)
 */
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formata data e hora
 */
function formatDateTime(date: Date): string {
  const dateStr = formatDate(date)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${dateStr} ${hours}:${minutes}`
}

/**
 * Formata valor monetario em BRL
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata CNPJ
 */
function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '').padStart(14, '0')
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
}

/**
 * Formata CPF
 */
function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '').padStart(11, '0')
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
}

/**
 * Formata PIS
 */
function formatPIS(pis: string): string {
  if (!pis) return 'N/A'
  const clean = pis.replace(/\D/g, '').padStart(11, '0')
  return `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8, 10)}-${clean.slice(10)}`
}

/**
 * Retorna nome do dia da semana em portugues
 */
function getDayOfWeekName(date: Date): string {
  const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  return days[date.getDay()]
}

/**
 * Retorna nome abreviado do dia da semana
 */
function getDayOfWeekShort(date: Date): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  return days[date.getDay()]
}

/**
 * Gera nome de arquivo
 */
function generateFilename(prefix: string, company: Company, startDate: Date, endDate: Date, format: ReportFormat): string {
  const cnpj = company.cnpj?.replace(/\D/g, '') || 'SEMCNPJ'
  const start = formatDate(startDate).replace(/\//g, '')
  const end = formatDate(endDate).replace(/\//g, '')
  return `${prefix}_${cnpj}_${start}_${end}.${format}`
}

/**
 * Converte TimeTrackingDaily para DailyTimeRecord
 */
function convertToDailyTimeRecord(
  record: TimeTrackingDaily,
  holidays: Date[]
): DailyTimeRecord {
  const date = new Date(record.date + 'T00:00:00')
  const dayOfWeek = date.getDay()

  const isHoliday = record.is_holiday ||
    holidays.some(h => h.toDateString() === date.toDateString())

  return {
    date,
    clockIn: record.clock_in ? new Date(`${record.date}T${record.clock_in}`) : null,
    clockOut: record.clock_out ? new Date(`${record.date}T${record.clock_out}`) : null,
    breakStart: record.break_start ? new Date(`${record.date}T${record.break_start}`) : null,
    breakEnd: record.break_end ? new Date(`${record.date}T${record.break_end}`) : null,
    additionalBreaks: record.additional_breaks?.map(b => ({
      start: new Date(`${record.date}T${b.start}`),
      end: new Date(`${record.date}T${b.end}`),
    })),
    isWorkday: record.is_workday,
    isHoliday,
    isSunday: dayOfWeek === 0,
  }
}

// ============================================================================
// HTML Templates
// ============================================================================

/**
 * Gera CSS base para relatorios
 */
function getBaseCSS(): string {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11px;
        line-height: 1.4;
        color: #333;
        background: #fff;
      }
      .container {
        max-width: 210mm;
        margin: 0 auto;
        padding: 15mm;
      }
      @media print {
        .container {
          padding: 10mm;
        }
        .page-break {
          page-break-before: always;
        }
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #333;
      }
      .header h1 {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .header h2 {
        font-size: 12px;
        font-weight: normal;
        color: #666;
      }
      .company-info {
        margin-bottom: 15px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
      }
      .company-info p {
        margin: 2px 0;
      }
      .employee-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
        padding: 10px;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .employee-info .label {
        font-weight: bold;
        color: #555;
      }
      .period-info {
        text-align: center;
        margin-bottom: 15px;
        padding: 8px;
        background: #e8f4f8;
        border-radius: 4px;
        font-weight: bold;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
        font-size: 10px;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 5px 8px;
        text-align: center;
      }
      th {
        background: #4a5568;
        color: white;
        font-weight: bold;
      }
      tr:nth-child(even) {
        background: #f9f9f9;
      }
      tr:hover {
        background: #f0f0f0;
      }
      .text-left {
        text-align: left;
      }
      .text-right {
        text-align: right;
      }
      .sunday {
        background: #fff0f0 !important;
        color: #c00;
      }
      .holiday {
        background: #fffbe0 !important;
        color: #856404;
      }
      .absent {
        background: #ffeaea !important;
      }
      .overtime {
        color: #007bff;
        font-weight: bold;
      }
      .missing {
        color: #dc3545;
        font-weight: bold;
      }
      .summary-box {
        margin: 15px 0;
        padding: 12px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }
      .summary-box h3 {
        font-size: 12px;
        margin-bottom: 10px;
        color: #333;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .summary-item {
        text-align: center;
        padding: 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e9ecef;
      }
      .summary-item .value {
        font-size: 14px;
        font-weight: bold;
        color: #333;
      }
      .summary-item .label {
        font-size: 9px;
        color: #666;
        margin-top: 2px;
      }
      .signature-area {
        margin-top: 40px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
      }
      .signature-line {
        text-align: center;
        padding-top: 30px;
        border-top: 1px solid #333;
      }
      .signature-line p {
        font-size: 10px;
        color: #666;
      }
      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        font-size: 9px;
        color: #666;
        text-align: center;
      }
      .notes {
        margin-top: 15px;
        padding: 10px;
        background: #fff8e1;
        border-left: 4px solid #ffc107;
        font-size: 10px;
      }
    </style>
  `
}

// ============================================================================
// Time Mirror Report (Espelho de Ponto)
// ============================================================================

/**
 * Gera relatorio de espelho de ponto
 */
export function generateTimeMirrorReport(
  data: TimeMirrorReportData,
  config: TimeMirrorReportConfig = {}
): ReportResult {
  const {
    format = 'html',
    includeHeader = true,
    includeFooter = true,
    includeSignature = true,
    includeManagerSignature = true,
    showLocation = false,
    showDevice = false,
    title = 'Espelho de Ponto',
    notes,
  } = config

  const { company, employee, dailyRecords, startDate, endDate, holidays, schedule } = data

  // Converte e calcula jornadas
  const dailyTimeRecords: DailyTimeRecord[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0]
    const record = dailyRecords.find(r => r.date === dateStr)

    if (record) {
      dailyTimeRecords.push(convertToDailyTimeRecord(record, holidays))
    } else {
      // Dia sem registro
      const dayOfWeek = current.getDay()
      const isHoliday = holidays.some(h => h.toDateString() === current.toDateString())
      dailyTimeRecords.push({
        date: new Date(current),
        clockIn: null,
        clockOut: null,
        breakStart: null,
        breakEnd: null,
        isWorkday: dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday,
        isHoliday,
        isSunday: dayOfWeek === 0,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  // Calcula jornada mensal
  const weeklyHours = employee.weekly_hours || CLT_CONSTANTS.WEEKLY_HOURS
  const journeyResult = calculateMonthlyJourney(dailyTimeRecords, weeklyHours)

  // Calcula valores monetarios
  const sundaysAndHolidays = countSundaysAndHolidays(startDate, endDate, holidays)
  const monetaryValues = employee.salary
    ? calculateMonetaryValues(employee.salary, journeyResult, sundaysAndHolidays, weeklyHours)
    : null

  // Gera HTML
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ${employee.name}</title>
      ${getBaseCSS()}
    </head>
    <body>
      <div class="container">
  `

  // Cabecalho
  if (includeHeader) {
    html += `
      <div class="header">
        <h1>${title.toUpperCase()}</h1>
        <h2>Portaria 671 MTE - Art. 87</h2>
      </div>

      <div class="company-info">
        <p><strong>${company.name}</strong></p>
        <p>CNPJ: ${formatCNPJ(company.cnpj || '')}</p>
        ${company.address ? `<p>${company.address.street}, ${company.address.number} - ${company.address.city}/${company.address.state}</p>` : ''}
      </div>
    `
  }

  // Dados do funcionario
  html += `
    <div class="employee-info">
      <div>
        <p><span class="label">Nome:</span> ${employee.name}</p>
        <p><span class="label">CPF:</span> ${formatCPF(employee.cpf)}</p>
        <p><span class="label">PIS:</span> ${formatPIS(employee.pis || '')}</p>
      </div>
      <div>
        <p><span class="label">Matricula:</span> ${employee.employee_number}</p>
        <p><span class="label">Cargo:</span> ${employee.position}</p>
        <p><span class="label">Departamento:</span> ${employee.department || 'N/A'}</p>
      </div>
    </div>

    <div class="period-info">
      Periodo: ${formatDate(startDate)} a ${formatDate(endDate)} | Jornada: ${weeklyHours}h semanais
    </div>
  `

  // Tabela de registros
  html += `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Dia</th>
          <th>Entrada</th>
          <th>I. Int.</th>
          <th>F. Int.</th>
          <th>Saida</th>
          <th>Trabalhado</th>
          <th>HE 50%</th>
          <th>HE 100%</th>
          <th>Noturno</th>
          <th>Falta</th>
          <th>Obs</th>
        </tr>
      </thead>
      <tbody>
  `

  for (const detail of journeyResult.dailyDetails) {
    const record = dailyRecords.find(r => r.date === detail.date.toISOString().split('T')[0])
    const dayRecord = dailyTimeRecords.find(d => d.date.toDateString() === detail.date.toDateString())

    let rowClass = ''
    if (dayRecord?.isSunday) rowClass = 'sunday'
    else if (dayRecord?.isHoliday) rowClass = 'holiday'
    else if (detail.missingMinutes > 0 && !detail.warnings.length) rowClass = 'absent'

    html += `
      <tr class="${rowClass}">
        <td>${formatDate(detail.date)}</td>
        <td>${getDayOfWeekShort(detail.date)}</td>
        <td>${record?.clock_in || '-'}</td>
        <td>${record?.break_start || '-'}</td>
        <td>${record?.break_end || '-'}</td>
        <td>${record?.clock_out || '-'}</td>
        <td>${formatMinutesAsTime(detail.netWorkedMinutes)}</td>
        <td class="${detail.overtime50Minutes > 0 ? 'overtime' : ''}">${detail.overtime50Minutes > 0 ? formatMinutesAsTime(detail.overtime50Minutes) : '-'}</td>
        <td class="${detail.overtime100Minutes > 0 ? 'overtime' : ''}">${detail.overtime100Minutes > 0 ? formatMinutesAsTime(detail.overtime100Minutes) : '-'}</td>
        <td>${detail.nightMinutes > 0 ? formatMinutesAsTime(detail.nightMinutes) : '-'}</td>
        <td class="${detail.missingMinutes > 0 ? 'missing' : ''}">${detail.missingMinutes > 0 ? formatMinutesAsTime(detail.missingMinutes) : '-'}</td>
        <td class="text-left">${detail.warnings.length > 0 ? detail.warnings[0] : (dayRecord?.isHoliday ? 'Feriado' : (dayRecord?.isSunday ? 'DSR' : ''))}</td>
      </tr>
    `
  }

  html += `
      </tbody>
    </table>
  `

  // Resumo
  html += `
    <div class="summary-box">
      <h3>Resumo do Periodo</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value">${journeyResult.totalWorkdays}</div>
          <div class="label">Dias Uteis</div>
        </div>
        <div class="summary-item">
          <div class="value">${journeyResult.totalWorkedDays}</div>
          <div class="label">Dias Trabalhados</div>
        </div>
        <div class="summary-item">
          <div class="value">${journeyResult.absenceDays}</div>
          <div class="label">Faltas</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatMinutesAsTime(journeyResult.totalWorkedMinutes)}</div>
          <div class="label">Horas Trabalhadas</div>
        </div>
        <div class="summary-item">
          <div class="value overtime">${formatMinutesAsTime(journeyResult.totalOvertime50Minutes)}</div>
          <div class="label">HE 50%</div>
        </div>
        <div class="summary-item">
          <div class="value overtime">${formatMinutesAsTime(journeyResult.totalOvertime100Minutes)}</div>
          <div class="label">HE 100%</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatMinutesAsTime(journeyResult.totalNightMinutes)}</div>
          <div class="label">Horas Noturnas</div>
        </div>
        <div class="summary-item">
          <div class="value missing">${formatMinutesAsTime(journeyResult.totalMissingMinutes)}</div>
          <div class="label">Horas Faltantes</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatMinutesAsTime(journeyResult.timeBankBalance)}</div>
          <div class="label">Banco Horas</div>
        </div>
      </div>
    </div>
  `

  // Valores monetarios
  if (monetaryValues) {
    html += `
      <div class="summary-box">
        <h3>Valores Calculados</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="value">${formatCurrency(monetaryValues.baseSalary)}</div>
            <div class="label">Salario Base</div>
          </div>
          <div class="summary-item">
            <div class="value">${formatCurrency(monetaryValues.hourlyRate)}</div>
            <div class="label">Valor Hora</div>
          </div>
          <div class="summary-item">
            <div class="value overtime">${formatCurrency(monetaryValues.overtime50Value)}</div>
            <div class="label">HE 50%</div>
          </div>
          <div class="summary-item">
            <div class="value overtime">${formatCurrency(monetaryValues.overtime100Value)}</div>
            <div class="label">HE 100%</div>
          </div>
          <div class="summary-item">
            <div class="value">${formatCurrency(monetaryValues.nightShiftValue)}</div>
            <div class="label">Adic. Noturno</div>
          </div>
          <div class="summary-item">
            <div class="value">${formatCurrency(monetaryValues.dsrValue)}</div>
            <div class="label">DSR</div>
          </div>
          <div class="summary-item">
            <div class="value">${formatCurrency(monetaryValues.totalEarnings)}</div>
            <div class="label">Total Adicionais</div>
          </div>
          <div class="summary-item">
            <div class="value missing">${formatCurrency(monetaryValues.absenceDeduction)}</div>
            <div class="label">Desc. Faltas</div>
          </div>
          <div class="summary-item">
            <div class="value" style="color: #28a745;">${formatCurrency(monetaryValues.totalEarnings - monetaryValues.absenceDeduction)}</div>
            <div class="label">Liquido</div>
          </div>
        </div>
      </div>
    `
  }

  // Notas
  if (notes) {
    html += `
      <div class="notes">
        <strong>Observacoes:</strong><br>
        ${notes}
      </div>
    `
  }

  // Area de assinatura
  if (includeSignature || includeManagerSignature) {
    html += `<div class="signature-area">`

    if (includeSignature) {
      html += `
        <div class="signature-line">
          <p>${employee.name}</p>
          <p>Funcionario</p>
        </div>
      `
    }

    if (includeManagerSignature) {
      html += `
        <div class="signature-line">
          <p>_______________________________</p>
          <p>Gestor / RH</p>
        </div>
      `
    }

    html += `</div>`
  }

  // Rodape
  if (includeFooter) {
    html += `
      <div class="footer">
        <p>Documento gerado em ${formatDateTime(new Date())} | Sistema RH-RICKGAY</p>
        <p>Este documento esta em conformidade com a Portaria 671/2021 do MTE</p>
      </div>
    `
  }

  html += `
      </div>
    </body>
    </html>
  `

  const filename = generateFilename(
    `ESPELHO_${employee.employee_number}`,
    company,
    startDate,
    endDate,
    format
  )

  return {
    content: html,
    filename,
    mimeType: format === 'html' ? 'text/html' : 'application/pdf',
    size: Buffer.byteLength(html, 'utf-8'),
    format,
    metadata: {
      generatedAt: new Date(),
      totalRecords: journeyResult.dailyDetails.length,
    },
  }
}

// ============================================================================
// Overtime Report (Relatorio de Horas Extras)
// ============================================================================

/**
 * Gera relatorio de horas extras
 */
export function generateOvertimeReport(
  data: OvertimeReportData,
  config: OvertimeReportConfig = {}
): ReportResult {
  const {
    format = 'html',
    includeHeader = true,
    includeFooter = true,
    groupByDepartment = false,
    includeMonetary = true,
    overtimeType = 'all',
    title = 'Relatorio de Horas Extras',
    notes,
  } = config

  const { company, employees, startDate, endDate } = data

  // Filtra por tipo se necessario
  let filteredEmployees = employees
  if (overtimeType === '50') {
    filteredEmployees = employees.filter(e => e.overtime50Hours > 0)
  } else if (overtimeType === '100') {
    filteredEmployees = employees.filter(e => e.overtime100Hours > 0)
  } else {
    filteredEmployees = employees.filter(e => e.overtime50Hours > 0 || e.overtime100Hours > 0)
  }

  // Agrupa por departamento se necessario
  let groupedData: Record<string, typeof filteredEmployees> = {}
  if (groupByDepartment) {
    for (const emp of filteredEmployees) {
      const dept = emp.employee.department || 'Sem Departamento'
      if (!groupedData[dept]) groupedData[dept] = []
      groupedData[dept].push(emp)
    }
  } else {
    groupedData['all'] = filteredEmployees
  }

  // Calcula totais
  const totals = filteredEmployees.reduce(
    (acc, e) => ({
      overtime50Hours: acc.overtime50Hours + e.overtime50Hours,
      overtime50Value: acc.overtime50Value + e.overtime50Value,
      overtime100Hours: acc.overtime100Hours + e.overtime100Hours,
      overtime100Value: acc.overtime100Value + e.overtime100Value,
      dsrValue: acc.dsrValue + e.dsrValue,
      totalValue: acc.totalValue + e.totalValue,
    }),
    { overtime50Hours: 0, overtime50Value: 0, overtime100Hours: 0, overtime100Value: 0, dsrValue: 0, totalValue: 0 }
  )

  // Gera HTML
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${getBaseCSS()}
    </head>
    <body>
      <div class="container">
  `

  // Cabecalho
  if (includeHeader) {
    html += `
      <div class="header">
        <h1>${title.toUpperCase()}</h1>
        <h2>${company.name}</h2>
      </div>

      <div class="company-info">
        <p>CNPJ: ${formatCNPJ(company.cnpj || '')}</p>
      </div>

      <div class="period-info">
        Periodo: ${formatDate(startDate)} a ${formatDate(endDate)} | Total de funcionarios: ${filteredEmployees.length}
      </div>
    `
  }

  // Tabela por grupo
  for (const [group, groupEmployees] of Object.entries(groupedData)) {
    if (groupByDepartment && group !== 'all') {
      html += `<h3 style="margin: 15px 0 10px; color: #333;">${group}</h3>`
    }

    html += `
      <table>
        <thead>
          <tr>
            <th class="text-left">Funcionario</th>
            <th>Matricula</th>
            ${overtimeType !== '100' ? '<th>HE 50% (h)</th>' : ''}
            ${overtimeType !== '100' && includeMonetary ? '<th>Valor HE 50%</th>' : ''}
            ${overtimeType !== '50' ? '<th>HE 100% (h)</th>' : ''}
            ${overtimeType !== '50' && includeMonetary ? '<th>Valor HE 100%</th>' : ''}
            ${includeMonetary ? '<th>DSR</th>' : ''}
            ${includeMonetary ? '<th>Total</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `

    for (const emp of groupEmployees) {
      html += `
        <tr>
          <td class="text-left">${emp.employee.name}</td>
          <td>${emp.employee.employee_number}</td>
          ${overtimeType !== '100' ? `<td class="overtime">${emp.overtime50Hours.toFixed(2)}</td>` : ''}
          ${overtimeType !== '100' && includeMonetary ? `<td class="text-right overtime">${formatCurrency(emp.overtime50Value)}</td>` : ''}
          ${overtimeType !== '50' ? `<td class="overtime">${emp.overtime100Hours.toFixed(2)}</td>` : ''}
          ${overtimeType !== '50' && includeMonetary ? `<td class="text-right overtime">${formatCurrency(emp.overtime100Value)}</td>` : ''}
          ${includeMonetary ? `<td class="text-right">${formatCurrency(emp.dsrValue)}</td>` : ''}
          ${includeMonetary ? `<td class="text-right" style="font-weight: bold;">${formatCurrency(emp.totalValue)}</td>` : ''}
        </tr>
      `
    }

    // Subtotal do grupo
    if (groupByDepartment && group !== 'all') {
      const groupTotals = groupEmployees.reduce(
        (acc, e) => ({
          overtime50Hours: acc.overtime50Hours + e.overtime50Hours,
          overtime50Value: acc.overtime50Value + e.overtime50Value,
          overtime100Hours: acc.overtime100Hours + e.overtime100Hours,
          overtime100Value: acc.overtime100Value + e.overtime100Value,
          dsrValue: acc.dsrValue + e.dsrValue,
          totalValue: acc.totalValue + e.totalValue,
        }),
        { overtime50Hours: 0, overtime50Value: 0, overtime100Hours: 0, overtime100Value: 0, dsrValue: 0, totalValue: 0 }
      )

      html += `
        <tr style="background: #e9ecef; font-weight: bold;">
          <td class="text-left">Subtotal ${group}</td>
          <td></td>
          ${overtimeType !== '100' ? `<td>${groupTotals.overtime50Hours.toFixed(2)}</td>` : ''}
          ${overtimeType !== '100' && includeMonetary ? `<td class="text-right">${formatCurrency(groupTotals.overtime50Value)}</td>` : ''}
          ${overtimeType !== '50' ? `<td>${groupTotals.overtime100Hours.toFixed(2)}</td>` : ''}
          ${overtimeType !== '50' && includeMonetary ? `<td class="text-right">${formatCurrency(groupTotals.overtime100Value)}</td>` : ''}
          ${includeMonetary ? `<td class="text-right">${formatCurrency(groupTotals.dsrValue)}</td>` : ''}
          ${includeMonetary ? `<td class="text-right">${formatCurrency(groupTotals.totalValue)}</td>` : ''}
        </tr>
      `
    }

    html += `
        </tbody>
      </table>
    `
  }

  // Total geral
  html += `
    <div class="summary-box">
      <h3>Total Geral</h3>
      <div class="summary-grid">
        ${overtimeType !== '100' ? `
          <div class="summary-item">
            <div class="value overtime">${totals.overtime50Hours.toFixed(2)}h</div>
            <div class="label">HE 50%</div>
          </div>
        ` : ''}
        ${overtimeType !== '100' && includeMonetary ? `
          <div class="summary-item">
            <div class="value overtime">${formatCurrency(totals.overtime50Value)}</div>
            <div class="label">Valor HE 50%</div>
          </div>
        ` : ''}
        ${overtimeType !== '50' ? `
          <div class="summary-item">
            <div class="value overtime">${totals.overtime100Hours.toFixed(2)}h</div>
            <div class="label">HE 100%</div>
          </div>
        ` : ''}
        ${overtimeType !== '50' && includeMonetary ? `
          <div class="summary-item">
            <div class="value overtime">${formatCurrency(totals.overtime100Value)}</div>
            <div class="label">Valor HE 100%</div>
          </div>
        ` : ''}
        ${includeMonetary ? `
          <div class="summary-item">
            <div class="value">${formatCurrency(totals.dsrValue)}</div>
            <div class="label">DSR</div>
          </div>
          <div class="summary-item">
            <div class="value" style="color: #28a745; font-size: 16px;">${formatCurrency(totals.totalValue)}</div>
            <div class="label">Total Geral</div>
          </div>
        ` : ''}
      </div>
    </div>
  `

  // Notas
  if (notes) {
    html += `
      <div class="notes">
        <strong>Observacoes:</strong><br>
        ${notes}
      </div>
    `
  }

  // Rodape
  if (includeFooter) {
    html += `
      <div class="footer">
        <p>Documento gerado em ${formatDateTime(new Date())} | Sistema RH-RICKGAY</p>
      </div>
    `
  }

  html += `
      </div>
    </body>
    </html>
  `

  const filename = generateFilename('HORAS_EXTRAS', company, startDate, endDate, format)

  return {
    content: html,
    filename,
    mimeType: format === 'html' ? 'text/html' : 'application/pdf',
    size: Buffer.byteLength(html, 'utf-8'),
    format,
    metadata: {
      generatedAt: new Date(),
      totalRecords: filteredEmployees.length,
    },
  }
}

// ============================================================================
// Absences Report (Relatorio de Faltas e Atrasos)
// ============================================================================

/**
 * Gera relatorio de faltas e atrasos
 */
export function generateAbsencesReport(
  data: AbsencesReportData,
  config: AbsencesReportConfig = {}
): ReportResult {
  const {
    format = 'html',
    includeHeader = true,
    includeFooter = true,
    groupByDepartment = false,
    includeDeductions = true,
    absenceType = 'all',
    title = 'Relatorio de Faltas e Atrasos',
    notes,
  } = config

  const { company, employees, startDate, endDate } = data

  // Filtra por tipo se necessario
  let filteredEmployees = employees
  if (absenceType === 'justified') {
    filteredEmployees = employees.map(e => ({
      ...e,
      details: e.details.filter(d => d.justification),
    })).filter(e => e.details.length > 0)
  } else if (absenceType === 'unjustified') {
    filteredEmployees = employees.map(e => ({
      ...e,
      details: e.details.filter(d => !d.justification),
    })).filter(e => e.details.length > 0)
  }

  // Calcula totais
  const totals = filteredEmployees.reduce(
    (acc, e) => ({
      absenceDays: acc.absenceDays + e.absenceDays,
      lateDays: acc.lateDays + e.lateDays,
      earlyLeaveDays: acc.earlyLeaveDays + e.earlyLeaveDays,
      totalMissingMinutes: acc.totalMissingMinutes + e.totalMissingMinutes,
      deductionValue: acc.deductionValue + e.deductionValue,
    }),
    { absenceDays: 0, lateDays: 0, earlyLeaveDays: 0, totalMissingMinutes: 0, deductionValue: 0 }
  )

  // Gera HTML
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${getBaseCSS()}
    </head>
    <body>
      <div class="container">
  `

  // Cabecalho
  if (includeHeader) {
    html += `
      <div class="header">
        <h1>${title.toUpperCase()}</h1>
        <h2>${company.name}</h2>
      </div>

      <div class="company-info">
        <p>CNPJ: ${formatCNPJ(company.cnpj || '')}</p>
      </div>

      <div class="period-info">
        Periodo: ${formatDate(startDate)} a ${formatDate(endDate)} | Funcionarios com ocorrencias: ${filteredEmployees.length}
      </div>
    `
  }

  // Tabela de resumo
  html += `
    <table>
      <thead>
        <tr>
          <th class="text-left">Funcionario</th>
          <th>Matricula</th>
          <th>Departamento</th>
          <th>Faltas</th>
          <th>Atrasos</th>
          <th>Saidas Ant.</th>
          <th>Total (min)</th>
          ${includeDeductions ? '<th>Desconto</th>' : ''}
        </tr>
      </thead>
      <tbody>
  `

  for (const emp of filteredEmployees) {
    html += `
      <tr>
        <td class="text-left">${emp.employee.name}</td>
        <td>${emp.employee.employee_number}</td>
        <td>${emp.employee.department || 'N/A'}</td>
        <td class="${emp.absenceDays > 0 ? 'missing' : ''}">${emp.absenceDays}</td>
        <td class="${emp.lateDays > 0 ? 'missing' : ''}">${emp.lateDays}</td>
        <td class="${emp.earlyLeaveDays > 0 ? 'missing' : ''}">${emp.earlyLeaveDays}</td>
        <td class="missing">${emp.totalMissingMinutes}</td>
        ${includeDeductions ? `<td class="text-right missing">${formatCurrency(emp.deductionValue)}</td>` : ''}
      </tr>
    `
  }

  // Total
  html += `
      <tr style="background: #e9ecef; font-weight: bold;">
        <td class="text-left" colspan="3">TOTAL</td>
        <td>${totals.absenceDays}</td>
        <td>${totals.lateDays}</td>
        <td>${totals.earlyLeaveDays}</td>
        <td>${totals.totalMissingMinutes}</td>
        ${includeDeductions ? `<td class="text-right">${formatCurrency(totals.deductionValue)}</td>` : ''}
      </tr>
    </tbody>
    </table>
  `

  // Resumo
  html += `
    <div class="summary-box">
      <h3>Resumo</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value missing">${totals.absenceDays}</div>
          <div class="label">Total Faltas</div>
        </div>
        <div class="summary-item">
          <div class="value missing">${totals.lateDays}</div>
          <div class="label">Total Atrasos</div>
        </div>
        <div class="summary-item">
          <div class="value missing">${totals.earlyLeaveDays}</div>
          <div class="label">Saidas Antecipadas</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatMinutesAsTime(totals.totalMissingMinutes)}</div>
          <div class="label">Tempo Total</div>
        </div>
        ${includeDeductions ? `
          <div class="summary-item">
            <div class="value missing">${formatCurrency(totals.deductionValue)}</div>
            <div class="label">Total Descontos</div>
          </div>
        ` : ''}
      </div>
    </div>
  `

  // Notas
  if (notes) {
    html += `
      <div class="notes">
        <strong>Observacoes:</strong><br>
        ${notes}
      </div>
    `
  }

  // Rodape
  if (includeFooter) {
    html += `
      <div class="footer">
        <p>Documento gerado em ${formatDateTime(new Date())} | Sistema RH-RICKGAY</p>
      </div>
    `
  }

  html += `
      </div>
    </body>
    </html>
  `

  const filename = generateFilename('FALTAS_ATRASOS', company, startDate, endDate, format)

  return {
    content: html,
    filename,
    mimeType: format === 'html' ? 'text/html' : 'application/pdf',
    size: Buffer.byteLength(html, 'utf-8'),
    format,
    metadata: {
      generatedAt: new Date(),
      totalRecords: filteredEmployees.length,
    },
  }
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Converte HTML para CSV simples
 */
export function convertReportToCSV(
  reportData: Array<Record<string, unknown>>,
  headers: string[]
): string {
  const lines: string[] = []

  // Cabecalho
  lines.push(headers.join(';'))

  // Dados
  for (const row of reportData) {
    const values = headers.map(h => {
      const value = row[h]
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return value.toString().replace('.', ',')
      return String(value).replace(/;/g, ',')
    })
    lines.push(values.join(';'))
  }

  return lines.join('\r\n')
}

/**
 * Gera relatorio de folha de pagamento consolidada
 */
export function generatePayrollReport(
  company: Company,
  employees: Employee[],
  dailyRecords: TimeTrackingDaily[],
  startDate: Date,
  endDate: Date,
  holidays: Date[]
): ReportResult {
  // Dados para o relatorio
  const reportData: OvertimeReportData['employees'] = []

  for (const employee of employees) {
    const employeeRecords = dailyRecords.filter(r => r.employee_id === employee.id)

    // Converte registros
    const dailyTimeRecords = employeeRecords.map(r => convertToDailyTimeRecord(r, holidays))

    // Calcula jornada
    const weeklyHours = employee.weekly_hours || CLT_CONSTANTS.WEEKLY_HOURS
    const journey = calculateMonthlyJourney(dailyTimeRecords, weeklyHours)

    // Calcula valores se tiver salario
    if (employee.salary) {
      const sundaysAndHolidays = countSundaysAndHolidays(startDate, endDate, holidays)
      const monetary = calculateMonetaryValues(employee.salary, journey, sundaysAndHolidays, weeklyHours)

      if (journey.totalOvertime50Minutes > 0 || journey.totalOvertime100Minutes > 0) {
        reportData.push({
          employee,
          overtime50Hours: minutesToDecimalHours(journey.totalOvertime50Minutes),
          overtime50Value: monetary.overtime50Value,
          overtime100Hours: minutesToDecimalHours(journey.totalOvertime100Minutes),
          overtime100Value: monetary.overtime100Value,
          dsrValue: monetary.dsrValue,
          totalValue: monetary.overtime50Value + monetary.overtime100Value + monetary.dsrValue,
        })
      }
    }
  }

  return generateOvertimeReport(
    { company, employees: reportData, startDate, endDate },
    { includeMonetary: true, title: 'Relatorio de Folha - Horas Extras' }
  )
}
