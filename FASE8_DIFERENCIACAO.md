# Fase 8 - Diferenciação: Documentação Técnica Completa

## Visão Geral

A Fase 8 - Diferenciação adiciona capacidades avançadas ao Sistema RH, transformando-o em uma plataforma moderna e competitiva através de 4 módulos principais:

1. **PWA Mobile App** - Aplicativo Progressive Web App instalável
2. **Organograma Visual** - Visualização interativa da hierarquia organizacional
3. **People Analytics** - Dashboard avançado de análise de dados de RH
4. **AI Chatbot e Automações** - Assistente inteligente e automações baseadas em IA

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PWA Module  │  │  Organogram  │  │  Analytics   │      │
│  │              │  │   Module     │  │   Module     │      │
│  │ - Service    │  │ - React Flow │  │ - Metrics    │      │
│  │   Worker     │  │ - Drag&Drop  │  │ - Insights   │      │
│  │ - Offline    │  │ - Export     │  │ - Predictions│      │
│  │ - Push       │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │          AI Chatbot Module                       │      │
│  │  - Natural Language Processing                   │      │
│  │  - Knowledge Base                                │      │
│  │  - Automated Insights                            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   Integration Layer                         │
│  - Feature Flags                                            │
│  - Performance Monitoring                                   │
│  - Error Tracking                                           │
├─────────────────────────────────────────────────────────────┤
│                      Backend (API Routes)                   │
│  - Analytics Calculations                                   │
│  - AI Processing                                            │
│  - Push Notifications                                       │
│  - Data Aggregation                                         │
├─────────────────────────────────────────────────────────────┤
│               Database (Supabase PostgreSQL)                │
│  - Employee Data                                            │
│  - Time Tracking                                            │
│  - Absences                                                 │
│  - Organizational Structure                                 │
└─────────────────────────────────────────────────────────────┘
```

## Módulo 1: PWA Mobile App

### Funcionalidades

- **Instalável**: App pode ser instalado em dispositivos móveis e desktop
- **Offline-First**: Funciona sem conexão, sincroniza quando online
- **Push Notifications**: Notificações nativas do sistema operacional
- **App Shortcuts**: Atalhos rápidos para funcionalidades principais
- **Background Sync**: Sincronização automática de dados pendentes

### Arquivos Principais

```
public/
├── manifest.json          # Configuração do PWA
├── sw.js                  # Service Worker
├── icon-192.png          # Ícone do app (192x192)
├── icon-512.png          # Ícone do app (512x512)
└── favicon.ico           # Favicon
```

### Tecnologias

- **Service Worker**: Cache offline, sincronização em background
- **IndexedDB**: Armazenamento local de dados
- **Web Push API**: Notificações push
- **Cache API**: Cache de recursos estáticos
- **Background Sync API**: Sincronização automática

### Estratégias de Cache

1. **Precache**: Assets críticos cacheados na instalação
2. **Cache First**: Assets estáticos (imagens, fonts, CSS)
3. **Network First**: Dados dinâmicos (API calls)
4. **Stale-While-Revalidate**: Páginas de navegação

### Offline Features

- Visualização de dados previamente carregados
- Registro de ponto offline (sincroniza quando online)
- Visualização de holerites em cache
- Navegação básica entre páginas

## Módulo 2: Organograma Visual

### Funcionalidades

- **Visualização Interativa**: Drag & drop, zoom, pan
- **Hierarquia Completa**: Estrutura organizacional completa
- **Edição em Tempo Real**: Arrastar funcionários para reorganizar
- **Export**: PNG, PDF, SVG
- **Filtros**: Por departamento, cargo, status
- **Busca**: Localizar funcionários rapidamente

### Arquivos Principais

```
src/
├── app/(dashboard)/funcionarios/organograma/
│   └── page.tsx                    # Página principal
├── components/organogram/
│   ├── organogram-view.tsx         # Componente de visualização
│   ├── employee-node.tsx           # Nó do funcionário
│   ├── connection-line.tsx         # Linha de conexão
│   └── organogram-controls.tsx     # Controles (zoom, export)
└── lib/organogram/
    ├── layout-engine.ts            # Cálculo de layout
    ├── export-handlers.ts          # Exportação
    └── hierarchy-utils.ts          # Utilitários de hierarquia
```

### Tecnologias

- **@xyflow/react**: Biblioteca para grafos e diagramas
- **react-flow-renderer**: Renderização de nós e conexões
- **html2canvas**: Export para PNG
- **jsPDF**: Export para PDF

### Estrutura de Dados

```typescript
interface OrgNode {
  id: string
  name: string
  position: string
  department: string
  managerId: string | null
  avatar?: string
  status: 'active' | 'onLeave' | 'inactive'
  subordinates?: OrgNode[]
}
```

## Módulo 3: People Analytics

### Funcionalidades

- **Dashboard de KPIs**: Métricas principais em cards
- **Análise de Turnover**: Taxa, custos, tendências
- **Análise de Absenteísmo**: Padrões, custos, heatmaps
- **Métricas de Produtividade**: Horas, overtime, utilização
- **Análise de Recrutamento**: Time to hire, custo, efetividade
- **Diversidade**: Distribuição por gênero, idade, tenure
- **Predições**: Turnover prediction, headcount projection
- **Benchmarking**: Comparação com indústria
- **Insights Automáticos**: IA detecta padrões e anomalias

### Arquivos Principais

```
src/
├── app/(dashboard)/analytics/
│   ├── page.tsx                    # Dashboard principal
│   ├── turnover/page.tsx           # Análise de turnover
│   ├── absenteeism/page.tsx        # Análise de absenteísmo
│   ├── recruitment/page.tsx        # Métricas de recrutamento
│   ├── productivity/page.tsx       # Produtividade
│   └── predictions/page.tsx        # Predições e projeções
├── components/analytics/
│   ├── kpi-card.tsx                # Card de KPI
│   ├── trend-chart.tsx             # Gráfico de tendência
│   ├── heatmap.tsx                 # Mapa de calor
│   ├── prediction-widget.tsx       # Widget de predição
│   └── insight-card.tsx            # Card de insight
├── lib/analytics/
│   ├── calculations.ts             # Cálculos de métricas
│   ├── predictions.ts              # Algoritmos de predição
│   ├── insights-generator.ts       # Geração de insights
│   └── benchmark-data.ts           # Dados de benchmark
└── types/analytics.ts              # Tipos TypeScript
```

### Tipos de Análises

#### 1. Turnover Analysis
- Taxa de turnover total, voluntário, involuntário
- Custo estimado de turnover
- Turnover por departamento, cargo, tenure
- Tendências históricas
- Predição de funcionários em risco

#### 2. Absenteeism Analysis
- Taxa de absenteísmo
- Custo de ausências
- Distribuição por tipo (médico, férias, folga)
- Heatmap por dia da semana e hora
- Padrões sazonais

#### 3. Recruitment Metrics
- Time to hire médio
- Custo por contratação
- Taxa de aceitação de ofertas
- Efetividade por fonte de candidatos
- Funil de conversão

#### 4. Productivity Metrics
- Horas trabalhadas vs esperadas
- Taxa de overtime
- Taxa de utilização
- Índice de produtividade

#### 5. Diversity Metrics
- Distribuição por gênero
- Distribuição por faixa etária
- Distribuição por tempo de casa
- Equity salarial

### Algoritmos de Predição

#### Turnover Prediction
Usa múltiplos fatores para calcular risco de saída:

```typescript
interface PredictionFactors {
  tenure: number              // Peso: 0.25
  absenteeism: number        // Peso: 0.20
  performanceScore: number   // Peso: 0.15
  salaryPosition: number     // Peso: 0.15
  promotionRecency: number   // Peso: 0.10
  overtimeHours: number      // Peso: 0.10
  managerTurnover: number    // Peso: 0.05
}
```

Score final: 0-100 (0 = baixo risco, 100 = alto risco)

#### Headcount Projection
Usa séries temporais e tendências históricas:

```typescript
interface ProjectionInput {
  historicalHeadcount: TrendData[]
  averageHires: number
  averageTerminations: number
  seasonality: SeasonalityData
  plannedHiring: number
}
```

### Insights Automáticos

Sistema de detecção automática de padrões:

1. **Anomalias**: Desvios significativos de métricas
2. **Tendências**: Mudanças consistentes ao longo do tempo
3. **Comparações**: Diferenças entre departamentos/cargos
4. **Alertas**: Métricas fora de limites aceitáveis

Exemplo:
```typescript
{
  type: 'warning',
  category: 'turnover',
  title: 'Turnover elevado em TI',
  description: 'Turnover 35% acima da média da empresa',
  impact: 'high',
  recommendation: 'Realizar pesquisa de clima e revisar pacote de benefícios',
  metric: {
    value: 18.5,
    benchmark: 12.0,
    difference: 6.5
  }
}
```

## Módulo 4: AI Chatbot e Automações

### Funcionalidades

- **Chat Interativo**: Interface de chat flutuante
- **Natural Language Processing**: Entende perguntas em português
- **Knowledge Base**: Base de conhecimento de RH
- **Insights Automáticos**: Geração diária de insights
- **Ações Sugeridas**: Recomendações baseadas em dados
- **Respostas Contextuais**: Considera contexto do usuário

### Arquivos Principais

```
src/
├── components/chatbot/
│   ├── chatbot-widget.tsx          # Widget flutuante
│   ├── chat-message.tsx            # Componente de mensagem
│   ├── chat-input.tsx              # Input de mensagem
│   └── suggested-questions.tsx     # Perguntas sugeridas
├── lib/ai/
│   ├── chatbot.ts                  # Lógica do chatbot
│   ├── nlp-processor.ts            # Processamento de linguagem
│   ├── knowledge-base.ts           # Base de conhecimento
│   ├── context-manager.ts          # Gerenciamento de contexto
│   └── response-generator.ts       # Geração de respostas
└── api/chatbot/
    ├── chat/route.ts               # Endpoint de chat
    └── insights/route.ts           # Endpoint de insights
```

### Intents Suportados

1. **Dúvidas sobre Política**
   - Férias
   - Licenças
   - Benefícios
   - Código de conduta

2. **Consultas de Dados**
   - Saldo de férias
   - Horas trabalhadas
   - Ausências
   - Holerites

3. **Ações Rápidas**
   - Solicitar ausência
   - Registrar ponto
   - Gerar relatório
   - Exportar dados

4. **Analytics**
   - KPIs do dashboard
   - Insights do mês
   - Comparações
   - Tendências

### Knowledge Base

Base de conhecimento estruturada em categorias:

```typescript
interface KnowledgeEntry {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
  relatedQuestions: string[]
}
```

Categorias:
- Ponto e Jornada
- Férias e Ausências
- Benefícios
- Folha de Pagamento
- Recrutamento
- Compliance
- Treinamento

### Integração com OpenAI

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateResponse(message: string, context: Context) {
  const completion = await openai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente de RH especializado...'
      },
      {
        role: 'user',
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  })

  return completion.choices[0].message.content
}
```

## Fluxos de Dados

### 1. Fluxo de Analytics

```
User Request
    ↓
Analytics Dashboard Component
    ↓
API Route: /api/analytics/[metric]
    ↓
Analytics Calculation Service
    ↓
Supabase Queries (aggregations)
    ↓
Data Processing & Enrichment
    ↓
Cache (Redis/Memory)
    ↓
Response to Frontend
    ↓
Chart Rendering
```

### 2. Fluxo de Chatbot

```
User Message
    ↓
Chatbot Widget
    ↓
API Route: /api/chatbot/chat
    ↓
NLP Processor (intent detection)
    ↓
Context Manager (enrich with user data)
    ↓
┌─────────────────────────────┐
│  Knowledge Base  │  OpenAI  │
│    (local)       │  (cloud) │
└─────────────────────────────┘
    ↓
Response Generator
    ↓
Response to Frontend
    ↓
Chat Display
```

### 3. Fluxo de PWA Offline

```
User Action (offline)
    ↓
Service Worker Intercepts
    ↓
Store in IndexedDB
    ↓
[User comes online]
    ↓
Background Sync Event
    ↓
Service Worker Syncs Data
    ↓
API Endpoint
    ↓
Supabase Database
    ↓
Remove from IndexedDB
    ↓
Notify User (success/failure)
```

### 4. Fluxo de Push Notifications

```
Server Event (e.g., approval needed)
    ↓
API Route: /api/notifications/push
    ↓
Web Push Service
    ↓
Service Worker receives push
    ↓
Show Notification
    ↓
User Clicks
    ↓
Navigate to relevant page
```

## APIs Criadas

### Analytics APIs

#### GET /api/analytics/dashboard
Retorna dados do dashboard principal

**Query Params:**
- `period`: `7d`, `30d`, `90d`, `1y`
- `companyId`: UUID da empresa

**Response:**
```json
{
  "kpis": [...],
  "headcount": {...},
  "turnover": {...},
  "absenteeism": {...},
  "insights": [...]
}
```

#### GET /api/analytics/predictions/turnover
Predição de turnover por funcionário

**Response:**
```json
{
  "predictions": [
    {
      "employeeId": "uuid",
      "employeeName": "João Silva",
      "riskScore": 75,
      "factors": [...],
      "recommendation": "..."
    }
  ]
}
```

#### GET /api/analytics/insights/daily
Insights gerados diariamente por IA

**Response:**
```json
{
  "date": "2026-01-29",
  "insights": [
    {
      "title": "...",
      "description": "...",
      "impact": "high",
      "category": "turnover"
    }
  ]
}
```

### Chatbot APIs

#### POST /api/chatbot/chat
Enviar mensagem ao chatbot

**Body:**
```json
{
  "message": "Qual meu saldo de férias?",
  "conversationId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "message": "Você tem 25 dias de férias disponíveis...",
  "suggestedActions": [...],
  "relatedQuestions": [...]
}
```

#### GET /api/chatbot/knowledge
Buscar na base de conhecimento

**Query Params:**
- `query`: Termo de busca
- `category`: Categoria (opcional)

### Organogram APIs

#### GET /api/organogram/tree
Retorna estrutura hierárquica

**Query Params:**
- `companyId`: UUID da empresa
- `rootId`: ID do nó raiz (opcional)

**Response:**
```json
{
  "root": {
    "id": "uuid",
    "name": "CEO",
    "position": "Chief Executive Officer",
    "subordinates": [...]
  }
}
```

#### PUT /api/organogram/update
Atualizar hierarquia

**Body:**
```json
{
  "employeeId": "uuid",
  "newManagerId": "uuid"
}
```

### PWA APIs

#### POST /api/pwa/subscribe
Registrar subscription de push

**Body:**
```json
{
  "subscription": {...},
  "userId": "uuid"
}
```

#### POST /api/pwa/sync
Sincronizar dados offline

**Body:**
```json
{
  "entries": [
    {
      "type": "clock_in",
      "data": {...},
      "timestamp": "2026-01-29T10:00:00Z"
    }
  ]
}
```

## Componentes Principais

### Analytics Components

1. **KPICard**: Card de KPI com sparkline
2. **TrendChart**: Gráfico de linha para tendências
3. **HeatmapChart**: Mapa de calor para absenteísmo
4. **PredictionWidget**: Widget de predições
5. **InsightCard**: Card de insight com recomendação
6. **ComparisonChart**: Gráfico de comparação entre períodos
7. **DistributionChart**: Gráfico de pizza/donut

### Chatbot Components

1. **ChatbotWidget**: Widget flutuante principal
2. **ChatMessage**: Bubble de mensagem
3. **ChatInput**: Input com sugestões
4. **SuggestedQuestions**: Perguntas rápidas
5. **ActionButtons**: Botões de ação rápida

### Organogram Components

1. **OrganogramView**: Container principal
2. **EmployeeNode**: Nó de funcionário
3. **ConnectionLine**: Linha de conexão
4. **OrganogramControls**: Controles de zoom/export
5. **SearchBox**: Busca de funcionários
6. **FilterPanel**: Painel de filtros

## Configurações Necessárias

### Environment Variables

```env
# AI/Chatbot
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4
CHATBOT_ENABLED=true

# Analytics
ANALYTICS_ENABLED=true
BENCHMARK_API_KEY=...

# PWA
NEXT_PUBLIC_PWA_ENABLED=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Feature Flags
NEXT_PUBLIC_ORGANOGRAM_ENABLED=true
NEXT_PUBLIC_PREDICTIONS_ENABLED=true
NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=false
```

### Supabase Configuration

#### Storage Buckets
- `analytics-exports`: Exports de analytics (PDF, Excel)
- `organogram-exports`: Exports de organogramas

#### Database Tables
Nenhuma nova tabela necessária - usa tabelas existentes:
- `employees`
- `time_entries`
- `absences`
- `companies`

## Troubleshooting

### PWA não instalando

1. Verificar HTTPS (PWA requer HTTPS)
2. Verificar `manifest.json` válido
3. Verificar Service Worker registrado
4. Verificar ícones existem e são válidos

```bash
# Verificar manifest
curl https://seu-dominio.com/manifest.json

# Verificar service worker no DevTools
# Application > Service Workers
```

### Analytics lentos

1. Verificar índices do banco
2. Implementar cache
3. Usar agregações pré-calculadas
4. Paginar resultados grandes

```sql
-- Criar índices para analytics
CREATE INDEX idx_time_entries_company_date
ON time_entries(company_id, entry_date);

CREATE INDEX idx_absences_company_dates
ON absences(company_id, start_date, end_date);
```

### Chatbot não respondendo

1. Verificar API key OpenAI
2. Verificar rate limits
3. Verificar logs de erro
4. Testar knowledge base local primeiro

```typescript
// Fallback para knowledge base local
if (!process.env.OPENAI_API_KEY) {
  return searchKnowledgeBase(message)
}
```

### Push Notifications não chegando

1. Verificar VAPID keys configuradas
2. Verificar permissão do browser
3. Verificar subscription ativa
4. Testar envio manual

```javascript
// Testar subscription
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub)
  })
})
```

## Performance Considerations

### Analytics Optimization

1. **Caching**: Cache resultados por 5-15 minutos
2. **Lazy Loading**: Carregar charts sob demanda
3. **Pagination**: Limitar dados retornados
4. **Pre-calculation**: Calcular métricas em background

### PWA Optimization

1. **Smart Caching**: Cache apenas essencial
2. **Lazy Registration**: Registrar SW após page load
3. **Update Strategy**: Background update do SW
4. **Storage Limits**: Limpar cache antigo

### Chatbot Optimization

1. **Response Cache**: Cache respostas comuns
2. **Knowledge Base First**: Tentar local antes de OpenAI
3. **Streaming**: Stream respostas longas
4. **Rate Limiting**: Limitar requests por usuário

## Security Considerations

### API Security

1. **Authentication**: Todas as APIs requerem auth
2. **Authorization**: Verificar company_id do usuário
3. **Rate Limiting**: Limitar requests por IP/usuário
4. **Input Validation**: Validar todos os inputs

### Data Privacy

1. **Analytics**: Dados agregados, nunca individuais públicos
2. **Chatbot**: Não logar informações sensíveis
3. **Exports**: Watermark com usuário que exportou
4. **PWA**: Encriptar dados sensíveis no IndexedDB

## Monitoring e Logs

### Métricas para Monitorar

1. **PWA**
   - Taxa de instalação
   - Taxa de uso offline
   - Sucesso de sync
   - Push notification engagement

2. **Analytics**
   - Tempo de cálculo de métricas
   - Cache hit rate
   - Queries lentas
   - Uso de memória

3. **Chatbot**
   - Mensagens por dia
   - Taxa de resolução
   - Tempo de resposta
   - Fallback para knowledge base vs OpenAI

4. **Organogram**
   - Tempo de renderização
   - Número de nós
   - Exports por dia
   - Performance de drag&drop

## Próximos Passos

### Fase 8.1 - Enhancements
- [ ] Chatbot com voice input
- [ ] Analytics com ML mais avançado
- [ ] Organogram 3D
- [ ] PWA com biometria

### Fase 8.2 - Integrations
- [ ] Integração com WhatsApp Business
- [ ] Integração com Slack
- [ ] API pública para parceiros
- [ ] Marketplace de apps

### Fase 8.3 - Advanced AI
- [ ] Automated hiring recommendations
- [ ] Predictive scheduling
- [ ] Sentiment analysis
- [ ] Automated compliance checks

## Conclusão

A Fase 8 - Diferenciação transforma o Sistema RH em uma plataforma moderna e competitiva, oferecendo:

- **Mobilidade**: PWA instalável e offline
- **Visualização**: Organograma interativo
- **Inteligência**: Analytics avançado e predições
- **Automação**: Chatbot com IA e insights automáticos

Essas funcionalidades posicionam o sistema como líder no mercado de HR Tech.
