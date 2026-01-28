# Guia de Testes - Módulo de Controle de Ponto

## Sumário Executivo

Suíte de testes completa para o módulo de controle de ponto com foco em:
- Validação de batidas e sequências
- Cálculos trabalhistas CLT
- Compliance legal (AFD/AEJ)
- Cobertura >85%

## Arquitetura de Testes

### Framework: Vitest

**Por que Vitest?**
- ⚡ Performance superior (executável em ~100ms)
- 🔥 Hot reload nativo
- 📊 UI integrada para debugging
- 🎯 100% compatível com Jest API
- 🛠️ Zero-config para Vite/Next.js

### Estrutura

```
src/__tests__/
├── setup.ts                          # Config global (mocks, cleanup)
├── fixtures/
│   ├── users.ts                      # Dados de usuários de teste
│   └── signings.ts                   # Cenários de batidas de ponto
└── time-tracking/
    ├── signing-validation.test.ts    # 40 testes - validações
    ├── hours-calculation.test.ts     # 35 testes - cálculos CLT
    └── compliance.test.ts            # 50 testes - AFD/compliance
```

## Categorias de Teste

### 1. Signing Validation (40 testes)

**Objetivo**: Garantir sequência correta e prevenir batidas inválidas

#### Testes de Sequência
```typescript
✅ not_started → clock_in (válido)
❌ not_started → clock_out (rejeitado)
✅ working → break_start (válido)
✅ working → clock_out (válido)
❌ working → clock_in (rejeitado - já marcou entrada)
✅ break → break_end (válido)
❌ break → clock_out (rejeitado - precisa finalizar intervalo)
```

**Cenários Testados**:
- Transições válidas entre estados
- Rejeição de transições inválidas
- Mensagens de erro descritivas
- Validação de tipo de ação

#### Testes de Duplicação
```typescript
✅ Primeira batida (sem histórico)
❌ Batida duplicada em <1 minuto
✅ Batida após 2 minutos (válida)
✅ Janela customizável (1-10 minutos)
```

#### Validação de Schema Zod
```typescript
✅ UUIDs válidos (employee_id, company_id)
❌ UUIDs inválidos
✅ Tipos de registro válidos (clock_in, clock_out, break_start, break_end)
❌ Tipos inválidos
✅ GPS válido (-90 a 90 lat, -180 a 180 long)
❌ GPS fora de range
✅ Notas até 500 caracteres
❌ Notas >500 caracteres
```

### 2. Hours Calculation (35 testes)

**Objetivo**: Cálculos precisos conforme CLT

#### Jornada Normal (8h)
```typescript
Input:
  - Clock In: 08:00
  - Clock Out: 17:00
  - Break: 12:00-13:00

Expected:
  - Worked: 540 min (9h bruto)
  - Break: 60 min
  - Net: 480 min (8h líquido)
  - Overtime: 0 min
  - Missing: 0 min
```

#### Hora Extra 50% (dias úteis)
```typescript
Input:
  - Clock In: 08:00
  - Clock Out: 19:00 (10h trabalhadas)
  - Break: 12:00-13:00

Expected:
  - Net: 600 min (10h)
  - Overtime 50%: 120 min (2h extras)
  - Time Bank: +120 min
```

#### Hora Extra 100% (domingos/feriados)
```typescript
Input:
  - Date: Sunday
  - Clock In: 08:00
  - Clock Out: 17:00

Expected:
  - Net: 480 min
  - Overtime 100%: 480 min (todo trabalho em domingo)
  - Overtime 50%: 0 min
```

#### Adicional Noturno (22h-5h)
```typescript
Input:
  - Clock In: 22:00
  - Clock Out: 06:00 (next day)

Cálculo:
  1. Night Minutes: 420 min (22h-5h = 7h)
  2. Night Reduction: 420 / 52.5 * 60 = 480 min
  3. Bonus: 480 - 420 = 60 min extra
  4. Night Shift Value: 20% sobre horas noturnas
```

#### Tolerância (10 minutos)
```typescript
485 min trabalhados vs 480 esperados = -5 min
→ Dentro da tolerância
→ Ajustado para 480 min
→ Sem desconto

495 min trabalhados vs 480 esperados = +15 min
→ Fora da tolerância
→ Mantém 495 min
→ 15 min de hora extra
```

#### Validação de Intervalo
```typescript
Jornada > 6h:
  - Min: 60 minutos
  - Max: 120 minutos
  - Warning se <60 min

Jornada 4h-6h:
  - Min: 15 minutos
```

#### Consolidação Mensal
```typescript
Input: Array de DailyTimeRecords

Output:
  - totalWorkdays: 20
  - totalWorkedDays: 18
  - totalWorkedMinutes: 8640 (144h)
  - totalOvertime50Minutes: 120 (2h)
  - totalOvertime100Minutes: 0
  - totalNightMinutes: 0
  - timeBankBalance: +120 min
  - absenceDays: 2
```

#### Valores Monetários
```typescript
Input:
  - baseSalary: R$ 5000
  - weeklyHours: 44h

Cálculo:
  1. Hourly Rate: 5000 / 220 = R$ 22.73/h
  2. OT 50%: 2h * 22.73 * 1.5 = R$ 68.19
  3. Night Shift: 0h * 22.73 * 0.2 = R$ 0
  4. DSR: (68.19 / 20 workdays) * 5 sundays = R$ 17.05
  5. Total Earnings: 68.19 + 17.05 = R$ 85.24
  6. Absence Deduction: 0 (sem faltas)
```

### 3. Compliance (50 testes)

**Objetivo**: Geração AFD válida conforme Portaria MTE 671

#### Validação de PIS
```typescript
✅ PIS válido com dígito verificador correto
❌ PIS com dígito errado
❌ PIS com tamanho inválido
✅ Formatação: 120.45678.90-1
```

**Algoritmo de Validação**:
```
PIS: 1 2 0 4 5 6 7 8 9 0 [1]
Pesos: 3 2 9 8 7 6 5 4 3 2

Soma: 1*3 + 2*2 + 0*9 + ... + 0*2 = X
Resto: X % 11
Dígito: Resto < 2 ? 0 : 11 - Resto
```

#### Estrutura AFD

**Registro Tipo 1 (Header)**:
```
Posição | Tam | Conteúdo
--------|-----|------------------
1       | 1   | '1' (tipo)
2-10    | 9   | NSR (000000001)
11      | 1   | '1' (tipo doc: CNPJ)
12-25   | 14  | CNPJ (14 dígitos)
26-37   | 12  | CEI (ou espaços)
38-187  | 150 | Razão Social
188-204 | 17  | Num Fabricação REP
205-212 | 8   | Data Início (DDMMAAAA)
213-220 | 8   | Data Fim (DDMMAAAA)
221-234 | 14  | Data/Hora Geração
235-999 | -   | Espaços até 99 chars
```

**Registro Tipo 2 (REP)**:
```
Posição | Tam | Conteúdo
--------|-----|------------------
1       | 1   | '2' (tipo)
2-10    | 9   | NSR
11-27   | 17  | Num Fabricação REP
28      | 1   | Tipo REP (1=C, 2=A, 3=P)
29-178  | 150 | Marca/Modelo
179-203 | 25  | Versão Firmware
```

**Registro Tipo 3 (Marcação)**:
```
Posição | Tam | Conteúdo
--------|-----|------------------
1       | 1   | '3' (tipo)
2-10    | 9   | NSR
11-22   | 12  | PIS (12 dígitos)
23-30   | 8   | Data (DDMMAAAA)
31-34   | 4   | Hora (HHMM)
```

**Registro Tipo 9 (Trailer)**:
```
Posição | Tam | Conteúdo
--------|-----|------------------
1       | 1   | '9' (tipo)
2-10    | 9   | Total de registros
```

#### Testes de Formatação
```typescript
✅ Date: 15/01/2024 → 15012024
✅ Time: 08:30 → 0830
✅ NSR sequencial: 1, 2, 3, 4...
✅ Ordenação por data/hora
✅ Cada linha exatamente 99 caracteres
✅ Line ending: \r\n (CRLF)
```

#### Normalização de Caracteres
```typescript
Input: "Açúcar & Café Ltda"
Output: "Acucar & Cafe Ltda"

- Remove acentos (NFD normalization)
- Remove caracteres não-ASCII
- Trunca em 150 caracteres
```

#### Edge Cases
```typescript
✅ Sem registros de ponto (só header + REP + trailer)
✅ Funcionário sem PIS (não gera Type 3)
✅ Nome empresa >150 chars (truncado)
✅ Múltiplos funcionários
✅ Encoding ISO-8859-1 vs UTF-8
✅ Ajustes (Type 4)
✅ Inclusões (Type 5)
```

## Fixtures

### Users
```typescript
export const testEmployee = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'employee@test.com',
  name: 'Test Employee',
  role: 'employee',
  company_id: '550e8400-e29b-41d4-a716-446655440010',
  department: 'Engineering',
}

export const testCompany = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  name: 'Test Company Inc',
  cnpj: '12.345.678/0001-90',
  cei: '123.456.78-9',
  weekly_hours: 44,
}
```

### Signings
```typescript
export const normalWorkday = {
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00Z'),
  clockOut: new Date('2024-01-15T17:00:00Z'),
  breakStart: new Date('2024-01-15T12:00:00Z'),
  breakEnd: new Date('2024-01-15T13:00:00Z'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

export const overtimeWorkday = {
  clockOut: new Date('2024-01-15T19:00:00Z'), // 10h worked
  // ... outros campos
}

export const nightShiftWorkday = {
  clockIn: new Date('2024-01-15T22:00:00Z'),
  clockOut: new Date('2024-01-16T06:00:00Z'),
  // ... outros campos
}
```

## Executar Testes

### Desenvolvimento (Watch Mode)
```bash
npm run test:watch
```

### CI/CD (Single Run)
```bash
npm test
```

### UI Interativa
```bash
npm run test:ui
# Abre navegador em http://localhost:51204
```

### Coverage Report
```bash
npm run test:coverage
# Gera relatório em coverage/index.html
```

### Filtrar Testes
```bash
# Por arquivo
npm test -- signing-validation

# Por padrão
npm test -- --grep "overtime"

# Específico
npm test -- -t "should calculate overtime correctly"
```

## Metas de Coverage

| Categoria | Target | Atual | Status |
|-----------|--------|-------|--------|
| Validations | 100% | - | 🎯 Critical |
| CLT Calculations | >95% | - | 🎯 Critical |
| AFD Generator | >90% | - | ⚠️ Important |
| Overall | >85% | - | ✅ Goal |

## Debugging

### Test.only
```typescript
it.only('should test this specifically', () => {
  // Roda apenas este teste
})
```

### Debug Mode
```bash
# Com breakpoints
node --inspect-brk node_modules/vitest/vitest.mjs run
```

### Console Logs
```typescript
it('debug test', () => {
  console.log('Debug value:', result)
  // Logs aparecem no terminal
})
```

## Integração CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --run"
    }
  }
}
```

## Próximos Passos

### Testes de Integração (Planejados)
- [ ] POST /api/signings - criar batida
- [ ] GET /api/signings - listar batidas
- [ ] PUT /api/signings/:id - ajustar batida
- [ ] DELETE /api/signings/:id - remover batida
- [ ] Autenticação Supabase
- [ ] Autorização por role

### Testes E2E com Playwright (Planejados)
- [ ] Fluxo: Login → Bater Ponto → Sucesso
- [ ] Fluxo: Ver Histórico → Filtrar por Data
- [ ] Fluxo: Solicitar Ajuste → Aprovação Manager
- [ ] Fluxo: Gerar Relatório → Download PDF
- [ ] Visual Regression (screenshots)
- [ ] Accessibility (WCAG AA)

## Referências

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Portaria MTE 671](http://www.mte.gov.br/)
- [CLT Atualizada](http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
- [Cálculo PIS](https://www.calculadoraonline.com.br/pis)
