# Componente Kanban - Guia de Uso

## Visão Geral

Componente Kanban Board reutilizável implementado com HTML5 Drag API nativa, sem dependências externas.

## Localização

- **Componente**: `/src/components/ui/kanban.tsx`
- **Uso**: `/src/app/(dashboard)/ausencias/page.tsx`

## Recursos Implementados

### 1. Drag and Drop Nativo
- ✅ HTML5 Drag API para performance máxima
- ✅ Efeitos visuais durante arrasto (opacity, scale)
- ✅ Feedback visual na coluna de destino
- ✅ Transições suaves entre estados

### 2. Funcionalidades
- ✅ Mover cards entre colunas (drag & drop)
- ✅ Contador de items por coluna
- ✅ Cores por status (pending=amarelo, approved=verde, rejected=vermelho)
- ✅ Avatar do funcionário
- ✅ Data de início e fim
- ✅ Tipo de ausência
- ✅ Duração calculada

### 3. Design Responsivo
- ✅ Scroll horizontal em mobile (snap scroll)
- ✅ Ajuste de tamanhos para diferentes telas
- ✅ Sombras sutis e animações
- ✅ Max-height com scroll interno nas colunas

### 4. Integração com Sistema
- ✅ TypeScript com tipos completos
- ✅ Atualização de estado local e banco de dados
- ✅ Toast notifications
- ✅ Contador de estatísticas sincronizado

## Estrutura de Componentes

```
KanbanBoard (container)
├─ KanbanColumn (coluna com header e drop zone)
│  └─ KanbanCard (card arrastável)
│     ├─ Avatar do funcionário
│     ├─ Badge de tipo
│     ├─ Data range
│     └─ Duração
```

## Como Usar

### Exemplo Básico

```tsx
import { KanbanBoard, defaultAbsenceColumns, type KanbanItem } from "@/components/ui/kanban"

const items: KanbanItem[] = [
  {
    id: "1",
    title: "João Silva",
    status: "pending",
    type: "vacation",
    startDate: "2024-02-01",
    endDate: "2024-02-15",
    employee: {
      id: "emp-1",
      name: "João Silva",
      avatar_url: "https://...",
      department: "TI"
    }
  }
]

function MyPage() {
  const handleMove = (itemId: string, newStatus: AbsenceStatus) => {
    // Atualizar no backend e estado local
  }

  const handleClick = (item: KanbanItem) => {
    // Abrir modal de detalhes
  }

  return (
    <KanbanBoard
      items={items}
      columns={defaultAbsenceColumns}
      onItemMove={handleMove}
      onItemClick={handleClick}
    />
  )
}
```

### Colunas Customizadas

```tsx
const customColumns: KanbanColumn[] = [
  {
    id: "draft",
    title: "Rascunho",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    textColor: "text-gray-900"
  },
  {
    id: "pending",
    title: "Em Análise",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-900"
  }
]
```

## Fluxo de Dados

```
1. Usuário arrasta card
   ↓
2. onDragStart: Serializa dados do item
   ↓
3. onDragOver: Mostra feedback visual
   ↓
4. onDrop: Deserializa e chama onItemMove
   ↓
5. onItemMove: Atualiza backend via updateAbsenceStatus()
   ↓
6. Estado local atualizado (absences)
   ↓
7. Stats recalculados
   ↓
8. Toast de confirmação
```

## Integração com Ausências

### Query Function Criada

```ts
// src/lib/supabase/queries.ts
export async function updateAbsenceStatus(
  absenceId: string,
  status: AbsenceStatus
): Promise<QueryResult<Absence>>
```

### Handler na Página

```tsx
const handleKanbanItemMove = async (itemId: string, newStatus: AbsenceStatus) => {
  // 1. Buscar absence atual
  const absence = absences.find(a => a.id === itemId)

  // 2. Update no Supabase
  const result = await updateAbsenceStatus(itemId, newStatus)

  // 3. Update estado local
  setAbsences(prev => prev.map(...))

  // 4. Update stats
  setStats(prev => { ... })

  // 5. Toast feedback
  toast.success("Status atualizado")
}
```

## Conversão de Dados

```tsx
// Converter AbsenceWithEmployee para KanbanItem
const kanbanItems: KanbanItem[] = absences
  .filter(absence =>
    ["pending", "approved", "rejected", "in_progress"].includes(absence.status)
  )
  .map(absence => ({
    id: absence.id,
    title: absence.employee?.full_name || "Sem nome",
    status: absence.status,
    type: absence.type,
    startDate: absence.start_date,
    endDate: absence.end_date,
    employee: {
      id: absence.employee_id,
      name: absence.employee?.full_name || "Sem nome",
      avatar_url: absence.employee?.avatar_url,
      department: absence.employee?.department
    },
    metadata: {
      reason: absence.reason,
      notes: absence.notes
    }
  }))
```

## Estilos e Cores

### Cores por Tipo de Ausência
- **Férias** (vacation*): Azul `#3b82f6`
- **Licenças** (*leave): Roxo `#8b5cf6`
- **Outros**: Cinza `#6b7280`

### Cores por Status (Colunas)
- **Pendentes**: Amarelo (bg-yellow-100, text-yellow-900)
- **Aprovados**: Verde (bg-green-100, text-green-900)
- **Rejeitados**: Vermelho (bg-red-100, text-red-900)
- **Em Andamento**: Azul (bg-blue-100, text-blue-900)

### Animações
- Hover: `scale-[1.02]`, `shadow-lg`, `translate-y-0.5`
- Dragging: `opacity-50`, `scale-95`
- Drop zone: `border-primary`, `bg-primary/5`, `scale-[1.02]`
- Transições: `duration-200` (200ms)

## Responsividade

### Mobile (< 640px)
- Largura: `calc(100vw - 3rem)` (quase tela inteira)
- Padding reduzido: `p-2`, `p-3`
- Font size menor: `text-xs`, `text-sm`
- Snap scroll horizontal

### Desktop (>= 640px)
- Largura fixa: `min-w-[300px]`, `max-w-[320px]`
- Padding normal: `p-3`, `p-4`
- Font size padrão: `text-sm`, `text-base`

## Melhorias Futuras

- [ ] Reordenação dentro da mesma coluna
- [ ] Bulk actions (mover múltiplos cards)
- [ ] Filtros inline por tipo
- [ ] Pesquisa rápida de funcionário
- [ ] Visualização compacta/expandida
- [ ] Export para CSV/PDF
- [ ] Keyboard shortcuts (arrow keys)
- [ ] Undo/redo de movimentações
- [ ] Histórico de mudanças de status

## Performance

- ✅ Sem bibliotecas externas (0 KB adicional)
- ✅ Memoização de items agrupados (`useMemo`)
- ✅ Event delegation otimizado
- ✅ Transições CSS nativas (GPU accelerated)
- ✅ Scroll virtual não necessário (poucas colunas)

## Acessibilidade

- ⚠️ Drag & drop nativo não é totalmente acessível
- 🔄 Próximos passos:
  - Adicionar navegação por teclado
  - ARIA labels para screen readers
  - Botões alternativos para mover cards
  - Focus management

## Testes

Testar manualmente:
1. ✅ Arrastar card entre colunas
2. ✅ Verificar atualização no banco
3. ✅ Verificar contadores
4. ✅ Clicar no card abre detalhes
5. ✅ Responsividade mobile
6. ✅ Scroll horizontal funciona
7. ✅ Animações suaves

## Troubleshooting

### Card não move
- Verificar se `onItemMove` está definido
- Verificar permissões do usuário
- Check console para erros de serialização

### Contador errado
- Verificar se stats está sendo atualizado corretamente
- Verificar se filtros estão aplicados

### Performance ruim
- Verificar quantidade de items (>100 requer virtualização)
- Verificar re-renders desnecessários
- Usar React DevTools Profiler

## Código de Exemplo Completo

Ver implementação completa em:
- `/src/components/ui/kanban.tsx` (componente)
- `/src/app/(dashboard)/ausencias/page.tsx` (integração)
