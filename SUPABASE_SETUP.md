# Supabase Setup Guide

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização (se necessário)
3. Crie um novo projeto
4. Anote as credenciais do projeto (URL e anon key)

## 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## 3. Executar Migrations

### Opção 1: Via Supabase CLI (Recomendado)

Instale o Supabase CLI:

```bash
npm install -g supabase
```

Faça login:

```bash
supabase login
```

Link com seu projeto:

```bash
supabase link --project-ref seu-project-id
```

Execute as migrations:

```bash
supabase db push
```

### Opção 2: Via Supabase Dashboard

1. Acesse seu projeto no dashboard do Supabase
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/20250126001000_create_hr_saas_schema.sql`
4. Cole e execute no editor SQL

## 4. Configurar Authentication

### Email/Password Authentication

No dashboard do Supabase:

1. Vá em **Authentication** → **Providers**
2. Habilite **Email**
3. Configure as opções:
   - Enable email confirmations (opcional)
   - Enable secure email change
   - Enable secure password change

### Configurar Email Templates (Opcional)

1. Vá em **Authentication** → **Email Templates**
2. Customize os templates de:
   - Confirmation
   - Password Reset
   - Magic Link
   - Change Email

## 5. Configurar Row Level Security (RLS)

As políticas básicas de RLS já estão incluídas na migration, mas você pode customizá-las:

1. Vá em **Authentication** → **Policies**
2. Revise as políticas criadas
3. Adicione políticas adicionais conforme necessário

### Exemplos de políticas adicionais:

```sql
-- Permitir HR managers criar funcionários
CREATE POLICY "HR managers can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('company_admin', 'hr_manager')
      AND company_id = employees.company_id
    )
  );

-- Permitir HR managers atualizar funcionários
CREATE POLICY "HR managers can update employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('company_admin', 'hr_manager')
      AND company_id = employees.company_id
    )
  );
```

## 6. Configurar Storage (Para documentos e fotos)

1. Vá em **Storage**
2. Crie os buckets necessários:
   - `employee-photos`: fotos de funcionários
   - `employee-documents`: documentos de funcionários
   - `company-logos`: logos das empresas
   - `payroll-documents`: documentos de folha de pagamento

### Configurar políticas de storage:

```sql
-- Permitir upload de fotos de funcionários
CREATE POLICY "Employees can upload their photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização de fotos de funcionários da mesma empresa
CREATE POLICY "Company users can view employee photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-photos' AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN profiles p ON e.company_id = p.company_id
    WHERE p.id = auth.uid()
  )
);
```

## 7. Seed Data (Opcional)

Crie dados iniciais para testes:

```sql
-- Criar empresa de exemplo
INSERT INTO companies (name, cnpj, email, phone)
VALUES ('Empresa Exemplo', '12.345.678/0001-90', 'contato@exemplo.com', '(11) 99999-9999');

-- Criar usuário admin (após criar conta no Auth)
INSERT INTO profiles (id, company_id, email, full_name, role)
VALUES (
  'uuid-do-usuario', -- ID do usuário criado no Auth
  'uuid-da-empresa', -- ID da empresa criada acima
  'admin@exemplo.com',
  'Admin Exemplo',
  'company_admin'
);
```

## 8. Testar Configuração

Execute o projeto localmente:

```bash
npm run dev
```

Teste as funcionalidades:

1. Criar conta
2. Login
3. Acessar dashboard (deve redirecionar se não autenticado)
4. Criar funcionário
5. Upload de documentos

## Estrutura de Arquivos Criada

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts       # Cliente para browser
│       ├── server.ts       # Cliente para server components
│       ├── middleware.ts   # Helper para middleware
│       ├── auth.ts         # Funções de autenticação
│       └── queries.ts      # Funções de query
├── types/
│   ├── database.ts         # Tipos do banco de dados
│   └── index.ts            # Re-exports
└── middleware.ts           # Middleware Next.js

supabase/
└── migrations/
    └── 20250126001000_create_hr_saas_schema.sql
```

## Uso dos Clientes Supabase

### Client Components (Browser)

```typescript
import { createClient } from '@/lib/supabase/client';

export function MyComponent() {
  const supabase = createClient();
  // usar supabase aqui
}
```

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server';

export async function MyServerComponent() {
  const supabase = await createClient();
  // usar supabase aqui
}
```

### Middleware

```typescript
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

## Funções Disponíveis

### Autenticação

```typescript
import { signIn, signUp, signOut, resetPassword } from '@/lib/supabase/auth';

// Login
const { user, error } = await signIn({ email, password });

// Cadastro
const { user, error } = await signUp({ email, password, full_name });

// Logout
await signOut();

// Reset de senha
await resetPassword(email);
```

### Queries

```typescript
import {
  getCurrentProfile,
  getCurrentCompany,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} from '@/lib/supabase/queries';

// Buscar perfil atual
const { data: profile, error } = await getCurrentProfile();

// Listar funcionários
const { data: employees, error } = await listEmployees(companyId);

// Criar funcionário
const { data: employee, error } = await createEmployee({
  company_id: companyId,
  full_name: 'João Silva',
  cpf: '123.456.789-00',
  // ... outros campos
});
```

## Troubleshooting

### Erro: Missing Supabase environment variables

Certifique-se de que `.env.local` existe e contém as variáveis corretas.

### Erro: Invalid API key

Verifique se a anon key está correta no `.env.local`.

### Erro: RLS policy violation

Verifique se as políticas de RLS estão configuradas corretamente e se o usuário tem permissão.

### Migrations não aplicadas

Execute `supabase db push` novamente ou aplique manualmente via dashboard.

## Próximos Passos

1. Configurar email provider (SMTP) para emails transacionais
2. Implementar autenticação social (Google, GitHub, etc.)
3. Configurar backup automático do banco de dados
4. Implementar logging e monitoring
5. Configurar CORS e rate limiting
