# Supabase Usage Examples

Exemplos práticos de como usar o Supabase no projeto.

## 1. Autenticação

### Login Page (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/supabase/auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { user, error } = await signIn({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (user) {
      router.push('/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

### Protected Page (Server Component)

```typescript
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bem-vindo, {user.email}</p>
    </div>
  );
}
```

## 2. Usando Hooks

### Display User Info

```typescript
'use client';

import { useProfile, useCompany } from '@/hooks/use-supabase';

export function UserProfile() {
  const { profile, loading: profileLoading } = useProfile();
  const { company, loading: companyLoading } = useCompany();

  if (profileLoading || companyLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h2>{profile?.full_name}</h2>
      <p>Função: {profile?.role}</p>
      <p>Empresa: {company?.name}</p>
    </div>
  );
}
```

### Check User Role

```typescript
'use client';

import { useUserRole } from '@/hooks/use-supabase';

export function AdminPanel() {
  const { isAdmin, loading } = useUserRole();

  if (loading) return <div>Carregando...</div>;

  if (!isAdmin) {
    return <div>Acesso negado</div>;
  }

  return (
    <div>
      <h1>Painel Administrativo</h1>
      {/* Admin content */}
    </div>
  );
}
```

## 3. Queries

### List Employees (Server Component)

```typescript
import { getCurrentCompany, listEmployees } from '@/lib/supabase/queries';

export default async function EmployeesPage() {
  const { data: company } = await getCurrentCompany();

  if (!company) {
    return <div>Empresa não encontrada</div>;
  }

  const { data: employees, error } = await listEmployees(company.id);

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  return (
    <div>
      <h1>Funcionários</h1>
      <ul>
        {employees?.map((employee) => (
          <li key={employee.id}>
            {employee.full_name} - {employee.department}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Create Employee (Client Component)

```typescript
'use client';

import { useState } from 'react';
import { createEmployee } from '@/lib/supabase/queries';
import { useCompany } from '@/hooks/use-supabase';

export function CreateEmployeeForm() {
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const { data, error } = await createEmployee({
      company_id: company!.id,
      full_name: formData.get('full_name') as string,
      cpf: formData.get('cpf') as string,
      email: formData.get('email') as string,
      birth_date: formData.get('birth_date') as string,
      employee_number: formData.get('employee_number') as string,
      department: formData.get('department') as string,
      position: formData.get('position') as string,
      hire_date: formData.get('hire_date') as string,
      status: 'active',
      contract_type: 'clt',
      salary: Number(formData.get('salary')),
      benefits: [],
      address: null,
    });

    setLoading(false);

    if (error) {
      alert('Erro ao criar funcionário: ' + error.message);
    } else {
      alert('Funcionário criado com sucesso!');
      e.currentTarget.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="full_name" placeholder="Nome completo" required />
      <input name="cpf" placeholder="CPF" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="birth_date" type="date" placeholder="Data de nascimento" required />
      <input name="employee_number" placeholder="Número do funcionário" required />
      <input name="department" placeholder="Departamento" required />
      <input name="position" placeholder="Cargo" required />
      <input name="hire_date" type="date" placeholder="Data de contratação" required />
      <input name="salary" type="number" placeholder="Salário" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Funcionário'}
      </button>
    </form>
  );
}
```

### Employee Detail Page (Server Component)

```typescript
import { getEmployee, getEmployeeDocuments } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';

export default async function EmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: employee, error } = await getEmployee(params.id);

  if (error || !employee) {
    notFound();
  }

  const { data: documents } = await getEmployeeDocuments(employee.id);

  return (
    <div>
      <h1>{employee.full_name}</h1>
      <div>
        <p>CPF: {employee.cpf}</p>
        <p>Departamento: {employee.department}</p>
        <p>Cargo: {employee.position}</p>
        <p>Status: {employee.status}</p>
      </div>

      <h2>Documentos</h2>
      <ul>
        {documents?.map((doc) => (
          <li key={doc.id}>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
              {doc.document_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 4. Real-time Updates

### Listen to Employee Changes

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Employee } from '@/types';

export function EmployeeList({ companyId }: { companyId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial data
    supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .then(({ data }) => {
        if (data) setEmployees(data);
      });

    // Subscribe to changes
    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('Change received!', payload);

          if (payload.eventType === 'INSERT') {
            setEmployees((prev) => [...prev, payload.new as Employee]);
          } else if (payload.eventType === 'UPDATE') {
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === payload.new.id ? (payload.new as Employee) : emp
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEmployees((prev) =>
              prev.filter((emp) => emp.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return (
    <ul>
      {employees.map((employee) => (
        <li key={employee.id}>{employee.full_name}</li>
      ))}
    </ul>
  );
}
```

## 5. File Upload (Storage)

### Upload Employee Photo

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function UploadPhoto({ employeeId }: { employeeId: string }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('employee-photos')
      .upload(fileName, file);

    if (error) {
      alert('Erro ao fazer upload: ' + error.message);
    } else {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(fileName);

      // Update employee photo_url
      await supabase
        .from('employees')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', employeeId);

      alert('Foto enviada com sucesso!');
    }

    setUploading(false);
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Enviando...</p>}
    </div>
  );
}
```

## 6. Search

### Search Employees

```typescript
'use client';

import { useState, useEffect } from 'react';
import { searchEmployees } from '@/lib/supabase/queries';
import { useCompany } from '@/hooks/use-supabase';
import type { Employee } from '@/types';

export function EmployeeSearch() {
  const { company } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      const { data } = await searchEmployees(company.id, searchTerm);
      setResults(data ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, company]);

  return (
    <div>
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar funcionário..."
      />
      {loading && <p>Buscando...</p>}
      <ul>
        {results.map((employee) => (
          <li key={employee.id}>
            {employee.full_name} - {employee.employee_number}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 7. Filters

### Filter Employees

```typescript
'use client';

import { useState, useEffect } from 'react';
import { listEmployees } from '@/lib/supabase/queries';
import { useCompany } from '@/hooks/use-supabase';
import type { Employee, EmployeeStatus } from '@/types';

export function FilteredEmployeeList() {
  const { company } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [status, setStatus] = useState<EmployeeStatus | ''>('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (!company) return;

    listEmployees(company.id, {
      status: status || undefined,
      department: department || undefined,
    }).then(({ data }) => {
      setEmployees(data ?? []);
    });
  }, [company, status, department]);

  return (
    <div>
      <div>
        <select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}>
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="on_leave">De férias</option>
          <option value="terminated">Desligado</option>
        </select>

        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Filtrar por departamento"
        />
      </div>

      <ul>
        {employees.map((employee) => (
          <li key={employee.id}>
            {employee.full_name} - {employee.department} ({employee.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 8. Error Handling

### With Toast Notifications

```typescript
'use client';

import { useState } from 'react';
import { createEmployee } from '@/lib/supabase/queries';
import { toast } from 'sonner';

export function CreateEmployeeWithToast() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    try {
      const { data, error } = await createEmployee({
        // ... employee data
      });

      if (error) {
        toast.error('Erro ao criar funcionário', {
          description: error.message,
        });
      } else {
        toast.success('Funcionário criado com sucesso!', {
          description: `${data.full_name} foi adicionado ao sistema.`,
        });
      }
    } catch (err) {
      toast.error('Erro inesperado', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    // Form component
  );
}
```

## Dicas de Performance

1. **Use Server Components quando possível**: Busque dados no servidor para melhor performance
2. **Cache com React Query**: Use `@tanstack/react-query` para cache de dados
3. **Pagination**: Implemente paginação para listas grandes
4. **Lazy Loading**: Carregue dados apenas quando necessário
5. **Debounce**: Use debounce em buscas para reduzir chamadas à API
6. **Optimistic Updates**: Atualize UI antes da resposta do servidor
7. **Real-time seletivo**: Use subscriptions apenas onde necessário
