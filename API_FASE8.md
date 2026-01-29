# API Documentation - Fase 8

Documentação completa das APIs REST criadas na Fase 8.

## Índice

- [Autenticação](#autenticação)
- [Rate Limits](#rate-limits)
- [Error Codes](#error-codes)
- [Analytics APIs](#analytics-apis)
- [Chatbot APIs](#chatbot-apis)
- [Organogram APIs](#organogram-apis)
- [PWA APIs](#pwa-apis)

---

## Autenticação

Todas as APIs requerem autenticação via Supabase Auth.

### Headers Obrigatórios

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Obter Access Token

```javascript
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token
```

### Exemplo de Request

```http
GET /api/analytics/dashboard?period=30d HTTP/1.1
Host: seu-dominio.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Rate Limits

Para evitar abuso, as APIs têm limites:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Analytics | 60 requests | 1 minuto |
| Chatbot | 10 requests | 1 minuto |
| Organogram | 30 requests | 1 minuto |
| PWA Sync | 120 requests | 1 minuto |

### Headers de Rate Limit

Resposta inclui headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1643723400
```

### Response quando exceder

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "retryAfter": 30,
  "message": "Please wait 30 seconds before trying again"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - No permission |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Period must be one of: 7d, 30d, 90d, 1y",
    "details": {
      "parameter": "period",
      "provided": "invalid",
      "expected": ["7d", "30d", "90d", "1y"]
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_PARAMETER` | Invalid query parameter |
| `MISSING_PARAMETER` | Required parameter missing |
| `UNAUTHORIZED` | Invalid or expired token |
| `FORBIDDEN` | No permission for resource |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `AI_SERVICE_ERROR` | OpenAI API error |
| `DATABASE_ERROR` | Database query failed |

---

## Analytics APIs

### GET /api/analytics/dashboard

Retorna dados completos do dashboard de analytics.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | No | Período: `7d`, `30d`, `90d`, `1y`. Default: `30d` |
| companyId | string | No | UUID da empresa. Default: empresa do usuário |

#### Request Example

```http
GET /api/analytics/dashboard?period=30d HTTP/1.1
```

#### Response 200 OK

```json
{
  "period": {
    "startDate": "2025-12-30T00:00:00Z",
    "endDate": "2026-01-29T00:00:00Z",
    "label": "Últimos 30 dias"
  },
  "kpis": [
    {
      "label": "Headcount",
      "value": 150,
      "change": 5.2,
      "trend": "up",
      "status": "good",
      "sparkline": [145, 147, 148, 150],
      "format": "number"
    },
    {
      "label": "Turnover",
      "value": "8.5%",
      "change": -2.3,
      "trend": "down",
      "status": "good",
      "format": "percentage"
    }
  ],
  "headcount": {
    "total": 150,
    "active": 145,
    "onLeave": 5,
    "byDepartment": [
      {
        "department": "Tecnologia",
        "value": 45,
        "percentage": 30,
        "change": 3
      }
    ],
    "trend": [
      { "date": "2026-01", "value": 150 }
    ]
  },
  "turnover": {
    "rate": 8.5,
    "voluntary": 6.0,
    "involuntary": 2.5,
    "hires": 8,
    "terminations": 12,
    "avgHeadcount": 148,
    "cost": 480000,
    "byDepartment": [...],
    "trend": [...]
  },
  "insights": [
    {
      "id": "uuid",
      "type": "warning",
      "category": "turnover",
      "title": "Turnover elevado em TI",
      "description": "...",
      "impact": "high",
      "recommendation": "...",
      "createdAt": "2026-01-29T10:00:00Z"
    }
  ]
}
```

---

### GET /api/analytics/turnover

Análise detalhada de turnover.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | No | Período |
| department | string | No | Filtrar por departamento |

#### Response 200 OK

```json
{
  "rate": 8.5,
  "voluntary": 6.0,
  "involuntary": 2.5,
  "hires": 8,
  "terminations": 12,
  "avgHeadcount": 148,
  "cost": 480000,
  "byDepartment": [
    {
      "department": "Tecnologia",
      "value": 12.5,
      "percentage": 0.125,
      "count": 5,
      "change": 2.0
    }
  ],
  "byTenure": [
    {
      "range": "0-90 dias",
      "count": 3,
      "percentage": 25
    },
    {
      "range": "90-365 dias",
      "count": 4,
      "percentage": 33.3
    }
  ],
  "trend": [
    {
      "date": "2025-12",
      "value": 10.5
    },
    {
      "date": "2026-01",
      "value": 8.5
    }
  ]
}
```

---

### GET /api/analytics/absenteeism

Análise de absenteísmo.

#### Response 200 OK

```json
{
  "rate": 3.2,
  "totalAbsences": 145,
  "avgDuration": 2.5,
  "cost": 125000,
  "byType": [
    {
      "type": "Médico",
      "value": 60,
      "percentage": 41.4,
      "count": 60
    },
    {
      "type": "Férias",
      "value": 55,
      "percentage": 37.9,
      "count": 55
    }
  ],
  "byDepartment": [...],
  "heatmap": [
    {
      "day": "Segunda",
      "hour": 9,
      "value": 12
    }
  ],
  "trend": [...]
}
```

---

### GET /api/analytics/predictions/turnover

Predição de risco de turnover por funcionário.

#### Response 200 OK

```json
{
  "predictions": [
    {
      "employeeId": "uuid",
      "employeeName": "João Silva",
      "riskScore": 75,
      "factors": [
        {
          "factor": "Tempo de casa",
          "impact": 60,
          "description": "Funcionário há 18 meses, período crítico"
        },
        {
          "factor": "Absenteísmo",
          "impact": 45,
          "description": "Taxa 20% acima da média"
        }
      ],
      "recommendation": "Conversa com gestor recomendada. Avaliar plano de carreira e ajuste salarial."
    }
  ],
  "summary": {
    "highRisk": 5,
    "mediumRisk": 12,
    "lowRisk": 133
  }
}
```

---

### GET /api/analytics/insights/daily

Insights gerados diariamente por IA.

#### Response 200 OK

```json
{
  "date": "2026-01-29",
  "insights": [
    {
      "id": "uuid",
      "type": "warning",
      "category": "turnover",
      "title": "Turnover elevado em TI",
      "description": "O departamento de TI apresentou turnover de 18% no último trimestre, 6% acima da média da empresa.",
      "impact": "high",
      "recommendation": "Realizar pesquisa de clima com o time de TI. Revisar salários vs mercado. Verificar carga de trabalho.",
      "metric": {
        "value": 18.0,
        "benchmark": 12.0,
        "difference": 6.0
      },
      "createdAt": "2026-01-29T02:00:00Z"
    }
  ],
  "count": 3
}
```

---

### GET /api/analytics/headcount/projection

Projeção de headcount futuro.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| months | number | No | Meses para projetar. Default: 6 |

#### Response 200 OK

```json
{
  "current": 150,
  "projections": [
    {
      "month": "2026-02",
      "projected": 155,
      "confidence": 85,
      "lower": 152,
      "upper": 158
    },
    {
      "month": "2026-03",
      "projected": 158,
      "confidence": 80,
      "lower": 154,
      "upper": 162
    }
  ],
  "hiringNeeds": [
    {
      "department": "Tecnologia",
      "position": "Desenvolvedor",
      "currentCount": 20,
      "projectedNeed": 25,
      "gap": 5,
      "priority": "high",
      "timeframe": "Q1 2026"
    }
  ]
}
```

---

### POST /api/analytics/export

Exportar relatório de analytics.

#### Request Body

```json
{
  "format": "pdf",
  "period": "30d",
  "includeCharts": true,
  "includeTrends": true,
  "includeInsights": true,
  "sections": ["kpis", "turnover", "absenteeism"]
}
```

#### Response 200 OK

```json
{
  "fileUrl": "https://storage.supabase.co/.../analytics-report.pdf",
  "fileName": "analytics-report-2026-01-29.pdf",
  "expiresAt": "2026-01-30T10:00:00Z",
  "fileSize": 2458624
}
```

---

## Chatbot APIs

### POST /api/chatbot/chat

Enviar mensagem ao chatbot.

#### Request Body

```json
{
  "message": "Qual meu saldo de férias?",
  "conversationId": "uuid",
  "userId": "uuid"
}
```

#### Response 200 OK

```json
{
  "message": "Você tem 25 dias de férias disponíveis para uso. Seu período aquisitivo atual vence em 15/03/2026.",
  "conversationId": "uuid",
  "messageId": "uuid",
  "timestamp": "2026-01-29T10:30:00Z",
  "suggestedActions": [
    {
      "label": "Solicitar Férias",
      "action": "navigate",
      "url": "/ausencias?type=vacation"
    }
  ],
  "relatedQuestions": [
    "Como solicitar férias?",
    "Posso vender férias?",
    "Como funciona o abono de férias?"
  ],
  "sources": [
    {
      "title": "Política de Férias",
      "url": "/docs/policies/vacation"
    }
  ]
}
```

---

### GET /api/chatbot/knowledge

Buscar na base de conhecimento.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | Termo de busca |
| category | string | No | Filtrar por categoria |
| limit | number | No | Máximo de resultados. Default: 10 |

#### Response 200 OK

```json
{
  "results": [
    {
      "id": "uuid",
      "category": "Férias",
      "question": "Como solicitar férias?",
      "answer": "Para solicitar férias: 1. Acesse o menu Ausências...",
      "relevance": 0.95,
      "keywords": ["férias", "solicitar", "ausência"]
    }
  ],
  "count": 1
}
```

---

### POST /api/chatbot/feedback

Enviar feedback sobre resposta do chatbot.

#### Request Body

```json
{
  "messageId": "uuid",
  "rating": 5,
  "helpful": true,
  "comment": "Resposta clara e completa"
}
```

#### Response 200 OK

```json
{
  "success": true,
  "message": "Feedback registrado com sucesso"
}
```

---

## Organogram APIs

### GET /api/organogram/tree

Retorna estrutura hierárquica completa.

#### Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| companyId | string | No | UUID da empresa |
| rootId | string | No | ID do nó raiz (CEO) |
| depth | number | No | Profundidade máxima. Default: infinito |

#### Response 200 OK

```json
{
  "root": {
    "id": "uuid",
    "name": "Ana Silva",
    "position": "CEO",
    "department": "Diretoria",
    "email": "ana.silva@empresa.com",
    "avatar": "https://...",
    "status": "active",
    "hireDate": "2020-01-01",
    "subordinates": [
      {
        "id": "uuid",
        "name": "Carlos Santos",
        "position": "CTO",
        "department": "Tecnologia",
        "subordinates": [...]
      }
    ]
  },
  "stats": {
    "totalNodes": 150,
    "maxDepth": 5,
    "avgSubordinates": 6
  }
}
```

---

### PUT /api/organogram/update

Atualizar hierarquia (mover funcionário).

#### Request Body

```json
{
  "employeeId": "uuid",
  "newManagerId": "uuid"
}
```

#### Response 200 OK

```json
{
  "success": true,
  "message": "Funcionário movido com sucesso",
  "employee": {
    "id": "uuid",
    "name": "João Silva",
    "oldManager": "Carlos Santos",
    "newManager": "Maria Costa"
  }
}
```

---

### POST /api/organogram/export

Exportar organograma.

#### Request Body

```json
{
  "format": "png",
  "rootId": "uuid",
  "includeInactive": false,
  "layout": "tree"
}
```

#### Response 200 OK

```json
{
  "fileUrl": "https://storage.supabase.co/.../organogram.png",
  "fileName": "organogram-2026-01-29.png",
  "expiresAt": "2026-01-30T10:00:00Z"
}
```

---

## PWA APIs

### POST /api/pwa/subscribe

Registrar subscription de push notifications.

#### Request Body

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "userId": "uuid"
}
```

#### Response 201 Created

```json
{
  "success": true,
  "subscriptionId": "uuid",
  "message": "Push notification subscription registered"
}
```

---

### DELETE /api/pwa/subscribe

Remover subscription.

#### Request Body

```json
{
  "subscriptionId": "uuid"
}
```

#### Response 200 OK

```json
{
  "success": true,
  "message": "Subscription removed"
}
```

---

### POST /api/pwa/sync

Sincronizar dados offline.

#### Request Body

```json
{
  "entries": [
    {
      "type": "clock_in",
      "data": {
        "employeeId": "uuid",
        "timestamp": "2026-01-29T09:00:00Z",
        "location": {
          "lat": -23.5505,
          "lng": -46.6333
        }
      },
      "clientTimestamp": "2026-01-29T09:00:05Z"
    }
  ]
}
```

#### Response 200 OK

```json
{
  "success": true,
  "synced": 1,
  "failed": 0,
  "results": [
    {
      "type": "clock_in",
      "status": "success",
      "id": "uuid",
      "message": "Clock in registered successfully"
    }
  ]
}
```

---

### POST /api/pwa/notification

Enviar push notification.

#### Request Body

```json
{
  "userId": "uuid",
  "title": "Aprovação Pendente",
  "body": "Você tem 3 solicitações de ausência para aprovar",
  "icon": "/icon-192.png",
  "badge": "/icon-192.png",
  "data": {
    "url": "/aprovacoes",
    "count": 3
  },
  "actions": [
    {
      "action": "view",
      "title": "Ver Solicitações"
    },
    {
      "action": "dismiss",
      "title": "Ignorar"
    }
  ]
}
```

#### Response 200 OK

```json
{
  "success": true,
  "sent": true,
  "message": "Notification sent successfully"
}
```

---

## Webhooks

### POST /api/webhooks/analytics

Receber eventos de analytics (para integrações).

#### Headers

```http
X-Webhook-Secret: your-webhook-secret
```

#### Payload

```json
{
  "event": "insight.created",
  "timestamp": "2026-01-29T10:00:00Z",
  "data": {
    "insightId": "uuid",
    "type": "warning",
    "category": "turnover",
    "title": "Turnover elevado em TI",
    "impact": "high"
  }
}
```

#### Response 200 OK

```json
{
  "received": true
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Analytics Client
class AnalyticsClient {
  constructor(private baseUrl: string, private token: string) {}

  async getDashboard(period: string = '30d') {
    const response = await fetch(
      `${this.baseUrl}/api/analytics/dashboard?period=${period}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    return response.json()
  }

  async getTurnover(department?: string) {
    const url = new URL(`${this.baseUrl}/api/analytics/turnover`)
    if (department) url.searchParams.set('department', department)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    return response.json()
  }
}

// Uso
const client = new AnalyticsClient('https://seu-dominio.com', token)
const dashboard = await client.getDashboard('30d')
```

### Python

```python
import requests

class AnalyticsClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_dashboard(self, period='30d'):
        response = requests.get(
            f'{self.base_url}/api/analytics/dashboard',
            params={'period': period},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Uso
client = AnalyticsClient('https://seu-dominio.com', token)
dashboard = client.get_dashboard('30d')
```

---

## Changelog

### v2.0.0 - 2026-01-29

- Lançamento inicial das APIs da Fase 8
- Analytics APIs completas
- Chatbot APIs
- Organogram APIs
- PWA APIs

---

## Support

Para suporte com as APIs:

- Email: api-support@seu-dominio.com
- Docs: https://seu-dominio.com/docs
- Status: https://status.seu-dominio.com
