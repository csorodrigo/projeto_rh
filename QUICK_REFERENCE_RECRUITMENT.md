# Quick Reference - Módulo de Recrutamento

Guia rápido de referência para desenvolvedores trabalhando com o módulo de recrutamento.

---

## Imports Rápidos

### Componentes
```tsx
import {
  // Badges
  JobStatusBadge,
  ApplicationStatusBadge,
  SourceBadge,
  LocationBadge,
  EmploymentTypeBadge,

  // Interactive
  RatingStars,
  TagInput,

  // Charts & Stats
  RecruitmentStats,
  HiringFunnel,
  SourceChart,

  // UI
  EmptyState,
} from "@/components/recruitment"
```

### Hooks
```tsx
import {
  useRecruitmentStats,
  useApplication,
} from "@/hooks"
```

### Constants & Utils
```tsx
import {
  // Constants
  JOB_STATUSES,
  APPLICATION_STATUSES,
  CANDIDATE_SOURCES,
  EMPLOYMENT_TYPES,
  LOCATION_TYPES,
  DEFAULT_PIPELINE_STAGES,

  // Stats
  calculateTimeToHire,
  calculateConversionRate,
  calculateFunnelData,

  // Filters
  filterJobs,
  filterCandidates,
  filterApplications,
} from "@/lib/recruitment"
```

---

## Snippets Úteis

### Exibir Status de Vaga
```tsx
<JobStatusBadge status="open" size="md" />
```

### Exibir Rating
```tsx
// Read-only
<RatingStars value={4} readOnly size="md" />

// Interactive
<RatingStars
  value={rating}
  onChange={setRating}
/>
```

### Input de Tags/Skills
```tsx
const [skills, setSkills] = useState(["React", "TypeScript"])

<TagInput
  tags={skills}
  onChange={setSkills}
  placeholder="Adicionar habilidades..."
  suggestions={["JavaScript", "Python", "Java"]}
  maxTags={10}
/>
```

### Empty State
```tsx
<EmptyState
  icon={Briefcase}
  title="Nenhuma vaga cadastrada"
  description="Comece criando sua primeira vaga"
  action={{
    label: "Criar Vaga",
    onClick: () => router.push("/recrutamento/vagas/nova")
  }}
/>
```

### Dashboard de KPIs
```tsx
const { data, isLoading } = useRecruitmentStats(companyId)

<RecruitmentStats
  data={data}
  isLoading={isLoading}
/>
```

### Gerenciar Candidatura
```tsx
const {
  data: application,
  updateStage,
  rate,
  addActivity,
} = useApplication(applicationId)

// Mover para próximo estágio
<Button onClick={() => updateStage.mutate(nextStageId)}>
  Próximo Estágio
</Button>

// Avaliar candidato
<RatingStars
  value={application?.rating || 0}
  onChange={(value) => rate.mutate(value)}
/>

// Adicionar comentário
<Button onClick={() =>
  addActivity.mutate({
    type: "comment",
    description: "Candidato aprovado na entrevista"
  })
}>
  Adicionar Comentário
</Button>
```

---

## Padrões de Código

### Componente de Página
```tsx
"use client"

import { useRecruitmentStats } from "@/hooks"
import { RecruitmentStats, EmptyState } from "@/components/recruitment"

export default function RecruitmentDashboard({
  companyId
}: {
  companyId: string
}) {
  const { data, isLoading, error } = useRecruitmentStats(companyId)

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return <EmptyState title="Sem dados" />

  return (
    <div className="space-y-6">
      <RecruitmentStats data={data} />
      {/* More components */}
    </div>
  )
}
```

### Card de Vaga
```tsx
function JobCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{job.title}</CardTitle>
          <JobStatusBadge status={job.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <LocationBadge type={job.location_type} city={job.city} />
          <EmploymentTypeBadge type={job.employment_type} />
        </div>
        <p className="text-sm text-muted-foreground">{job.description}</p>
      </CardContent>
    </Card>
  )
}
```

### Card de Candidato
```tsx
function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{candidate.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{candidate.email}</p>
          </div>
          <SourceBadge source={candidate.source} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <RatingStars value={candidate.rating || 0} readOnly />
          <div className="flex gap-1">
            {candidate.skills?.map(skill => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Tipos TypeScript

### Job
```typescript
interface Job {
  id: string
  title: string
  description: string
  status: 'draft' | 'open' | 'paused' | 'closed'
  location_type: 'presencial' | 'remoto' | 'hibrido'
  employment_type: 'clt' | 'pj' | 'estagio' | 'temporario'
  city?: string
  department: string
  requirements?: string[]
  created_at: string
}
```

### Candidate
```typescript
interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  source: 'portal' | 'linkedin' | 'indicacao' | 'outro'
  rating?: number
  skills?: string[]
  resume_url?: string
  created_at: string
}
```

### Application
```typescript
interface Application {
  id: string
  job_id: string
  candidate_id: string
  stage_id: string
  status: 'active' | 'rejected' | 'hired' | 'withdrawn'
  rating?: number
  created_at: string
  hired_at?: string
  rejected_at?: string
}
```

---

## Cores do Módulo

```tsx
// Primary color: purple-500
"text-purple-500"
"bg-purple-500"
"border-purple-500"

// Status colors
"text-green-500"   // open, hired, indicacao, remoto
"text-blue-500"    // active, portal, presencial, clt
"text-orange-500"  // paused, temporario
"text-red-500"     // rejected
"text-gray-500"    // closed, withdrawn, outro
```

---

## Navegação

### URLs
```
/recrutamento                    → Dashboard
/recrutamento/vagas              → Lista de vagas
/recrutamento/vagas/nova         → Criar vaga
/recrutamento/vagas/[id]         → Detalhes da vaga
/recrutamento/pipeline           → Kanban pipeline
/recrutamento/candidatos         → Lista de candidatos
/recrutamento/candidatos/[id]    → Perfil do candidato
/recrutamento/admissao          → Processo de admissão
```

### Menu Lateral
```tsx
{
  title: "Recrutamento",
  icon: Briefcase,
  iconColor: "text-purple-500",
  items: [
    { title: "Dashboard", url: "/recrutamento" },
    { title: "Vagas", url: "/recrutamento/vagas" },
    { title: "Pipeline", url: "/recrutamento/pipeline" },
    { title: "Candidatos", url: "/recrutamento/candidatos" },
    { title: "Admissões", url: "/recrutamento/admissao" },
  ]
}
```

### Atalhos de Teclado (Cmd+K)
- "Recrutamento" → Navega para dashboard
- "Nova Vaga" → Cria nova vaga
- "Ver Pipeline" → Abre kanban
- "Adicionar Candidato" → Adiciona candidato

---

## Best Practices

### 1. Sempre use os hooks para data fetching
```tsx
// ✅ Bom
const { data } = useRecruitmentStats(companyId)

// ❌ Ruim
const [data, setData] = useState()
useEffect(() => {
  fetch('/api/stats').then(...)
}, [])
```

### 2. Use os componentes de badge para consistência
```tsx
// ✅ Bom
<JobStatusBadge status={job.status} />

// ❌ Ruim
<span className="px-2 py-1 bg-green-500">Open</span>
```

### 3. Sempre trate loading e erro
```tsx
// ✅ Bom
if (isLoading) return <Skeleton />
if (error) return <ErrorState />
if (!data) return <EmptyState />

// ❌ Ruim
return <div>{data.title}</div>
```

### 4. Use TypeScript types exportados
```tsx
// ✅ Bom
import type { JobStatus } from "@/lib/recruitment/constants"

// ❌ Ruim
type JobStatus = "open" | "closed"
```

### 5. Acessibilidade
```tsx
// ✅ Bom
<button aria-label="Mover para próximo estágio">
  <ChevronRight />
</button>

// ❌ Ruim
<div onClick={...}>
  <ChevronRight />
</div>
```

---

## Troubleshooting

### Componente não renderiza
- Verifique se os imports estão corretos
- Verifique se os dados têm a estrutura esperada
- Use console.log para debug

### Mutations não funcionam
- Verifique autenticação Supabase
- Verifique permissões RLS
- Verifique se queryClient está configurado

### Styles não aplicam
- Verifique classes Tailwind
- Rode `npm run build` para rebuild
- Verifique conflitos de CSS

### TypeScript errors
- Verifique tipos importados
- Use `as const` em arrays/objects readonly
- Verifique nullable fields (use `?`)

---

## Recursos Adicionais

- **Documentação:** `/src/components/recruitment/README.md`
- **Exemplos:** `/src/components/recruitment/RecruitmentComponentsExample.tsx`
- **Types:** `/src/lib/recruitment/constants.ts`
- **Utils:** `/src/lib/recruitment/stats.ts`, `/src/lib/recruitment/filters.ts`

---

**Última atualização:** 29/01/2026
**Versão:** 1.0.0
