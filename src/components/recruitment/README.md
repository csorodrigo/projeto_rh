# Recruitment Module Components

Componentes compartilhados do módulo de Recrutamento.

## Estrutura

```
src/components/recruitment/
├── StatusBadge.tsx          # Badges de status (vagas e candidaturas)
├── SourceBadge.tsx          # Badge de origem do candidato
├── LocationBadge.tsx        # Badge de tipo de localização
├── EmploymentTypeBadge.tsx  # Badge de tipo de contratação
├── RatingStars.tsx          # Componente de avaliação (1-5 estrelas)
├── TagInput.tsx             # Input para tags/skills
├── EmptyState.tsx           # Estado vazio reutilizável
├── RecruitmentStats.tsx     # Grid de KPIs
├── HiringFunnel.tsx         # Gráfico de funil
├── SourceChart.tsx          # Gráfico de origem de candidatos
└── index.ts                 # Exports centralizados
```

## Componentes

### StatusBadge

Badge para status de vagas e candidaturas.

```tsx
import { JobStatusBadge, ApplicationStatusBadge } from "@/components/recruitment"

// Status de vaga
<JobStatusBadge status="open" />
<JobStatusBadge status="draft" size="sm" />

// Status de candidatura
<ApplicationStatusBadge status="hired" />
<ApplicationStatusBadge status="active" showIcon={false} />
```

### RatingStars

Componente de avaliação com estrelas.

```tsx
import { RatingStars } from "@/components/recruitment"

// Display (read-only)
<RatingStars value={4} readOnly />

// Input mode
<RatingStars value={rating} onChange={setRating} />
```

### TagInput

Input para adicionar/remover tags.

```tsx
import { TagInput } from "@/components/recruitment"

<TagInput
  tags={tags}
  onChange={setTags}
  placeholder="Adicionar habilidades..."
  suggestions={["React", "TypeScript", "Node.js"]}
  maxTags={10}
/>
```

### LocationBadge

Badge para tipo de localização.

```tsx
import { LocationBadge } from "@/components/recruitment"

<LocationBadge type="remoto" />
<LocationBadge type="presencial" city="São Paulo" />
<LocationBadge type="hibrido" />
```

### SourceBadge

Badge para origem do candidato.

```tsx
import { SourceBadge } from "@/components/recruitment"

<SourceBadge source="portal" />
<SourceBadge source="linkedin" />
<SourceBadge source="indicacao" />
```

### EmploymentTypeBadge

Badge para tipo de contratação.

```tsx
import { EmploymentTypeBadge } from "@/components/recruitment"

<EmploymentTypeBadge type="clt" />
<EmploymentTypeBadge type="pj" />
<EmploymentTypeBadge type="estagio" />
```

### EmptyState

Estado vazio reutilizável.

```tsx
import { EmptyState } from "@/components/recruitment"
import { Briefcase } from "lucide-react"

<EmptyState
  icon={Briefcase}
  title="Nenhuma vaga cadastrada"
  description="Comece criando sua primeira vaga de emprego"
  action={{
    label: "Criar Vaga",
    onClick: () => router.push("/recrutamento/vagas/nova")
  }}
/>
```

### RecruitmentStats

Grid de KPIs de recrutamento.

```tsx
import { RecruitmentStats } from "@/components/recruitment"

<RecruitmentStats
  data={{
    totalOpenJobs: 12,
    totalCandidates: 85,
    avgTimeToHire: 21,
    conversionRate: 15,
    candidatesByStage: [
      { stage: "Triagem", count: 30 },
      { stage: "Entrevista RH", count: 20 },
    ]
  }}
  isLoading={false}
/>
```

### HiringFunnel

Gráfico de funil de contratação.

```tsx
import { HiringFunnel } from "@/components/recruitment"

<HiringFunnel
  stages={[
    { stage: "Triagem", count: 100, conversionRate: 100 },
    { stage: "Entrevista RH", count: 60, conversionRate: 60, dropoffRate: 40 },
    { stage: "Técnica", count: 30, conversionRate: 30, dropoffRate: 50 },
  ]}
  onStageClick={(stage) => console.log(stage)}
/>
```

### SourceChart

Gráfico de origem de candidatos.

```tsx
import { SourceChart } from "@/components/recruitment"

<SourceChart
  data={[
    { source: "portal", count: 45 },
    { source: "linkedin", count: 30 },
    { source: "indicacao", count: 20 },
    { source: "outro", count: 5 },
  ]}
  type="bar" // ou "pie"
/>
```

## Hooks

### useRecruitmentStats

Hook para buscar estatísticas de recrutamento.

```tsx
import { useRecruitmentStats } from "@/hooks"

function Dashboard({ companyId }) {
  const { data, isLoading, error } = useRecruitmentStats(companyId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>

  return (
    <div>
      <p>Open Jobs: {data.totalOpenJobs}</p>
      <p>Candidates: {data.totalCandidates}</p>
    </div>
  )
}
```

### useApplication

Hook para gerenciar uma aplicação.

```tsx
import { useApplication } from "@/hooks"

function ApplicationDetails({ applicationId }) {
  const {
    data: application,
    isLoading,
    updateStage,
    addActivity,
    rate,
    updateStatus
  } = useApplication(applicationId)

  return (
    <div>
      <h1>{application?.candidate.name}</h1>
      <button onClick={() => updateStage.mutate("stage-id")}>
        Mover Estágio
      </button>
      <button onClick={() => rate.mutate(5)}>
        Avaliar 5 Estrelas
      </button>
    </div>
  )
}
```

## Utilities

### Constants

```tsx
import {
  JOB_STATUSES,
  APPLICATION_STATUSES,
  CANDIDATE_SOURCES,
  EMPLOYMENT_TYPES,
  LOCATION_TYPES,
  DEFAULT_PIPELINE_STAGES
} from "@/lib/recruitment"
```

### Stats

```tsx
import {
  calculateTimeToHire,
  calculateConversionRate,
  calculateFunnelData,
  groupBySource,
  calculateStageDropoff
} from "@/lib/recruitment"
```

### Filters

```tsx
import {
  filterJobs,
  filterCandidates,
  filterApplications,
  buildJobFilterQuery,
  buildCandidateFilterQuery,
  buildApplicationFilterQuery
} from "@/lib/recruitment"
```

## Navegação

O módulo de recrutamento foi adicionado ao menu principal:

- Dashboard
- Vagas
- Pipeline
- Candidatos
- Admissões

E ao comando de busca global (Cmd+K):

- Nova Vaga
- Ver Pipeline
- Adicionar Candidato

## Design System

Todos os componentes seguem o design system existente:

- Uso de shadcn/ui como base
- Cores consistentes (purple-500 para recrutamento)
- Acessibilidade (ARIA, keyboard navigation)
- Responsive design
- Animações sutis
- TypeScript strict mode
