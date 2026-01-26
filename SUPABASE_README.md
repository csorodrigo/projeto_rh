# Supabase Integration - HR SaaS System

Configuração completa do Supabase para o sistema SaaS de RH com tipos TypeScript e Next.js 14 App Router.

## 📁 Estrutura de Arquivos Criada

```
rh-rickgay/
├── supabase/
│   └── migrations/
│       └── 20250126001000_create_hr_saas_schema.sql  # Schema completo do banco
│
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # Cliente Supabase para browser
│   │       ├── server.ts       # Cliente Supabase para server components
│   │       ├── middleware.ts   # Helper para middleware Next.js
│   │       ├── auth.ts         # Funções de autenticação
│   │       └── queries.ts      # Funções de query com tipos seguros
│   │
│   ├── types/
│   │   ├── database.ts         # Tipos TypeScript do banco de dados
│   │   └── index.ts            # Re-exports de tipos
│   │
│   ├── hooks/
│   │   └── use-supabase.ts     # React hooks customizados
│   │
│   └── middleware.ts            # Middleware Next.js com proteção de rotas
│
├── scripts/
│   └── validate-supabase.ts     # Script de validação da configuração
│
├── .env.example                 # Template de variáveis de ambiente
├── SUPABASE_SETUP.md           # Guia de configuração
└── USAGE_EXAMPLES.md           # Exemplos de uso
```

## 🎯 Recursos Implementados

### 1. Schema do Banco de Dados

**13 tabelas principais:**
- ✅ `companies` - Empresas
- ✅ `profiles` - Perfis de usuário
- ✅ `employees` - Funcionários
- ✅ `employee_documents` - Documentos
- ✅ `time_entries` - Registro de ponto
- ✅ `work_schedules` - Escalas de trabalho
- ✅ `absences` - Ausências e férias
- ✅ `asos` - ASO (Atestado de Saúde Ocupacional)
- ✅ `medical_certificates` - Atestados médicos
- ✅ `evaluation_cycles` - Ciclos de avaliação
- ✅ `evaluations` - Avaliações de desempenho
- ✅ `pdis` - Planos de Desenvolvimento Individual
- ✅ `pdi_checkins` - Check-ins de PDI
- ✅ `payrolls` - Folha de pagamento

**Enums:**
- `user_role`: super_admin, company_admin, hr_manager, hr_analyst, employee
- `employee_status`: active, inactive, on_leave, terminated
- `contract_type`: clt, pj, internship, temporary
- `absence_type`: vacation, sick_leave, personal_leave, unpaid_leave, other
- `evaluation_status`: draft, in_progress, completed, cancelled
- `pdi_status`: draft, active, completed, cancelled

**Features:**
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de segurança básicas
- ✅ Índices otimizados
- ✅ Triggers de updated_at automáticos
- ✅ Relacionamentos FK com cascata

### 2. Clientes TypeScript

**Browser Client (`client.ts`)**
```typescript
import { createClient } from '@/lib/supabase/client';
// Uso em Client Components
```

**Server Client (`server.ts`)**
```typescript
import { createClient } from '@/lib/supabase/server';
// Uso em Server Components
```

**Middleware Helper (`middleware.ts`)**
```typescript
import { updateSession } from '@/lib/supabase/middleware';
// Gerenciamento de sessão no middleware
```

### 3. Autenticação

**Funções disponíveis:**
- ✅ `signIn()` - Login com email/senha
- ✅ `signUp()` - Cadastro de novo usuário
- ✅ `signOut()` - Logout
- ✅ `resetPassword()` - Reset de senha
- ✅ `updatePassword()` - Atualizar senha
- ✅ `getCurrentUser()` - Obter usuário atual
- ✅ `getSession()` - Obter sessão atual
- ✅ `onAuthStateChange()` - Listener de mudanças
- ✅ `isAuthenticated()` - Verificar autenticação

### 4. Queries Type-Safe

**Profile & Company:**
- `getCurrentProfile()` - Perfil do usuário atual
- `getCompany()` - Dados da empresa
- `getCurrentCompany()` - Empresa do usuário atual

**Employees (CRUD completo):**
- `listEmployees()` - Listar com filtros
- `getEmployee()` - Buscar por ID
- `createEmployee()` - Criar
- `updateEmployee()` - Atualizar
- `deleteEmployee()` - Deletar (soft delete)
- `searchEmployees()` - Buscar por nome/número

**Related Data:**
- `getEmployeeDocuments()`
- `getEmployeeTimeEntries()`
- `getEmployeeAbsences()`
- `getEmployeeASOs()`
- `getEmployeeMedicalCertificates()`
- `getEmployeeEvaluations()`
- `getEmployeePDIs()`
- `getEmployeePayrolls()`

**Statistics:**
- `getCompanyStats()` - Estatísticas da empresa

### 5. React Hooks

**Hooks customizados:**
- ✅ `useUser()` - Estado do usuário atual
- ✅ `useProfile()` - Perfil do usuário
- ✅ `useCompany()` - Empresa do usuário
- ✅ `useAuth()` - Estado de autenticação
- ✅ `useUserRole()` - Verificação de permissões

### 6. Middleware & Route Protection

**Proteção automática de rotas:**
- Rotas protegidas: `/dashboard/*`
- Rotas públicas: `/login`, `/signup`, `/auth/*`
- Redirecionamento automático
- Gerenciamento de sessão

### 7. Tipos TypeScript Completos

**Zero `any` types:**
- ✅ Tipos para todas as tabelas
- ✅ Tipos para Insert/Update operations
- ✅ Tipos para enums
- ✅ Tipos para JSON fields (Address, Benefits, etc)
- ✅ Tipos para query results
- ✅ Tipos para auth operations

## 🚀 Quick Start

### 1. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase.

### 2. Executar Migrations

**Via Supabase CLI:**
```bash
supabase link --project-ref seu-project-id
supabase db push
```

**Via Dashboard:**
Copie o conteúdo de `supabase/migrations/20250126001000_create_hr_saas_schema.sql` e execute no SQL Editor.

### 3. Validar Configuração

```bash
npx ts-node scripts/validate-supabase.ts
```

### 4. Usar no Código

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('employees').select('*');
  // ...
}

// Client Component
'use client';
import { useProfile } from '@/hooks/use-supabase';

export function MyComponent() {
  const { profile, loading } = useProfile();
  // ...
}
```

## 📚 Documentação

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Guia completo de configuração
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Exemplos práticos de uso

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. Políticas básicas já criadas:
- Usuários só veem dados da própria empresa
- Controle de acesso baseado em roles
- Isolamento multi-tenant garantido

### Próximos Passos de Segurança

1. Adicionar mais políticas específicas por role
2. Implementar auditoria de ações
3. Configurar rate limiting
4. Adicionar 2FA
5. Implementar password policies

## 🎨 Features Adicionais Sugeridas

### Storage

Configurar buckets para:
- Fotos de funcionários
- Documentos (contratos, ASOs, etc)
- Logos de empresas
- Folhas de pagamento

### Real-time

Implementar subscriptions para:
- Lista de funcionários
- Registro de ponto
- Notificações

### Edge Functions

Criar functions para:
- Processamento de folha
- Envio de emails
- Geração de relatórios
- Integração com APIs externas

## 🧪 Testes

### Testar Autenticação

```bash
# 1. Criar usuário via Supabase Dashboard
# 2. Testar login na aplicação
# 3. Verificar redirect para dashboard
# 4. Testar logout
```

### Testar Queries

```bash
# 1. Criar empresa no banco
# 2. Criar perfil vinculado
# 3. Criar funcionários
# 4. Testar listagem/filtros
```

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se `.env.local` existe
- Confirme que as variáveis estão corretas

### Erro: "RLS policy violation"
- Verifique se o usuário está autenticado
- Confirme que o perfil tem company_id
- Revise as políticas RLS

### Erro: "Table not found"
- Execute as migrations
- Verifique se o schema foi aplicado corretamente

### Tipos TypeScript não reconhecidos
- Execute `npm run build` para regenerar tipos
- Verifique se `@/types/database` está sendo importado

## 📊 Performance

### Otimizações Implementadas

- ✅ Índices em colunas frequently queried
- ✅ Composite indexes para queries complexas
- ✅ Foreign key indexes automáticos
- ✅ Triggers eficientes para updated_at

### Melhorias Sugeridas

1. Implementar caching com React Query
2. Usar pagination para listas grandes
3. Implementar infinite scroll
4. Adicionar debounce em buscas
5. Usar optimistic updates

## 🔄 Updates

Para atualizar o schema:

1. Criar nova migration
2. Testar localmente
3. Executar via CLI ou Dashboard
4. Atualizar tipos TypeScript
5. Atualizar queries se necessário

## 📝 Convenções

### Naming

- Tabelas: plural, snake_case
- Colunas: snake_case
- Tipos TS: PascalCase
- Funções: camelCase

### Commits

- `feat(db):` novos schemas/tables
- `feat(api):` novas queries
- `fix(db):` correções de schema
- `docs:` documentação

## 🤝 Contribuindo

1. Criar branch feature
2. Fazer alterações
3. Testar localmente
4. Criar PR com descrição
5. Aguardar review

## 📞 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Status:** ✅ Configuração completa e pronta para uso

**Versão:** 1.0.0

**Última atualização:** 26/01/2025
