# Checklist de Testes - Animações

Lista de verificação para testar todas as animações implementadas.

## 🎯 Acesso à Página de Testes

URL: `http://localhost:3000/animations`

## ✅ Componentes Base

### Button
- [ ] Hover mostra shadow sutil
- [ ] Click/Active mostra scale-down (95%)
- [ ] Link variant tem underline animado
- [ ] Destructive variant tem shadow vermelho no hover
- [ ] Outline variant tem border transition
- [ ] Disabled não tem animações

### Card
- [ ] Hover aumenta shadow
- [ ] Hover muda border color
- [ ] Transition é suave
- [ ] Não há layout shift no hover

### Dialog/Modal
- [ ] Abre com scale-in suave
- [ ] Fecha com scale-out
- [ ] Overlay faz fade in/out
- [ ] Botão X tem hover state
- [ ] Não há jump no conteúdo

### Dropdown Menu
- [ ] Abre com slide-down
- [ ] Fecha com fade-out
- [ ] Items têm hover background
- [ ] Transition de cores é suave
- [ ] Submenu abre corretamente

### Badge
- [ ] Aceita classes de animação
- [ ] Transform transition funciona

### Status Badge
- [ ] Badges urgentes pulsam
- [ ] Badges pendentes pulsam
- [ ] Hover mostra shadow colorido
- [ ] Tooltip aparece corretamente
- [ ] Pulse é sutil e profissional

### Toast (Sonner)
- [ ] Success slide da direita
- [ ] Error slide da direita
- [ ] Warning slide da direita
- [ ] Info slide da direita
- [ ] Loading tem spinner animado
- [ ] Botões têm press effect
- [ ] Close button tem hover smooth

### Progress Bar
- [ ] Gradient está animado
- [ ] Mudança de valor é suave
- [ ] Cores estão corretas

### Skeleton
- [ ] Shimmer effect visível
- [ ] Animação é contínua
- [ ] Não causa flickering

### Alert
- [ ] Hover muda background sutilmente
- [ ] Destructive variant está estilizado
- [ ] Transition é suave

### Popover
- [ ] Abre com scale-in
- [ ] Fecha com scale-out
- [ ] Posicionamento correto

## 🎨 Classes de Utilidade

### Fade Animations
- [ ] `animate-fade-in` - fade suave
- [ ] `animate-fade-out` - fade out suave

### Slide Animations
- [ ] `animate-slide-up` - de baixo para cima
- [ ] `animate-slide-down` - de cima para baixo
- [ ] `animate-slide-left` - da esquerda
- [ ] `animate-slide-right` - da direita

### Scale Animations
- [ ] `animate-scale-in` - zoom in
- [ ] `animate-scale-out` - zoom out

### Effect Animations
- [ ] `animate-pulse-slow` - pulse sutil
- [ ] `animate-shimmer` - shimmer visível
- [ ] `animate-bounce-subtle` - bounce leve
- [ ] `animate-shake` - shake para erros
- [ ] `animate-spin` - rotação contínua

### Hover Effects
- [ ] `hover-lift` - eleva elemento
- [ ] `hover-scale` - aumenta elemento
- [ ] `hover-glow` - adiciona glow

### Interactive
- [ ] `press-effect` - active scale down
- [ ] `link-animated` - underline animado

### Transitions
- [ ] `transition-smooth` - all properties
- [ ] `transition-colors-smooth` - apenas cores
- [ ] `transition-transform-smooth` - apenas transform
- [ ] `transition-shadow-smooth` - apenas shadow

### Stagger
- [ ] `stagger-fade-in` - 8 elementos com delays diferentes
- [ ] Delay aumenta progressivamente
- [ ] Não há saltos visuais

## 📱 Exemplos Práticos

### Employee Cards (Tab 2)
- [ ] Cards aparecem em stagger
- [ ] Hover eleva cards
- [ ] Avatar tem scale no hover do card
- [ ] Nome tem color transition no hover
- [ ] Status badge correto
- [ ] Menu dropdown slide corretamente
- [ ] Links têm underline animado
- [ ] Ícones têm scale sutil no hover

### Formulário (Tab 3)
- [ ] Modal abre com scale-in
- [ ] Campos sem erro são normais
- [ ] Submit sem preencher mostra shake
- [ ] Mensagens de erro aparecem com fade-in
- [ ] Toast de erro aparece
- [ ] Toast de loading aparece
- [ ] Toast de sucesso aparece
- [ ] Form reseta após sucesso
- [ ] Focus remove shake e erro

## ⚡ Performance

### Frame Rate
- [ ] Animações rodam a 60fps
- [ ] Não há frame drops visíveis
- [ ] Múltiplas animações simultâneas OK

### Layout Shifts
- [ ] Nenhum CLS (Cumulative Layout Shift)
- [ ] Elementos não "pulam" durante animação
- [ ] Scroll position mantida

### Recursos
- [ ] CPU usage razoável (<30%)
- [ ] Memory leaks ausentes
- [ ] GPU acceleration ativo

### DevTools
- [ ] Performance > Record > Apenas Composite/Paint
- [ ] Sem Layout/Reflow em animações
- [ ] Rendering > Paint Flashing - mínimo

## 🌐 Cross-Browser

### Chrome
- [ ] Todas animações OK
- [ ] Performance OK
- [ ] Sem warnings console

### Firefox
- [ ] Todas animações OK
- [ ] Performance OK
- [ ] Sem warnings console

### Safari
- [ ] Todas animações OK
- [ ] Performance OK
- [ ] Sem warnings console

### Edge
- [ ] Todas animações OK
- [ ] Performance OK
- [ ] Sem warnings console

## 📱 Responsive

### Mobile (< 640px)
- [ ] Animações funcionam
- [ ] Performance OK em mobile
- [ ] Gestos não interferem

### Tablet (640px - 1024px)
- [ ] Animações funcionam
- [ ] Layout responsivo OK
- [ ] Hover states OK (se touch screen)

### Desktop (> 1024px)
- [ ] Todas animações OK
- [ ] Hover states OK
- [ ] Performance excelente

## 🎭 Estados Especiais

### Loading
- [ ] Skeleton shimmer contínuo
- [ ] Progress gradient animado
- [ ] Spinner rotação suave
- [ ] Toast loading aparece

### Success
- [ ] Toast success verde
- [ ] Ícone correto
- [ ] Badge approved sem pulse
- [ ] Cor verde consistente

### Error
- [ ] Input shake funciona
- [ ] Toast error vermelho
- [ ] Badge rejected sem pulse
- [ ] Cor vermelha consistente

### Warning
- [ ] Toast warning amarelo
- [ ] Badge pending com pulse
- [ ] Cor amarela consistente

### Info
- [ ] Toast info azul
- [ ] Cor azul consistente

## 🔍 Acessibilidade

### Motion
- [ ] Animações respeitam `prefers-reduced-motion`
- [ ] Alternativas para usuários sensíveis
- [ ] Opção para desabilitar animações

### Focus
- [ ] Focus rings visíveis
- [ ] Focus não perdido em animações
- [ ] Tab order mantido

### Screen Readers
- [ ] ARIA labels corretos
- [ ] Anúncios de mudança de estado
- [ ] Toasts anunciados

## 🐛 Edge Cases

### Animações Simultâneas
- [ ] Múltiplos toasts OK
- [ ] Stagger + hover OK
- [ ] Modal + dropdown OK
- [ ] Form shake + toast OK

### Interrupção
- [ ] Fechar modal mid-animation OK
- [ ] Mudar tab mid-animation OK
- [ ] Scroll mid-animation OK
- [ ] Navigate away OK

### Rápidas Interações
- [ ] Hover rápido não quebra
- [ ] Click spam não quebra
- [ ] Tab rápido não quebra
- [ ] Resize rápido OK

## 📊 Métricas

### Timing
- Fade: ~300ms ✅
- Slide: ~300ms ✅
- Scale: ~200ms ✅
- Pulse: 2s loop ✅
- Shimmer: 2s loop ✅
- Shake: ~400ms ✅

### Durations
- [ ] Nenhuma animação > 500ms
- [ ] Maioria entre 200-400ms
- [ ] Loops são suaves

### Easing
- [ ] cubic-bezier suave
- [ ] Não há movimento robótico
- [ ] Aceleração/desaceleração natural

## ✅ Aprovação Final

### Qualidade Visual
- [ ] Todas animações suaves
- [ ] Nenhum glitch visual
- [ ] Cores consistentes
- [ ] Shadows corretos

### Performance
- [ ] 60fps consistente
- [ ] Sem memory leaks
- [ ] CPU usage aceitável
- [ ] GPU acceleration ativo

### UX
- [ ] Feedback visual claro
- [ ] Estados bem diferenciados
- [ ] Nenhuma animação distrai
- [ ] Profissional e polido

### Código
- [ ] Todas classes documentadas
- [ ] Exemplos funcionam
- [ ] Guias completos
- [ ] TypeScript sem erros

---

## 🎯 Como Usar Este Checklist

1. **Acesse** `http://localhost:3000/animations`
2. **Navegue** pelas 3 tabs
3. **Teste** cada item marcando ✅
4. **Anote** problemas encontrados
5. **Reporte** issues se necessário

## 📝 Report Template

Se encontrar problemas:

```markdown
**Componente:** [nome]
**Animação:** [qual]
**Problema:** [descrição]
**Browser:** [Chrome/Firefox/Safari/Edge]
**Device:** [Desktop/Mobile/Tablet]
**Steps to reproduce:**
1.
2.
3.

**Expected:**
**Actual:**
**Screenshot:** [se aplicável]
```

---

**Última atualização:** 2026-01-28
**Status:** Pronto para testes
