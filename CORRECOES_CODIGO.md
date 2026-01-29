# Correções de Código - Sistema RH

**Aplicar estas mudanças EXATAMENTE como mostrado abaixo**

---

## Correção 1: /src/middleware.ts

### ANTES (versão atual - ERRADA)

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const protectedRoutes = [
  '/dashboard',
  '/funcionarios',
  '/ponto',
  '/ausencias',
  '/pdi',
  '/saude',
  '/folha',
  '/relatorios',
  '/configuracoes',
  '/config',
];

const publicRoutes = ['/login', '/signup', '/auth'];

const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

### DEPOIS (versão corrigida - CORRETA)

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Protected routes that require authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/funcionarios',
  '/ponto',
  '/ausencias',
  '/pdi',
  '/saude',
  '/folha',
  '/relatorios',
  '/configuracoes',
  '/config',
  '/recrutamento',
  '/analytics',
  '/aprovacoes',
  '/notificacoes',
];

/**
 * Public routes that don't require authentication
 * CORRIGIDO: Adicionado /vagas, /sobre, /privacidade
 */
const publicRoutes = [
  '/login',
  '/signup',
  '/auth',
  '/vagas',
  '/sobre',
  '/privacidade',
];

/**
 * Routes that authenticated users shouldn't access
 * (redirects to dashboard if authenticated)
 */
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // CORRIGIDO: Verificar rotas públicas PRIMEIRO
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow access to public routes without authentication
  if (isPublicRoute && !authRoutes.some(route => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - public folder assets
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

**Mudanças Principais:**
1. Adicionado `/vagas`, `/sobre`, `/privacidade` em `publicRoutes`
2. Adicionada verificação de rotas públicas ANTES das outras verificações
3. Ajustado matcher para excluir `manifest.json` e `sw.js`
4. Adicionadas rotas protegidas que estavam faltando

---

## Correção 2: /src/app/page.tsx

### ANTES (versão atual - ERRADA)

```typescript
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/dashboard")
}
```

### DEPOIS (versão corrigida - CORRETA)

```typescript
import { redirect } from "next/navigation"

/**
 * Home page redirects to public job portal
 * This allows unauthenticated visitors to see available jobs
 */
export default function HomePage() {
  redirect("/vagas")
}
```

**Mudança Principal:**
- Redireciona para `/vagas` (público) ao invés de `/dashboard` (protegido)

---

## Verificação das Mudanças

### Comando para ver o diff

```bash
# Ver mudanças no middleware
git diff src/middleware.ts

# Ver mudanças na home page
git diff src/app/page.tsx
```

### Comando para aplicar

```bash
# Adicionar arquivos modificados
git add src/middleware.ts src/app/page.tsx

# Commit com mensagem descritiva
git commit -m "fix(auth): Permitir acesso a rotas públicas e PWA

- Adicionar /vagas, /sobre, /privacidade em publicRoutes
- Verificar rotas públicas antes de aplicar autenticação
- Excluir manifest.json e sw.js do middleware
- Redirecionar home page para /vagas ao invés de /dashboard
- Corrigir 401 em todas as páginas públicas

Fixes: Portal de vagas inacessível, PWA não funciona"

# Push para repositório
git push origin main
```

---

## Testes Pós-Aplicação

### 1. Build Local

```bash
npm run build
```

Deve completar sem erros.

### 2. Servidor Local

```bash
npm run dev
```

Testar:
- http://localhost:3000 → deve redirecionar para /vagas
- http://localhost:3000/vagas → deve carregar lista de vagas
- http://localhost:3000/login → deve carregar página de login
- http://localhost:3000/dashboard → deve redirecionar para /login

### 3. Produção (após deploy)

```bash
# Testar portal de vagas
curl -I https://rh-rickgay-hbd0wgpoy-csorodrigo-2569s-projects.vercel.app/vagas

# Testar login
curl -I https://rh-rickgay-hbd0wgpoy-csorodrigo-2569s-projects.vercel.app/login

# Testar PWA manifest
curl -I https://rh-rickgay-hbd0wgpoy-csorodrigo-2569s-projects.vercel.app/manifest.json

# Testar service worker
curl -I https://rh-rickgay-hbd0wgpoy-csorodrigo-2569s-projects.vercel.app/sw.js
```

Todos devem retornar **200 OK** ou **307 Redirect** (não 401).

---

## Rollback (se necessário)

Se algo der errado, reverter para o commit anterior:

```bash
# Ver último commit
git log --oneline -1

# Reverter último commit (mantém mudanças locais)
git reset --soft HEAD~1

# Reverter último commit (descarta mudanças)
git reset --hard HEAD~1

# Forçar push (se já fez push)
git push --force origin main
```

---

## Próximos Passos (Opcional)

### Criar Páginas Públicas Faltantes

#### /src/app/(public)/sobre/page.tsx

```typescript
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sobre a Empresa | Carreiras",
  description: "Conheça mais sobre nossa empresa, cultura e valores.",
}

export default function SobrePage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-6">Sobre a Empresa</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          Conteúdo sobre a empresa...
        </p>
      </div>
    </div>
  )
}
```

#### /src/app/(public)/privacidade/page.tsx

```typescript
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade | Carreiras",
  description: "Nossa política de privacidade e proteção de dados.",
}

export default function PrivacidadePage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-6">Política de Privacidade</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          Conteúdo da política de privacidade...
        </p>
      </div>
    </div>
  )
}
```

---

## Checklist Final

- [ ] Aplicar mudanças no /src/middleware.ts
- [ ] Aplicar mudanças no /src/app/page.tsx
- [ ] Rodar `npm run build` localmente
- [ ] Testar no localhost
- [ ] Commit com mensagem descritiva
- [ ] Push para repositório
- [ ] Aguardar deploy no Vercel (2-3 min)
- [ ] Testar URLs de produção
- [ ] Verificar se /vagas está acessível
- [ ] Verificar se /login está acessível
- [ ] Verificar se PWA funciona
- [ ] Marcar como resolvido

---

**Tempo Total Estimado**: 15 minutos
**Dificuldade**: Baixa
**Risco**: Mínimo (mudanças simples e diretas)
