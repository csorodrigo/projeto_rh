# Instalação dos Componentes de Gráficos

## Status da Implementação

✅ Todos os componentes foram criados com sucesso:
- AreaChart.tsx
- BarChart.tsx
- PieChart.tsx
- LineChart.tsx
- ChartCard.tsx
- Utilitários e tipos
- Exemplos de uso
- Testes

## Instalação do Recharts

A biblioteca recharts foi adicionada ao `package.json`, mas pode ser necessário completar a instalação manualmente devido a conflitos no `node_modules`.

### Opção 1: Instalação Simples

```bash
npm install
```

Se houver erros, tente a Opção 2.

### Opção 2: Instalação Forçada

```bash
# Remover pasta problemática se existir
rm -rf "node_modules/ajv 2"

# Instalar dependências
npm install

# Ou forçar instalação do recharts especificamente
npm install recharts --force
```

### Opção 3: Reinstalação Completa

Se ainda houver problemas, faça uma reinstalação completa:

```bash
# Backup do package.json atual
cp package.json package.json.backup

# Remover node_modules e lock files
rm -rf node_modules package-lock.json

# Reinstalar tudo
npm install
```

## Verificação da Instalação

Após a instalação, verifique se o recharts está presente:

```bash
npm list recharts
```

Você deve ver algo como:
```
rh-rickgay@0.1.0
└── recharts@2.15.0
```

## Uso dos Componentes

### Importação Básica

```tsx
import { AreaChart, BarChart, PieChart, LineChart } from '@/components/charts';
```

### Exemplo Rápido

```tsx
import { LineChart } from '@/components/charts';

const data = [
  { name: 'Jan', vendas: 4000 },
  { name: 'Fev', vendas: 3000 },
  { name: 'Mar', vendas: 5000 },
];

export function MyChart() {
  return (
    <LineChart
      data={data}
      dataKeys={[{ key: 'vendas', name: 'Vendas', color: '#8b5cf6' }]}
      height={300}
    />
  );
}
```

## Importar Estilos CSS

Adicione ao seu arquivo principal (ex: `app/globals.css` ou `layout.tsx`):

```css
@import '@/components/charts/chart-styles.css';
```

Ou importe diretamente no componente:

```tsx
import '@/components/charts/chart-styles.css';
```

## Testar os Componentes

Execute os testes:

```bash
npm test ChartCard.test.tsx
```

## Ver Exemplos

Os componentes de exemplo foram criados para demonstração:

1. **ChartExamples.tsx** - Exemplos individuais de cada tipo de gráfico
2. **DashboardExample.tsx** - Dashboard completo com múltiplos gráficos

Para usar os exemplos, importe e renderize em uma página:

```tsx
// Em app/dashboard/page.tsx ou similar
import { DashboardExample } from '@/components/charts';

export default function DashboardPage() {
  return <DashboardExample />;
}
```

## Estrutura de Arquivos Criada

```
src/components/charts/
├── AreaChart.tsx          # Gráfico de área
├── BarChart.tsx           # Gráfico de barras
├── PieChart.tsx           # Gráfico de pizza/donut
├── LineChart.tsx          # Gráfico de linhas
├── ChartCard.tsx          # Wrapper com título/subtítulo
├── ChartExamples.tsx      # Exemplos de uso
├── DashboardExample.tsx   # Dashboard completo
├── ChartCard.test.tsx     # Testes unitários
├── types.ts               # Tipos TypeScript
├── utils.ts               # Funções utilitárias
├── chart-styles.css       # Estilos customizados
├── index.ts               # Exportações centralizadas
├── README.md              # Documentação completa
└── INSTALLATION.md        # Este arquivo
```

## Recursos dos Componentes

Todos os gráficos incluem:

- ✅ Suporte completo a Dark Mode
- ✅ Estados de Loading
- ✅ Estados Vazios (Empty State)
- ✅ Totalmente responsivos
- ✅ Tooltips informativos
- ✅ Legendas configuráveis
- ✅ Cores customizáveis
- ✅ TypeScript completo
- ✅ Formatação de valores (moeda, porcentagem, número)

## Próximos Passos

1. Completar a instalação do recharts (se necessário)
2. Importar os estilos CSS no projeto
3. Testar os componentes de exemplo
4. Integrar nos seus dashboards

## Suporte

Para mais informações:
- Documentação completa: `README.md`
- Exemplos práticos: `ChartExamples.tsx` e `DashboardExample.tsx`
- Recharts docs: https://recharts.org/

## Troubleshooting

### Erro: "Cannot find module 'recharts'"

Execute novamente a instalação:
```bash
npm install recharts --force
```

### Erro: "ENOTEMPTY" durante instalação

Remova a pasta problemática:
```bash
rm -rf "node_modules/ajv 2"
npm install
```

### Gráficos não aparecem

Verifique se:
1. O recharts está instalado
2. Os estilos CSS foram importados
3. O hook useTheme está funcionando

### Dark mode não funciona

Certifique-se de que o hook useTheme está configurado corretamente e que o Tailwind está configurado para dark mode.
