# Cálculos CLT - Documentação Completa

Este documento descreve todos os cálculos trabalhistas implementados no sistema, baseados na **Consolidação das Leis do Trabalho (CLT)** brasileira.

## Índice

1. [Constantes CLT](#constantes-clt)
2. [Jornada de Trabalho](#jornada-de-trabalho)
3. [Hora Extra 50%](#hora-extra-50)
4. [Hora Extra 100%](#hora-extra-100)
5. [Adicional Noturno](#adicional-noturno)
6. [Banco de Horas](#banco-de-horas)
7. [DSR - Descanso Semanal Remunerado](#dsr---descanso-semanal-remunerado)
8. [Interjornada](#interjornada)
9. [Intervalos (Intrajornada)](#intervalos-intrajornada)
10. [Validações e Violações](#validacoes-e-violacoes)
11. [Exemplos Práticos](#exemplos-praticos)

---

## Constantes CLT

### Valores Padrão

```typescript
WEEKLY_HOURS: 44          // Jornada semanal padrão
DAILY_HOURS: 8           // Jornada diária (segunda a sexta)
SATURDAY_HOURS: 4        // Jornada aos sábados
NIGHT_START: '22:00'     // Início período noturno
NIGHT_END: '05:00'       // Fim período noturno
NIGHT_HOUR_MINUTES: 52.5 // Hora noturna reduzida
TOLERANCE_MINUTES: 10    // Tolerância de ponto
```

### Base Legal

- **Jornada**: CLT Art. 58 - Duração normal do trabalho não superior a 8h diárias e 44h semanais
- **Tolerância**: CLT Art. 58 §1º - Variações de até 10 minutos não são descontadas nem computadas como extras
- **Adicional Noturno**: CLT Art. 73 - 20% sobre a hora diurna

---

## Jornada de Trabalho

### Cálculo da Jornada Semanal

**44 horas semanais** divididas em:
- Segunda a Sexta: 8 horas/dia = 40 horas
- Sábado: 4 horas
- **Total**: 44 horas semanais

### Jornada Mensal

Para cálculo de salário-hora:
- **Jornada mensal** = Jornada semanal × 5
- Para 44h semanais: **220 horas mensais**

### Função: `calculateDailyJourney()`

Calcula a jornada de um dia específico.

**Entrada**:
```typescript
{
  date: Date
  clockIn: Date | null
  clockOut: Date | null
  breakStart: Date | null
  breakEnd: Date | null
  isWorkday: boolean
  isHoliday: boolean
  isSunday: boolean
}
```

**Saída**:
```typescript
{
  workedMinutes: number      // Tempo bruto trabalhado
  breakMinutes: number        // Tempo de intervalo
  netWorkedMinutes: number    // Tempo líquido (trabalhado - intervalo)
  overtime50Minutes: number   // HE 50% (dias úteis)
  overtime100Minutes: number  // HE 100% (domingos/feriados)
  nightMinutes: number        // Minutos no período noturno
  missingMinutes: number      // Minutos faltantes
  timeBankMinutes: number     // Saldo banco de horas
  exceedsTolerance: boolean   // Se ultrapassou tolerância
  warnings: string[]          // Avisos e alertas
}
```

**Exemplo**:
```typescript
const record = {
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
// result.netWorkedMinutes = 480 (8 horas)
// result.overtime50Minutes = 0
```

**Base Legal**: CLT Art. 58

---

## Hora Extra 50%

### Quando Aplicar

Hora extra 50% é aplicada quando:
- Trabalhador excede jornada normal em **dias úteis** (segunda a sexta)
- Máximo: **2 horas extras por dia** (CLT Art. 59)

### Cálculo

**Fórmula**:
```
Valor HE 50% = (Horas extras × Valor hora) × 1.5
```

### Função: `calculateOvertimeRegular()`

```typescript
calculateOvertimeRegular(
  workedMinutes: number,    // Minutos trabalhados
  expectedMinutes: number,  // Minutos esperados (normalmente 480)
  hourlyRate: number       // Valor da hora normal
)
```

**Retorno**:
```typescript
{
  overtimeMinutes: number    // Minutos de HE trabalhados
  overtimeValue: number      // Valor monetário
  hourlyRate: number         // Valor hora normal
  exceedsLimit: boolean      // Se excedeu 2h/dia
  excessMinutes: number      // Minutos além do limite
}
```

**Exemplo**:
```typescript
const result = calculateOvertimeRegular(
  600,  // 10 horas trabalhadas
  480,  // 8 horas esperadas
  10.00 // R$ 10,00/hora
)

// result.overtimeMinutes = 120 (2 horas)
// result.overtimeValue = 30.00 (2h × R$ 10,00 × 1.5)
// result.exceedsLimit = false (dentro do limite de 2h)
```

**Base Legal**: CLT Art. 59 - Horas extras com acréscimo mínimo de 50%

---

## Hora Extra 100%

### Quando Aplicar

Hora extra 100% é aplicada quando o trabalho ocorre em:
- **Domingos**
- **Feriados nacionais**

### Cálculo

**Fórmula**:
```
Valor HE 100% = (Horas trabalhadas × Valor hora) × 2.0
```

### Função: `calculateOvertimeWeekend()`

```typescript
calculateOvertimeWeekend(
  workedMinutes: number,  // Minutos trabalhados
  hourlyRate: number     // Valor da hora normal
): number                // Retorna valor monetário
```

**Exemplo**:
```typescript
const value = calculateOvertimeWeekend(
  480,   // 8 horas trabalhadas
  10.00  // R$ 10,00/hora
)

// value = 160.00 (8h × R$ 10,00 × 2.0)
```

**Base Legal**:
- CLT Art. 59 - Acréscimo de 100% para trabalho em feriados
- CF/88 Art. 7º, XVI - Remuneração do serviço extraordinário superior no mínimo 50%

---

## Adicional Noturno

### Definição

**Período noturno**: 22h às 5h
- **Adicional**: 20% sobre a hora diurna
- **Hora noturna reduzida**: 52 minutos e 30 segundos = 1 hora para cálculo

### Por que a Hora é Reduzida?

A CLT estabelece que a hora noturna tem duração menor para compensar o desgaste do trabalho noturno. Assim:
- Trabalhou **52min30s** no período noturno = Recebe por **1 hora**
- Trabalhou **7 horas** (420 min) no relógio = Recebe por **8 horas** (480 min)

### Cálculo

**Fórmula**:
```
1. Identificar minutos no período noturno (22h-5h)
2. Aplicar redução: minutos_ajustados = (minutos_noturnos / 52.5) × 60
3. Calcular adicional: valor = (horas_ajustadas × valor_hora) × 0.20
```

### Função: `calculateNightShift()`

```typescript
calculateNightShift(
  startTime: string | Date,  // Início do turno
  endTime: string | Date,    // Fim do turno
  hourlyRate: number        // Valor hora normal
)
```

**Retorno**:
```typescript
{
  nightMinutes: number          // Minutos no período noturno
  adjustedNightMinutes: number  // Minutos com redução aplicada
  nightBonus: number            // Valor do adicional (20%)
  nightHourlyRate: number       // Valor hora com adicional
  startTime: string
  endTime: string
}
```

**Exemplo 1 - Turno Totalmente Noturno**:
```typescript
const result = calculateNightShift(
  new Date('2024-01-15T22:00:00'),
  new Date('2024-01-16T05:00:00'),
  10.00
)

// Período: 22h às 5h = 7 horas no relógio = 420 minutos
// result.nightMinutes = 420
// result.adjustedNightMinutes = 480 (420 / 52.5 × 60)
// result.nightBonus = 9.60 (8h × R$ 10,00 × 0.20)
// result.nightHourlyRate = 12.00 (R$ 10,00 × 1.20)
```

**Exemplo 2 - Turno Parcialmente Noturno**:
```typescript
const result = calculateNightShift(
  new Date('2024-01-15T20:00:00'),  // Inicia às 20h
  new Date('2024-01-16T02:00:00'),  // Termina às 2h
  12.50
)

// Período noturno: 22h às 2h = 4 horas = 240 minutos
// result.nightMinutes = 240
// result.adjustedNightMinutes ≈ 274 (240 / 52.5 × 60)
// result.nightBonus ≈ 11.42 (4.57h × R$ 12,50 × 0.20)
```

**Base Legal**:
- CLT Art. 73 - Adicional noturno de pelo menos 20%
- CLT Art. 73 §1º - Hora noturna de 52 minutos e 30 segundos

---

## Banco de Horas

### Definição

Sistema de compensação de horas extras através de folgas ou redução de jornada futura.

### Regras CLT

- **Prazo de compensação**: Até 6 meses (CLT Art. 59 §2º)
- **Limite diário**: Máximo 10h/dia (8h normais + 2h extras)
- **Acordo**: Deve haver acordo individual ou coletivo

### Função: `calculateTimeBank()`

```typescript
calculateTimeBank(
  overtimeMinutes: number,      // Horas extras acumuladas
  compensatedMinutes: number,   // Horas já compensadas
  maxBalanceMinutes?: number,   // Limite do banco (padrão: 120h)
  referenceDate?: Date          // Data para cálculo de expiração
)
```

**Retorno**:
```typescript
{
  balance: number             // Saldo atual (+ crédito, - débito)
  toCompensate: number        // Minutos que podem ser compensados
  toPay: number              // Minutos que devem ser pagos (excedeu limite)
  withinLimit: boolean       // Se está dentro do limite
  nextExpiration: Date       // Próxima data de expiração
  expiredMovements: number   // Movimentos que expiraram
}
```

**Exemplo 1 - Saldo Normal**:
```typescript
const result = calculateTimeBank(
  600,  // 10 horas de extras
  120   // 2 horas compensadas
)

// result.balance = 480 (8 horas de crédito)
// result.toCompensate = 480
// result.toPay = 0
// result.withinLimit = true
// result.nextExpiration = +6 meses
```

**Exemplo 2 - Excedeu Limite**:
```typescript
const result = calculateTimeBank(
  8000,  // 133+ horas de extras
  0,
  7200   // Limite: 120 horas
)

// result.balance = 8000
// result.toCompensate = 7200 (limite máximo)
// result.toPay = 800 (excesso que deve ser pago)
// result.withinLimit = false
```

**Exemplo 3 - Funcionário Devendo Horas**:
```typescript
const result = calculateTimeBank(
  100,   // 100 minutos de extras
  300    // Compensou 300 minutos
)

// result.balance = -200 (funcionário deve 200 minutos)
// result.toCompensate = 200 (deve compensar)
```

**Base Legal**:
- CLT Art. 59 §2º - Compensação no período máximo de 6 meses
- CLT Art. 59 §5º - Banco de horas mediante acordo individual

---

## DSR - Descanso Semanal Remunerado

### Definição

O DSR é o pagamento adicional sobre horas extras, reflexo nos domingos e feriados.

### Cálculo

**Fórmula**:
```
DSR = (Total HE do mês / Dias úteis trabalhados) × Domingos e feriados
```

### Funções

**Função básica** - `calculateDSR()`:
```typescript
calculateDSR(
  overtimeValue: number,      // Valor total HE do mês
  workdays: number,           // Dias úteis trabalhados
  sundaysAndHolidays: number  // Domingos e feriados do mês
): number
```

**Função aprimorada** - `calculateDSREnhanced()`:
```typescript
calculateDSREnhanced(
  overtimeValue: number,
  workedDays: number,
  month: number,              // Mês (1-12)
  year: number,              // Ano
  customHolidays?: Date[]    // Feriados customizados
): number
```

**Exemplo**:
```typescript
// Janeiro/2024: 22 dias úteis, 5 domingos/feriados
const dsr = calculateDSR(
  500.00,  // R$ 500,00 em horas extras
  22,      // 22 dias úteis trabalhados
  5        // 5 domingos e feriados
)

// dsr = 113.64
// Cálculo: (500 / 22) × 5 = R$ 113,64
```

**Exemplo Detalhado**:
```typescript
const dsrEnhanced = calculateDSREnhanced(
  1000.00,  // R$ 1.000,00 em HE
  20,       // 20 dias trabalhados
  1,        // Janeiro
  2024      // 2024
)

// Conta automaticamente domingos e feriados de janeiro/2024
// dsrEnhanced ≈ 250.00
```

**Base Legal**:
- CLT Art. 67 - Direito ao repouso semanal remunerado
- Súmula 172 TST - DSR integra a remuneração para todos os efeitos legais

---

## Interjornada

### Definição

**Intervalo entre jornadas** - Período de descanso obrigatório entre o fim de uma jornada e início da próxima.

### Regra CLT

- **Mínimo**: 11 horas consecutivas de descanso
- **Violação**: Se não cumprir, a próxima jornada pode ser considerada hora extra

### Função: `validateInterjornada()`

```typescript
validateInterjornada(
  exitTime: Date,       // Saída da jornada anterior
  nextEntryTime: Date   // Entrada da próxima jornada
)
```

**Retorno**:
```typescript
{
  valid: boolean              // Se cumpre mínimo de 11h
  hoursRest: number          // Horas de descanso
  missingHours: number       // Horas faltantes
  exitTime: Date
  nextEntryTime: Date
  countsAsOvertime: boolean  // Se viola, conta como extra
}
```

**Exemplo 1 - Interjornada Válida**:
```typescript
const result = validateInterjornada(
  new Date('2024-01-15T18:00:00'),  // Saiu às 18h
  new Date('2024-01-16T08:00:00')   // Entrou às 8h (14h depois)
)

// result.valid = true
// result.hoursRest = 14
// result.missingHours = 0
// result.countsAsOvertime = false
```

**Exemplo 2 - Violação de Interjornada**:
```typescript
const result = validateInterjornada(
  new Date('2024-01-15T22:00:00'),  // Saiu às 22h
  new Date('2024-01-16T06:00:00')   // Entrou às 6h (apenas 8h)
)

// result.valid = false
// result.hoursRest = 8
// result.missingHours = 3
// result.countsAsOvertime = true ⚠️
```

**Consequências da Violação**:
1. Multa administrativa
2. Jornada seguinte pode ser paga como extra
3. Risco de ação trabalhista
4. Caracteriza condições inadequadas de trabalho

**Base Legal**: CLT Art. 66 - Intervalo mínimo de 11 horas consecutivas

---

## Intervalos (Intrajornada)

### Definição

**Intervalo durante a jornada** para descanso e alimentação.

### Regras CLT

| Jornada | Intervalo Mínimo | Intervalo Máximo |
|---------|------------------|------------------|
| Até 4h | Não obrigatório | - |
| 4h a 6h | 15 minutos | ~30 minutos |
| Mais de 6h | 1 hora | 2 horas |

### Função: `validateBreak()`

```typescript
validateBreak(
  workedMinutes: number,  // Minutos trabalhados
  breakMinutes: number    // Minutos de intervalo
)
```

**Retorno**:
```typescript
{
  valid: boolean
  breakMinutes: number
  requiredMinutes: number
  missingMinutes: number
  violation?: 'insufficient' | 'excessive' | 'none'
}
```

**Exemplo 1 - Jornada > 6h (Correto)**:
```typescript
const result = validateBreak(
  540,  // 9 horas trabalhadas
  60    // 1 hora de intervalo
)

// result.valid = true
// result.requiredMinutes = 60
// result.violation = 'none'
```

**Exemplo 2 - Intervalo Insuficiente**:
```typescript
const result = validateBreak(
  540,  // 9 horas trabalhadas
  30    // Apenas 30 minutos
)

// result.valid = false
// result.requiredMinutes = 60
// result.missingMinutes = 30
// result.violation = 'insufficient' ⚠️
```

**Exemplo 3 - Jornada 4h-6h**:
```typescript
const result = validateBreak(
  300,  // 5 horas trabalhadas
  15    // 15 minutos
)

// result.valid = true
// result.requiredMinutes = 15
```

**Exemplo 4 - Intervalo Excessivo**:
```typescript
const result = validateBreak(
  540,  // 9 horas trabalhadas
  150   // 2h30min de intervalo
)

// result.valid = false
// result.violation = 'excessive'
// Intervalo não pode exceder 2h
```

**Base Legal**:
- CLT Art. 71 - Intervalos para descanso e alimentação
- CLT Art. 71 §4º - Não concessão ou redução de intervalo pode gerar adicional de 50%

---

## Validações e Violações

### Função: `detectViolations()`

Detecta todas as violações trabalhistas em um conjunto de registros.

```typescript
detectViolations(
  records: DailyTimeRecord[]  // Registros do período
)
```

**Retorno**:
```typescript
{
  interjornada: InterjornadaResult[]      // Violações de interjornada
  dailyLimit: DailyLimitResult[]          // Violações de limite diário
  breaks: BreakValidationResult[]         // Violações de intervalo
  excessiveOvertime: Date[]               // Dias com HE > 2h
  totalViolations: number                 // Total de violações
  hasCriticalViolations: boolean          // Se há violações críticas
}
```

**Exemplo de Uso**:
```typescript
const records = [
  // ... registros do mês
]

const violations = detectViolations(records)

if (violations.hasCriticalViolations) {
  console.log('⚠️ ATENÇÃO: Violações críticas detectadas!')

  if (violations.interjornada.length > 0) {
    console.log(`- ${violations.interjornada.length} violações de interjornada`)
  }

  if (violations.breaks.length > 0) {
    console.log(`- ${violations.breaks.length} intervalos irregulares`)
  }
}
```

### Tipos de Violações

**🔴 Violações Críticas** (Risco Legal Alto):
- Interjornada < 11h
- Intervalo insuficiente (< 1h para jornada > 6h)
- Jornada > 10h/dia sem acordo

**🟡 Violações Moderadas** (Atenção):
- Hora extra > 2h/dia
- Intervalo excessivo (> 2h)
- Violações de tolerância frequentes

---

## Exemplos Práticos

### Exemplo Completo 1 - Dia Normal de Trabalho

**Cenário**:
- Entrada: 08:00
- Intervalo: 12:00 às 13:00
- Saída: 17:00
- Jornada esperada: 8h

```typescript
const record = {
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
```

**Resultado**:
- Tempo bruto: 9h (08:00 às 17:00)
- Intervalo: 1h
- **Tempo líquido: 8h** ✅
- Hora extra: 0
- Advertências: Nenhuma

---

### Exemplo Completo 2 - Dia com Hora Extra

**Cenário**:
- Entrada: 08:00
- Intervalo: 12:00 às 13:00
- Saída: 19:00 (2h extras)
- Salário: R$ 2.200,00
- Jornada: 44h semanais

```typescript
const record = {
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00'),
  clockOut: new Date('2024-01-15T19:00:00'),
  breakStart: new Date('2024-01-15T12:00:00'),
  breakEnd: new Date('2024-01-15T13:00:00'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

const daily = calculateDailyJourney(record)
const hourlyRate = calculateHourlyRate(2200, 44)
const overtime = calculateOvertimeRegular(
  daily.netWorkedMinutes,
  480,
  hourlyRate
)
```

**Resultado**:
- Tempo bruto: 11h
- Intervalo: 1h
- **Tempo líquido: 10h**
- **Hora extra: 2h** (120 minutos)
- Valor hora: R$ 10,00
- **Valor HE 50%: R$ 30,00** (2h × R$ 10,00 × 1.5)

---

### Exemplo Completo 3 - Trabalho Noturno

**Cenário**:
- Entrada: 22:00
- Intervalo: 02:00 às 03:00
- Saída: 06:00
- Salário: R$ 2.640,00

```typescript
const record = {
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
const hourlyRate = calculateHourlyRate(2640, 44)
const nightShift = calculateNightShift(
  record.clockIn,
  record.clockOut,
  hourlyRate
)
```

**Resultado**:
- Tempo bruto: 8h
- Intervalo: 1h
- Tempo líquido: 7h
- **Período noturno: 7h** (22h às 5h)
- Com redução noturna: **8h para pagamento**
- Valor hora: R$ 12,00
- **Adicional noturno (20%): R$ 19,20** (8h × R$ 12,00 × 0.20)

---

### Exemplo Completo 4 - Trabalho em Domingo

**Cenário**:
- Domingo
- Entrada: 08:00
- Saída: 16:00
- Sem intervalo (jornada < 6h)

```typescript
const record = {
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
const value = calculateOvertimeWeekend(
  daily.netWorkedMinutes,
  10.00
)
```

**Resultado**:
- Tempo trabalhado: 8h
- **Hora extra 100%: 8h**
- Valor hora: R$ 10,00
- **Valor HE 100%: R$ 160,00** (8h × R$ 10,00 × 2.0)

---

### Exemplo Completo 5 - Mês Completo com DSR

**Cenário**: Janeiro/2024
- 22 dias úteis trabalhados
- 5 domingos e feriados
- Total HE 50%: 20h = R$ 300,00
- Total HE 100%: 8h = R$ 160,00
- Adicional noturno: R$ 50,00

```typescript
const overtimeValue = 300.00 + 160.00 + 50.00 // R$ 510,00

const dsr = calculateDSR(
  overtimeValue,
  22,  // Dias úteis
  5    // Domingos e feriados
)
```

**Resultado**:
- Total extras e adicionais: R$ 510,00
- **DSR**: R$ 115,91 ((510 / 22) × 5)
- **Total a receber**: R$ 625,91

---

## Integração com Supabase

### Consultas Disponíveis

O arquivo `src/lib/supabase/queries/clt-reports.ts` fornece:

#### 1. Calcular Horas Extras do Mês
```typescript
const result = await calculateMonthlyOvertime(
  employeeId,
  2024,
  1  // Janeiro
)

// Retorna: journey, monetary, employee
```

#### 2. Calcular Banco de Horas
```typescript
const timeBank = await calculateEmployeeTimeBank(
  employeeId,
  2024,
  1
)

// Retorna: balance, toCompensate, toPay, etc.
```

#### 3. Detectar Violações
```typescript
const violations = await detectMonthlyViolations(
  employeeId,
  2024,
  1
)

// Retorna: todas as violações do mês
```

#### 4. Relatório Consolidado da Empresa
```typescript
const report = await getCompanyMonthlyReport(
  companyId,
  2024,
  1
)

// Retorna: dados de todos os funcionários + totais
```

---

## Referências Legais

### CLT - Consolidação das Leis do Trabalho

- **Art. 58**: Duração normal do trabalho (8h diárias, 44h semanais)
- **Art. 58 §1º**: Tolerância de 10 minutos
- **Art. 59**: Horas extras (máximo 2h/dia, acréscimo mínimo 50%)
- **Art. 59 §2º**: Banco de horas (compensação em até 6 meses)
- **Art. 66**: Interjornada (mínimo 11h de descanso)
- **Art. 67**: Descanso semanal remunerado
- **Art. 71**: Intervalos intrajornada
- **Art. 73**: Adicional noturno (20%, hora reduzida)

### Súmulas TST

- **Súmula 172**: DSR integra remuneração
- **Súmula 264**: Hora extra habitual reflete em férias, 13º, etc.
- **Súmula 340**: Intervalo não concedido gera adicional de 50%

### Constituição Federal

- **Art. 7º, XIII**: Jornada não superior a 8h diárias
- **Art. 7º, XVI**: Remuneração do serviço extraordinário superior em pelo menos 50%

---

## Observações Importantes

1. **Acordos Coletivos**: Podem estabelecer regras diferentes (sempre respeitar o mais benéfico ao trabalhador)

2. **Categorias Especiais**: Algumas profissões têm regras próprias (médicos, motoristas, etc.)

3. **Escalas Especiais**: 12x36 e outras escalas têm cálculos específicos

4. **Tributação**: Horas extras sofrem desconto de IR e INSS normalmente

5. **Reflexos**: Horas extras habituais refletem em férias, 13º salário, FGTS, etc.

---

## Changelog

### Versão 2.0 (Janeiro 2025)
- ✅ Adicionadas funções de hora extra 50% e 100%
- ✅ Implementado cálculo completo de adicional noturno
- ✅ Sistema de banco de horas com limites e expiração
- ✅ Validação de interjornada
- ✅ Validação de intervalos intrajornada
- ✅ Detecção automática de violações
- ✅ Integração completa com Supabase
- ✅ Testes unitários abrangentes
- ✅ Documentação completa

### Versão 1.0 (Dezembro 2024)
- Cálculos básicos de jornada
- Horas extras simples
- DSR básico

---

**Desenvolvido com ❤️ seguindo a legislação trabalhista brasileira**

Para dúvidas ou contribuições, consulte o código em:
- `/src/lib/compliance/clt-calculations.ts`
- `/src/lib/supabase/queries/clt-reports.ts`
- `/src/__tests__/unit/clt-calculations.test.ts`
