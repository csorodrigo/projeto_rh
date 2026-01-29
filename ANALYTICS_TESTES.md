# Guia de Testes - People Analytics Dashboard

## 🧪 Roteiro Completo de Testes

### Pré-requisitos
- ✅ Aplicação rodando (`npm run dev`)
- ✅ Banco de dados com dados de funcionários
- ✅ Usuário autenticado

---

## 1️⃣ Teste Básico de Navegação

### 1.1 Acessar Menu Analytics
```
1. Login na aplicação
2. Abrir menu lateral
3. Clicar em "Analytics"
4. Verificar que submenu expande
5. Ver 3 opções: Dashboard, Executivo, Departamentos
```

✅ **Esperado**: Menu expande e mostra 3 opções

---

## 2️⃣ Dashboard Principal (/analytics)

### 2.1 Carregamento Inicial
```
1. Clicar em Analytics > Dashboard
2. Aguardar carregamento
```

✅ **Esperado**:
- Spinner de loading aparece
- Dados carregam em ~2 segundos
- 4 KPI cards aparecem no topo
- Gráficos renderizam

### 2.2 KPI Cards
```
1. Verificar 4 cards:
   - Headcount Total
   - Taxa de Turnover
   - Taxa de Absenteísmo
   - Custo de Turnover
```

✅ **Esperado**:
- Cada card mostra:
  - Valor principal (grande)
  - Mudança percentual
  - Tendência (↑↓)
  - Status colorido (verde/amarelo/vermelho)
  - Mini sparkline (se disponível)

### 2.3 Filtro de Período
```
1. Clicar no botão de período (ex: "Últimos 6 meses")
2. Verificar presets disponíveis:
   - Últimos 7 dias
   - Últimos 30 dias
   - Últimos 90 dias
   - Últimos 6 meses
   - Último ano
   - Este ano
   - Ano passado
3. Clicar em "Últimos 30 dias"
4. Verificar que dados atualizam
```

✅ **Esperado**:
- Popover abre com presets
- Ao selecionar, dados recarregam
- Label do botão atualiza

### 2.4 Período Customizado
```
1. Abrir filtro de período
2. Ir para "Período customizado"
3. Selecionar data inicial
4. Selecionar data final
5. Clicar em "Aplicar período"
```

✅ **Esperado**:
- Calendário permite seleção
- Botão "Aplicar" só ativa se ambas datas selecionadas
- Dados atualizam

### 2.5 Tabs de Navegação
```
1. Verificar 4 tabs:
   - Visão Geral
   - Tendências
   - Distribuição
   - Insights
2. Clicar em cada tab
```

✅ **Esperado**:
- Tab ativa tem highlight
- Conteúdo muda ao trocar tab
- Transição suave

### 2.6 Tab "Visão Geral"
```
1. Verificar:
   - 4 KPIs no topo
   - 2 gráficos em grid:
     - Headcount (área)
     - Turnover (linha)
   - Top 3 insights (se houver)
```

✅ **Esperado**:
- Gráficos renderizam
- Tooltips funcionam ao passar mouse
- Legends clicáveis

### 2.7 Tab "Tendências"
```
1. Clicar em "Tendências"
2. Verificar 3 gráficos:
   - Headcount (evolução)
   - Turnover (tendência)
   - Absenteísmo (tendência)
```

✅ **Esperado**:
- Todos gráficos com linha temporal
- Eixo X mostra meses
- Linhas de benchmark visíveis

### 2.8 Tab "Distribuição"
```
1. Clicar em "Distribuição"
2. Verificar:
   - Gráfico de Demografia completo
   - Gráfico de Absenteísmo
```

✅ **Esperado**:
- Gráficos de pizza funcionam
- Pirâmide etária renderiza
- Tabelas de equidade aparecem

### 2.9 Tab "Insights"
```
1. Clicar em "Insights"
2. Verificar:
   - Summary com contadores (Alertas, Avisos, Info, Positivos)
   - Lista de insights detalhados
```

✅ **Esperado**:
- Cards coloridos por tipo
- Alertas (vermelho) aparecem primeiro
- Recomendações presentes
- Métricas comparativas visíveis

### 2.10 Botões de Ação
```
1. Clicar em "Atualizar" (ícone refresh)
2. Verificar que dados recarregam
3. Clicar em "Exportar" (ícone download)
4. Verificar que ação é preparada (não implementada ainda)
```

✅ **Esperado**:
- Atualizar funciona
- Exportar preparado para implementação futura

---

## 3️⃣ Dashboard Executivo (/analytics/executivo)

### 3.1 Acesso
```
1. Menu > Analytics > Executivo
2. Aguardar carregamento
```

✅ **Esperado**:
- Página carrega
- Período padrão: Último ano

### 3.2 Métricas Principais
```
1. Verificar 3 cards principais:
   - Força de Trabalho (total)
   - Taxa de Turnover (com status)
   - Taxa de Absenteísmo (com status)
```

✅ **Esperado**:
- Cards com borda colorida à esquerda
- Status em texto (Excelente/Bom/Médio/Ruim)
- Números grandes e legíveis

### 3.3 Impacto Financeiro
```
1. Verificar seção "Impacto Financeiro"
2. Ver 4 cards:
   - Folha Total
   - Custo de Turnover
   - Custo de Absenteísmo
   - Custo por Funcionário
```

✅ **Esperado**:
- Valores em R$
- Cores contextuais (azul, vermelho, laranja, verde)
- Labels claros

### 3.4 Highlights
```
1. Verificar seção "Pontos Positivos"
2. Verificar seção "Áreas de Atenção"
```

✅ **Esperado**:
- Listas com bullet points
- Pontos positivos em verde
- Áreas de atenção em laranja
- Texto claro e acionável

### 3.5 Exportar PDF
```
1. Clicar em "Exportar PDF"
```

✅ **Esperado**:
- Botão preparado para futura implementação

---

## 4️⃣ Analytics por Departamento (/analytics/departamentos)

### 4.1 Acesso e Carregamento
```
1. Menu > Analytics > Departamentos
2. Aguardar carregamento
```

✅ **Esperado**:
- Página carrega
- Dados de todos departamentos aparecem

### 4.2 Summary Cards
```
1. Verificar 4 cards no topo:
   - Total de Departamentos
   - Maior Headcount (+ nome dept)
   - Maior Turnover (+ nome dept)
   - Maior Absenteísmo (+ nome dept)
```

✅ **Esperado**:
- Números corretos
- Nomes de departamentos
- Layout claro

### 4.3 Tabela Comparativa
```
1. Verificar tabela com colunas:
   - Departamento
   - Headcount
   - Turnover
   - Desligamentos
   - Absenteísmo
   - Salário Médio
   - Tenure Médio
```

✅ **Esperado**:
- Todas colunas visíveis
- Números formatados corretamente
- Status coloridos (verde/amarelo/vermelho)

### 4.4 Ordenação
```
1. Clicar no header "Turnover"
2. Verificar que ordena decrescente
3. Clicar novamente
4. Verificar que ordena crescente
5. Testar outras colunas
```

✅ **Esperado**:
- Ícone de ordenação aparece
- Tabela reordena instantaneamente
- Alternância asc/desc funciona

### 4.5 Rankings
```
1. Verificar card "Melhores Performances"
   - Menor Turnover (top 3)
   - Menor Absenteísmo (top 3)
2. Verificar card "Áreas de Atenção"
   - Maior Turnover (top 3)
   - Maior Absenteísmo (top 3)
```

✅ **Esperado**:
- Rankings corretos
- Valores em percentual
- Cores adequadas (verde/vermelho)

---

## 5️⃣ Testes de Responsividade

### 5.1 Desktop (>1024px)
```
1. Abrir em tela grande
2. Verificar:
   - Grid de 4 colunas para KPIs
   - Gráficos lado a lado (2 colunas)
   - Tabelas completas
```

✅ **Esperado**: Layout otimizado para desktop

### 5.2 Tablet (768-1024px)
```
1. Redimensionar para tablet
2. Verificar:
   - Grid de 2 colunas
   - Gráficos empilhados
   - Tabela scrollável horizontalmente
```

✅ **Esperado**: Layout adaptado

### 5.3 Mobile (<768px)
```
1. Redimensionar para mobile
2. Verificar:
   - Stack vertical (1 coluna)
   - Gráficos compactos
   - Tabela scrollável
   - Menu hamburguer
```

✅ **Esperado**: Layout mobile-friendly

---

## 6️⃣ Testes de Gráficos (Recharts)

### 6.1 Interatividade
```
1. Passar mouse sobre gráficos
2. Verificar tooltips
3. Clicar em legends
4. Verificar que linhas/barras aparecem/desaparecem
```

✅ **Esperado**:
- Tooltips informativos
- Legends clicáveis
- Animações suaves

### 6.2 Gráfico de Linha (Turnover)
```
1. Abrir TurnoverChart
2. Verificar:
   - Linha azul de turnover
   - Linhas de benchmark (verde, amarelo)
   - Labels dos meses no eixo X
```

✅ **Esperado**: Gráfico completo e legível

### 6.3 Gráfico de Área (Headcount)
```
1. Abrir HeadcountChart
2. Verificar:
   - Área preenchida em azul
   - Gradiente suave
   - Evolução temporal clara
```

✅ **Esperado**: Área suave e bonita

### 6.4 Gráfico de Barra (Departamentos)
```
1. Ver gráficos de barra
2. Verificar:
   - Barras verticais ou horizontais
   - Cores consistentes
   - Labels legíveis
```

✅ **Esperado**: Barras bem formadas

### 6.5 Gráfico de Pizza (Distribuição)
```
1. Ver gráfico de pizza (tipos de ausência, gênero)
2. Verificar:
   - Fatias proporcionais
   - Labels com percentuais
   - Cores distintas
```

✅ **Esperado**: Pizza clara e proporcional

---

## 7️⃣ Testes de Insights

### 7.1 Geração de Insights
```
1. Ir para tab Insights
2. Verificar se insights foram gerados
3. Ler insights de diferentes tipos:
   - Alertas (vermelho)
   - Warnings (amarelo)
   - Info (azul)
   - Success (verde)
```

✅ **Esperado**:
- Pelo menos alguns insights gerados
- Texto claro e acionável
- Recomendações presentes

### 7.2 Insights de Turnover
```
1. Verificar se há insights sobre:
   - Turnover alto/baixo
   - Departamentos específicos
   - Tendências
   - Custos
```

✅ **Esperado**: Análise relevante de turnover

### 7.3 Insights de Absenteísmo
```
1. Verificar insights sobre:
   - Taxa de absenteísmo
   - Tipos predominantes
   - Departamentos afetados
```

✅ **Esperado**: Análise de absenteísmo

### 7.4 Comparação com Benchmarks
```
1. Verificar insights que comparam com benchmarks
2. Ver se mostra:
   - Valor atual
   - Benchmark
   - Diferença
```

✅ **Esperado**: Comparação clara

---

## 8️⃣ Testes de Edge Cases

### 8.1 Sem Dados
```
1. Testar com período sem dados
2. Verificar estado vazio
```

✅ **Esperado**:
- Mensagem amigável
- Sem erros
- Sugestão de ação

### 8.2 Período Inválido
```
1. Tentar selecionar data futura
2. Verificar validação
```

✅ **Esperado**: Data futura desabilitada

### 8.3 Erro de Rede
```
1. Desabilitar rede
2. Tentar carregar dados
```

✅ **Esperado**: Mensagem de erro amigável

---

## 9️⃣ Testes de Performance

### 9.1 Tempo de Carregamento
```
1. Medir tempo desde clique até dados carregados
```

✅ **Esperado**: < 2 segundos

### 9.2 Múltiplas Mudanças de Período
```
1. Alternar rapidamente entre períodos
2. Verificar se não trava
```

✅ **Esperado**: Transições suaves

### 9.3 Scroll em Tabelas Grandes
```
1. Se tabela > 20 linhas, testar scroll
```

✅ **Esperado**: Scroll suave

---

## 🔟 Testes de Cálculos

### 10.1 Validar Turnover
```
Fórmula: (Desligamentos / Headcount Médio) × 100

Exemplo:
- 5 desligamentos
- 50 funcionários
- Esperado: 10%

1. Verificar se cálculo está correto
```

✅ **Esperado**: Cálculo preciso

### 10.2 Validar Absenteísmo
```
Fórmula: (Dias Ausentes / (Dias Úteis × Funcionários)) × 100

Exemplo:
- 100 dias ausentes
- 22 dias úteis
- 50 funcionários
- Esperado: 9.09%

1. Verificar cálculo
```

✅ **Esperado**: Cálculo correto

---

## 📋 Checklist de Testes

### Navegação
- [ ] Menu Analytics aparece
- [ ] Submenu com 3 opções funciona
- [ ] Links levam para páginas corretas

### Dashboard Principal
- [ ] KPIs carregam
- [ ] Filtro de período funciona
- [ ] 4 tabs funcionam
- [ ] Gráficos renderizam
- [ ] Insights aparecem

### Dashboard Executivo
- [ ] Métricas principais corretas
- [ ] Impacto financeiro calculado
- [ ] Highlights relevantes

### Departamentos
- [ ] Tabela comparativa funciona
- [ ] Ordenação funciona
- [ ] Rankings corretos
- [ ] Status coloridos

### Gráficos
- [ ] Todos renderizam
- [ ] Tooltips funcionam
- [ ] Legends clicáveis
- [ ] Responsivos

### Insights
- [ ] Geram automaticamente
- [ ] Categorizados corretamente
- [ ] Recomendações presentes
- [ ] Priorização por impacto

### Responsividade
- [ ] Desktop OK
- [ ] Tablet OK
- [ ] Mobile OK

### Performance
- [ ] Carregamento < 2s
- [ ] Sem travamentos
- [ ] Scroll suave

### Edge Cases
- [ ] Sem dados tratado
- [ ] Erros tratados
- [ ] Validações funcionam

---

## 🐛 Reportar Bugs

Se encontrar bugs, registre:

1. **URL**: Qual página?
2. **Ação**: O que fez?
3. **Esperado**: O que deveria acontecer?
4. **Obtido**: O que aconteceu?
5. **Browser**: Chrome/Firefox/Safari?
6. **Console**: Algum erro no console?

---

## ✅ Critérios de Sucesso

Para considerar testes aprovados:
- ✅ Todas páginas carregam sem erros
- ✅ Gráficos renderizam corretamente
- ✅ Cálculos estão precisos
- ✅ Insights são gerados
- ✅ Responsivo em todos dispositivos
- ✅ Performance < 2s
- ✅ Sem erros no console

---

**Boa sorte nos testes!** 🎯
