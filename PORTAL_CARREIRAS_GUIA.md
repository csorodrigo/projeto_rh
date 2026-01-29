# Guia de Uso - Portal de Carreiras Público

## Visão Geral

Este guia explica como usar e configurar o Portal de Carreiras Público implementado na Fase 7.

## Para Administradores

### Como Publicar uma Vaga

1. Acesse o dashboard interno (autenticado)
2. Navegue até "Recrutamento" > "Vagas"
3. Crie uma nova vaga ou edite uma existente
4. Configure os campos:
   - **Título**: Nome da vaga
   - **Descrição**: Descrição completa
   - **Departamento**: Ex: "Tecnologia", "Vendas"
   - **Localização**: Ex: "São Paulo, SP"
   - **Modalidade**: Presencial, Remoto ou Híbrido
   - **Tipo**: Tempo Integral, Meio Período, etc.
   - **Requisitos**: Lista de requisitos necessários
   - **Responsabilidades**: O que a pessoa fará
   - **Diferenciais**: Nice to have
   - **Benefícios**: Lista de benefícios oferecidos
   - **Faixa Salarial**: Min e Max (opcional)
   - **Mostrar Salário**: Se deve aparecer publicamente

5. **IMPORTANTE**: Marque as opções:
   - ✅ `is_public = true` (vaga aparece no portal público)
   - ✅ `status = active` (vaga está aberta)

6. Salve a vaga

A vaga estará imediatamente disponível em `/vagas`

### Como Gerenciar Candidaturas

1. Acesse "Recrutamento" > "Candidaturas"
2. Veja todas as candidaturas recebidas
3. Para cada candidatura:
   - Ver dados do candidato
   - Baixar currículo
   - Ver carta de apresentação
   - Mover para próxima etapa do pipeline
   - Adicionar notas
   - Agendar entrevistas

### Configurar Etapas do Pipeline

As etapas padrão criadas automaticamente são:
1. Triagem
2. Entrevista RH
3. Entrevista Técnica
4. Entrevista Final
5. Proposta

Você pode personalizar:
1. Acesse "Recrutamento" > "Configurações" > "Pipeline"
2. Adicione, edite ou remova etapas
3. Reordene as etapas
4. Defina cores para cada etapa

## Para Candidatos

### Como se Candidatar

1. Acesse o site público: `https://seusite.com/vagas`
2. Navegue pelas vagas disponíveis
3. Use os filtros para refinar a busca:
   - Buscar por palavra-chave
   - Filtrar por departamento
   - Filtrar por localização
   - Filtrar por tipo de contratação
   - Filtrar por modalidade

4. Clique em uma vaga para ver detalhes
5. Clique em "Candidatar-se"
6. Preencha o formulário:
   - Nome completo *
   - Email *
   - Telefone *
   - LinkedIn (opcional)
   - Upload de currículo * (PDF ou Word, máx. 5MB)
   - Carta de apresentação (opcional)
   - Aceite os termos *

7. Clique em "Enviar Candidatura"
8. Você receberá um email de confirmação

### Compartilhar Vaga

Em qualquer página de vaga, clique em "Compartilhar" para:
- Copiar link da vaga
- Compartilhar no LinkedIn
- Compartilhar no WhatsApp

## Personalização

### Customizar Branding

**Editar Logo e Nome da Empresa:**

Arquivo: `src/app/(public)/layout.tsx`

```tsx
// Linha 14-19
<div className="flex flex-col">
  <span className="font-bold text-lg">Carreiras</span>
  <span className="text-xs text-muted-foreground">Sua Empresa</span> {/* Mudar aqui */}
</div>
```

**Adicionar Logo Real:**

Substitua o ícone `<Building2>` por:

```tsx
<Image
  src="/logo.png"
  alt="Logo da Empresa"
  width={40}
  height={40}
/>
```

### Customizar Textos

**Hero Section:**

Arquivo: `src/app/(public)/vagas/page.tsx`

```tsx
<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
  Construa sua carreira conosco {/* Personalizar */}
</h1>
<p className="text-xl text-muted-foreground mb-8">
  Encontre oportunidades em uma empresa que valoriza pessoas... {/* Personalizar */}
</p>
```

**Footer:**

Arquivo: `src/app/(public)/layout.tsx` (linhas 49-89)

Edite:
- Texto "Construindo o futuro..."
- Links rápidos
- Informações de contato
- Email, telefone, endereço

### Customizar Emails

Arquivo: `src/lib/notifications/recruitment-emails.ts`

**Email ao Candidato:**
- Edite o HTML e texto em `sendApplicationReceivedEmail()`
- Adicione logo da empresa
- Personalize mensagens
- Ajuste próximos passos

**Email ao Hiring Manager:**
- Edite em `sendNewApplicationNotification()`
- Ajuste link do dashboard
- Personalize conteúdo

### Customizar Cores

As cores vêm do seu `tailwind.config.ts`:

```ts
colors: {
  primary: {
    DEFAULT: "#6366f1", // Indigo - mudar para cor da marca
    foreground: "#ffffff",
  },
  // ...
}
```

## Integrações

### Adicionar Google Analytics

1. Crie uma conta no Google Analytics
2. Adicione o script no `layout.tsx`:

```tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  `}
</Script>
```

### Integrar Email Service

**Usando Resend:**

1. Crie conta em [resend.com](https://resend.com)
2. Obtenha API key
3. Instale: `npm install resend`
4. Configure `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

5. Crie `src/lib/email.ts`:

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  return await resend.emails.send({
    from: 'Carreiras <carreiras@suaempresa.com>',
    ...params,
  })
}
```

6. Substitua os `console.log` em `recruitment-emails.ts` por chamadas ao `sendEmail()`

### Adicionar reCAPTCHA

1. Crie projeto no [Google reCAPTCHA](https://www.google.com/recaptcha)
2. Adicione ao formulário em `ApplyModal.tsx`:

```tsx
import ReCAPTCHA from "react-google-recaptcha"

// No formulário:
<ReCAPTCHA
  sitekey="YOUR_SITE_KEY"
  onChange={(token) => setCaptchaToken(token)}
/>

// No submit:
if (!captchaToken) {
  toast({ title: "Complete o CAPTCHA", variant: "destructive" })
  return
}
```

## SEO

### Adicionar Sitemap

Crie `src/app/sitemap.ts`:

```ts
import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, updated_at')
    .eq('is_public', true)
    .eq('status', 'active')

  const jobUrls = jobs?.map((job) => ({
    url: `https://seusite.com/vagas/${job.id}`,
    lastModified: job.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []

  return [
    {
      url: 'https://seusite.com/vagas',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...jobUrls,
  ]
}
```

### Adicionar Structured Data

Em `src/app/(public)/vagas/[id]/page.tsx`, adicione JSON-LD:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "datePosted": job.published_at,
      "employmentType": job.job_type,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company.name,
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location,
        }
      },
      // ... mais campos
    })
  }}
/>
```

## Troubleshooting

### Vagas não aparecem no portal

Verifique:
- [ ] `is_public = true`
- [ ] `status = 'active'`
- [ ] Migration foi executada
- [ ] RLS policies estão ativas

### Upload de currículo falha

Verifique:
- [ ] Bucket 'resumes' existe no Supabase Storage
- [ ] RLS policies do storage estão corretas
- [ ] Arquivo é PDF/DOC e < 5MB
- [ ] Variáveis de ambiente estão configuradas

### Emails não são enviados

- [ ] Integração com serviço de email está configurada
- [ ] API keys estão corretas
- [ ] Domínio está verificado no serviço de email

### Candidatura não é salva

Verifique logs do console para:
- Erros de validação
- Erros do Supabase
- Problemas de rede

## Performance

### Otimizações Recomendadas

1. **Caching**
   - Use `next.config.js` para configurar cache de imagens
   - Implemente ISR (Incremental Static Regeneration) para páginas de vagas

2. **Images**
   - Use Next.js `<Image>` component
   - Configure domínios permitidos
   - Use formatos modernos (WebP)

3. **Fonts**
   - Use `next/font` para otimização automática
   - Preload fonts importantes

4. **Bundle Size**
   - Analise com `@next/bundle-analyzer`
   - Use dynamic imports para componentes pesados
   - Tree-shake libraries não usadas

## Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Consulte a documentação técnica em `FASE7_PORTAL_CARREIRAS.md`
3. Verifique logs do console e do Supabase
4. Entre em contato com o time de desenvolvimento

## Checklist de Lançamento

Antes de colocar em produção:

- [ ] Migration executada
- [ ] Variáveis de ambiente configuradas
- [ ] Bucket 'resumes' criado e configurado
- [ ] RLS policies testadas
- [ ] Branding customizado (logo, cores, textos)
- [ ] Email service integrado e testado
- [ ] Formulário de candidatura testado
- [ ] Upload de currículo testado
- [ ] SEO configurado (meta tags, sitemap)
- [ ] Analytics configurado
- [ ] Testes de segurança realizados
- [ ] Testes de responsividade mobile
- [ ] Performance otimizada
- [ ] Domínio configurado
- [ ] SSL configurado
- [ ] Backup do banco de dados configurado

Bom recrutamento! 🚀
