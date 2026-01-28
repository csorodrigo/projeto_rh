# Guia de Testes - Navegação Melhorada

## Como Testar as Melhorias

### 1. Testar Breadcrumbs

**Rota:** Qualquer página do dashboard

**Passos:**
1. Acesse `/dashboard`
2. Navegue para `/funcionarios`
3. Observe o breadcrumb: `Home > Funcionários`
4. Clique em "Home" - deve voltar ao dashboard
5. Acesse `/funcionarios/organograma`
6. Observe: `Home > Funcionários > Organograma`
7. Em mobile (<640px), veja truncamento

**Esperado:**
- ✅ Breadcrumb atualiza automaticamente
- ✅ Links funcionam corretamente
- ✅ Ícone de home visível
- ✅ Responsive em mobile

### 2. Testar Busca Global

**Rota:** Qualquer página

**Passos:**
1. Clique no ícone de busca no header
2. Campo de busca deve aparecer
3. Digite um termo de busca
4. Pressione Enter ou clique fora
5. Desktop: barra sempre visível
6. Mobile: toggle para economizar espaço

**Esperado:**
- ✅ Toggle funciona
- ✅ Auto-focus no campo
- ✅ Botão de fechar (×) funciona
- ✅ Submissão redireciona para `/busca?q=termo`

### 3. Testar Notificações

**Rota:** Qualquer página

**Passos:**
1. Observe badge vermelho com número no sino
2. Clique no ícone de notificações
3. Veja lista de notificações
4. Notificações não lidas têm:
   - Ponto azul à esquerda
   - Background destacado
   - Texto em cor primária
5. Scroll se tiver muitas notificações
6. Clique em "Ver todas as notificações"

**Esperado:**
- ✅ Badge anima (pulse)
- ✅ Contador correto
- ✅ Visual de não lidas diferente
- ✅ Scroll funciona
- ✅ Link funciona

### 4. Testar Quick Actions

**Rota:** Qualquer página (desktop)

**Passos:**
1. Clique no botão "+ Novo"
2. Dropdown abre com ações
3. Opções disponíveis:
   - Novo Funcionário
   - Registrar Ponto
4. Clique em uma opção
5. Deve navegar para rota correta

**Esperado:**
- ✅ Dropdown abre/fecha
- ✅ Ícones visíveis
- ✅ Navegação funciona
- ✅ Oculto em mobile

### 5. Testar Sidebar com Submenu

**Rota:** `/funcionarios`, `/ponto`, ou `/ausencias`

**Passos:**
1. Observe ícones coloridos
2. Veja badges em "Ausências" (5) e "Saúde" (3)
3. Clique em "Funcionários"
4. Submenu expande mostrando:
   - Lista
   - Organograma
   - Importar
5. Clique em "Organograma"
6. Submenu permanece aberto
7. Chevron roda 180° quando aberto
8. Border lateral nos subitens

**Esperado:**
- ✅ Ícones coloridos
- ✅ Badges visíveis
- ✅ Animação suave
- ✅ Auto-expansão na rota ativa
- ✅ Highlight visual claro

**Cores dos Ícones (Verificar):**
- Dashboard: azul
- Funcionários: verde
- Ponto: roxo
- Ausências: laranja
- PDI: cyan
- Saúde: vermelho
- Folha: verde-esmeralda
- Relatórios: índigo

### 6. Testar Module Tabs

#### Funcionários

**Rota:** `/funcionarios`

**Passos:**
1. Observe 3 tabs no topo:
   - Lista (ícone List)
   - Organograma (ícone Network)
   - Importar (ícone Upload)
2. Tab ativa tem border inferior azul
3. Clique em "Organograma"
4. Navegação funciona
5. Tab visual muda
6. Hover em tabs inativas mostra feedback

**Esperado:**
- ✅ 3 tabs visíveis
- ✅ Tab ativa destacada
- ✅ Navegação funciona
- ✅ Hover state visível

#### Ponto

**Rota:** `/ponto`

**Passos:**
1. Observe 3 tabs:
   - Hoje (ícone Clock)
   - Histórico (ícone History)
   - Configurações (ícone Settings)
2. Teste navegação entre tabs
3. Conteúdo muda corretamente

**Esperado:**
- ✅ Tabs funcionais
- ✅ Conteúdo atualiza
- ✅ Tab ativa sincroniza com URL

#### Ausências

**Rota:** `/ausencias`

**Passos:**
1. Observe 3 tabs:
   - Lista (ícone List)
   - Kanban (ícone Kanban)
   - Calendário (ícone Calendar)
2. Clique em "Kanban"
3. Veja página "Em desenvolvimento"
4. Clique em "Calendário"
5. Veja página "Em desenvolvimento"

**Esperado:**
- ✅ Tabs funcionais
- ✅ Páginas placeholder carregam
- ✅ UI consistente

### 7. Testar Responsividade

#### Mobile (<640px)

**Passos:**
1. Abra DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Selecione iPhone/Android
4. Navegue pelo sistema

**Verificar:**
- ✅ Breadcrumb trunca
- ✅ Busca vira toggle
- ✅ Quick actions ocultos
- ✅ Sidebar colapsa
- ✅ Tabs responsivas

#### Tablet (640px-1024px)

**Verificar:**
- ✅ Layout ajustado
- ✅ Sidebar colapsável
- ✅ Breadcrumb completo
- ✅ Elementos bem espaçados

#### Desktop (>1024px)

**Verificar:**
- ✅ Todas funcionalidades visíveis
- ✅ Sidebar expandida
- ✅ Busca sempre visível
- ✅ Quick actions visíveis

### 8. Testar Acessibilidade

**Ferramentas:** Navegador + Tab key

**Passos:**
1. Use apenas teclado (Tab, Enter, Esc)
2. Navegue pelos elementos
3. Verifique focus indicators
4. Teste screen reader (opcional)

**Verificar:**
- ✅ Tab navigation funciona
- ✅ Focus visível
- ✅ Enter ativa botões/links
- ✅ Esc fecha dropdowns
- ✅ ARIA labels presentes

### 9. Testar Páginas Placeholder

**Rotas para Testar:**

1. `/funcionarios/organograma`
   - Ícone Network grande
   - Texto "Em desenvolvimento"
   - UI consistente

2. `/funcionarios/importar`
   - Ícone Upload
   - Informações sobre formato
   - Botão "Baixar Modelo" (disabled)

3. `/ausencias/kanban`
   - Ícone Kanban
   - Mensagem explicativa
   - UI consistente

4. `/ausencias/calendario`
   - Ícone Calendar
   - Mensagem explicativa
   - UI consistente

**Esperado:**
- ✅ Todas carregam sem erro
- ✅ UI consistente
- ✅ Mensagens claras
- ✅ Breadcrumb e tabs funcionam

### 10. Testar Performance

**Ferramentas:** Chrome DevTools (Performance tab)

**Verificar:**
1. Animações a 60fps
2. Sem layout shifts
3. Navegação instantânea
4. Sem re-renders desnecessários

**Métricas Esperadas:**
- ✅ FPS: ~60
- ✅ Layout shifts: 0
- ✅ Time to Interactive: <1s
- ✅ Smooth animations

## Checklist Completo

### Visual
- [ ] Breadcrumbs aparecem corretamente
- [ ] Ícones coloridos na sidebar
- [ ] Badges de contagem visíveis
- [ ] Tabs com border ativo
- [ ] Notificações com ponto azul
- [ ] Quick actions dropdown

### Funcional
- [ ] Breadcrumb links funcionam
- [ ] Busca redireciona corretamente
- [ ] Notificações clicáveis
- [ ] Quick actions navegam
- [ ] Sidebar expande/colapsa
- [ ] Tabs navegam corretamente

### Responsivo
- [ ] Mobile: breadcrumb trunca
- [ ] Mobile: busca toggle
- [ ] Tablet: layout ajusta
- [ ] Desktop: tudo visível

### Acessibilidade
- [ ] Navegação por teclado
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Semântica correta

### Performance
- [ ] Animações suaves
- [ ] Sem layout shifts
- [ ] Carregamento rápido
- [ ] Sem bugs de re-render

## Problemas Conhecidos

Nenhum problema conhecido no momento.

## Reportar Problemas

Se encontrar algum problema durante os testes:

1. Anote a rota onde ocorreu
2. Descreva o comportamento esperado vs atual
3. Screenshots se possível
4. Console errors (F12 > Console)
5. Device/browser usado

## Próximos Passos Após Testes

Após validar todas as funcionalidades:

1. ✅ Implementar busca backend
2. ✅ Real-time em notificações
3. ✅ Organograma interativo
4. ✅ Kanban funcional
5. ✅ Calendário de ausências
6. ✅ Mais quick actions
7. ✅ Atalhos de teclado
