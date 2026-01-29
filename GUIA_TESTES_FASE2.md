# Guia de Testes - Fase 2

## ✅ Checklist de Validação

### Pré-requisitos
```bash
# 1. Instalar dependências (se necessário)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Aguardar mensagem: "Ready in X seconds"
# 4. Abrir navegador em http://localhost:3000
```

---

## 🧪 Testes por Funcionalidade

### TESTE 1: Página de Relatórios Hub
**Rota**: `/relatorios`

**Passos**:
1. Acessar `/relatorios` no navegador
2. Verificar se aparecem 4 cards de categoria
3. Verificar ícones e cores:
   - ⏰ Verde: "Registro de ponto"
   - 📅 Laranja: "Férias e ausências"
   - 👥 Azul: "Dados pessoais"
   - 📁 Rosa: "Projetos e tarefas"
4. Passar mouse sobre cada card (deve ter efeito hover)
5. Verificar se mostra "X relatórios" abaixo de cada título
6. Scroll down: verificar seção "Relatórios Legais"
7. Verificar indicadores rápidos no final

**Resultado Esperado**:
- ✅ Layout responsivo
- ✅ Hover effects suaves
- ✅ Ícones coloridos corretos
- ✅ Estatísticas carregadas
- ✅ Sem erros no console

---

### TESTE 2: Navegação entre Categorias
**Rotas**: `/relatorios/ponto`, `/relatorios/ausencias`, etc.

**Passos**:
1. Na página `/relatorios`, clicar no card "Registro de ponto"
2. Verificar se navega para `/relatorios/ponto`
3. Verificar empty state:
   - Ícone de arquivo
   - Título: "Nenhum relatório disponível"
   - Descrição
   - Botão "Voltar para Relatórios"
4. Clicar em "Voltar para Relatórios"
5. Repetir para outras categorias

**Resultado Esperado**:
- ✅ Navegação funcional
- ✅ Empty state renderizado
- ✅ Botão voltar funciona
- ✅ URL correta na barra

---

### TESTE 3: Configurações > Automações
**Rota**: `/config` (aba Automações)

**Passos**:
1. Acessar `/config`
2. Clicar na aba "Automações" (ícone raio ⚡)
3. Verificar se aparecem 6 cards de automação
4. Verificar switches (3 devem estar ON, 3 OFF)
5. Alternar um switch de OFF para ON
6. Verificar se botão "Salvar Alterações" aparece no bottom-right
7. Clicar em "Salvar Alterações"
8. Verificar toast de sucesso
9. Verificar se botão desaparece

**Automações Esperadas**:
1. ✅ Notificação de ausências (ON)
2. ✅ Lembrete de ponto (ON)
3. ⬜ Aprovação automática (OFF)
4. ✅ Mensagem de aniversário (ON)
5. ✅ Alerta de documentos (ON)
6. ⬜ Relatório mensal (OFF)

**Resultado Esperado**:
- ✅ Switches funcionais
- ✅ Botão sticky aparece/desaparece
- ✅ Toast verde de sucesso
- ✅ Estado mantido

---

### TESTE 4: Configurações > Calendários - Menu Lateral
**Rota**: `/config` (aba Calendários)

**Passos**:
1. Acessar `/config`
2. Clicar na aba "Calendários"
3. Verificar menu lateral esquerdo com 3 opções:
   - ⭐ Feriados
   - 🌴 Férias
   - 🔒 Ausências
4. Verificar que "Feriados" está selecionado (fundo roxo)
5. Clicar em "Férias"
6. Verificar:
   - Fundo roxo move para "Férias"
   - Título muda para "Férias"
   - Descrição muda
   - Chevron > aparece
7. Repetir para "Ausências"

**Resultado Esperado**:
- ✅ Menu lateral visível
- ✅ Highlight visual funciona
- ✅ Chevron animado
- ✅ Título/descrição dinâmicos
- ✅ Layout responsivo

---

### TESTE 5: Support Chat Widget
**Visível em**: Todas as páginas do dashboard

**Passos**:
1. Acessar qualquer página do dashboard
2. Verificar botão roxo no canto inferior direito
3. Clicar no botão
4. Verificar se abre card de chat:
   - Header roxo "Suporte RH"
   - Mensagem de boas-vindas
   - Input de mensagem
   - Botão enviar
5. Digitar uma mensagem no input
6. Pressionar Enter
7. Verificar se mensagem é enviada (console.log)
8. Clicar no X para fechar
9. Verificar se volta para botão flutuante

**Resultado Esperado**:
- ✅ Botão sempre visível (fixed position)
- ✅ Abre/fecha suavemente
- ✅ Enter funciona
- ✅ Botão enviar funciona
- ✅ Visual consistente

---

### TESTE 6: Empty States
**Rotas**: Páginas de categoria vazias

**Passos**:
1. Acessar qualquer página de categoria vazia
2. Verificar elementos:
   - Ícone cinza (círculo com fundo muted)
   - Título centralizado
   - Descrição centralizada
   - Botão de ação (se aplicável)
3. Verificar responsividade (resize browser)

**Resultado Esperado**:
- ✅ Centralizado vertical e horizontal
- ✅ Espaçamento adequado
- ✅ Texto legível
- ✅ Responsivo

---

## 📱 Testes de Responsividade

### Mobile (375px)
```javascript
// No DevTools, abrir modo responsivo
// Selecionar iPhone SE ou similar
```

**Verificar**:
- [ ] Cards de relatório empilham em 1 coluna
- [ ] Menu lateral de calendários colapsa ou fica acessível
- [ ] Chat widget não bloqueia conteúdo
- [ ] Tabs de configuração rolam horizontalmente
- [ ] Textos não quebram incorretamente

### Tablet (768px)
**Verificar**:
- [ ] Cards em 2 colunas
- [ ] Menu lateral visível
- [ ] Espaçamentos adequados

### Desktop (1920px)
**Verificar**:
- [ ] Layout completo
- [ ] Sem elementos muito espaçados
- [ ] Conteúdo centralizado

---

## 🐛 Testes de Erros Comuns

### Console do Navegador
**Abrir DevTools > Console**

**Verificar ausência de**:
- ❌ Erros de import
- ❌ Warnings de React Hooks
- ❌ 404 de assets
- ❌ Errors de TypeScript

### Network Tab
**Verificar**:
- ✅ Todas as rotas retornam 200
- ✅ Nenhum arquivo faltando
- ✅ Tempo de carregamento < 2s

---

## 🎨 Testes Visuais

### Paleta de Cores
**Verificar cores consistentes**:
- Verde: `bg-green-100`, `text-green-600`
- Laranja: `bg-orange-100`, `text-orange-600`
- Azul: `bg-blue-100`, `text-blue-600`
- Rosa: `bg-pink-100`, `text-pink-600`
- Roxo: `bg-purple-600` (CTAs)

### Tipografia
- Títulos: `text-2xl font-bold` ou `text-xl font-semibold`
- Descrições: `text-muted-foreground text-sm`
- Botões: Consistentes com shadcn/ui

### Espaçamentos
- Cards: `gap-4` ou `gap-6`
- Seções: `space-y-6`
- Padding: `p-6` em cards

---

## ✅ Checklist Final

### Funcionalidades
- [ ] Todas as rotas navegáveis
- [ ] Empty states exibidos
- [ ] Switches salvam estado
- [ ] Chat abre/fecha
- [ ] Menu lateral funciona
- [ ] Hover effects suaves

### Performance
- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Nenhum erro no console

### Acessibilidade
- [ ] Tab navigation funciona
- [ ] ARIA labels presentes
- [ ] Contraste adequado (WCAG AA)
- [ ] Screen reader friendly

### Cross-browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 🚨 Problemas Conhecidos & Soluções

### Problema: Build falha
**Solução**:
```bash
rm -rf .next
npm run build
```

### Problema: Tipos não encontrados
**Solução**:
```bash
npm install
```

### Problema: Porta 3000 em uso
**Solução**:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 📝 Relatório de Testes

Preencha após executar todos os testes:

```
Data: __/__/____
Testador: ___________

Página de Relatórios:     [ ] Pass [ ] Fail
Navegação:                [ ] Pass [ ] Fail
Automações:               [ ] Pass [ ] Fail
Calendários:              [ ] Pass [ ] Fail
Chat Widget:              [ ] Pass [ ] Fail
Empty States:             [ ] Pass [ ] Fail
Responsividade Mobile:    [ ] Pass [ ] Fail
Responsividade Tablet:    [ ] Pass [ ] Fail
Responsividade Desktop:   [ ] Pass [ ] Fail
Console sem erros:        [ ] Pass [ ] Fail
Performance:              [ ] Pass [ ] Fail

Observações:
_________________________________________
_________________________________________
_________________________________________
```

---

**Versão**: 1.0
**Data**: 29/01/2026
**Status**: Pronto para testes
