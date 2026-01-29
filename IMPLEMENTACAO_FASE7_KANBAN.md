# Implementação Fase 7 - Pipeline Kanban de Recrutamento

## Visão Geral

Sistema completo de Pipeline Kanban para gerenciamento de candidatos no processo seletivo, implementado com drag & drop usando @dnd-kit.

## Arquitetura

### 1. Banco de Dados

#### Migration: `021_recruitment_system.sql`

Tabelas criadas:
- **jobs**: Vagas de emprego
- **candidates**: Candidatos
- **job_applications**: Candidaturas (relação candidato-vaga)
- **application_activities**: Timeline de atividades
- **application_comments**: Comentários e avaliações
- **interviews**: Entrevistas agendadas
- **offer_letters**: Propostas de emprego

Views:
- **application_details**: View com dados enriquecidos de candidaturas

### 2. Tipos TypeScript

#### Arquivo: `src/types/recruitment.ts`

Principais tipos:
- `Job`: Vaga de emprego
- `Candidate`: Candidato
- `JobApplication`: Candidatura
- `ApplicationWithDetails`: Candidatura com dados relacionados
- `PipelineStage`: Estágio do pipeline
- `KanbanCandidate`: Candidato formatado para Kanban
- `KanbanFilters`: Filtros do Kanban

### 3. Utilitários

#### Arquivo: `src/lib/recruitment/kanban-utils.ts`

Funções helper:
- `getStageColor()`: Retorna cor do estágio
- `getStageName()`: Retorna nome do estágio
- `sortStages()`: Ordena estágios por ordem
- `getApplicationsByStage()`: Filtra candidatos por estágio
- `groupApplicationsByStage()`: Agrupa candidatos por estágio
- `calculateTimeInStage()`: Calcula tempo no estágio
- `applicationToKanbanCard()`: Converte aplicação para card Kanban
- `handleDragEnd()`: Handler de drag & drop
- `filterApplications()`: Aplica filtros
- `calculateKanbanStats()`: Calcula estatísticas
- `formatTimeInStage()`: Formata tempo de forma amigável
- `getTimeAlertColor()`: Retorna cor de alerta baseado no tempo
- `getInitials()`: Gera iniciais do nome

### 4. Hook Customizado

#### Arquivo: `src/hooks/use-kanban.ts`

Hook `useKanban()` gerencia:
- Estado do Kanban
- Queries (vaga, candidaturas)
- Mutations (mover, avaliar, rejeitar, contratar)
- Filtros
- Estatísticas
- Optimistic updates
- Error handling

Opções:
```typescript
interface UseKanbanOptions {
  jobId?: string;              // ID da vaga (opcional, se não informado busca todas)
  initialFilters?: KanbanFilters;
  enableRealtime?: boolean;    // Habilita realtime do Supabase
}
```

Retorno:
```typescript
interface UseKanbanReturn {
  // Dados
  job: Job | null;
  stages: PipelineStage[];
  applications: ApplicationWithDetails[];
  applicationsByStage: Record<string, ApplicationWithDetails[]>;

  // Filtros
  filters: KanbanFilters;
  setFilters: (filters: KanbanFilters) => void;
  filteredApplications: ApplicationWithDetails[];

  // Estatísticas
  stats: KanbanStats;

  // Ações
  moveApplication: (applicationId, fromStage, toStage) => Promise<void>;
  updateRating: (applicationId, rating) => Promise<void>;
  rejectApplication: (applicationId, reason, stage) => Promise<void>;
  hireApplication: (applicationId) => Promise<void>;

  // Estados
  isLoading: boolean;
  isMoving: boolean;
  error: Error | null;

  // Refresh
  refetch: () => void;
}
```

### 5. Componentes

#### 5.1 KanbanBoard

**Arquivo**: `src/components/recruitment/KanbanBoard.tsx`

Board principal com @dnd-kit:
- Contexto de drag & drop
- Sensores de mouse e teclado
- Overlay durante drag
- Scroll horizontal
- Gerenciamento de estado de drag

Props:
```typescript
interface KanbanBoardProps {
  stages: PipelineStage[];
  candidatesByStage: Record<string, KanbanCandidate[]>;
  onMoveCandidate: (candidateId, fromStage, toStage) => void;
  onCandidateClick?: (candidate) => void;
  onAddCandidate?: (stageId) => void;
  className?: string;
}
```

#### 5.2 KanbanColumn

**Arquivo**: `src/components/recruitment/KanbanColumn.tsx`

Coluna do Kanban:
- Header com nome e contador
- Drop zone com feedback visual
- Lista de candidatos com SortableContext
- Botão de adicionar candidato
- Cores personalizadas por estágio

#### 5.3 CandidateCard

**Arquivo**: `src/components/recruitment/CandidateCard.tsx`

Card draggable de candidato:
- Avatar com iniciais
- Nome e cargo atual
- Contato (email, telefone, localização)
- Skills (até 3 visíveis + contador)
- Tags (até 2 visíveis + contador)
- Rating (estrelas)
- Tempo no estágio com alerta de cor
- Ações rápidas (ver currículo, ver detalhes)
- Animações smooth

#### 5.4 CandidateDetailModal

**Arquivo**: `src/components/recruitment/CandidateDetailModal.tsx`

Modal com detalhes completos:
- **Tab Perfil**: Informações pessoais, skills, tags, timeline
- **Tab Currículo**: Link para currículo
- **Tab Atividades**: Timeline de atividades (em desenvolvimento)
- **Tab Avaliação**:
  - Avaliar candidato (1-5 estrelas)
  - Adicionar comentários com rating opcional
  - Histórico de comentários

#### 5.5 StageConfigModal

**Arquivo**: `src/components/recruitment/StageConfigModal.tsx`

Modal de configuração de estágios:
- Reordenar estágios com drag & drop
- Editar nome do estágio
- Escolher cor (10 presets)
- Adicionar novos estágios
- Deletar estágios
- Preview das mudanças

### 6. Páginas

#### 6.1 Pipeline Geral

**Arquivo**: `src/app/(dashboard)/recrutamento/pipeline/page.tsx`

View Kanban de todas as vagas:
- Busca por nome/email
- Filtro por rating mínimo
- Filtros avançados (tags, data)
- Estatísticas totais
- Board completo
- Modal de detalhes

#### 6.2 Pipeline de Vaga Específica

**Arquivo**: `src/app/(dashboard)/recrutamento/vagas/[id]/pipeline/page.tsx`

View Kanban de uma vaga:
- Informações da vaga (título, código, status, departamento)
- Card com dados da vaga
- Busca e filtros
- Estatísticas por estágio
- Botão de configurar estágios
- Board da vaga
- Modal de detalhes

## Funcionalidades Implementadas

### Drag & Drop
- Drag de candidatos entre estágios
- Feedback visual durante drag
- Animações suaves
- Drop zones com highlight
- Optimistic updates
- Rollback em caso de erro

### Filtros
- Busca por nome ou email
- Filtro por rating mínimo
- Filtro por tags
- Filtro por período de candidatura
- Contador de filtros ativos
- Limpar filtros

### Estatísticas
- Total de candidatos
- Candidatos por estágio
- Tempo médio por estágio
- Taxa de conversão (preparado)

### Ações
- Mover candidato entre estágios (drag & drop)
- Avaliar candidato (1-5 estrelas)
- Adicionar comentários
- Ver currículo
- Ver detalhes completos
- Rejeitar candidato (preparado)
- Contratar candidato (preparado)

### UX/UI
- Design inspirado em Trello/Linear
- Animações smooth (@dnd-kit)
- Feedback visual de drag
- Cores personalizadas por estágio
- Mobile responsive (scroll horizontal)
- Loading states
- Empty states
- Tooltips informativos
- Badges de contadores
- Time alerts (cores baseadas no tempo)

## Padrões @dnd-kit

### Estrutura
```typescript
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <ScrollArea>
    {stages.map(stage => (
      <Droppable id={stage.id}>
        <SortableContext items={candidateIds}>
          {candidates.map(candidate => (
            <Sortable id={candidate.id}>
              <CandidateCard {...candidate} />
            </Sortable>
          ))}
        </SortableContext>
      </Droppable>
    ))}
  </ScrollArea>

  <DragOverlay>
    {/* Card sendo arrastado */}
  </DragOverlay>
</DndContext>
```

### Sensores
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 } // 8px para ativar
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);
```

### Handlers
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const fromStage = active.data.current?.stageId;
  const toStage = over.id;

  onMoveCandidate(active.id, fromStage, toStage);
};
```

## Próximos Passos (Opcional)

### Funcionalidades Adicionais
1. Timeline de atividades completa
2. Agendamento de entrevistas
3. Envio de emails
4. Propostas de emprego
5. Conversão candidato → funcionário
6. Realtime com Supabase subscriptions
7. Notificações push
8. Exportar relatórios
9. Templates de estágios
10. Automações (mover automaticamente após X dias)

### Melhorias
1. Paginação de candidatos
2. Virtualization para listas grandes
3. Filtros avançados (múltiplas tags, range de datas)
4. Busca full-text
5. Atalhos de teclado
6. Modo compacto/expandido
7. Personalização de cards
8. Analytics e métricas
9. Integração com calendário
10. Arquivamento de candidatos

## Como Usar

### 1. Rodar Migration
```bash
# Aplicar migration no Supabase
psql -h [host] -U [user] -d [database] -f supabase/migrations/021_recruitment_system.sql
```

### 2. Acessar Pipeline Geral
```
/recrutamento/pipeline
```

### 3. Acessar Pipeline de Vaga
```
/recrutamento/vagas/{job-id}/pipeline
```

### 4. Usar Hook
```typescript
import { useKanban } from '@/hooks/use-kanban';

function MyComponent() {
  const {
    stages,
    applications,
    moveApplication,
    updateRating,
    isLoading,
  } = useKanban({ jobId: '...' });

  // ...
}
```

### 5. Usar Componentes
```typescript
import {
  KanbanBoard,
  CandidateDetailModal,
  StageConfigModal,
} from '@/components/recruitment';

function MyPage() {
  return (
    <>
      <KanbanBoard
        stages={stages}
        candidatesByStage={grouped}
        onMoveCandidate={handleMove}
        onCandidateClick={handleClick}
      />

      <CandidateDetailModal
        candidate={selected}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
```

## Tecnologias Utilizadas

- **React 19**: Framework
- **Next.js 16**: App Router
- **TypeScript**: Type safety
- **@dnd-kit**: Drag & drop
- **@tanstack/react-query**: Data fetching e cache
- **Supabase**: Backend e realtime
- **Tailwind CSS**: Styling
- **shadcn/ui**: Componentes base
- **date-fns**: Manipulação de datas
- **Sonner**: Toast notifications
- **Lucide React**: Ícones

## Performance

### Optimistic Updates
Todas as mutations usam optimistic updates:
1. Atualiza UI imediatamente
2. Faz request ao servidor
3. Em caso de erro, reverte mudanças
4. Em caso de sucesso, refetch para garantir sincronização

### Memoization
- Uso extensivo de `useMemo` para evitar recalculos
- Callbacks estáveis com `useCallback`
- Agrupamento otimizado por estágio

### Queries
- Cache automático do React Query
- Invalidação inteligente de queries
- Refetch apenas quando necessário

## Acessibilidade

- Navegação por teclado completa
- Sensores de teclado no drag & drop
- Labels descritivos
- Focus management
- Screen reader friendly

## Mobile

- Scroll horizontal suave
- Touch gestures para drag & drop
- Snap scroll para melhor navegação
- Cards responsivos
- Layout adaptativo

---

**Desenvolvido com Claude Code**
*Fase 7 - Sistema de Recrutamento - Pipeline Kanban*
