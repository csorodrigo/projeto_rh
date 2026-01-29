# Guia de Uso: Histórico de Ponto

## Como Acessar

1. Faça login no sistema
2. No menu lateral, clique em "Ponto"
3. Na página de Ponto, clique na aba "Histórico"

**OU**

Acesse diretamente: `https://seu-dominio.com/ponto/historico`

---

## Interface da Página

### Cabeçalho
- **Título**: "Histórico de Ponto"
- **Botão Exportar**: Para exportar dados em CSV ou PDF

### Seção de Filtros
Card com opções de filtragem:

#### Filtro de Período
Escolha entre:
- **Hoje**: Exibe apenas os registros de hoje
- **Esta Semana**: Exibe registros da semana atual
- **Este Mês**: Exibe registros do mês atual
- **Personalizado**: Permite selecionar um intervalo específico de datas

#### Seletor de Data Personalizada
Quando selecionar "Personalizado":
1. Clique no campo "Data"
2. Um calendário duplo será exibido
3. Clique na data inicial
4. Clique na data final
5. As datas selecionadas aparecem no formato: "DD/MM/YYYY - DD/MM/YYYY"

**Limitações:**
- Não é possível selecionar datas futuras
- A data final deve ser posterior à data inicial

---

## Cards de Resumo

Quatro cards exibem estatísticas do período selecionado:

### 1. Total de Horas
- Soma de todas as horas trabalhadas no período
- Cor verde
- Formato: "Xh Ymin"
- Exemplo: "42h 30min"

### 2. Média por Dia
- Média de horas trabalhadas por dia
- Considera apenas dias com registro
- Cor azul
- Formato: "Xh Ymin"
- Exemplo: "8h 30min"

### 3. Dias com Registro
- Quantidade de dias que possuem pelo menos um registro
- Cor padrão
- Exemplo: "5"

### 4. Dias sem Registro
- Quantidade de dias sem nenhum registro
- Cor vermelha
- Exemplo: "2"

---

## Listagem de Dias

Cada dia do período é exibido em um card individual:

### Cabeçalho do Card
- **Status (ícone)**:
  - ✅ Verde: Dia completo
  - ⚠️ Amarelo: Dia incompleto
  - ❌ Vermelho: Sem registros
- **Data**: Formato "Dia da semana, DD/MM"
  - Exemplo: "Segunda, 27/01"
- **Badge de Status**:
  - "Completo" (verde)
  - "Incompleto" (amarelo)
  - "Sem registros" (vermelho)
- **Contador**: "X registro(s)"

### Corpo do Card

#### Para dias COM registros:

**Blocos de Entrada/Saída:**
Cada bloco mostra um par entrada → saída:

```
🟢 Entrada      →      🔵 Saída      ⏱️ 4h 0min
   08:00                 12:00

🟢 Volta        →      🔵 Saída      ⏱️ 5h 0min
   13:00                 18:00
```

**Elementos de cada bloco:**
- Seta verde (⬇️): Entrada ou volta de intervalo
- Seta azul (⬆️): Saída ou início de intervalo
- Horário: Formato 24h (HH:mm)
- Duração: Tempo trabalhado naquele período
- Badge "Em aberto": Quando falta a saída correspondente

#### Para dias SEM registros:
- Ícone de alerta ❌
- Mensagem: "Nenhum registro neste dia"

### Rodapé do Card (apenas para dias com registros)

Exibe o resumo do dia:

**Total Trabalhado:**
- Soma de todos os períodos do dia
- Cor verde
- Formato: "Xh Ymin"
- Exemplo: "9h 0min"

**Diferença (se houver):**
Comparado com 8h esperadas:
- **Hora Extra** (azul): "+Xh Ymin"
  - Exemplo: "+1h 30min"
- **Faltante** (vermelho): "-Xh Ymin"
  - Exemplo: "-2h 0min"

---

## Paginação

Quando o período selecionado tem mais de 7 dias:

**Controles:**
- Indicador: "Página X de Y"
- Botão "Anterior": Navega para página anterior
- Botão "Próxima": Navega para próxima página

**Comportamento:**
- 7 dias são exibidos por vez
- Botões desabilitam quando não há mais páginas

---

## Exportação

### Como Exportar

1. Selecione o período desejado
2. Clique no botão "Exportar" no canto superior direito
3. Escolha o formato:
   - **CSV**: Para análise em Excel/Planilhas
   - **PDF**: Para impressão ou arquivo

### O que é Exportado

**Dados incluídos:**
- Nome do funcionário
- Período selecionado
- Todos os registros de ponto do período
- Data e hora de cada registro
- Tipo de registro (entrada/saída/intervalo)
- Total de horas por dia
- Estatísticas do período

**Formato do Arquivo:**
- **CSV**: `historico_ponto_NOME_YYYYMMDD.csv`
- **PDF**: `historico_ponto_NOME_YYYYMMDD.pdf`

**Observação:** Botão fica desabilitado quando não há registros no período.

---

## Interpretação dos Status

### Dia Completo ✅
**O que significa:**
- Todos os registros estão pareados corretamente
- Cada entrada tem sua saída correspondente
- Não há registros pendentes

**Exemplo:**
```
08:00 - Entrada
12:00 - Saída (intervalo)
13:00 - Entrada
18:00 - Saída
```

### Dia Incompleto ⚠️
**O que significa:**
- Existe pelo menos uma entrada sem saída
- Registro ainda em aberto

**Exemplo:**
```
08:00 - Entrada
12:00 - Saída (intervalo)
13:00 - Entrada
[Falta saída]
```

**Ação recomendada:**
- Verificar se esqueceu de bater o ponto
- Solicitar ajuste se necessário

### Sem Registros ❌
**O que significa:**
- Nenhum registro foi feito neste dia
- Pode ser fim de semana, feriado ou ausência

**Possíveis razões:**
- Dia não útil
- Férias
- Falta
- Folga

---

## Cenários de Uso

### 1. Consultar Ponto de Hoje
1. Acesse a página de Histórico
2. Selecione o filtro "Hoje"
3. Visualize seus registros do dia atual

### 2. Verificar Semana Trabalhada
1. Selecione o filtro "Esta Semana"
2. Verifique quantas horas trabalhou
3. Compare com a meta semanal

### 3. Consultar Mês para Fechamento
1. Selecione o filtro "Este Mês"
2. Visualize o resumo mensal
3. Verifique dias incompletos
4. Exporte para PDF se necessário

### 4. Consultar Período Específico
1. Selecione o filtro "Personalizado"
2. Escolha data inicial e final
3. Visualize registros do período
4. Exporte para análise

### 5. Identificar Dias com Problema
1. Consulte o período desejado
2. Procure por badges amarelos (Incompleto)
3. Clique no dia para ver detalhes
4. Solicite ajuste se necessário

---

## Dicas e Boas Práticas

### Para Funcionários

1. **Consulte regularmente**: Verifique seu histórico pelo menos uma vez por semana
2. **Identifique inconsistências**: Procure dias incompletos e regularize
3. **Antes do fechamento**: Sempre revise o mês inteiro antes do fechamento de folha
4. **Guarde comprovantes**: Exporte PDFs mensais para seu arquivo pessoal

### Para Gestores

1. **Monitore a equipe**: Use os filtros para verificar padrões
2. **Identifique problemas**: Dias sem registro podem indicar faltas ou esquecimentos
3. **Acompanhe horas extras**: Verifique colaboradores com muitas horas excedentes
4. **Documentação**: Exporte relatórios mensais para arquivo

---

## Solução de Problemas

### Não consigo ver meus registros
**Possíveis causas:**
1. Não está vinculado como funcionário
2. Período selecionado está incorreto
3. Ainda não bateu ponto no período

**Solução:**
- Entre em contato com o RH
- Verifique os filtros de data
- Tente mudar o período

### Erro ao carregar
**Mensagem:** "Erro ao carregar histórico"

**Solução:**
1. Recarregue a página (F5)
2. Verifique sua conexão com internet
3. Tente fazer logout e login novamente
4. Entre em contato com suporte técnico

### Exportação não funciona
**Possíveis causas:**
1. Não há registros no período
2. Navegador bloqueou download

**Solução:**
- Verifique se o período tem registros
- Permita downloads no navegador
- Tente outro formato (CSV ou PDF)

### Registros incompletos
**O que fazer:**
1. Verifique se realmente esqueceu de bater o ponto
2. Solicite ajuste através do sistema
3. Entre em contato com seu gestor

---

## Perguntas Frequentes

### Por que alguns dias aparecem como "incompletos"?
Quando você registra uma entrada mas não registra a saída correspondente, o dia fica marcado como incompleto. Isso pode acontecer se você esquecer de bater o ponto ao sair.

### Como solicito ajuste de um dia incompleto?
Atualmente, você deve entrar em contato com seu gestor ou RH. Em breve, haverá um botão direto no histórico para solicitar ajustes.

### Posso alterar meus registros?
Não é possível alterar registros diretamente. Você deve solicitar um ajuste que será aprovado pelo gestor.

### Os registros aparecem em tempo real?
Sim, quando você bate o ponto na página principal, os registros aparecem imediatamente no histórico.

### Por que a média por dia é diferente do total dividido pelos dias?
A média considera apenas os dias em que você trabalhou (com registros), não conta fins de semana ou dias sem registro.

### Posso ver o histórico de outros funcionários?
Não, por questões de privacidade, você só pode ver seu próprio histórico. Gestores podem ter acesso através de relatórios específicos.

### Quanto tempo os registros ficam disponíveis?
Todos os registros ficam disponíveis permanentemente no sistema, desde o início do seu contrato.

---

## Suporte

Para dúvidas ou problemas:
1. Consulte este guia
2. Entre em contato com seu gestor
3. Abra um chamado com o RH
4. Envie email para: suporte@empresa.com
