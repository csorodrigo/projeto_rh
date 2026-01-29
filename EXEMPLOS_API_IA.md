# Exemplos de Uso - API de IA

## Chat API

### Enviar Mensagem

```typescript
// POST /api/ai/chat
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Como solicitar férias?',
    sessionId: 'session_123', // opcional
    context: {
      currentPage: '/ponto',
      userProfile: {
        name: 'João Silva',
        department: 'TI',
        role: 'Desenvolvedor'
      }
    }
  })
})

const data = await response.json()
console.log(data)
// {
//   message: "Para solicitar férias...",
//   sessionId: "session_123",
//   intent: {
//     type: "request_vacation",
//     confidence: 95,
//     suggestedAction: {
//       type: "navigate",
//       route: "/ausencias/nova?type=vacation"
//     }
//   },
//   suggestions: [
//     { id: "1", text: "Ver meu saldo", category: "action" },
//     { id: "2", text: "Política de férias", category: "faq" }
//   ]
// }
```

### Health Check

```typescript
// GET /api/ai/chat
const response = await fetch('/api/ai/chat')
const data = await response.json()
console.log(data)
// {
//   status: "ok",
//   service: "AI Chat API",
//   timestamp: "2024-01-29T..."
// }
```

## Suggestions API

### Obter Sugestões (GET)

```typescript
// GET /api/ai/suggestions?context=dashboard&limit=5
const response = await fetch('/api/ai/suggestions?context=dashboard&limit=5')
const data = await response.json()
console.log(data)
// {
//   suggestions: [...],
//   insights: [...]
// }
```

### Obter Sugestões (POST)

```typescript
// POST /api/ai/suggestions
const response = await fetch('/api/ai/suggestions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    context: 'employee',
    entityId: 'emp_123',
    limit: 10
  })
})

const data = await response.json()
console.log(data)
// {
//   suggestions: [
//     {
//       id: "sug_001",
//       category: "employee_management",
//       title: "Padrão de atrasos detectado",
//       description: "João Silva apresenta atrasos recorrentes...",
//       priority: "medium",
//       impact: { type: "quality", value: 15, unit: "% melhoria" },
//       actions: [...]
//     }
//   ],
//   insights: [...]
// }
```

## Usar no React (Client Component)

### Hook Customizado

```typescript
// hooks/useChat.ts
import { useState } from 'react'
import type { ChatMessage } from '@/types/ai'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (text: string) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })

      const data = await response.json()

      setMessages(prev => [
        ...prev,
        { role: 'user', content: text, timestamp: new Date() },
        { role: 'assistant', content: data.message, timestamp: new Date() }
      ])

      return data
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, sendMessage, isLoading }
}
```

### Usar no Componente

```typescript
'use client'

import { useChat } from '@/hooks/useChat'

export function MyChatComponent() {
  const { messages, sendMessage, isLoading } = useChat()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = e.currentTarget.querySelector('input')
    if (input?.value) {
      await sendMessage(input.value)
      input.value = ''
    }
  }

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}

      <form onSubmit={handleSubmit}>
        <input type="text" disabled={isLoading} />
        <button disabled={isLoading}>Enviar</button>
      </form>
    </div>
  )
}
```

## Usar Serviços de IA Diretamente

### Chatbot Service

```typescript
import { sendMessage } from '@/lib/ai/chatbot-service'

const response = await sendMessage({
  message: 'Como funciona o banco de horas?',
  context: {
    userProfile: {
      userId: 'user_123',
      name: 'João',
      department: 'TI'
    }
  }
})

console.log(response.message)
console.log(response.intent)
console.log(response.suggestions)
```

### Intent Detector

```typescript
import { detectIntent } from '@/lib/ai/intent-detector'

const intent = await detectIntent('Quero solicitar férias')

console.log(intent)
// {
//   type: 'request_vacation',
//   confidence: 95,
//   entities: { dates: ['15/02/2024'] },
//   suggestedAction: {
//     type: 'navigate',
//     route: '/ausencias/nova?type=vacation'
//   }
// }
```

### Knowledge Base

```typescript
import { searchKnowledgeBase } from '@/lib/ai/knowledge-base'

const results = await searchKnowledgeBase('férias', {
  limit: 5,
  minScore: 10,
  category: 'Férias'
})

results.forEach(entry => {
  console.log(entry.question)
  console.log(entry.answer)
})
```

### Pattern Detector

```typescript
import { detectAllPatterns } from '@/lib/ai/pattern-detector'

const employeeData = {
  id: 'emp_123',
  name: 'João Silva',
  department: 'TI',
  hireDate: new Date('2020-01-01'),
  absences: [...],
  timeEntries: [...],
  performance: { score: 85, trend: 'stable' }
}

const result = await detectAllPatterns(employeeData)

console.log(result.overallRisk) // 'low' | 'medium' | 'high' | 'critical'
console.log(result.patterns)
// [
//   {
//     type: 'overtime',
//     confidence: 75,
//     evidence: [...],
//     impact: '...',
//     recommendation: '...'
//   }
// ]
```

### Turnover Prediction

```typescript
import { predictTurnover } from '@/lib/ai/turnover-prediction'

const prediction = await predictTurnover(
  {
    id: 'emp_123',
    name: 'João Silva',
    department: 'TI',
    position: 'Desenvolvedor',
    hireDate: new Date('2020-01-01'),
    salary: 8000,
    lastPromotion: new Date('2022-06-01'),
    absenceDays: 5,
    overtimeHours: 25,
    performanceScore: 85,
    engagementScore: 70,
    benefitsValue: 1500
  },
  {
    averageSalaryForPosition: 10000,
    industryTurnoverRate: 15
  }
)

console.log(prediction.risk) // 0-100
console.log(prediction.riskLevel) // 'low' | 'medium' | 'high' | 'critical'
console.log(prediction.factors)
console.log(prediction.suggestions)
```

### Automation Engine

```typescript
import { createAutomationEngine, createDefaultRules } from '@/lib/ai/automation-rules'

const engine = createAutomationEngine(createDefaultRules())

// Executar uma regra
const execution = await engine.executeRule('rule_1', {
  employee: {
    id: 'emp_123',
    name: 'João Silva',
    days_since_hire: 90,
    email: 'joao@empresa.com'
  }
})

console.log(execution.status) // 'success' | 'failed'
console.log(execution.actionsExecuted)
console.log(execution.logs)
```

## Server Actions (Next.js)

```typescript
// app/actions/ai.ts
'use server'

import { sendMessage } from '@/lib/ai/chatbot-service'

export async function chatAction(message: string) {
  const response = await sendMessage({
    message,
    context: {
      // Get from session/auth
    }
  })

  return response
}
```

```typescript
// Usar no componente
'use client'

import { chatAction } from '@/app/actions/ai'

export function MyComponent() {
  const handleChat = async (message: string) => {
    const response = await chatAction(message)
    console.log(response)
  }

  return <button onClick={() => handleChat('Oi')}>Chat</button>
}
```

## Streaming (Futuro)

```typescript
// Exemplo de implementação futura com streaming
async function streamChat(message: string) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stream: true })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader!.read()
    if (done) break

    const chunk = decoder.decode(value)
    console.log('Chunk:', chunk)
    // Atualizar UI com chunk
  }
}
```

## Exemplos de Testes

```typescript
// __tests__/ai/chatbot.test.ts
import { sendMessage } from '@/lib/ai/chatbot-service'

describe('Chatbot Service', () => {
  it('deve responder perguntas sobre férias', async () => {
    const response = await sendMessage({
      message: 'Como solicitar férias?'
    })

    expect(response.message).toBeDefined()
    expect(response.intent?.type).toBe('request_vacation')
    expect(response.intent?.confidence).toBeGreaterThan(50)
  })

  it('deve detectar intenção de check balance', async () => {
    const response = await sendMessage({
      message: 'Qual meu saldo de horas?'
    })

    expect(response.intent?.type).toBe('check_balance')
  })
})
```

## Dicas de Uso

### Rate Limiting
```typescript
// O sistema tem rate limiting de 20 mensagens/minuto por padrão
// Para uso intensivo, implemente debouncing:

import { debounce } from 'lodash'

const debouncedSend = debounce(async (message: string) => {
  await sendMessage({ message })
}, 300)
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit excedido
      console.log('Aguarde 1 minuto')
    } else if (response.status === 400) {
      // Erro de validação
      const error = await response.json()
      console.log(error.error)
    }
  }

  const data = await response.json()
  return data
} catch (error) {
  console.error('Network error:', error)
}
```

### Caching
```typescript
// Use React Query para cache automático
import { useQuery } from '@tanstack/react-query'

export function useSuggestions(context: string) {
  return useQuery({
    queryKey: ['suggestions', context],
    queryFn: async () => {
      const res = await fetch(`/api/ai/suggestions?context=${context}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
```

## Recursos Adicionais

- [Documentação Completa](./IMPLEMENTACAO_IA_CHATBOT.md)
- [Guia Rápido](./GUIA_RAPIDO_IA.md)
- [Configuração de Ambiente](./.env.ai.example)
