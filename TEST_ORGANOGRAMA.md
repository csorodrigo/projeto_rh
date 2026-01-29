# Checklist de Testes - Organograma Visual Interativo

## Setup Inicial

### Pré-requisitos
- [x] Biblioteca @xyflow/react instalada
- [x] Build do projeto bem-sucedido
- [x] Funcionários cadastrados no sistema
- [x] Pelo menos um funcionário sem gestor (CEO)

---

## Testes de Funcionalidade

### 1. Carregamento da Página
- [ ] Página carrega sem erros
- [ ] Loading state aparece brevemente
- [ ] Hierarquia renderiza corretamente
- [ ] Estatísticas aparecem no topo
- [ ] Nenhum erro no console

**URL:** `/funcionarios/organograma`

---

### 2. Visualização Hierárquica

#### Renderização Básica
- [ ] CEO aparece no topo (nível 0)
- [ ] Subordinados diretos no nível abaixo
- [ ] Linhas conectam gestores a subordinados
- [ ] Avatares carregam corretamente
- [ ] Nomes, cargos e departamentos visíveis

#### Badges e Indicadores
- [ ] CEO tem badge amarelo "CEO"
- [ ] Funcionários com subordinados mostram contador
- [ ] Ausências mostram badge vermelho (se houver)
- [ ] Tamanhos diferentes por nível (CEO maior)

---

### 3. Interatividade

#### Zoom e Pan
- [ ] Scroll do mouse faz zoom in/out
- [ ] Drag move o canvas (pan)
- [ ] Controles de zoom funcionam:
  - [ ] Botão "+" aumenta zoom
  - [ ] Botão "-" diminui zoom
  - [ ] Botão "1:1" reseta zoom
  - [ ] Botão "Fit" ajusta tela
- [ ] Percentual de zoom atualiza

#### Mini-map
- [ ] Mini-map aparece no canto
- [ ] Cores diferentes por nível
- [ ] Clique no mini-map navega
- [ ] Viewport indicator funciona

---

### 4. Seleção de Nodes

#### Clique em Funcionário
- [ ] Clique abre painel de detalhes
- [ ] Node fica destacado (ring azul)
- [ ] Caminho até CEO é destacado
- [ ] Badge "Caminho destacado: X níveis" aparece
- [ ] Linhas do caminho animam

#### Painel de Detalhes
- [ ] Avatar e nome corretos
- [ ] Cargo e departamento aparecem
- [ ] Email e telefone (se disponíveis)
- [ ] Data de admissão formatada
- [ ] Matrícula exibida

#### Gestor Direto
- [ ] Gestor aparece no painel
- [ ] Clique no gestor navega para ele
- [ ] Painel atualiza

#### Subordinados Diretos
- [ ] Lista de subordinados aparece
- [ ] Clique em subordinado navega
- [ ] Contador correto

#### Caminho Hierárquico
- [ ] Breadcrumb de gestores aparece
- [ ] Clique em gestor do caminho navega
- [ ] Ordem correta (gestor direto ao CEO)

#### Botões de Ação
- [ ] "Ver Perfil Completo" abre `/funcionarios/{id}`
- [ ] "Enviar Email" abre cliente de email
- [ ] Botão fechar (X) fecha painel

---

### 5. Busca e Filtros

#### Abrir Painel de Busca
- [ ] Botão "Buscar" abre painel lateral
- [ ] Input de busca aparece
- [ ] Filtros aparecem
- [ ] Botão fechar (X) fecha painel

#### Busca Textual
- [ ] Digite nome → funcionário aparece
- [ ] Digite cargo → funcionário aparece
- [ ] Digite email → funcionário aparece
- [ ] Digite departamento → funcionários aparecem
- [ ] Busca é case-insensitive
- [ ] Resultados atualizam em tempo real

#### Filtro por Departamento
- [ ] Dropdown mostra todos departamentos
- [ ] Seleção filtra resultados
- [ ] "Todos os departamentos" remove filtro

#### Filtro por Nível
- [ ] Dropdown mostra todos níveis
- [ ] Seleção filtra resultados
- [ ] Labels especiais (CEO, Diretoria)
- [ ] "Todos os níveis" remove filtro

#### Combinar Filtros
- [ ] Busca + departamento funciona
- [ ] Busca + nível funciona
- [ ] Departamento + nível funciona
- [ ] Todos combinados funcionam

#### Limpar Filtros
- [ ] Botão "Limpar filtros" aparece quando há filtros
- [ ] Clique limpa todos filtros
- [ ] Todos funcionários retornam

#### Clique em Resultado
- [ ] Clique centraliza no funcionário
- [ ] Painel de detalhes abre
- [ ] Caminho é destacado

#### Contador de Resultados
- [ ] "X funcionário(s) encontrado(s)" correto
- [ ] Singular/plural correto
- [ ] Atualiza com filtros

---

### 6. Layouts

#### Top-Down (Padrão)
- [ ] CEO no topo
- [ ] Hierarquia de cima para baixo
- [ ] Subordinados centralizados sob gestor

#### Left-Right
- [ ] Seleção muda layout
- [ ] CEO à esquerda
- [ ] Hierarquia esquerda para direita
- [ ] Transição suave

#### Compact
- [ ] Layout mais compacto
- [ ] Espaçamento vertical menor
- [ ] Toda hierarquia visível

#### Radial
- [ ] CEO no centro
- [ ] Subordinados em círculo
- [ ] Níveis em anéis concêntricos

---

### 7. Estatísticas

#### Cards de Estatísticas
- [ ] Total de funcionários correto
- [ ] Número de departamentos correto
- [ ] Média de subordinados calculada
- [ ] Profundidade hierárquica correta
- [ ] Funcionários sem gestor correto

#### Ícones e Cores
- [ ] Cada card tem ícone apropriado
- [ ] Cores diferentes por métrica
- [ ] Layout responsivo

---

### 8. Exportação

#### PNG
- [ ] Clique em "Exportar" → "Exportar como PNG"
- [ ] Arquivo baixa automaticamente
- [ ] Nome: "organograma.png"
- [ ] Imagem de alta qualidade (2x)
- [ ] Todo organograma visível
- [ ] Toast "Organograma exportado como PNG"

#### PDF
- [ ] Clique em "Exportar" → "Exportar como PDF"
- [ ] Arquivo baixa automaticamente
- [ ] Nome: "organograma.pdf"
- [ ] Tamanho A4
- [ ] Organograma ajustado à página
- [ ] Toast "Organograma exportado como PDF"

#### JSON
- [ ] Clique em "Exportar" → "Exportar como JSON"
- [ ] Arquivo baixa automaticamente
- [ ] Nome: "organograma.json"
- [ ] Estrutura hierárquica completa
- [ ] JSON válido (pode abrir em editor)
- [ ] Toast "Estrutura exportada como JSON"

#### CSV
- [ ] Clique em "Exportar" → "Exportar como CSV"
- [ ] Arquivo baixa automaticamente
- [ ] Nome: "organograma.csv"
- [ ] Todas colunas presentes
- [ ] CSV válido (pode abrir no Excel)
- [ ] Toast "Dados exportados como CSV"

---

### 9. Compartilhamento

#### Gerar Link
- [ ] Botão "Compartilhar" funciona
- [ ] Link copiado para clipboard
- [ ] Toast "Link copiado para a área de transferência"

#### Usar Link
- [ ] Cole link em nova aba
- [ ] Organograma abre
- [ ] Filtros preservados (se houver)

---

### 10. Estados Especiais

#### Loading
- [ ] Skeleton aparece ao carregar
- [ ] Transição suave para conteúdo

#### Vazio (Sem Funcionários)
- [ ] Ícone de rede aparece
- [ ] Mensagem "Nenhum funcionário cadastrado"
- [ ] Texto explicativo

#### Erro de API
- [ ] Toast de erro aparece
- [ ] Mensagem clara
- [ ] Console mostra erro técnico

---

### 11. Responsividade

#### Desktop (>1024px)
- [ ] Layout completo
- [ ] Painéis laterais funcionam
- [ ] Estatísticas em 5 colunas

#### Tablet (768-1024px)
- [ ] Layout adaptado
- [ ] Painéis sobrepõem
- [ ] Estatísticas em 2-3 colunas

#### Mobile (<768px)
- [ ] Scroll horizontal funciona
- [ ] Controles de zoom acessíveis
- [ ] Estatísticas em 1 coluna
- [ ] Painéis em fullscreen

---

### 12. Performance

#### Tempo de Carregamento
- [ ] <100ms para 100 funcionários
- [ ] <500ms para 500 funcionários
- [ ] <2s para 1000+ funcionários

#### Interatividade
- [ ] Zoom sem lag
- [ ] Pan suave
- [ ] Cliques responsivos
- [ ] Busca sem atrasos

#### Memória
- [ ] Sem memory leaks
- [ ] Uso de RAM aceitável

---

### 13. Acessibilidade

#### Navegação por Teclado
- [ ] Tab navega entre elementos
- [ ] Enter abre detalhes
- [ ] Esc fecha painéis
- [ ] Atalhos de zoom funcionam:
  - [ ] Ctrl + "+" zoom in
  - [ ] Ctrl + "-" zoom out
  - [ ] Ctrl + "0" reset

#### Screen Readers
- [ ] Labels apropriados
- [ ] Alt text em imagens
- [ ] ARIA attributes

---

### 14. Validações (API)

#### Mudança de Gestor Válida
- [ ] POST para `/api/organogram/update`
- [ ] Validação passa
- [ ] Hierarquia atualizada
- [ ] Response 200

#### Ciclo Detectado
- [ ] Tentar fazer A gestor de B, onde B é gestor de A
- [ ] Validação falha
- [ ] Mensagem clara
- [ ] Response 400

#### Próprio Gestor
- [ ] Tentar fazer A gestor de A
- [ ] Validação falha
- [ ] Mensagem clara
- [ ] Response 400

#### Sem Permissão
- [ ] Login como Employee
- [ ] Tentar atualizar hierarquia
- [ ] Response 403
- [ ] Mensagem clara

---

## Bugs Conhecidos

### Nenhum no momento ✅

---

## Observações

### Dados de Teste Recomendados

Para testes completos, cadastre:
- 1 CEO (sem gestor)
- 3-5 Diretores (gestor: CEO)
- 10-20 Gerentes (gestor: Diretores)
- 30-50 Funcionários (gestor: Gerentes)

Isso permite testar:
- Múltiplos níveis (3-4 níveis)
- Diferentes span of control
- Layouts variados
- Performance

### Browsers Testados

Recomendado testar em:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Aprovação Final

- [ ] Todos testes básicos passaram
- [ ] Todos testes de interatividade passaram
- [ ] Exportações funcionam
- [ ] Performance aceitável
- [ ] Sem erros no console
- [ ] Documentação completa

**Assinatura:** ___________________________

**Data:** ___/___/______

---

**Status:** AGUARDANDO TESTES
