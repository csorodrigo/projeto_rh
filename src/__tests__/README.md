# Time Tracking Module - Test Suite

Suíte de testes completa para o módulo de controle de ponto.

## Estrutura de Testes

```
src/__tests__/
├── setup.ts                      # Configuração global de testes
├── fixtures/                     # Dados de teste reutilizáveis
│   ├── users.ts                  # Funcionários, gerentes, empresa
│   └── signings.ts               # Batidas de ponto e cenários
└── time-tracking/                # Testes unitários
    ├── signing-validation.test.ts    # Validação de batidas
    ├── hours-calculation.test.ts     # Cálculos de horas
    └── compliance.test.ts            # Geração AFD/AEJ
```

## Executar Testes

### Modo Watch (Desenvolvimento)
```bash
npm run test:watch
```

### Execução Única
```bash
npm test
```

### Interface Gráfica
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

## Coverage Esperado

- **Validações**: 100% (lógica crítica de segurança)
- **Cálculos CLT**: >95% (cálculos trabalhistas)
- **AFD Generator**: >90% (compliance legal)
- **Overall**: >85%

## Tipos de Teste

### 1. Testes Unitários

#### Signing Validation (`signing-validation.test.ts`)
- ✅ Validação de sequência de batidas (IN → BREAK → OUT)
- ✅ Prevenção de batidas duplicadas
- ✅ Validação de intervalo mínimo entre batidas
- ✅ Validação de schemas Zod
- ✅ Validação de coordenadas GPS
- ✅ Limites de caracteres em campos

**Coverage**: 100% - Lógica de validação crítica

#### Hours Calculation (`hours-calculation.test.ts`)
- ✅ Cálculo de horas trabalhadas (líquido vs bruto)
- ✅ Cálculo de horas extras (50% e 100%)
- ✅ Cálculo de adicional noturno (22h-5h)
- ✅ Aplicação da redução noturna (52.5min = 60min)
- ✅ Cálculo de banco de horas
- ✅ Validação de intervalo mínimo (60min para >6h)
- ✅ Aplicação de tolerância (10min)
- ✅ Cálculo DSR sobre horas extras
- ✅ Consolidação mensal

**Coverage**: >95% - Cálculos trabalhistas críticos

#### Compliance (`compliance.test.ts`)
- ✅ Validação de PIS (algoritmo dígito verificador)
- ✅ Geração AFD válida (Portaria 671)
- ✅ Estrutura de 99 posições fixas
- ✅ Tipos de registro (1, 2, 3, 4, 5, 9)
- ✅ NSR sequencial
- ✅ Formatação de datas (DDMMAAAA)
- ✅ Formatação de horas (HHMM)
- ✅ Normalização de caracteres especiais
- ✅ Ordenação de registros por data

**Coverage**: >90% - Compliance legal com MTE

### 2. Fixtures Disponíveis

#### Users (`fixtures/users.ts`)
```typescript
import { testEmployee, testManager, testHR, testCompany } from '../fixtures/users'
```

Usuários pré-configurados com IDs, roles e departamentos.

#### Signings (`fixtures/signings.ts`)
```typescript
import {
  validSigningSequence,           // Sequência válida completa
  invalidSequence_DoubleClockIn,   // Erro: duplo clock_in
  normalWorkday,                   // Dia normal 8h
  overtimeWorkday,                 // Dia com HE
  nightShiftWorkday,               // Turno noturno
  sundayWorkday,                   // Domingo (HE 100%)
  absence,                         // Falta
} from '../fixtures/signings'
```

## Padrões de Teste

### Arrange-Act-Assert
```typescript
it('should calculate overtime correctly', () => {
  // Arrange
  const record = overtimeWorkday

  // Act
  const result = calculateDailyJourney(record)

  // Assert
  expect(result.overtime50Minutes).toBeGreaterThan(0)
})
```

### Testes de Edge Cases
```typescript
it('should handle missing clock-out', () => {
  const record = missingClockOut
  const result = calculateDailyJourney(record)

  expect(result.warnings).toContain('Sem registro de ponto')
})
```

### Testes de Validação
```typescript
it('should reject invalid sequence', () => {
  const result = validateActionSequence('working', 'clock_in')

  expect(result.valid).toBe(false)
  expect(result.message).toContain('nao permitida')
})
```

## Mocking

### Supabase Client
```typescript
// Mock automático via setup.ts
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
```

### Datas
```typescript
// Use datas fixas nos fixtures
const fixedDate = new Date('2024-01-15T08:00:00Z')
```

## Debugging

### Visualizar Falhas
```bash
npm run test:ui
```

### Watch Mode com Filtro
```bash
npm run test:watch -- signing-validation
```

### Coverage Específico
```bash
npm run test:coverage -- src/lib/compliance
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: npm test

- name: Coverage check
  run: npm run test:coverage
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Próximos Passos

### Testes de Integração (Planejados)
- [ ] API Routes (`/api/signings`)
- [ ] Database operations
- [ ] Authentication flow

### Testes E2E (Planejados)
- [ ] Fluxo completo de bater ponto
- [ ] Visualizar histórico
- [ ] Solicitar ajuste

## Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
npm install
```

### Erro: "Test timeout"
```typescript
// Aumentar timeout
it('slow test', async () => {
  // ...
}, 10000) // 10 segundos
```

### Erro: "Environment not loaded"
```bash
# Verificar vitest.config.ts
# Verificar src/__tests__/setup.ts
```

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Portaria MTE 671](http://www.mte.gov.br/)
- [CLT - Consolidação das Leis do Trabalho](http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
