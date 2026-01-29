# People Analytics Dashboard - Fase 8

Sistema completo de People Analytics com métricas, gráficos e insights automáticos.

## Estrutura Implementada

### 1. Types e Interfaces (`src/types/analytics.ts`)

Tipos TypeScript completos para todas as métricas e componentes:
- `AnalyticsPeriod` - Definição de períodos temporais
- `TurnoverMetrics` - Métricas de rotatividade
- `RecruitmentMetrics` - Métricas de recrutamento
- `AbsenteeismMetrics` - Métricas de absenteísmo
- `ProductivityMetrics` - Métricas de produtividade
- `EngagementMetrics` - Métricas de engajamento
- `DiversityMetrics` - Métricas de diversidade
- `HeadcountMetrics` - Métricas de headcount
- `KPIData` - Estrutura de KPIs
- `Insight` - Estrutura de insights automáticos

### 2. Benchmarks de Mercado (`src/lib/analytics/benchmarks.ts`)

Benchmarks baseados em dados do mercado brasileiro e internacional:

**Turnover:**
- Excelente: ≤5%
- Bom: ≤10%
- Médio: ≤15%
- Ruim: >20%

**Absenteísmo:**
- Excelente: ≤2%
- Bom: ≤3%
- Médio: ≤5%
- Ruim: >8%

**Time to Hire:**
- Excelente: ≤15 dias
- Bom: ≤30 dias
- Médio: ≤45 dias
- Ruim: >60 dias

**Funções úteis:**
- `getBenchmarkStatus()` - Determina status baseado em benchmark
- `getStatusColor()` - Retorna cor do status
- `calculatePercentile()` - Calcula percentil
- `compareWithIndustry()` - Compara com benchmark da indústria

### 3. Cálculo de Métricas (`src/lib/analytics/metrics.ts`)

Funções para calcular todas as métricas de RH:

#### Turnover
- `calculateTurnover()` - Taxa de turnover geral
- `calculateTurnoverByType()` - Voluntário vs involuntário
- `calculateTurnoverCost()` - Custo estimado
- `calculateTurnoverByDepartment()` - Por departamento

#### Recrutamento
- `calculateTimeToHire()` - Tempo médio de contratação
- `calculateCostPerHire()` - Custo por contratação
- `calculateOfferAcceptanceRate()` - Taxa de aceitação
- `calculateSourceEffectiveness()` - Efetividade por canal

#### Absenteísmo
- `calculateAbsenteeismRate()` - Taxa de absenteísmo
- `calculateAbsenteeismByType()` - Por tipo de ausência
- `calculateAbsenteeismCost()` - Custo estimado

#### Produtividade
- `calculateAverageHoursWorked()` - Média de horas
- `calculateOvertimeRate()` - Taxa de horas extras
- `calculateProductivityIndex()` - Índice de produtividade
- `calculateUtilizationRate()` - Taxa de utilização

#### Engajamento
- `calculateAverageTenure()` - Tempo médio de casa
- `calculatePromotionRate()` - Taxa de promoção
- `calculateRetentionRate()` - Taxa de retenção
- `calculateEarlyTurnover()` - Turnover nos primeiros 90 dias

#### Diversidade
- `calculateGenderDistribution()` - Distribuição por gênero
- `calculateAgeDistribution()` - Distribuição etária
- `calculateTenureDistribution()` - Distribuição por tempo de casa
- `calculateSalaryEquity()` - Equidade salarial
- `calculateDiversityIndex()` - Índice de diversidade (Shannon)

### 4. Queries de Analytics (`src/lib/supabase/queries/analytics.ts`)

Queries otimizadas para buscar dados do Supabase:

- `getHeadcountTrend()` - Evolução do headcount
- `getHiresAndTerminations()` - Admissões e desligamentos
- `getAbsenceMetrics()` - Métricas de ausências
- `getDepartmentMetrics()` - Métricas por departamento
- `getAgeDistribution()` - Distribuição etária
- `getTenureDistribution()` - Distribuição de tempo de casa
- `getSalaryBands()` - Faixas salariais
- `getTimeToHireByJob()` - Tempo de contratação por vaga
- `getCurrentHeadcount()` - Headcount atual

### 5. Insights Engine (`src/lib/analytics/insights.ts`)

Geração automática de insights acionáveis:

**Funcionalidade:**
- `generateInsights()` - Gera todos os insights
- Detecta anomalias e tendências
- Compara com benchmarks
- Gera recomendações automáticas
- Prioriza por impacto (alto/médio/baixo)

**Tipos de Insights:**
- Alerts (críticos) - vermelho
- Warnings (atenção) - amarelo
- Info (informativos) - azul
- Success (positivos) - verde

**Categorias:**
- Turnover
- Absenteísmo
- Recrutamento
- Produtividade
- Diversidade
- Custos

### 6. Componentes de Visualização

#### KPICard (`src/components/analytics/KPICard.tsx`)
Card de KPI com:
- Valor principal destacado
- Tendência (↑↓) com percentual
- Status visual (cores)
- Mini sparkline
- Comparação com período anterior

#### TurnoverChart (`src/components/analytics/TurnoverChart.tsx`)
- Gráfico de tendência temporal
- Comparação com benchmarks
- Breakdown por departamento
- Métricas de turnover voluntário/involuntário

#### HeadcountChart (`src/components/analytics/HeadcountChart.tsx`)
- Evolução do headcount (área)
- Distribuição por departamento (barras)
- Top 10 cargos
- Tabelas detalhadas

#### AbsenteeismChart (`src/components/analytics/AbsenteeismChart.tsx`)
- Tendência de absenteísmo
- Distribuição por tipo (pizza)
- Por departamento
- Status vs benchmark

#### DemographicsCharts (`src/components/analytics/DemographicsCharts.tsx`)
- Índice de diversidade
- Distribuição por gênero (pizza)
- Pirâmide etária (barras)
- Tempo de casa
- Análise de equidade salarial

#### InsightsList (`src/components/analytics/InsightsList.tsx`)
- Cards de insights
- Priorização por impacto
- Recomendações acionáveis
- Comparação com benchmarks
- Summary de insights

#### PeriodFilter (`src/components/analytics/PeriodFilter.tsx`)
- Presets rápidos (7d, 30d, 90d, 6m, 1a)
- Seleção customizada com calendário
- Comparação período-sobre-período
- Comparação ano-sobre-ano

### 7. Páginas

#### Dashboard Principal (`/analytics`)
Features:
- 4 KPIs principais em cards
- Tabs: Overview, Tendências, Distribuição, Insights
- Filtro de período
- Botões de atualizar e exportar
- Gráficos interativos (Recharts)
- Top insights automáticos

#### Dashboard Executivo (`/analytics/executivo`)
Visão C-level simplificada:
- Métricas de alto nível
- Headcount, Turnover, Absenteísmo
- Impacto financeiro
- Pontos positivos vs áreas de atenção
- Período padrão: último ano
- Foco em status e ações

#### Analytics por Departamento (`/analytics/departamentos`)
Comparação entre departamentos:
- Tabela comparativa ordenável
- Rankings de melhores/piores
- Métricas: headcount, turnover, absenteísmo, salário
- Status colorido vs benchmarks
- Drill-down por departamento

## Uso

### Exemplo básico

```typescript
import { generateInsights } from '@/lib/analytics/insights';
import { calculateTurnover } from '@/lib/analytics/metrics';
import { TURNOVER_BENCHMARKS } from '@/lib/analytics/benchmarks';

// Calcular turnover
const turnoverRate = calculateTurnover(
  terminations, // número de desligamentos
  avgHeadcount  // headcount médio
);

// Comparar com benchmark
const status = getBenchmarkStatus(
  turnoverRate,
  TURNOVER_BENCHMARKS,
  false // false = menor é melhor
);

// Gerar insights
const insights = generateInsights({
  turnover: turnoverMetrics,
  absenteeism: absenteeismMetrics
});
```

### Navegar para Analytics

No menu lateral:
- **Analytics** > Dashboard
- **Analytics** > Executivo
- **Analytics** > Departamentos

## Tecnologias

- **React 19** - Framework
- **Next.js 16** - SSR e routing
- **TypeScript** - Type safety
- **Recharts** - Gráficos
- **Tailwind CSS** - Styling
- **date-fns** - Manipulação de datas
- **Supabase** - Database e queries

## Próximos Passos (Opcional)

1. **Predictive Analytics** (`src/lib/analytics/predictions.ts`)
   - Prever risco de turnover por funcionário
   - Projetar headcount futuro
   - Prever necessidades de contratação

2. **Export Functionality** (`src/lib/analytics/export.ts`)
   - Exportar relatórios em PDF
   - Exportar dados em CSV/Excel
   - Screenshots de gráficos

3. **Mais Métricas**
   - Employee Net Promoter Score (eNPS)
   - Cost per Employee
   - Training ROI
   - Promotion Readiness

4. **Dashboards Adicionais**
   - Analytics por projeto
   - Analytics por gestor
   - Analytics por cargo

5. **Machine Learning**
   - Modelos de predição avançados
   - Clusterização de funcionários
   - Detecção de padrões

## Fórmulas Utilizadas

### Turnover
```
Taxa de Turnover = (Desligamentos / Headcount Médio) × 100
Custo de Turnover = Desligamentos × Salário Médio Anual × 1.5
```

### Absenteísmo
```
Taxa de Absenteísmo = (Dias de Ausência / (Dias Úteis × Funcionários)) × 100
Custo de Absenteísmo = Dias de Ausência × Salário Diário Médio
```

### Time to Hire
```
Time to Hire = Σ(Data Contratação - Data Publicação) / Nº Contratações
```

### Diversidade (Shannon Index)
```
Índice de Diversidade = -Σ(pi × ln(pi))
onde pi = proporção da categoria i
```

## Responsividade

Todos os componentes são totalmente responsivos:
- **Desktop**: Gráficos lado a lado, tabelas completas
- **Tablet**: Grid de 2 colunas, gráficos adaptados
- **Mobile**: Stack vertical, gráficos compactos

## Performance

Otimizações implementadas:
- React Query para cache de dados
- Memoização de cálculos pesados (`useMemo`)
- Lazy loading de gráficos
- Queries otimizadas com indexes
- Paginação em tabelas grandes

## Testes

Para testar:
1. Acesse `/analytics`
2. Selecione um período
3. Explore as diferentes tabs
4. Verifique insights gerados
5. Teste drill-down por departamento

## Troubleshooting

**Dados não carregam:**
- Verifique conexão com Supabase
- Confirme que existem dados de funcionários
- Verifique console para erros

**Gráficos não aparecem:**
- Verifique se Recharts está instalado
- Confirme que há dados no período selecionado

**Insights vazios:**
- Normal se métricas estão dentro dos benchmarks
- Adicione mais dados de teste

## Autores

Implementado na Fase 8 - Diferenciação do projeto RH System.
