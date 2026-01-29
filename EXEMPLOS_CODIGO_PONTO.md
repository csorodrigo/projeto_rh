# Exemplos de Código - Sistema de Ponto

## Referência Rápida para Desenvolvedores

---

## 1. Como Usar as Queries

### 1.1. Registrar Ponto

```typescript
import { recordTimeEntry } from '@/lib/supabase/queries'

// Registrar entrada
const result = await recordTimeEntry(
  employeeId,
  companyId,
  'clock_in',
  {
    source: 'web',
    deviceInfo: {
      user_agent: navigator.userAgent,
      device_type: 'desktop',
    },
  }
)

if (result.error) {
  console.error('Erro ao registrar:', result.error.message)
} else {
  console.log('Ponto registrado:', result.data)
}
```

### 1.2. Buscar Registros de Hoje

```typescript
import { getTodayTimeRecords } from '@/lib/supabase/queries'

const { data: records, error } = await getTodayTimeRecords(employeeId)

if (records) {
  records.forEach(record => {
    console.log(`${record.record_type} às ${record.recorded_at}`)
  })
}
```

### 1.3. Verificar Status Atual

```typescript
import { getCurrentClockStatus } from '@/lib/supabase/queries'

const { data: status, error } = await getCurrentClockStatus(employeeId)

if (status) {
  console.log('Status:', status.status) // 'not_started' | 'working' | 'break' | 'finished'
  console.log('Última ação:', status.lastAction)
  console.log('Horário:', status.lastActionTime)
}
```

### 1.4. Buscar Resumo do Dia

```typescript
import { getDailyTimeTracking } from '@/lib/supabase/queries'

const today = new Date().toISOString().split('T')[0]
const { data: summary, error } = await getDailyTimeTracking(employeeId, today)

if (summary) {
  console.log('Entrada:', summary.clock_in)
  console.log('Saída:', summary.clock_out)
  console.log('Minutos trabalhados:', summary.worked_minutes)
  console.log('Horas extras:', summary.overtime_minutes)
}
```

### 1.5. Consultar Banco de Horas

```typescript
import { getTimeBankBalance } from '@/lib/supabase/queries'

const { data: balance, error } = await getTimeBankBalance(employeeId)

if (balance) {
  const hours = Math.floor(balance.balance_minutes / 60)
  const minutes = balance.balance_minutes % 60
  console.log(`Saldo: ${hours}h ${minutes}min`)
}
```

---

## 2. Componentes Prontos

### 2.1. Widget de Relógio

```tsx
import { ClockWidget } from '@/components/time-tracking'

function MyPage() {
  const [status, setStatus] = useState('not_started')

  const handleClockAction = async (action: ClockType) => {
    // Sua lógica de registro
    await recordTimeEntry(employeeId, companyId, action)
    // Atualizar status
    const { data } = await getCurrentClockStatus(employeeId)
    if (data) setStatus(data.status)
  }

  return (
    <ClockWidget
      currentStatus={status}
      onClockAction={handleClockAction}
      isLoading={false}
    />
  )
}
```

### 2.2. Lista de Registros

```tsx
import { TimeEntriesList } from '@/components/time-tracking'

function MyPage() {
  const [entries, setEntries] = useState<TimeRecord[]>([])

  useEffect(() => {
    async function loadEntries() {
      const { data } = await getTodayTimeRecords(employeeId)
      if (data) setEntries(data)
    }
    loadEntries()
  }, [employeeId])

  return <TimeEntriesList entries={entries} />
}
```

### 2.3. Cards de Resumo

```tsx
import { TimeSummaryCard } from '@/components/time-tracking'

function MyPage() {
  const [workedMinutes, setWorkedMinutes] = useState(0)
  const [bankMinutes, setBankMinutes] = useState(0)

  return (
    <>
      <TimeSummaryCard
        type="worked"
        minutes={workedMinutes}
        label="Horas hoje"
      />
      <TimeSummaryCard
        type="bank"
        minutes={bankMinutes}
        label="Banco de horas"
      />
    </>
  )
}
```

### 2.4. Lista de Presença

```tsx
import { PresenceList } from '@/components/time-tracking'

function MyPage() {
  const [presence, setPresence] = useState<PresenceStatus[]>([])
  const [loading, setLoading] = useState(true)

  const loadPresence = async () => {
    setLoading(true)
    const { data } = await getPresenceStatus(companyId)
    if (data) setPresence(data)
    setLoading(false)
  }

  return (
    <PresenceList
      presenceData={presence}
      isLoading={loading}
    />
  )
}
```

---

## 3. Hooks Personalizados

### 3.1. Hook para Ponto

```typescript
import { useState, useEffect, useCallback } from 'react'

export function useTimeTracking(employeeId: string) {
  const [status, setStatus] = useState<'not_started' | 'working' | 'break' | 'finished'>('not_started')
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [workedMinutes, setWorkedMinutes] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, recordsRes, dailyRes] = await Promise.all([
        getCurrentClockStatus(employeeId),
        getTodayTimeRecords(employeeId),
        getDailyTimeTracking(employeeId, new Date().toISOString().split('T')[0]),
      ])

      if (statusRes.data) setStatus(statusRes.data.status)
      if (recordsRes.data) setRecords(recordsRes.data)
      if (dailyRes.data) setWorkedMinutes(dailyRes.data.worked_minutes)
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clockAction = async (action: ClockType) => {
    await recordTimeEntry(employeeId, companyId, action)
    await loadData() // Recarregar dados
  }

  return {
    status,
    records,
    workedMinutes,
    loading,
    clockAction,
    reload: loadData,
  }
}

// Uso:
function MyPage() {
  const { status, records, workedMinutes, clockAction } = useTimeTracking(employeeId)

  return (
    <div>
      <p>Status: {status}</p>
      <p>Trabalhado: {workedMinutes} min</p>
      <button onClick={() => clockAction('clock_in')}>Entrada</button>
    </div>
  )
}
```

### 3.2. Hook para Tempo Real

```typescript
export function useRealtimeClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return {
    time,
    timeString: formatTime(time),
    dateString: formatDate(time),
  }
}

// Uso:
function ClockDisplay() {
  const { timeString, dateString } = useRealtimeClock()

  return (
    <div>
      <h1>{timeString}</h1>
      <p>{dateString}</p>
    </div>
  )
}
```

---

## 4. Formatação de Dados

### 4.1. Minutos para Horas

```typescript
function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : minutes > 0 ? '+' : ''
  return `${sign}${hours}h ${mins}min`
}

// Exemplos:
formatMinutesToHours(150)   // "2h 30min"
formatMinutesToHours(-90)   // "-1h 30min"
formatMinutesToHours(480)   // "8h 0min"
```

### 4.2. Timestamp para Hora

```typescript
function formatTimeFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Exemplo:
formatTimeFromTimestamp('2026-01-29T14:30:00Z') // "14:30"
```

### 4.3. Calcular Duração

```typescript
function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.floor(diffMs / 1000 / 60) // minutos
}

// Exemplo:
const worked = calculateDuration('2026-01-29T08:00:00Z', '2026-01-29T17:00:00Z')
console.log(worked) // 540 minutos (9 horas)
```

---

## 5. Validações

### 5.1. Validar Sequência de Ações

```typescript
function canPerformAction(
  lastAction: ClockType | null,
  nextAction: ClockType
): { allowed: boolean; message?: string } {
  if (!lastAction) {
    if (nextAction !== 'clock_in') {
      return {
        allowed: false,
        message: 'Primeira ação deve ser entrada',
      }
    }
    return { allowed: true }
  }

  switch (nextAction) {
    case 'clock_in':
      if (lastAction !== 'clock_out') {
        return {
          allowed: false,
          message: 'Já existe entrada registrada',
        }
      }
      break
    case 'break_start':
      if (!['clock_in', 'break_end'].includes(lastAction)) {
        return {
          allowed: false,
          message: 'Registre entrada antes do intervalo',
        }
      }
      break
    case 'break_end':
      if (lastAction !== 'break_start') {
        return {
          allowed: false,
          message: 'Não há intervalo ativo',
        }
      }
      break
    case 'clock_out':
      if (lastAction === 'break_start') {
        return {
          allowed: false,
          message: 'Finalize o intervalo antes',
        }
      }
      if (!['clock_in', 'break_end'].includes(lastAction)) {
        return {
          allowed: false,
          message: 'Registre entrada antes da saída',
        }
      }
      break
  }

  return { allowed: true }
}
```

### 5.2. Validar Tempo Mínimo

```typescript
function canRecordNow(lastRecordTime: string | null): boolean {
  if (!lastRecordTime) return true

  const lastTime = new Date(lastRecordTime).getTime()
  const now = Date.now()
  const diffSeconds = (now - lastTime) / 1000

  return diffSeconds >= 60 // Mínimo 60 segundos
}
```

---

## 6. Queries SQL Diretas

### 6.1. Buscar Último Registro

```sql
SELECT *
FROM time_records
WHERE employee_id = 'xxx'
  AND DATE(recorded_at) = CURRENT_DATE
ORDER BY recorded_at DESC
LIMIT 1;
```

### 6.2. Calcular Horas do Dia

```sql
SELECT
  clock_in,
  clock_out,
  worked_minutes,
  break_minutes,
  overtime_minutes
FROM time_tracking_daily
WHERE employee_id = 'xxx'
  AND date = CURRENT_DATE;
```

### 6.3. Saldo do Banco de Horas

```sql
SELECT balance_after AS saldo
FROM time_bank
WHERE employee_id = 'xxx'
ORDER BY created_at DESC
LIMIT 1;
```

### 6.4. Quem Está Trabalhando Agora

```sql
WITH latest_records AS (
  SELECT DISTINCT ON (employee_id)
    employee_id,
    record_type,
    recorded_at
  FROM time_records
  WHERE company_id = 'xxx'
    AND DATE(recorded_at) = CURRENT_DATE
  ORDER BY employee_id, recorded_at DESC
)
SELECT
  e.name,
  lr.record_type,
  lr.recorded_at
FROM employees e
INNER JOIN latest_records lr ON lr.employee_id = e.id
WHERE lr.record_type IN ('clock_in', 'break_start', 'break_end')
ORDER BY e.name;
```

---

## 7. Tratamento de Erros

### 7.1. Try-Catch Completo

```typescript
async function safeClockAction(action: ClockType) {
  try {
    const result = await recordTimeEntry(employeeId, companyId, action)

    if (result.error) {
      // Erros do Supabase
      toast.error('Erro ao registrar ponto', {
        description: result.error.message,
      })
      return
    }

    // Sucesso
    toast.success('Ponto registrado!', {
      description: `${action} registrado às ${formatTime(new Date())}`,
    })

    // Recarregar dados
    await loadData()
  } catch (err) {
    // Erros de rede ou outros
    console.error('Erro inesperado:', err)
    toast.error('Erro de conexão', {
      description: 'Verifique sua internet e tente novamente',
    })
  }
}
```

### 7.2. Validações com Feedback

```typescript
async function validateAndRecord(action: ClockType) {
  // 1. Verificar se funcionário existe
  const { data: employee } = await getEmployee(employeeId)
  if (!employee) {
    toast.error('Funcionário não encontrado')
    return
  }

  // 2. Verificar se está ativo
  if (employee.status !== 'active') {
    toast.error('Funcionário inativo', {
      description: 'Entre em contato com o RH',
    })
    return
  }

  // 3. Verificar último registro
  const { data: status } = await getCurrentClockStatus(employeeId)
  const validation = canPerformAction(status?.lastAction || null, action)

  if (!validation.allowed) {
    toast.warning('Ação não permitida', {
      description: validation.message,
    })
    return
  }

  // 4. Validar tempo mínimo
  if (!canRecordNow(status?.lastActionTime || null)) {
    toast.warning('Aguarde 1 minuto', {
      description: 'Tempo mínimo entre registros',
    })
    return
  }

  // 5. Registrar
  await safeClockAction(action)
}
```

---

## 8. Testes

### 8.1. Teste de Componente

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClockWidget } from '@/components/time-tracking'

describe('ClockWidget', () => {
  it('deve renderizar botão de entrada', () => {
    render(
      <ClockWidget
        currentStatus="not_started"
        onClockAction={jest.fn()}
      />
    )

    expect(screen.getByText('Entrada')).toBeInTheDocument()
  })

  it('deve chamar onClockAction ao clicar', async () => {
    const mockAction = jest.fn()

    render(
      <ClockWidget
        currentStatus="not_started"
        onClockAction={mockAction}
      />
    )

    fireEvent.click(screen.getByText('Entrada'))

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith('clock_in')
    })
  })
})
```

### 8.2. Teste de Query

```typescript
import { recordTimeEntry } from '@/lib/supabase/queries'

describe('recordTimeEntry', () => {
  it('deve registrar entrada com sucesso', async () => {
    const result = await recordTimeEntry(
      'employee-id',
      'company-id',
      'clock_in'
    )

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.record_type).toBe('clock_in')
  })

  it('deve retornar erro com dados inválidos', async () => {
    const result = await recordTimeEntry(
      'invalid-id',
      'invalid-company',
      'clock_in'
    )

    expect(result.error).toBeDefined()
    expect(result.data).toBeNull()
  })
})
```

---

## 9. Otimizações

### 9.1. Memoização

```typescript
import { useMemo } from 'react'

function TimeTrackingPage() {
  const [records, setRecords] = useState<TimeRecord[]>([])

  // Calcular total apenas quando records mudar
  const totalWorked = useMemo(() => {
    // Lógica complexa de cálculo
    return calculateTotalMinutes(records)
  }, [records])

  return <div>Total: {totalWorked} min</div>
}
```

### 9.2. Debounce para Botões

```typescript
import { useState } from 'react'

function useDebouncedAction() {
  const [loading, setLoading] = useState(false)

  const debouncedAction = async (action: ClockType) => {
    if (loading) return // Prevenir múltiplos cliques

    setLoading(true)
    try {
      await recordTimeEntry(employeeId, companyId, action)
    } finally {
      setTimeout(() => setLoading(false), 1000) // Debounce de 1s
    }
  }

  return { debouncedAction, loading }
}
```

---

## 10. Dicas de Performance

### 10.1. Carregar Dados em Paralelo

```typescript
async function loadAllData() {
  // ✅ BOM - Paralelo
  const [status, records, balance] = await Promise.all([
    getCurrentClockStatus(employeeId),
    getTodayTimeRecords(employeeId),
    getTimeBankBalance(employeeId),
  ])

  // ❌ RUIM - Sequencial
  const status = await getCurrentClockStatus(employeeId)
  const records = await getTodayTimeRecords(employeeId)
  const balance = await getTimeBankBalance(employeeId)
}
```

### 10.2. Cache de Perfil

```typescript
let cachedProfile: Profile | null = null

async function getProfileCached(): Promise<Profile> {
  if (cachedProfile) return cachedProfile

  const { data } = await getCurrentProfile()
  if (data) {
    cachedProfile = data
  }
  return cachedProfile!
}
```

---

## Conclusão

Este documento contém exemplos práticos de como usar o sistema de ponto. Use como referência para:

- Integrar o sistema em novas páginas
- Criar novos componentes
- Entender o fluxo de dados
- Implementar validações
- Otimizar performance

Para mais informações, consulte:
- `SISTEMA_PONTO_COMPLETO.md` - Documentação completa
- `TESTE_SISTEMA_PONTO.md` - Checklist de testes
- `/src/app/(dashboard)/ponto/page.tsx` - Implementação de referência
