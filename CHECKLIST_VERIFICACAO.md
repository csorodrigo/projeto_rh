# Checklist de Verificação - Portal de Carreiras

Use este checklist para verificar se a implementação está completa e funcionando.

## ✅ Arquivos Criados

### Database
- [ ] `supabase/migrations/021_recruitment_system.sql` - Migration completa
- [ ] `TESTE_PORTAL_CARREIRAS.sql` - Script de testes

### Types
- [ ] `src/types/recruitment.ts` - Tipos TypeScript (já existia)

### Layout
- [ ] `src/app/(public)/layout.tsx` - Layout público

### Pages
- [ ] `src/app/(public)/vagas/page.tsx` - Lista de vagas
- [ ] `src/app/(public)/vagas/[id]/page.tsx` - Detalhes da vaga

### Components
- [ ] `src/components/recruitment/PublicJobsList.tsx`
- [ ] `src/components/recruitment/PublicJobCard.tsx`
- [ ] `src/components/recruitment/PublicJobFilters.tsx`
- [ ] `src/components/recruitment/JobDetailsContent.tsx`
- [ ] `src/components/recruitment/ApplyModal.tsx`
- [ ] `src/components/recruitment/JobShareButton.tsx`
- [ ] `src/components/recruitment/index.ts` - Export file

### API Routes
- [ ] `src/app/api/careers/apply/route.ts`

### Utilities
- [ ] `src/lib/recruitment/resume-upload.ts`
- [ ] `src/lib/notifications/recruitment-emails.ts`

### Documentação
- [ ] `FASE7_PORTAL_CARREIRAS.md`
- [ ] `PORTAL_CARREIRAS_GUIA.md`
- [ ] `RESUMO_IMPLEMENTACAO_FASE7.md`
- [ ] `EXEMPLOS_USO_COMPONENTES.md`
- [ ] `CHECKLIST_VERIFICACAO.md` (este arquivo)

## ✅ Database Setup

### Migration
- [ ] Migration 021 foi executada no Supabase
- [ ] Tabelas criadas:
  - [ ] job_postings
  - [ ] candidates
  - [ ] applications
  - [ ] recruitment_stages
  - [ ] application_stage_history
  - [ ] interviews
  - [ ] interview_feedback

### Enums
- [ ] job_status
- [ ] job_type
- [ ] job_location_type
- [ ] application_status
- [ ] interview_type
- [ ] interview_status

### Storage
- [ ] Bucket 'resumes' criado
- [ ] Permissões do bucket configuradas

### RLS Policies
- [ ] job_postings - acesso público para vagas abertas
- [ ] candidates - insert público
- [ ] applications - insert público
- [ ] storage.objects - upload público

### Triggers
- [ ] update_recruitment_updated_at
- [ ] update_job_applications_count
- [ ] log_application_stage_change
- [ ] create_default_recruitment_stages

### Índices
- [ ] idx_job_postings_published
- [ ] idx_candidates_search
- [ ] idx_applications_status
- [ ] E outros...

## ✅ Configuração

### Variáveis de Ambiente
```bash
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_APP_URL
```

### Supabase
- [ ] Projeto criado
- [ ] URL e chaves configuradas
- [ ] Storage habilitado
- [ ] RLS habilitado

## ✅ Funcionalidades

### Portal Público
- [ ] Acessa `/vagas` sem autenticação
- [ ] Lista de vagas é exibida
- [ ] Cards de vagas são clicáveis
- [ ] Badge "Nova" aparece em vagas recentes
- [ ] Vagas não públicas não aparecem

### Filtros
- [ ] Busca por palavra-chave funciona
- [ ] Filtro de departamento funciona
- [ ] Filtro de localização funciona
- [ ] Filtro de tipo de contratação funciona
- [ ] Filtro de modalidade funciona
- [ ] Botão "Limpar filtros" funciona
- [ ] Filtros sincronizam com URL

### Detalhes da Vaga
- [ ] Página `/vagas/[id]` carrega
- [ ] Informações são exibidas corretamente
- [ ] Requisitos em lista com ícones
- [ ] Responsabilidades em lista
- [ ] Benefícios em lista
- [ ] Salário é exibido (se configurado)
- [ ] Botão "Candidatar-se" funciona
- [ ] Botão "Compartilhar" funciona

### Formulário de Candidatura
- [ ] Modal abre ao clicar em "Candidatar-se"
- [ ] Todos os campos são exibidos
- [ ] Validação funciona em cada campo
- [ ] Upload de arquivo funciona
- [ ] Arquivo PDF é aceito
- [ ] Arquivo Word é aceito
- [ ] Arquivo > 5MB é rejeitado
- [ ] Arquivo de tipo errado é rejeitado
- [ ] Checkbox LGPD é obrigatório
- [ ] Loading state é exibido durante submit
- [ ] Tela de sucesso é exibida
- [ ] Modal fecha após sucesso

### Upload de Currículo
- [ ] Arquivo é enviado ao Storage
- [ ] Path correto: `{company_id}/candidates/{candidate_id}/file.pdf`
- [ ] URL pública é gerada
- [ ] URL é salva no banco

### Backend
- [ ] Candidato é criado ou atualizado
- [ ] Application é criada
- [ ] Status inicial é "applied"
- [ ] Estágio inicial é "Triagem"
- [ ] Contadores são atualizados
- [ ] Histórico é registrado

### Compartilhamento
- [ ] Popover de compartilhar abre
- [ ] "Copiar link" funciona
- [ ] Toast é exibido ao copiar
- [ ] "Compartilhar no LinkedIn" abre janela
- [ ] "Compartilhar no WhatsApp" abre app/web

### Emails (se configurado)
- [ ] Email de confirmação é enviado ao candidato
- [ ] Template HTML está correto
- [ ] Notificação é enviada ao hiring manager
- [ ] Links no email funcionam

## ✅ Responsividade

### Mobile
- [ ] Layout funciona em 375px (iPhone SE)
- [ ] Layout funciona em 414px (iPhone Pro Max)
- [ ] Filtros são acessíveis
- [ ] Cards são clicáveis
- [ ] Formulário é usável
- [ ] Upload funciona no mobile

### Tablet
- [ ] Layout funciona em 768px (iPad)
- [ ] Grid adapta corretamente

### Desktop
- [ ] Layout funciona em 1024px
- [ ] Layout funciona em 1920px
- [ ] Sidebar de filtros está visível
- [ ] Grid de vagas está correto

## ✅ SEO

### Meta Tags
- [ ] Title tag presente em todas as páginas
- [ ] Description tag presente
- [ ] Open Graph tags configuradas
- [ ] URLs são amigáveis (/vagas, /vagas/[id])

### Performance
- [ ] Lighthouse Performance > 80
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 90

### Outros
- [ ] Sitemap existe (ou será criado)
- [ ] robots.txt configurado
- [ ] Structured data (opcional)

## ✅ Segurança

### Validação
- [ ] Validação client-side com Zod
- [ ] Validação server-side na API
- [ ] Sanitização de inputs
- [ ] Tipo de arquivo validado
- [ ] Tamanho de arquivo validado

### RLS
- [ ] Vagas não públicas não são acessíveis
- [ ] Candidatos só são visíveis para empresa
- [ ] Applications só são visíveis para empresa
- [ ] Upload de currículo tem permissões corretas

### Outros
- [ ] HTTPS configurado (em produção)
- [ ] CORS configurado corretamente
- [ ] Rate limiting (recomendado)
- [ ] CAPTCHA (recomendado)

## ✅ Acessibilidade

### Keyboard Navigation
- [ ] Todos os botões são acessíveis via Tab
- [ ] Enter abre modal
- [ ] Escape fecha modal
- [ ] Filtros são navegáveis

### Screen Readers
- [ ] Botões têm labels apropriados
- [ ] Imagens têm alt text
- [ ] Form fields têm labels
- [ ] ARIA labels onde necessário

### Cores
- [ ] Contraste suficiente (WCAG AA)
- [ ] Informação não depende apenas de cor

## ✅ Testes

### Funcionais
- [ ] Listar vagas
- [ ] Filtrar vagas
- [ ] Ver detalhes
- [ ] Candidatar-se
- [ ] Upload de currículo
- [ ] Compartilhar vaga

### Edge Cases
- [ ] Nenhuma vaga disponível
- [ ] Vaga não encontrada (404)
- [ ] Upload falha
- [ ] Email já cadastrado
- [ ] Rede offline
- [ ] Timeout na API

### Performance
- [ ] Tempo de carregamento < 3s
- [ ] Imagens otimizadas
- [ ] Bundle size otimizado
- [ ] Lazy loading funciona

## ✅ Customização

### Branding
- [ ] Logo da empresa adicionado
- [ ] Nome da empresa atualizado
- [ ] Cores do tema ajustadas
- [ ] Textos personalizados

### Conteúdo
- [ ] Hero section customizado
- [ ] Footer customizado
- [ ] Links de navegação corretos
- [ ] Informações de contato atualizadas

## ✅ Integrações (Opcional)

- [ ] Google Analytics configurado
- [ ] Email service integrado (Resend, SendGrid)
- [ ] reCAPTCHA adicionado
- [ ] Monitoring configurado (Sentry, etc)

## ✅ Deploy

### Pré-Deploy
- [ ] Build local sem erros
- [ ] Testes passando
- [ ] Migration testada
- [ ] Variáveis de ambiente configuradas

### Deploy
- [ ] Deploy em staging
- [ ] Smoke tests em staging
- [ ] Deploy em produção
- [ ] Smoke tests em produção

### Pós-Deploy
- [ ] DNS configurado
- [ ] SSL configurado
- [ ] Monitoring ativo
- [ ] Backup configurado
- [ ] Logs sendo coletados

## 🎯 Pronto para Produção?

Para considerar pronto para produção, você deve ter:

**Essencial:**
- ✅ Todos os itens em "Arquivos Criados"
- ✅ Todos os itens em "Database Setup"
- ✅ Todos os itens em "Configuração"
- ✅ Maioria dos itens em "Funcionalidades"
- ✅ Maioria dos itens em "Responsividade"
- ✅ Maioria dos itens em "Segurança"

**Recomendado:**
- ✅ Maioria dos itens em "SEO"
- ✅ Maioria dos itens em "Acessibilidade"
- ✅ Alguns itens em "Integrações"

**Opcional:**
- ⭕ Structured data
- ⭕ reCAPTCHA
- ⭕ Analytics avançado
- ⭕ A/B testing

## 📝 Notas

Use este espaço para anotar problemas encontrados ou melhorias necessárias:

```
- 
- 
- 
```

## ✨ Conclusão

Quando todos os itens essenciais estiverem marcados, seu Portal de Carreiras estará pronto para receber candidatos!

**Boa sorte com o recrutamento! 🚀**
