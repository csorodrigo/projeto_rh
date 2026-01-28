# Exemplos de Uso - Testes

## Como Escrever Novos Testes

### Template Básico
```typescript
import { describe, it, expect } from 'vitest'

describe('Nome da Feature', () => {
  describe('Cenário Específico', () => {
    it('should comportamento esperado', () => {
      // Arrange - Preparar dados
      const input = setupTestData()

      // Act - Executar ação
      const result = functionUnderTest(input)

      // Assert - Verificar resultado
      expect(result).toBe(expected)
    })
  })
})
```

### Teste com Fixtures
```typescript
import { describe, it, expect } from 'vitest'
import { testEmployee } from '../fixtures/users'
import { normalWorkday } from '../fixtures/signings'

describe('Daily Journey', () => {
  it('should calculate normal workday', () => {
    const result = calculateDailyJourney(normalWorkday)

    expect(result.netWorkedMinutes).toBe(480)
    expect(result.overtime50Minutes).toBe(0)
  })
})
```

### Teste com Múltiplos Casos
```typescript
describe('PIS Validation', () => {
  it.each([
    ['120.45678.90-1', true],
    ['123.45678.90-0', false],
    ['00000000000', false],
  ])('should validate PIS %s as %s', (pis, expected) => {
    expect(validatePIS(pis)).toBe(expected)
  })
})
```

### Teste de Erro
```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    validateActionSequence('invalid_state', 'clock_in')
  }).toThrow('Invalid state')
})
```

### Teste Assíncrono
```typescript
it('should fetch signing data', async () => {
  const data = await fetchSignings(testEmployee.id)

  expect(data).toBeDefined()
  expect(data.length).toBeGreaterThan(0)
})
```

## Matchers Comuns

### Igualdade
```typescript
expect(value).toBe(10)                    // Igualdade estrita
expect(object).toEqual({ a: 1 })          // Deep equality
expect(value).not.toBe(5)                 // Negação
```

### Números
```typescript
expect(value).toBeGreaterThan(5)
expect(value).toBeGreaterThanOrEqual(5)
expect(value).toBeLessThan(10)
expect(value).toBeCloseTo(5.5, 1)         // Aproximado (decimais)
```

### Strings
```typescript
expect(text).toContain('substring')
expect(text).toMatch(/regex/)
expect(text).toHaveLength(10)
```

### Arrays
```typescript
expect(array).toContain(item)
expect(array).toHaveLength(5)
expect(array).toEqual(expect.arrayContaining([1, 2]))
```

### Objects
```typescript
expect(obj).toHaveProperty('key')
expect(obj).toMatchObject({ a: 1 })
expect(obj).toEqual(expect.objectContaining({ a: 1 }))
```

### Booleans
```typescript
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeDefined()
expect(value).toBeUndefined()
expect(value).toBeNull()
```

## Hooks de Setup

### beforeEach
```typescript
describe('With Setup', () => {
  let testData

  beforeEach(() => {
    testData = createTestData()
  })

  it('test 1', () => {
    expect(testData).toBeDefined()
  })

  it('test 2', () => {
    expect(testData).toBeDefined()
  })
})
```

### afterEach
```typescript
describe('With Cleanup', () => {
  afterEach(() => {
    cleanupDatabase()
    resetMocks()
  })

  it('test that needs cleanup', () => {
    // test code
  })
})
```

### beforeAll / afterAll
```typescript
describe('Suite with Global Setup', () => {
  beforeAll(() => {
    // Executado UMA vez antes de todos os testes
    setupDatabase()
  })

  afterAll(() => {
    // Executado UMA vez depois de todos os testes
    teardownDatabase()
  })

  it('test 1', () => {})
  it('test 2', () => {})
})
```

## Mocking

### Mock de Função
```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()
mockFn.mockReturnValue(42)

expect(mockFn()).toBe(42)
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(arg)
```

### Mock de Módulo
```typescript
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: mockData,
        error: null,
      })),
    })),
  })),
}))
```

### Spy
```typescript
const spy = vi.spyOn(object, 'method')

spy.mockImplementation(() => 'mocked')

expect(spy).toHaveBeenCalled()

spy.mockRestore() // Restaurar implementação original
```

## Testes Parametrizados

### it.each com Array
```typescript
it.each([
  [1, 2, 3],
  [2, 3, 5],
  [5, 5, 10],
])('should add %i + %i = %i', (a, b, expected) => {
  expect(add(a, b)).toBe(expected)
})
```

### it.each com Object
```typescript
it.each([
  { clockIn: '08:00', clockOut: '17:00', expected: 480 },
  { clockIn: '08:00', clockOut: '19:00', expected: 600 },
])('should calculate minutes for $clockIn to $clockOut', ({ clockIn, clockOut, expected }) => {
  const result = calculateMinutes(clockIn, clockOut)
  expect(result).toBe(expected)
})
```

## Organização de Testes

### Por Feature
```typescript
// signing-validation.test.ts
describe('Signing Validation', () => {
  describe('Action Sequence', () => {
    it('should allow valid transitions', () => {})
    it('should reject invalid transitions', () => {})
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicates', () => {})
    it('should allow after window', () => {})
  })
})
```

### Por Cenário
```typescript
// hours-calculation.test.ts
describe('Hours Calculation', () => {
  describe('Normal Workday', () => {
    it('should calculate 8h', () => {})
  })

  describe('Overtime', () => {
    it('should calculate 50% overtime', () => {})
    it('should calculate 100% overtime', () => {})
  })

  describe('Night Shift', () => {
    it('should apply night reduction', () => {})
  })
})
```

## Debugging

### console.log
```typescript
it('debug test', () => {
  const result = calculateSomething(input)
  console.log('Result:', result) // Aparece no terminal
  expect(result).toBeDefined()
})
```

### expect com snapshot
```typescript
it('should match snapshot', () => {
  const result = generateAFD(data)
  expect(result).toMatchSnapshot()
})
```

### test.only para isolar
```typescript
describe('Suite', () => {
  it('test 1', () => {}) // Não roda
  it.only('test 2', () => {}) // Roda apenas este
  it('test 3', () => {}) // Não roda
})
```

### test.skip para pular
```typescript
it.skip('work in progress', () => {
  // Não executado
})
```

## Padrões Recomendados

### DRY com Helper Functions
```typescript
function createNormalWorkday(overrides = {}) {
  return {
    clockIn: new Date('2024-01-15T08:00:00Z'),
    clockOut: new Date('2024-01-15T17:00:00Z'),
    ...overrides,
  }
}

it('test 1', () => {
  const workday = createNormalWorkday()
})

it('test 2', () => {
  const workday = createNormalWorkday({ clockOut: new Date('...') })
})
```

### Expect Helper
```typescript
function expectValidJourney(result) {
  expect(result).toBeDefined()
  expect(result.netWorkedMinutes).toBeGreaterThan(0)
  expect(result.warnings).toBeInstanceOf(Array)
}

it('test', () => {
  const result = calculateDailyJourney(workday)
  expectValidJourney(result)
})
```

### Custom Matchers
```typescript
expect.extend({
  toBeValidPIS(received) {
    const pass = validatePIS(received)
    return {
      pass,
      message: () => `Expected ${received} to be valid PIS`,
    }
  },
})

// Uso
expect('120.45678.90-1').toBeValidPIS()
```

## Boas Práticas

### ✅ DO
```typescript
// Nomes descritivos
it('should calculate overtime when working more than 8 hours', () => {})

// Arrange-Act-Assert
it('test', () => {
  const input = createInput()      // Arrange
  const result = doSomething(input) // Act
  expect(result).toBe(expected)     // Assert
})

// Um conceito por teste
it('should validate PIS', () => {
  // Testa APENAS validação de PIS
})

// Usar fixtures
import { normalWorkday } from '../fixtures/signings'
```

### ❌ DON'T
```typescript
// Nome vago
it('works', () => {})

// Muitos conceitos
it('should validate and format and save PIS', () => {
  // Fazer 3 testes separados
})

// Hardcoded values
const employee = {
  id: '123',
  name: 'John',
  // Usar fixtures
}

// Lógica complexa em teste
it('complex test', () => {
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
      // Usar it.each
    }
  }
})
```

## Performance

### Paralelização
```typescript
// Por padrão, Vitest roda testes em paralelo
// Para forçar sequencial:
describe.sequential('Must Run in Order', () => {
  it('test 1', () => {})
  it('test 2', () => {})
})
```

### Timeout Customizado
```typescript
it('slow test', async () => {
  await slowOperation()
}, 10000) // 10 segundos
```

### Otimizar Setup
```typescript
// Ruim: Setup em cada teste
it('test 1', () => {
  const data = expensiveSetup()
})
it('test 2', () => {
  const data = expensiveSetup()
})

// Bom: Setup compartilhado
beforeAll(() => {
  data = expensiveSetup()
})
```
