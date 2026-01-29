# Exemplos de Uso - Biblioteca CLT

Este documento apresenta exemplos práticos de como usar a biblioteca de cálculos CLT.

## Instalação e Importação

```typescript
import {
  // Funções principais
  calculateDailyJourney,
  calculateMonthlyJourney,
  calculateHourlyRate,
  calculateMonetaryValues,

  // Novas funções
  calculateOvertimeRegular,
  calculateOvertimeWeekend,
  calculateNightShift,
  calculateTimeBank,
  calculateDSREnhanced,

  // Validações
  validateInterjornada,
  validateDailyLimit,
  validateBreak,
  detectViolations,

  // Tipos
  type DailyTimeRecord,
  type MonthlyJourneyResult,
  type MonetaryValues,
} from '@/lib/compliance/clt-calculations'

// Queries Supabase
import {
  calculateMonthlyOvertime,
  calculateEmployeeTimeBank,
  detectMonthlyViolations,
  getCompanyMonthlyReport,
} from '@/lib/supabase/queries/clt-reports'
```

## Cenário 1: Cálculo de Dia Normal

Funcionário trabalha das 8h às 17h com 1h de intervalo.

```typescript
const record: DailyTimeRecord = {
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00'),
  clockOut: new Date('2024-01-15T17:00:00'),
  breakStart: new Date('2024-01-15T12:00:00'),
  breakEnd: new Date('2024-01-15T13:00:00'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

const result = calculateDailyJourney(record)

console.log('Jornada do dia:', {
  trabalhado: `${result.netWorkedMinutes / 60}h`,
  extras50: `${result.overtime50Minutes / 60}h`,
  avisos: result.warnings,
})

// Output:
// Jornada do dia: {
//   trabalhado: '8h',
//   extras50: '0h',
//   avisos: []
// }
```

## Cenário 2: Dia com Hora Extra

Funcionário faz 2 horas extras (até 19h).

```typescript
const record: DailyTimeRecord = {
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00'),
  clockOut: new Date('2024-01-15T19:00:00'), // 2h a mais
  breakStart: new Date('2024-01-15T12:00:00'),
  breakEnd: new Date('2024-01-15T13:00:00'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

const daily = calculateDailyJourney(record)
const hourlyRate = calculateHourlyRate(2200, 44) // R$ 2.200,00, 44h/sem

const overtime = calculateOvertimeRegular(
  daily.netWorkedMinutes,
  480, // 8h esperadas
  hourlyRate
)

console.log('Horas extras:', {
  minutos: overtime.overtimeMinutes,
  valor: `R$ ${overtime.overtimeValue.toFixed(2)}`,
  dentroDolimite: !overtime.exceedsLimit,
})

// Output:
// Horas extras: {
//   minutos: 120,
//   valor: 'R$ 30.00',
//   dentroDolimite: true
// }
```

## Cenário 3: Trabalho Noturno

Funcionário trabalha das 22h às 6h (turno noturno).

```typescript
const record: DailyTimeRecord = {
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T22:00:00'),
  clockOut: new Date('2024-01-16T06:00:00'),
  breakStart: new Date('2024-01-16T02:00:00'),
  breakEnd: new Date('2024-01-16T03:00:00'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

const daily = calculateDailyJourney(record)
const hourlyRate = calculateHourlyRate(2640, 44) // R$ 2.640,00

const nightShift = calculateNightShift(
  record.clockIn!,
  record.clockOut!,
  hourlyRate
)

console.log('Adicional noturno:', {
  minutosNoturnos: nightShift.nightMinutes,
  minutosAjustados: nightShift.adjustedNightMinutes,
  adicional: `R$ ${nightShift.nightBonus.toFixed(2)}`,
  valorHoraNoturna: `R$ ${nightShift.nightHourlyRate.toFixed(2)}`,
})

// Output:
// Adicional noturno: {
//   minutosNoturnos: 420,
//   minutosAjustados: 480,
//   adicional: 'R$ 19.20',
//   valorHoraNoturna: 'R$ 14.40'
// }
```

## Cenário 4: Trabalho em Domingo

Funcionário trabalha 8h em um domingo.

```typescript
const record: DailyTimeRecord = {
  date: new Date('2024-01-14'), // Domingo
  clockIn: new Date('2024-01-14T08:00:00'),
  clockOut: new Date('2024-01-14T16:00:00'),
  breakStart: null,
  breakEnd: null,
  isWorkday: false,
  isHoliday: false,
  isSunday: true,
}

const daily = calculateDailyJourney(record, 0) // Domingo = 0h esperadas
const hourlyRate = calculateHourlyRate(2200, 44)

const value = calculateOvertimeWeekend(
  daily.netWorkedMinutes,
  hourlyRate
)

console.log('Trabalho em domingo:', {
  horasTrabalhadas: daily.netWorkedMinutes / 60,
  valor: `R$ ${value.toFixed(2)}`,
  tipo: 'HE 100%',
})

// Output:
// Trabalho em domingo: {
//   horasTrabalhadas: 8,
//   valor: 'R$ 160.00',
//   tipo: 'HE 100%'
// }
```

## Cenário 5: Cálculo Mensal Completo

Processar todo o mês e calcular valores monetários.

```typescript
const records: DailyTimeRecord[] = [
  // ... todos os dias do mês
]

// Calcular jornada mensal
const monthly = calculateMonthlyJourney(records, 44)

// Calcular valores monetários
const monetary = calculateMonetaryValues(
  2200, // Salário base
  monthly,
  5, // Domingos e feriados do mês
  44 // Jornada semanal
)

console.log('Resumo mensal:', {
  salarioBase: `R$ ${monetary.baseSalary.toFixed(2)}`,
  valorHora: `R$ ${monetary.hourlyRate.toFixed(2)}`,
  he50: `R$ ${monetary.overtime50Value.toFixed(2)}`,
  he100: `R$ ${monetary.overtime100Value.toFixed(2)}`,
  adicionalNoturno: `R$ ${monetary.nightShiftValue.toFixed(2)}`,
  dsr: `R$ ${monetary.dsrValue.toFixed(2)}`,
  totalProventos: `R$ ${monetary.totalEarnings.toFixed(2)}`,
  descontoFaltas: `R$ ${monetary.absenceDeduction.toFixed(2)}`,
})

// Output:
// Resumo mensal: {
//   salarioBase: 'R$ 2200.00',
//   valorHora: 'R$ 10.00',
//   he50: 'R$ 150.00',
//   he100: 'R$ 80.00',
//   adicionalNoturno: 'R$ 40.00',
//   dsr: 'R$ 61.36',
//   totalProventos: 'R$ 331.36',
//   descontoFaltas: 'R$ 0.00'
// }
```

## Cenário 6: Banco de Horas

Gerenciar banco de horas do funcionário.

```typescript
const currentMonth = {
  overtimeMinutes: 600, // 10h de extras este mês
  compensatedMinutes: 120, // 2h compensadas
}

const timeBank = calculateTimeBank(
  currentMonth.overtimeMinutes,
  currentMonth.compensatedMinutes,
  120 * 60, // Limite: 120h
  new Date('2024-01-15')
)

console.log('Banco de horas:', {
  saldo: `${timeBank.balance / 60}h`,
  aCompensar: `${timeBank.toCompensate / 60}h`,
  aPagar: `${timeBank.toPay / 60}h`,
  dentroDoLimite: timeBank.withinLimit,
  proximaExpiracao: timeBank.nextExpiration?.toLocaleDateString('pt-BR'),
})

// Output:
// Banco de horas: {
//   saldo: '8h',
//   aCompensar: '8h',
//   aPagar: '0h',
//   dentroDoLimite: true,
//   proximaExpiracao: '15/07/2024'
// }
```

## Cenário 7: Validação de Interjornada

Verificar se o funcionário teve descanso adequado entre jornadas.

```typescript
const day1Exit = new Date('2024-01-15T22:00:00')
const day2Entry = new Date('2024-01-16T06:00:00')

const interjornada = validateInterjornada(day1Exit, day2Entry)

if (!interjornada.valid) {
  console.warn('⚠️ VIOLAÇÃO DE INTERJORNADA!', {
    horasDescanso: interjornada.hoursRest,
    horasFaltando: interjornada.missingHours,
    contaComoExtra: interjornada.countsAsOvertime,
  })
}

// Output:
// ⚠️ VIOLAÇÃO DE INTERJORNADA! {
//   horasDescanso: 8,
//   horasFaltando: 3,
//   contaComoExtra: true
// }
```

## Cenário 8: Validação de Intervalo

Verificar se o intervalo está adequado.

```typescript
const workedMinutes = 540 // 9 horas
const breakMinutes = 30 // Apenas 30 minutos

const breakValidation = validateBreak(workedMinutes, breakMinutes)

if (!breakValidation.valid) {
  console.warn('⚠️ INTERVALO IRREGULAR!', {
    realizado: `${breakValidation.breakMinutes}min`,
    exigido: `${breakValidation.requiredMinutes}min`,
    faltando: `${breakValidation.missingMinutes}min`,
    violacao: breakValidation.violation,
  })
}

// Output:
// ⚠️ INTERVALO IRREGULAR! {
//   realizado: '30min',
//   exigido: '60min',
//   faltando: '30min',
//   violacao: 'insufficient'
// }
```

## Cenário 9: Detecção de Violações do Mês

Detectar todas as violações trabalhistas do mês.

```typescript
const monthRecords: DailyTimeRecord[] = [
  // ... registros do mês
]

const violations = detectViolations(monthRecords)

console.log('Relatório de violações:', {
  totalViolacoes: violations.totalViolations,
  criticas: violations.hasCriticalViolations,
  interjornada: violations.interjornada.length,
  limitesDiarios: violations.dailyLimit.length,
  intervalos: violations.breaks.length,
  extrasExcessivas: violations.excessiveOvertime.length,
})

if (violations.hasCriticalViolations) {
  console.error('🔴 ATENÇÃO: Violações críticas detectadas!')

  violations.interjornada.forEach(v => {
    console.error(`- Interjornada insuficiente: ${v.hoursRest}h (faltam ${v.missingHours}h)`)
  })

  violations.breaks.forEach(v => {
    if (v.violation === 'insufficient') {
      console.error(`- Intervalo insuficiente: ${v.breakMinutes}min (mínimo ${v.requiredMinutes}min)`)
    }
  })
}

// Output:
// Relatório de violações: {
//   totalViolacoes: 5,
//   criticas: true,
//   interjornada: 2,
//   limitesDiarios: 1,
//   intervalos: 1,
//   extrasExcessivas: 1
// }
// 🔴 ATENÇÃO: Violações críticas detectadas!
// - Interjornada insuficiente: 8h (faltam 3h)
// - Intervalo insuficiente: 30min (mínimo 60min)
```

## Cenário 10: Integração com Supabase

Buscar dados do banco e calcular automaticamente.

```typescript
// Calcular horas extras do mês
const result = await calculateMonthlyOvertime(
  'employee-uuid',
  2024,
  1 // Janeiro
)

if (result) {
  console.log('Dados do funcionário:', result.employee.name)
  console.log('Total horas extras 50%:', result.journey.totalOvertime50Minutes / 60)
  console.log('Valor a pagar:', result.monetary.totalEarnings)
}

// Verificar banco de horas
const timeBank = await calculateEmployeeTimeBank(
  'employee-uuid',
  2024,
  1
)

if (timeBank) {
  console.log('Saldo banco de horas:', timeBank.balance / 60, 'horas')
}

// Detectar violações
const violations = await detectMonthlyViolations(
  'employee-uuid',
  2024,
  1
)

if (violations?.hasCriticalViolations) {
  console.error('Funcionário com violações críticas!')
}

// Relatório da empresa inteira
const companyReport = await getCompanyMonthlyReport(
  'company-uuid',
  2024,
  1
)

if (companyReport) {
  console.log('Total HE 50% empresa:', companyReport.totals.totalOvertime50Value)
  console.log('Total violações:', companyReport.totals.totalViolations)

  // Funcionários com violações
  const withViolations = companyReport.employees.filter(
    e => e.violations.hasCriticalViolations
  )

  console.log(`${withViolations.length} funcionários com violações críticas`)
}
```

## Cenário 11: Dashboard em Tempo Real

Criar widget de alertas para o dashboard.

```typescript
async function getDashboardAlerts(companyId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const report = await getCompanyMonthlyReport(companyId, year, month)

  if (!report) return []

  const alerts = []

  // Verificar violações críticas
  const critical = report.employees.filter(e => e.violations.hasCriticalViolations)
  if (critical.length > 0) {
    alerts.push({
      type: 'critical',
      message: `${critical.length} funcionário(s) com violações críticas`,
      employees: critical.map(e => e.name),
    })
  }

  // Verificar horas extras excessivas
  const excessiveOT = report.employees.filter(
    e => e.journey.totalOvertime50Minutes > 30 * 60 // > 30h/mês
  )
  if (excessiveOT.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${excessiveOT.length} funcionário(s) com muitas horas extras`,
      employees: excessiveOT.map(e => e.name),
    })
  }

  // Verificar banco de horas próximo ao limite
  for (const employee of report.employees) {
    const timeBank = await calculateEmployeeTimeBank(employee.id, year, month)
    if (timeBank && !timeBank.withinLimit) {
      alerts.push({
        type: 'warning',
        message: `${employee.name} - Banco de horas excedeu limite`,
        value: `${(timeBank.toPay / 60).toFixed(1)}h a pagar`,
      })
    }
  }

  return alerts
}

// Usar no componente
const alerts = await getDashboardAlerts('company-uuid')

alerts.forEach(alert => {
  if (alert.type === 'critical') {
    console.error('🔴', alert.message)
  } else {
    console.warn('🟡', alert.message)
  }
})
```

## Cenário 12: Geração de Relatório Exportável

Criar relatório detalhado para exportação.

```typescript
async function generateMonthlyReport(employeeId: string, year: number, month: number) {
  const result = await calculateMonthlyOvertime(employeeId, year, month)
  const violations = await detectMonthlyViolations(employeeId, year, month)
  const timeBank = await calculateEmployeeTimeBank(employeeId, year, month)

  if (!result || !violations || !timeBank) {
    throw new Error('Erro ao gerar relatório')
  }

  return {
    periodo: `${month}/${year}`,
    funcionario: {
      nome: result.employee.name,
      salarioBase: result.employee.base_salary,
      jornada: `${result.employee.weekly_hours}h semanais`,
    },
    jornada: {
      diasUteis: result.journey.totalWorkdays,
      diasTrabalhados: result.journey.totalWorkedDays,
      horasTrabalhadas: result.journey.totalWorkedHours,
      faltas: result.journey.absenceDays,
    },
    horasExtras: {
      he50Horas: result.journey.totalOvertime50Minutes / 60,
      he50Valor: result.monetary.overtime50Value,
      he100Horas: result.journey.totalOvertime100Minutes / 60,
      he100Valor: result.monetary.overtime100Value,
    },
    adicionais: {
      noturnoHoras: result.journey.totalNightMinutes / 60,
      noturnoValor: result.monetary.nightShiftValue,
      dsrValor: result.monetary.dsrValue,
    },
    totais: {
      proventos: result.monetary.totalEarnings,
      descontos: result.monetary.absenceDeduction,
      liquido: result.monetary.totalEarnings - result.monetary.absenceDeduction,
    },
    bancoDeHoras: {
      saldo: timeBank.balance / 60,
      aCompensar: timeBank.toCompensate / 60,
      aPagar: timeBank.toPay / 60,
      expiracao: timeBank.nextExpiration,
    },
    compliance: {
      totalViolacoes: violations.totalViolations,
      criticas: violations.hasCriticalViolations,
      detalhes: {
        interjornada: violations.interjornada.length,
        limitesDiarios: violations.dailyLimit.length,
        intervalos: violations.breaks.length,
        extrasExcessivas: violations.excessiveOvertime.length,
      },
    },
  }
}

// Gerar relatório
const report = await generateMonthlyReport('employee-uuid', 2024, 1)

console.log('Relatório Mensal:', JSON.stringify(report, null, 2))

// Exportar para PDF ou Excel
// ...
```

## Funções Auxiliares Úteis

```typescript
import {
  formatCurrency,
  formatMinutesAsTime,
  minutesToDecimalHours,
  isNationalHoliday,
  countSundaysAndHolidays,
} from '@/lib/compliance/clt-calculations'

// Formatar valores
const valor = 1234.56
console.log(formatCurrency(valor)) // "R$ 1.234,56"

// Formatar tempo
const minutos = 125
console.log(formatMinutesAsTime(minutos)) // "02:05"

// Converter para decimal
console.log(minutesToDecimalHours(90)) // 1.50

// Verificar feriado
const dia = new Date('2024-12-25')
console.log(isNationalHoliday(dia)) // true (Natal)

// Contar domingos e feriados
const inicio = new Date('2024-01-01')
const fim = new Date('2024-01-31')
console.log(countSundaysAndHolidays(inicio, fim)) // 5
```

## Tratamento de Erros

```typescript
try {
  const result = await calculateMonthlyOvertime(employeeId, year, month)

  if (!result) {
    throw new Error('Funcionário não encontrado ou sem registros')
  }

  // Processar resultado...

} catch (error) {
  console.error('Erro ao calcular horas extras:', error)
  // Notificar usuário ou log
}
```

## Melhores Práticas

1. **Sempre validar entradas**:
   ```typescript
   if (!employeeId || !year || !month) {
     throw new Error('Parâmetros inválidos')
   }
   ```

2. **Verificar dados antes de calcular**:
   ```typescript
   if (!record.clockIn || !record.clockOut) {
     // Tratar ausência de registro
   }
   ```

3. **Alertar sobre violações críticas**:
   ```typescript
   if (violations.hasCriticalViolations) {
     await notifyHR(violations)
   }
   ```

4. **Cachear cálculos quando possível**:
   ```typescript
   const cacheKey = `overtime-${employeeId}-${year}-${month}`
   const cached = await cache.get(cacheKey)
   if (cached) return cached
   ```

5. **Manter logs de auditoria**:
   ```typescript
   await auditLog.create({
     action: 'calculate_overtime',
     employeeId,
     month,
     result: summary,
   })
   ```

---

Este guia cobre os principais casos de uso da biblioteca CLT. Para mais detalhes, consulte:
- [CALCULOS_CLT.md](./CALCULOS_CLT.md) - Documentação completa
- [src/lib/compliance/clt-calculations.ts](./src/lib/compliance/clt-calculations.ts) - Código fonte
- [src/__tests__/unit/clt-calculations.test.ts](./src/__tests__/unit/clt-calculations.test.ts) - Testes unitários
