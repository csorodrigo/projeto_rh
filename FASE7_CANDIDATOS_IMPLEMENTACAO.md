# Fase 7 - Gestão de Candidatos e Sistema de Atividades

## Implementação Completa

Este documento descreve a implementação da Fase 7 do sistema de Recrutamento, focada em **Gestão de Candidatos** e **Sistema de Atividades/Timeline**.

## Arquivos Criados

### 1. Tipos e Definições

**`src/types/recruitment.ts`**
- Tipos completos para o sistema de recrutamento
- Enums: JobStatus, JobType, ApplicationStatus, ActivityType, InterviewType, etc
- Interfaces: Job, Candidate, Application, Activity, Interview, Rating
- Tipos estendidos com relações
- Tipos utilitários para formulários e operações

### 2. Utilitários

**`src/lib/recruitment/candidate-utils.ts`**
- `findDuplicateCandidates()` - Detecta candidatos duplicados por email
- `calculateAverageRating()` - Calcula rating médio e por categoria
- `getActivityIcon()` - Retorna ícone para cada tipo de atividade
- `formatActivityDescription()` - Formata descrição legível de atividades
- `getCandidateStatus()` - Status agregado do candidato
- `getSourceBadge()` - Badge colorido por origem
- Funções de formatação de data e tempo
- Validação de email e telefone
- Funções de exportação de dados

### 3. Componentes de Candidato

**`src/components/recruitment/CandidateProfile.tsx`**
- Visualização completa do perfil
- Modo de edição inline
- Informações pessoais e profissionais
- Metadata (tags, origem, notas)
- Auditoria (created_at, updated_at)

**`src/components/recruitment/CandidateTimeline.tsx`**
- Timeline vertical de atividades
- Ícones por tipo de atividade
- Timestamps relativos ("2 horas atrás")
- Mostra autor da ação
- Comentários expansíveis
- Scroll infinito (preparado)
- Loading states

**`src/components/recruitment/CandidateApplicationsList.tsx`**
- Lista de aplicações do candidato
- Status e estágio atual
- Informações da vaga
- Timeline de datas importantes
- Link para pipeline da vaga
- Motivo de rejeição (quando aplicável)

**`src/components/recruitment/AddActivityForm.tsx`**
- Form para adicionar atividades
- Tipos suportados:
  - Comentário
  - Avaliação com rating
  - Agendamento de entrevista
  - Registro de ligação
  - Registro de email
- Campos dinâmicos por tipo
- Validação com Zod
- Rich text para comentários (Textarea)
- Date picker para entrevistas
- Rating interativo (estrelas)

**`src/components/recruitment/RatingDisplay.tsx`**
- `RatingStars` - Display de estrelas
- `RatingList` - Lista de avaliações
- `InteractiveRating` - Rating interativo (input)
- `RatingSummary` - Resumo com distribuição
- Agrupamento por categoria
- Média calculada automaticamente

**`src/components/recruitment/ResumeViewer.tsx`**
- Visualizador de PDF inline (iframe)
- Controles de zoom
- Fallback para documentos Word
- Botões de download e nova aba
- Error handling

**`src/components/recruitment/MergeCandidatesModal.tsx`**
- Modal para mesclar duplicados
- Comparação lado a lado
- Escolha campo por campo
- Radio buttons para preferência
- Confirmação antes de mesclar
- Preview dos dados mesclados

### 4. Páginas

**`src/app/(dashboard)/recrutamento/candidatos/page.tsx`**
- Lista completa de candidatos
- DataTable com colunas:
  - Avatar, Nome, Email
  - Telefone
  - Cargo e Empresa Atual
  - Origem
  - Rating
  - Tags
  - Última Atividade
- Filtros:
  - Por origem (LinkedIn, Indeed, etc)
  - Por rating (5★, 4+★, 3+★)
  - Por tag (input de busca)
- Search por nome/email
- Detecção automática de duplicados
- Alerta visual de duplicados
- Ações:
  - Ver Perfil
  - Mesclar com Duplicado
  - Exportar Dados
- Botão "Novo Candidato"
- Botão "Exportar"

**`src/app/(dashboard)/recrutamento/candidatos/[id]/page.tsx`**
- Página de perfil completo do candidato
- Layout com sidebar + conteúdo
- **Sidebar:**
  - Avatar grande
  - Nome e cargo
  - Rating médio
  - Tags
  - Origem
  - Ações rápidas:
    - Adicionar Nota
    - Enviar Email
    - Ligar
    - Menu "Mais Ações"
  - Card de contato com links
- **Tabs principais:**
  1. **Perfil** - CandidateProfile component
  2. **Currículo** - ResumeViewer component
  3. **Aplicações** - CandidateApplicationsList
  4. **Timeline** - CandidateTimeline
  5. **Avaliações** - RatingSummary
- Modal de adicionar atividade
- Breadcrumb de navegação

### 5. API Routes

**`src/app/api/recruitment/candidates/[id]/merge/route.ts`**
- POST para mesclar candidatos
- Validação de permissões
- Verifica se candidatos existem
- Aplica preferências de campos
- Mescla tags (união)
- Mescla notas (concatenação)
- Transfere aplicações
- Transfere atividades
- Transfere documentos
- Registra histórico da mesclagem
- Deleta candidato duplicado
- Retorna candidato mesclado

**`src/app/api/recruitment/candidates/[id]/activities/route.ts`**
- **GET** - Lista atividades com paginação
- **POST** - Cria nova atividade
- Suporta todos os tipos de atividade
- Atualiza rating médio do candidato (quando aplicável)
- Cria notificações (preparado)
- Joins com dados do usuário (performer)

## Funcionalidades Implementadas

### ✅ Gestão de Candidatos

1. **Lista de Candidatos**
   - Visualização em tabela com todas as informações relevantes
   - Busca e filtros múltiplos
   - Detecção automática de duplicados
   - Exportação de dados

2. **Perfil Detalhado**
   - Visualização completa de informações
   - Edição inline de dados
   - Organização em tabs
   - Sidebar com ações rápidas

3. **Currículo**
   - Visualização de PDF inline
   - Controles de zoom
   - Download e nova aba
   - Fallback para outros formatos

4. **Mesclar Duplicados**
   - Detecção por email
   - Comparação lado a lado
   - Escolha granular de dados
   - Consolidação automática de aplicações

### ✅ Sistema de Atividades

1. **Timeline Completa**
   - Histórico de todas as interações
   - Ícones por tipo
   - Timestamps relativos
   - Autor das ações
   - Comentários expansíveis

2. **Tipos de Atividade**
   - Mudança de status
   - Comentários
   - Agendamento de entrevistas
   - Avaliações (ratings)
   - Upload de documentos
   - Email enviado
   - Ligação registrada
   - Testes/assessments completados
   - Proposta enviada/aceita/rejeitada

3. **Adicionar Atividade**
   - Form dinâmico por tipo
   - Validação completa
   - Rating interativo
   - Date picker para entrevistas
   - Rich text para notas

### ✅ Sistema de Avaliação

1. **Ratings**
   - Escala de 1-5 estrelas
   - Por categoria (técnica, cultural, comunicação, etc)
   - Comentários opcionais
   - Média calculada automaticamente
   - Distribuição visual

2. **Visualizações**
   - Rating médio destacado
   - Lista de avaliações
   - Agrupamento por categoria
   - Histórico completo

### ✅ Aplicações do Candidato

1. **Lista de Aplicações**
   - Todas as vagas aplicadas
   - Status atual
   - Estágio no pipeline
   - Origem da aplicação
   - Datas importantes
   - Link para a vaga

## Integrações

### Com Outros Módulos

- **Funcionários**: Conversão de candidato em funcionário (preparado)
- **Notificações**: Eventos de atividades (preparado)
- **Workflows**: Aprovações no processo seletivo (preparado)
- **Documentos**: Gestão de currículos e anexos

### Com Supabase

- Autenticação e autorização
- RLS (Row Level Security)
- Queries otimizadas
- Joins com profiles

## UX/UI

### Diretrizes Seguidas

- ✅ Timeline clara e informativa
- ✅ Indicação de autor e timestamp
- ✅ Avatares e nomes dos usuários
- ✅ Confirmação em ações destrutivas
- ✅ Feedback visual (toasts)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Acessibilidade (aria-labels, keyboard navigation)

### Padrões de Design

- Uso consistente de shadcn/ui
- Cores e badges por status
- Ícones do lucide-react
- Espaçamento e tipografia padronizados
- Dark mode suportado

## Tecnologias

- **Next.js 14+** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form** + **Zod**
- **TanStack Table** (DataTable)
- **date-fns** (formatação de datas)
- **Sonner** (toasts)
- **Supabase** (database)

## Próximos Passos Sugeridos

### Melhorias Futuras

1. **Upload de Currículo**
   - Drag & drop
   - Parse automático de CV
   - Extração de dados

2. **Comunicação**
   - Templates de email
   - Histórico de emails
   - Integração com calendário

3. **Analytics**
   - Métricas de recrutamento
   - Funil de conversão
   - Time to hire

4. **Automações**
   - Email automático após aplicação
   - Lembretes de entrevistas
   - Feedback automático

5. **Integrações**
   - LinkedIn API
   - Indeed API
   - Google Calendar
   - Zoom/Meet

## Como Usar

### Acessar Lista de Candidatos

```
/recrutamento/candidatos
```

### Ver Perfil de um Candidato

```
/recrutamento/candidatos/[id]
```

### Adicionar Atividade

1. Ir ao perfil do candidato
2. Clicar em "Adicionar Atividade"
3. Escolher tipo
4. Preencher informações
5. Salvar

### Mesclar Duplicados

1. Ir à lista de candidatos
2. Identificar candidatos com badge "Duplicado"
3. Clicar em "..." > "Mesclar com Duplicado"
4. Escolher dados a manter
5. Confirmar mesclagem

## Estrutura de Dados

### Candidate
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  current_position: string
  current_company: string
  linkedin_url: string
  resume_url: string
  source: ApplicationSource
  tags: string[]
  rating: CandidateRating (1-5)
  notes: string
}
```

### Activity
```typescript
{
  id: string
  candidate_id: string
  type: ActivityType
  action: string
  comment: string
  rating?: CandidateRating
  interview_date?: string
  performed_by: string
  created_at: string
}
```

## Validações

- Email: formato válido
- Telefone: formato brasileiro
- Rating: 1-5 estrelas
- Datas: futuras para entrevistas
- Campos obrigatórios marcados

## Permissões

- HR Manager/Analyst: full access
- Hiring Manager: read + comment
- Employee: no access

## Performance

- Lazy loading de atividades antigas
- Debounce em searches (300ms)
- Paginação em listas grandes
- Cache com React Query (preparado)
- Optimistic updates em drag & drop (preparado)

---

**Implementado por:** Claude Sonnet 4.5
**Data:** Janeiro 2026
**Status:** ✅ Completo e funcional
