# Guia de Animações e Micro-Interactions

Sistema completo de animações e micro-interactions implementado para melhorar a UX do sistema RH.

## 📋 Índice

- [Keyframes Disponíveis](#keyframes-disponíveis)
- [Classes de Utilidade](#classes-de-utilidade)
- [Componentes Atualizados](#componentes-atualizados)
- [Exemplos de Uso](#exemplos-de-uso)
- [Performance](#performance)

## 🎬 Keyframes Disponíveis

### Fade Animations
```css
fadeIn      - Fade in suave (0 → 100% opacity)
fadeOut     - Fade out suave (100% → 0% opacity)
```

### Slide Animations
```css
slideInUp      - Slide de baixo para cima com fade
slideInDown    - Slide de cima para baixo com fade
slideInLeft    - Slide da esquerda para direita com fade
slideInRight   - Slide da direita para esquerda com fade
slideOutRight  - Slide para direita com fade out
```

### Scale Animations
```css
scaleIn   - Scale in com fade (95% → 100%)
scaleOut  - Scale out com fade (100% → 95%)
```

### Effect Animations
```css
pulse         - Pulse de opacidade (padrão)
pulseSlow     - Pulse lento com scale sutil
shimmer       - Efeito shimmer para loading
bounce        - Bounce vertical
bounceSubtle  - Bounce sutil
shake         - Shake horizontal para erros
spin          - Rotação contínua
expandWidth   - Expande largura 0% → 100%
```

## 🎨 Classes de Utilidade

### Animações Básicas
```jsx
// Fade
<div className="animate-fade-in">Conteúdo</div>
<div className="animate-fade-out">Conteúdo</div>

// Slide
<div className="animate-slide-up">Conteúdo</div>
<div className="animate-slide-down">Conteúdo</div>
<div className="animate-slide-left">Conteúdo</div>
<div className="animate-slide-right">Conteúdo</div>

// Scale
<div className="animate-scale-in">Modal</div>
<div className="animate-scale-out">Modal</div>

// Effects
<div className="animate-pulse-slow">Badge urgente</div>
<div className="animate-shimmer">Loading skeleton</div>
<div className="animate-bounce-subtle">Notificação</div>
<div className="animate-shake">Campo com erro</div>
```

### Transições Suaves
```jsx
// All properties
<div className="transition-smooth">Elemento</div>

// Colors only
<div className="transition-colors-smooth">Elemento</div>

// Transform only
<div className="transition-transform-smooth">Elemento</div>

// Shadow only
<div className="transition-shadow-smooth">Card</div>
```

### Hover Effects
```jsx
// Lift on hover
<div className="hover-lift">Card interativo</div>

// Scale on hover
<div className="hover-scale">Botão</div>

// Glow on hover
<div className="hover-glow">Card especial</div>
```

### Interactive States
```jsx
// Press effect
<button className="press-effect">Botão</button>

// Link animated underline
<a className="link-animated">Link</a>
```

### Loading States
```jsx
// Shimmer skeleton
<div className="skeleton-shimmer h-4 w-full"></div>

// Progress gradient
<div className="progress-gradient"></div>
```

### Stagger Animations
```jsx
// Stagger children fade-in (até 8 filhos)
<div className="stagger-fade-in">
  <div>Item 1</div>  {/* delay: 0.05s */}
  <div>Item 2</div>  {/* delay: 0.10s */}
  <div>Item 3</div>  {/* delay: 0.15s */}
</div>
```

## 🔧 Componentes Atualizados

### Button
**Melhorias:**
- Active scale effect (`active:scale-95`)
- Hover shadow em variantes default/destructive
- Border color transition em outline
- Link com underline animado
- GPU acceleration (`will-change-transform`)

```jsx
<Button>Hover para ver shadow</Button>
<Button variant="link">Link com underline animado</Button>
```

### Card
**Melhorias:**
- Hover shadow elevation
- Border color transition
- Smooth shadow transition

```jsx
<Card>
  {/* Hover para ver shadow e border transition */}
</Card>
```

### Dialog/Modal
**Melhorias:**
- Scale-in animation na abertura
- Scale-out animation no fechamento
- Overlay fade suave

```jsx
<Dialog>
  <DialogContent>
    {/* Abre com scale-in animado */}
  </DialogContent>
</Dialog>
```

### Dropdown Menu
**Melhorias:**
- Slide-down animation
- Fade-out ao fechar
- Smooth color transitions nos itens

```jsx
<DropdownMenu>
  <DropdownMenuContent>
    {/* Slide-down animation */}
  </DropdownMenuContent>
</DropdownMenu>
```

### Badge
**Melhorias:**
- Transform transition adicionada
- Suporte para animações customizadas

```jsx
<Badge>Status</Badge>
<Badge className="animate-pulse-slow">Urgente</Badge>
```

### Status Badge
**Melhorias:**
- Hover shadow colorido por variante
- Pulse lento em badges urgentes
- Will-change optimization

```jsx
<QuickStatusBadge status="pending" />  {/* Com pulse */}
<QuickStatusBadge status="urgent" />   {/* Com pulse */}
<QuickStatusBadge status="approved" /> {/* Sem pulse */}
```

### Toast (Sonner)
**Melhorias:**
- Slide-in da direita
- Press effect em botões
- Hover smooth no close button

```jsx
toast.success("Animação slide-in da direita!")
```

### Progress
**Melhorias:**
- Gradient animado
- Smooth width transition

```jsx
<Progress value={progress} />
```

### Skeleton
**Melhorias:**
- Shimmer effect ao invés de pulse simples
- Loading mais moderno e profissional

```jsx
<Skeleton className="h-4 w-full" />
```

## 💡 Exemplos de Uso

### Cards que aparecem em sequência
```jsx
<div className="stagger-fade-in">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

### Modal com animação personalizada
```jsx
<Dialog>
  <DialogContent className="animate-scale-in">
    <DialogTitle>Título</DialogTitle>
    <DialogDescription>Descrição</DialogDescription>
  </DialogContent>
</Dialog>
```

### Botão com feedback visual completo
```jsx
<Button className="hover-glow press-effect">
  Clique aqui
</Button>
```

### Loading skeleton moderno
```jsx
<div className="space-y-3">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Badge urgente com pulse
```jsx
<QuickStatusBadge status="urgent" />
{/* ou */}
<Badge className="animate-pulse-slow">Urgente</Badge>
```

### Progress bar animado
```jsx
<Progress value={progress} className="progress-gradient" />
```

### Link com underline animado
```jsx
<a href="#" className="link-animated text-primary">
  Saiba mais
</a>
```

### Campo com erro (shake animation)
```jsx
{error && (
  <Input className="animate-shake" />
)}
```

## ⚡ Performance

### Otimizações Implementadas

**1. Transform e Opacity**
- Todas as animações usam `transform` e `opacity`
- Propriedades que não causam reflow/repaint

**2. Will-Change**
```css
.will-change-transform { will-change: transform; }
.will-change-opacity { will-change: opacity; }
```

**3. GPU Acceleration**
```css
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

**4. Cubic-Bezier Suaves**
```css
cubic-bezier(0.4, 0, 0.2, 1)  /* ease-out suave */
cubic-bezier(0.16, 1, 0.3, 1) /* scale effect */
```

### Guidelines de Performance

✅ **Faça:**
- Use `transform` e `opacity` para animações
- Aplique `will-change` apenas durante animações
- Use `transition-*-smooth` para transições específicas
- Prefira animações curtas (200-400ms)

❌ **Evite:**
- Animar `width`, `height`, `top`, `left`
- Aplicar `will-change` permanentemente
- Animações longas (>500ms) sem necessidade
- Muitas animações simultâneas

### Monitoring

Verifique performance com DevTools:
```javascript
// Chrome DevTools → Performance → Record
// Procure por:
// - Layout shifts (CLS)
// - Long tasks
// - Frame drops
```

## 🎯 Quando Usar Cada Animação

### Fade
- Aparecer/desaparecer conteúdo
- Tooltips
- Overlays

### Slide
- Dropdowns
- Sidebars
- Notifications
- Toasts

### Scale
- Modals
- Popovers
- Zoom effects

### Pulse
- Badges urgentes
- Notificações pendentes
- Status "em andamento"

### Shimmer
- Loading skeletons
- Placeholders
- Data fetching

### Shake
- Validação com erro
- Feedback negativo
- Campos inválidos

### Bounce
- Elementos de destaque
- Chamar atenção
- Notificações importantes

## 📦 Componente de Showcase

Um componente completo de demonstração está disponível:

```jsx
import { AnimationShowcase } from "@/components/ui/animation-showcase"

export default function Page() {
  return <AnimationShowcase />
}
```

Este componente demonstra todas as animações e micro-interactions implementadas.

## 🔄 Atualizações Futuras

Melhorias planejadas:
- [ ] Animações de página (page transitions)
- [ ] Animações de lista (enter/exit)
- [ ] Gestures (swipe, drag)
- [ ] Parallax effects
- [ ] Scroll-triggered animations
- [ ] Micro-interactions customizadas por módulo

---

**Última atualização:** 2026-01-28
**Versão:** 1.0.0
