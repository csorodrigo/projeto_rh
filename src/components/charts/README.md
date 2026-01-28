# Componentes de Gráficos

Biblioteca de componentes de gráficos reutilizáveis construída com Recharts, totalmente integrada com o design system do projeto (Tailwind CSS + Dark Mode).

## Instalação

A biblioteca recharts já foi instalada:

```bash
npm install recharts
```

## Componentes Disponíveis

### 1. AreaChart

Gráfico de área para visualizar tendências ao longo do tempo.

**Props:**

```typescript
interface AreaChartProps {
  data: DataPoint[];              // Array de dados
  dataKeys: {                     // Configuração das séries
    key: string;                  // Nome do campo no data
    color?: string;               // Cor da série (opcional)
    name?: string;                // Nome para exibição (opcional)
  }[];
  xAxisKey?: string;              // Campo para eixo X (padrão: 'name')
  height?: number;                // Altura em pixels (padrão: 300)
  isLoading?: boolean;            // Estado de carregamento
  emptyMessage?: string;          // Mensagem quando vazio
  showGrid?: boolean;             // Mostrar grade (padrão: true)
  showLegend?: boolean;           // Mostrar legenda (padrão: true)
  stacked?: boolean;              // Empilhar áreas (padrão: false)
}
```

**Exemplo de uso:**

```tsx
import { AreaChart } from '@/components/charts';

const data = [
  { name: 'Jan', vendas: 4000, despesas: 2400 },
  { name: 'Fev', vendas: 3000, despesas: 1398 },
  { name: 'Mar', vendas: 2000, despesas: 9800 },
];

<AreaChart
  data={data}
  dataKeys={[
    { key: 'vendas', name: 'Vendas', color: '#8b5cf6' },
    { key: 'despesas', name: 'Despesas', color: '#ef4444' },
  ]}
  height={300}
/>
```

---

### 2. BarChart

Gráfico de barras para comparar valores entre categorias.

**Props:**

```typescript
interface BarChartProps {
  data: DataPoint[];
  dataKeys: {
    key: string;
    color?: string;
    name?: string;
  }[];
  xAxisKey?: string;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;           // Barras horizontais
  stacked?: boolean;              // Barras empilhadas
  customColors?: string[];        // Cores personalizadas por barra
}
```

**Exemplo de uso:**

```tsx
import { BarChart } from '@/components/charts';

const data = [
  { name: 'Seg', horas: 40 },
  { name: 'Ter', horas: 35 },
  { name: 'Qua', horas: 45 },
];

// Vertical
<BarChart
  data={data}
  dataKeys={[{ key: 'horas', name: 'Horas Trabalhadas' }]}
/>

// Horizontal
<BarChart
  data={data}
  dataKeys={[{ key: 'horas', name: 'Horas Trabalhadas' }]}
  horizontal
/>

// Com cores personalizadas por barra
<BarChart
  data={data}
  dataKeys={[{ key: 'horas' }]}
  customColors={['#8b5cf6', '#06b6d4', '#10b981']}
/>
```

---

### 3. PieChart

Gráfico de pizza para mostrar distribuição proporcional.

**Props:**

```typescript
interface PieChartProps {
  data: DataPoint[];              // { name: string, value: number }
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showLegend?: boolean;
  showLabels?: boolean;           // Mostrar porcentagens
  innerRadius?: number;           // Raio interno (0 = pizza, >0 = donut)
  outerRadius?: number;           // Raio externo
  customColors?: string[];
  valueFormatter?: (value: number) => string;
}
```

**Exemplo de uso:**

```tsx
import { PieChart } from '@/components/charts';

const data = [
  { name: 'Desenvolvimento', value: 400 },
  { name: 'Marketing', value: 300 },
  { name: 'Vendas', value: 300 },
];

// Pizza tradicional
<PieChart data={data} />

// Donut
<PieChart data={data} innerRadius={60} />

// Com formatação customizada
<PieChart
  data={data}
  valueFormatter={(value) => `R$ ${value.toFixed(2)}`}
/>
```

---

### 4. LineChart

Gráfico de linhas para evolução temporal.

**Props:**

```typescript
interface LineChartProps {
  data: DataPoint[];
  dataKeys: {
    key: string;
    color?: string;
    name?: string;
    strokeWidth?: number;
    strokeDasharray?: string;     // Para linhas tracejadas
  }[];
  xAxisKey?: string;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;             // Mostrar pontos (padrão: true)
  curved?: boolean;               // Linhas curvas (padrão: true)
}
```

**Exemplo de uso:**

```tsx
import { LineChart } from '@/components/charts';

const data = [
  { name: 'Jan', usuarios: 100, meta: 120 },
  { name: 'Fev', usuarios: 150, meta: 150 },
  { name: 'Mar', usuarios: 200, meta: 180 },
];

<LineChart
  data={data}
  dataKeys={[
    { key: 'usuarios', name: 'Usuários', color: '#8b5cf6' },
    {
      key: 'meta',
      name: 'Meta',
      color: '#ef4444',
      strokeDasharray: '5 5'  // Linha tracejada
    },
  ]}
/>
```

---

## Recursos Comuns

### Dark Mode

Todos os componentes suportam dark mode automaticamente através do hook `useTheme`:

```tsx
import { useTheme } from '@/hooks/useTheme';

const { theme, toggleTheme } = useTheme();
```

### Estados

**Loading:**
```tsx
<AreaChart data={data} dataKeys={keys} isLoading={true} />
```

**Empty:**
```tsx
<AreaChart
  data={[]}
  dataKeys={keys}
  emptyMessage="Nenhum dado disponível no momento"
/>
```

### Cores Padrão

Os componentes usam cores do Tailwind CSS por padrão:

- `#8b5cf6` - purple-600
- `#06b6d4` - cyan-600
- `#10b981` - emerald-600
- `#f59e0b` - amber-600
- `#ef4444` - red-600
- `#ec4899` - pink-600

### Responsividade

Todos os gráficos são responsivos e se adaptam ao container pai:

```tsx
<div className="w-full max-w-4xl">
  <LineChart data={data} dataKeys={keys} />
</div>
```

---

## Exemplos Completos

### Dashboard com Múltiplos Gráficos

```tsx
import { AreaChart, BarChart, PieChart, LineChart } from '@/components/charts';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Vendas vs Despesas */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Vendas vs Despesas</h3>
        <AreaChart
          data={salesData}
          dataKeys={[
            { key: 'vendas', name: 'Vendas', color: '#10b981' },
            { key: 'despesas', name: 'Despesas', color: '#ef4444' },
          ]}
        />
      </div>

      {/* Horas por Dia */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Horas Trabalhadas</h3>
        <BarChart
          data={hoursData}
          dataKeys={[{ key: 'horas', name: 'Horas' }]}
        />
      </div>

      {/* Distribuição por Departamento */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Por Departamento</h3>
        <PieChart data={deptData} />
      </div>

      {/* Evolução de Usuários */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Crescimento</h3>
        <LineChart
          data={growthData}
          dataKeys={[
            { key: 'usuarios', name: 'Total' },
            { key: 'novos', name: 'Novos' },
          ]}
        />
      </div>
    </div>
  );
}
```

### Gráfico com Estado de Carregamento

```tsx
function SalesChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AreaChart
      data={data}
      dataKeys={[{ key: 'vendas', name: 'Vendas' }]}
      isLoading={loading}
      emptyMessage="Nenhuma venda registrada"
    />
  );
}
```

---

## Customização Avançada

### Cores Personalizadas

```tsx
const customColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];

<PieChart data={data} customColors={customColors} />
```

### Altura Customizada

```tsx
<LineChart data={data} dataKeys={keys} height={400} />
```

### Sem Grade

```tsx
<AreaChart data={data} dataKeys={keys} showGrid={false} />
```

### Sem Legenda

```tsx
<BarChart data={data} dataKeys={keys} showLegend={false} />
```

---

## Integração com APIs

```tsx
import { useEffect, useState } from 'react';
import { LineChart } from '@/components/charts';

function MetricsChart() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  return (
    <LineChart
      data={metrics}
      dataKeys={[
        { key: 'visits', name: 'Visitas', color: '#8b5cf6' },
        { key: 'conversions', name: 'Conversões', color: '#10b981' },
      ]}
      isLoading={loading}
      emptyMessage="Sem dados de métricas disponíveis"
    />
  );
}
```

---

## Acessibilidade

Todos os componentes incluem:

- Estados de loading com indicador visual
- Estados vazios com mensagens descritivas
- Tooltips informativos
- Suporte completo a dark mode
- Responsividade para diferentes tamanhos de tela

---

## Arquivo de Exemplos

Veja `ChartExamples.tsx` para uma demonstração interativa de todos os componentes e suas variações.

---

## Suporte

Para mais informações sobre Recharts: https://recharts.org/
