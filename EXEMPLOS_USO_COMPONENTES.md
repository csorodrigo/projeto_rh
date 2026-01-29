# Exemplos de Uso - Componentes de Recrutamento

Este arquivo contém exemplos práticos de como usar os componentes criados para o Portal de Carreiras.

## Componentes Públicos

### PublicJobsList

Lista de vagas com filtros.

```tsx
import { PublicJobsList } from '@/components/recruitment'

// Uso básico
<PublicJobsList />

// Com filtros da URL
<PublicJobsList filters={searchParams} />

// Filtros disponíveis:
// - search: string
// - department: string
// - location: string
// - job_type: string
// - location_type: string
```

### PublicJobCard

Card individual de vaga.

```tsx
import { PublicJobCard } from '@/components/recruitment'
import type { Job } from '@/types/recruitment'

const job: Job = {
  id: '123',
  title: 'Desenvolvedor Full Stack',
  department: 'Tecnologia',
  location: 'São Paulo, SP',
  location_type: 'hybrid',
  job_type: 'full_time',
  description: 'Vaga para desenvolvedor...',
  published_at: new Date().toISOString(),
  featured: true,
  // ... outros campos
}

<PublicJobCard job={job} />
```

### PublicJobFilters

Sidebar com filtros.

```tsx
import { PublicJobFilters } from '@/components/recruitment'

// Os filtros automaticamente sincronizam com a URL
<PublicJobFilters />
```

### JobDetailsContent

Conteúdo detalhado da vaga.

```tsx
import { JobDetailsContent } from '@/components/recruitment'

const jobWithCompany = {
  ...job,
  company: {
    name: 'Minha Empresa',
    logo_url: '/logo.png'
  }
}

<JobDetailsContent job={jobWithCompany} />
```

### ApplyModal

Modal de candidatura.

```tsx
import { ApplyModal } from '@/components/recruitment'
import { useState } from 'react'

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Candidatar-se
      </Button>

      <ApplyModal
        jobId="job-id-123"
        jobTitle="Desenvolvedor Full Stack"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
```

### JobShareButton

Botão de compartilhamento.

```tsx
import { JobShareButton } from '@/components/recruitment'

<JobShareButton
  jobId="job-id-123"
  jobTitle="Desenvolvedor Full Stack"
/>
```

## Páginas Completas

### Página de Listagem

```tsx
// src/app/(public)/vagas/page.tsx
import { Suspense } from "react"
import { PublicJobsList, PublicJobFilters } from "@/components/recruitment"

export default function VagasPage({ searchParams }) {
  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>Carregando...</div>}>
            <PublicJobFilters />
          </Suspense>
        </aside>

        {/* Jobs List */}
        <div className="lg:col-span-3">
          <Suspense fallback={<div>Carregando...</div>}>
            <PublicJobsList filters={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

### Página de Detalhes

```tsx
// src/app/(public)/vagas/[id]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { JobDetailsContent } from "@/components/recruitment"
import { notFound } from "next/navigation"

export default async function JobDetailsPage({ params }) {
  const supabase = createClient()

  const { data: job } = await supabase
    .from('job_postings')
    .select('*, company:companies(name, logo_url)')
    .eq('id', params.id)
    .eq('is_public', true)
    .eq('status', 'active')
    .single()

  if (!job) notFound()

  return <JobDetailsContent job={job} />
}
```

## API Routes

### Processar Candidatura

```tsx
// src/app/api/careers/apply/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadResume } from "@/lib/recruitment/resume-upload"

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  // Extract data
  const jobId = formData.get("jobId") as string
  const full_name = formData.get("full_name") as string
  const email = formData.get("email") as string
  const resume = formData.get("resume") as File

  // Validate
  if (!jobId || !full_name || !email || !resume) {
    return NextResponse.json(
      { message: "Campos obrigatórios faltando" },
      { status: 400 }
    )
  }

  // Process...
  // (ver implementação completa em src/app/api/careers/apply/route.ts)
}
```

## Utilities

### Upload de Currículo

```tsx
import { uploadResume, deleteResume, getResumeDownloadUrl } from '@/lib/recruitment/resume-upload'

// Upload
const resumeUrl = await uploadResume(file, candidateId, companyId)

// Delete
await deleteResume(resumeUrl, companyId)

// Get download URL
const downloadUrl = await getResumeDownloadUrl(resumeUrl)
```

### Enviar Emails

```tsx
import {
  sendApplicationReceivedEmail,
  sendNewApplicationNotification
} from '@/lib/notifications/recruitment-emails'

// Email ao candidato
await sendApplicationReceivedEmail({
  candidateName: 'João Silva',
  candidateEmail: 'joao@exemplo.com',
  jobTitle: 'Desenvolvedor Full Stack'
})

// Email ao hiring manager
await sendNewApplicationNotification({
  hiringManagerId: 'manager-id-123',
  candidateName: 'João Silva',
  jobTitle: 'Desenvolvedor Full Stack',
  applicationId: 'app-id-123'
})
```

## Queries Supabase

### Buscar Vagas Públicas

```tsx
const { data: jobs } = await supabase
  .from('job_postings')
  .select('*')
  .eq('is_public', true)
  .eq('status', 'active')
  .order('featured', { ascending: false })
  .order('published_at', { ascending: false })
```

### Buscar Vaga por ID

```tsx
const { data: job } = await supabase
  .from('job_postings')
  .select(`
    *,
    company:companies(name, logo_url)
  `)
  .eq('id', jobId)
  .eq('is_public', true)
  .eq('status', 'active')
  .single()
```

### Criar Candidato

```tsx
const { data: candidate } = await supabase
  .from('candidates')
  .insert({
    company_id: companyId,
    email: 'joao@exemplo.com',
    name: 'João Silva',
    phone: '11987654321',
    source: 'careers_page'
  })
  .select('id')
  .single()
```

### Criar Candidatura

```tsx
const { data: application } = await supabase
  .from('applications')
  .insert({
    job_id: jobId,
    candidate_id: candidateId,
    company_id: companyId,
    status: 'applied',
    current_stage_id: firstStageId,
    source: 'careers_page'
  })
  .select('id')
  .single()
```

## Customização

### Cores e Tema

```tsx
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // Sua cor primária
          foreground: '#ffffff',
        },
        // ...
      }
    }
  }
}
```

### Textos

```tsx
// Editar em src/app/(public)/layout.tsx
<span className="text-xs text-muted-foreground">
  Sua Empresa {/* Mudar aqui */}
</span>
```

### Logo

```tsx
// Substituir Building2 icon por Image
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={40}
  height={40}
/>
```

## Validação com Zod

```tsx
import { z } from 'zod'

const applyFormSchema = z.object({
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
  resume: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "Máx. 5MB")
    .refine(
      (file) => ["application/pdf", "application/msword"].includes(file.type),
      "Apenas PDF ou Word"
    ),
  gdpr_consent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos",
  }),
})

type ApplyFormValues = z.infer<typeof applyFormSchema>
```

## Testing

### Test de Componente

```tsx
import { render, screen } from '@testing-library/react'
import { PublicJobCard } from '@/components/recruitment'

test('renders job card', () => {
  const job = {
    id: '1',
    title: 'Desenvolvedor',
    department: 'TI',
    // ...
  }

  render(<PublicJobCard job={job} />)

  expect(screen.getByText('Desenvolvedor')).toBeInTheDocument()
  expect(screen.getByText('TI')).toBeInTheDocument()
})
```

### Test de API Route

```tsx
import { POST } from '@/app/api/careers/apply/route'

test('validates required fields', async () => {
  const formData = new FormData()
  // Not adding required fields

  const request = new Request('http://localhost:3000/api/careers/apply', {
    method: 'POST',
    body: formData,
  })

  const response = await POST(request)
  expect(response.status).toBe(400)
})
```

## Dicas de Performance

### Lazy Loading

```tsx
import dynamic from 'next/dynamic'

const ApplyModal = dynamic(() =>
  import('@/components/recruitment/ApplyModal').then(mod => mod.ApplyModal)
)
```

### Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/company-logo.png"
  alt="Company Logo"
  width={200}
  height={50}
  priority // Para logos importantes
/>
```

### Suspense Boundaries

```tsx
<Suspense fallback={<JobsListSkeleton />}>
  <PublicJobsList filters={searchParams} />
</Suspense>
```

## Segurança

### Validação Server-Side

Sempre valide no servidor, não confie apenas no cliente:

```tsx
// ❌ Não confie apenas na validação do cliente
// ✅ Sempre valide no servidor também

export async function POST(request: NextRequest) {
  const data = await request.json()

  // Validar novamente no servidor
  if (!data.email || !isValidEmail(data.email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  // Processar...
}
```

### RLS Policies

Sempre teste suas políticas RLS:

```sql
-- Como usuário anônimo
SET ROLE anon;
SELECT * FROM job_postings; -- Deve ver apenas vagas públicas

-- Como usuário autenticado
SET ROLE authenticated;
SELECT * FROM job_postings; -- Deve ver vagas da sua empresa
```

## Conclusão

Estes exemplos cobrem os principais casos de uso dos componentes criados. Para mais detalhes, consulte:

- `FASE7_PORTAL_CARREIRAS.md` - Documentação técnica completa
- `PORTAL_CARREIRAS_GUIA.md` - Guia de uso e customização
- Código fonte dos componentes

Boa implementação! 🚀
