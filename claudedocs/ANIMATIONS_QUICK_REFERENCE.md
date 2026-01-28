# Quick Reference - Animações

Guia rápido para usar as animações no sistema RH.

## 🚀 Classes Mais Usadas

### Fade
```jsx
className="animate-fade-in"     // Aparecer suavemente
className="animate-fade-out"    // Desaparecer suavemente
```

### Slide
```jsx
className="animate-slide-up"    // Deslizar de baixo para cima
className="animate-slide-down"  // Deslizar de cima para baixo
className="animate-slide-right" // Deslizar da direita para esquerda
```

### Scale
```jsx
className="animate-scale-in"    // Zoom in com fade
className="animate-scale-out"   // Zoom out com fade
```

### Hover
```jsx
className="hover-lift"          // Eleva ao passar mouse
className="hover-scale"         // Aumenta ao passar mouse
className="hover-glow"          // Glow ao passar mouse
```

### Transitions
```jsx
className="transition-smooth"           // Transição suave (all)
className="transition-colors-smooth"    // Apenas cores
className="transition-transform-smooth" // Apenas transform
className="transition-shadow-smooth"    // Apenas shadow
```

## 🎯 Uso por Contexto

### Cards
```jsx
// Card com hover elevation
<Card className="hover-lift">
  {/* conteúdo */}
</Card>

// Card aparecendo com fade
<Card className="animate-fade-in">
  {/* conteúdo */}
</Card>
```

### Buttons
```jsx
// Já tem animações automáticas
<Button>Click me</Button>

// Com glow extra
<Button className="hover-glow">Special</Button>

// Com press effect manual
<div className="press-effect">Custom</div>
```

### Modals/Dialogs
```jsx
// Animação automática no Dialog
<Dialog>
  <DialogContent>
    {/* Scale-in automático */}
  </DialogContent>
</Dialog>
```

### Badges de Status
```jsx
// Badges urgentes pulsam automaticamente
<QuickStatusBadge status="urgent" />
<QuickStatusBadge status="pending" />

// Badge customizado com pulse
<Badge className="animate-pulse-slow">Urgente</Badge>
```

### Formulários
```jsx
// Campo com erro - shake
<Input className={error ? "animate-shake" : ""} />

// Label de erro aparecendo
{error && (
  <p className="text-xs text-destructive animate-fade-in">
    Campo obrigatório
  </p>
)}
```

### Listas/Grids
```jsx
// Cards aparecendo em sequência
<div className="stagger-fade-in grid grid-cols-3 gap-4">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
  {/* Até 8 itens com delay escalonado */}
</div>
```

### Loading States
```jsx
// Skeleton com shimmer
<Skeleton className="h-4 w-full" />

// Progress com gradient animado
<Progress value={progress} />

// Custom shimmer
<div className="skeleton-shimmer h-20 rounded-lg" />
```

### Toasts
```jsx
// Animação automática - slide da direita
toast.success("Mensagem")
toast.error("Erro")
toast.loading("Carregando...")
```

### Links
```jsx
// Link com underline animado
<a href="#" className="link-animated text-primary">
  Saiba mais
</a>
```

## 📦 Componentes com Animações Automáticas

Estes componentes já vêm com animações incorporadas:

- ✅ **Button** - hover shadow, active press, link underline
- ✅ **Card** - hover elevation, border transition
- ✅ **Dialog** - scale in/out, overlay fade
- ✅ **DropdownMenu** - slide down, fade out
- ✅ **Toast** - slide in da direita
- ✅ **Progress** - gradient animado
- ✅ **Skeleton** - shimmer effect
- ✅ **StatusBadge** - pulse em urgentes/pendentes

## 🎨 Combinações Comuns

### Card Interativo Completo
```jsx
<Card className="animate-fade-in hover-lift group">
  <CardHeader>
    <div className="transition-colors-smooth group-hover:text-primary">
      Título
    </div>
  </CardHeader>
  <CardContent>
    <Button className="hover-glow">Ação</Button>
  </CardContent>
</Card>
```

### Dropdown Animado
```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">⋮</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* Slide-down automático */}
    <DropdownMenuItem>Item 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Form Field com Validação
```jsx
<div className="space-y-2">
  <Label>Nome</Label>
  <Input
    className={error ? "animate-shake border-destructive" : ""}
  />
  {error && (
    <p className="text-xs text-destructive animate-fade-in">
      {error}
    </p>
  )}
</div>
```

### Grid de Cards Stagger
```jsx
<div className="stagger-fade-in grid grid-cols-1 md:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="hover-lift">
      {/* conteúdo */}
    </Card>
  ))}
</div>
```

## ⚡ Performance Tips

### DO ✅
```jsx
// Use transform e opacity
<div className="transition-transform-smooth hover:scale-105" />

// Use will-change durante animação
<div className="will-change-transform animate-scale-in" />

// Animações curtas (200-400ms)
<div className="animate-fade-in" /> // 300ms
```

### DON'T ❌
```jsx
// Não anime width/height diretamente
<div className="transition-all hover:w-full" /> // ❌

// Não use will-change permanentemente
<div className="will-change-transform" /> // ❌

// Não use animações longas
<div style={{ animation: "fadeIn 2s" }} /> // ❌
```

## 🔍 Debugging

### Ver animações no DevTools
1. Chrome DevTools → Performance → Record
2. Interaja com elementos animados
3. Verifique:
   - FPS deve estar em 60
   - Sem layout shifts
   - Apenas composite/paint

### Testar animações
Acesse: `http://localhost:3000/animations`

### Verificar classes aplicadas
```jsx
// Use React DevTools para inspecionar
<Card className="animate-fade-in hover-lift" />
```

## 📱 Responsive Animations

Use com breakpoints Tailwind:

```jsx
// Animação apenas em mobile
<div className="md:animate-none animate-slide-up" />

// Hover apenas em desktop
<Card className="md:hover-lift" />

// Stagger em desktop, normal em mobile
<div className="md:stagger-fade-in space-y-4">
  <Card />
  <Card />
</div>
```

## 🎭 Estados Especiais

### Loading
```jsx
<Skeleton className="h-20 w-full" />
<div className="animate-spin">⟳</div>
<Progress value={progress} />
```

### Success
```jsx
toast.success("Sucesso!")
<QuickStatusBadge status="approved" />
```

### Error
```jsx
<Input className="animate-shake border-destructive" />
toast.error("Erro!")
```

### Warning
```jsx
<QuickStatusBadge status="pending" /> {/* Com pulse */}
toast.warning("Atenção!")
```

## 📚 Recursos Adicionais

- **Showcase completo:** `/animations`
- **Guia detalhado:** `claudedocs/ANIMATIONS_GUIDE.md`
- **Implementação:** `claudedocs/ANIMATIONS_IMPLEMENTATION_SUMMARY.md`
- **Componentes:**
  - `src/components/ui/animation-showcase.tsx`
  - `src/components/examples/animated-employee-card.tsx`
  - `src/components/examples/animated-form-example.tsx`

---

**Versão:** 1.0.0 | **Última atualização:** 2026-01-28
