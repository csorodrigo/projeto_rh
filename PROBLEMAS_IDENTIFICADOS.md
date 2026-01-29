# Problemas Identificados - Sistema RH em Produção

**Data**: 29/01/2026
**Status**: BLOQUEIO TOTAL DO SISTEMA

---

## Matriz de Severidade

| ID | Problema | Severidade | Impacto | Tempo Fix | Status |
|---|---|---|---|---|---|
| P1 | Middleware bloqueia rotas públicas | CRÍTICO | 100% | 5 min | Pendente |
| P2 | Home redireciona para dashboard protegido | CRÍTICO | 100% | 2 min | Pendente |
| P3 | PWA manifest e service worker bloqueados | CRÍTICO | 100% | 2 min | Pendente |
| P4 | Páginas públicas não existem | ALTO | 50% | 30 min | Pendente |
| P5 | Build ignora erros TypeScript/ESLint | MÉDIO | 30% | 2h | Pendente |
| P6 | Falta tratamento erro env vars | MÉDIO | 20% | 15 min | Pendente |

**Total de Problemas**: 6
**Problemas Críticos**: 3
**Problemas Altos**: 1
**Problemas Médios**: 2

---

## P1: Middleware Bloqueia Rotas Públicas

### Descrição
O middleware não permite acesso a `/vagas`, causando 401 em todas as tentativas.

### Evidência
```bash
$ curl -I https://rh-rickgay.vercel.app/vagas
HTTP/2 401 Unauthorized
```

### Impacto
- Portal de vagas: Inacessível
- Candidatos externos: Bloqueados
- Taxa de conversão: 0%

### Causa Raiz
```typescript
// ATUAL (ERRADO)
const publicRoutes = ['/login', '/signup', '/auth'];
// Falta /vagas!
```

### Solução
```typescript
// CORRIGIDO
const publicRoutes = ['/login', '/signup', '/auth', '/vagas'];
```

### Teste de Validação
```bash
curl -I https://rh-rickgay.vercel.app/vagas
# Deve retornar: HTTP/2 200 OK
```

---

## P2: Home Redireciona para Dashboard Protegido

### Descrição
Página inicial (`/`) redireciona para `/dashboard` que requer autenticação.

### Fluxo Atual (ERRADO)
```
Visitante → / → /dashboard → 401 → /login → Confusão
```

### Fluxo Esperado (CORRETO)
```
Visitante → / → /vagas → Vê vagas → Aplica
```

### Causa Raiz
```typescript
// src/app/page.tsx - ATUAL (ERRADO)
export default function HomePage() {
  redirect("/dashboard") // ❌
}
```

### Solução
```typescript
// src/app/page.tsx - CORRIGIDO
export default function HomePage() {
  redirect("/vagas") // ✅
}
```

### Impacto no Funil de Conversão

**Antes:**
```
100 visitantes → 0 chegam em /vagas → 0 conversões
```

**Depois:**
```
100 visitantes → 100 chegam em /vagas → X conversões
```

---

## P3: PWA Manifest e Service Worker Bloqueados

### Descrição
Arquivos PWA essenciais retornam 401, impedindo instalação do app.

### Evidência
```bash
$ curl -I https://rh-rickgay.vercel.app/manifest.json
HTTP/2 401 Unauthorized

$ curl -I https://rh-rickgay.vercel.app/sw.js
HTTP/2 401 Unauthorized
```

### Impacto
- PWA não pode ser instalado
- Funcionalidades offline: Indisponíveis
- Push notifications: Não funcionam
- App shortcuts: Não funcionam

### Funcionalidades Afetadas

| Funcionalidade | Status | Impacto |
|---|---|---|
| Instalação PWA | Bloqueada | Crítico |
| Modo offline | Indisponível | Alto |
| Push notifications | Não funciona | Médio |
| App shortcuts | Não funciona | Médio |
| Ícone na home | Não aparece | Baixo |

### Causa Raiz
Matcher do middleware processa arquivos PWA:

```typescript
// ATUAL
matcher: [
  "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
]
// Processa manifest.json e sw.js!
```

### Solução
```typescript
// CORRIGIDO
matcher: [
  "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
]
// Exclui manifest.json e sw.js
```

### Teste de Validação
```bash
curl -I https://rh-rickgay.vercel.app/manifest.json
# Deve retornar: HTTP/2 200 OK
# Content-Type: application/json

curl -I https://rh-rickgay.vercel.app/sw.js
# Deve retornar: HTTP/2 200 OK
# Content-Type: application/javascript
```

---

## P4: Páginas Públicas Não Existem

### Descrição
Links para `/sobre` e `/privacidade` existem no layout, mas páginas não foram criadas.

### Links Existentes (layout público)
```typescript
<Link href="/sobre">Sobre a Empresa</Link>
<Link href="/privacidade">Política de Privacidade</Link>
```

### Status Atual
```bash
$ curl -I https://rh-rickgay.vercel.app/sobre
HTTP/2 404 Not Found

$ curl -I https://rh-rickgay.vercel.app/privacidade
HTTP/2 404 Not Found
```

### Impacto
- Links quebrados no rodapé
- Experiência do usuário ruim
- SEO negativo
- Compliance (privacidade obrigatória)

### Solução
Criar arquivos:
- `/src/app/(public)/sobre/page.tsx`
- `/src/app/(public)/privacidade/page.tsx`

### Prioridade
- `/privacidade` → ALTA (obrigatório por lei LGPD)
- `/sobre` → MÉDIA (melhora conversão)

---

## P5: Build Ignora Erros TypeScript/ESLint

### Descrição
Configuração do Next.js ignora erros em build:

```typescript
// next.config.ts - PERIGOSO
typescript: {
  ignoreBuildErrors: true,  // ❌
},
eslint: {
  ignoreDuringBuilds: true, // ❌
},
```

### Riscos

| Risco | Probabilidade | Impacto | Severidade |
|---|---|---|---|
| Bugs em produção | Alta | Alto | Crítico |
| Type safety perdida | Alta | Médio | Alto |
| Dívida técnica | Certa | Médio | Médio |
| Manutenção difícil | Alta | Alto | Alto |

### Tipos de Erros Não Detectados
- Type mismatches
- Undefined properties
- Null pointer exceptions
- Missing imports
- Unused variables
- Código morto

### Solução
1. Rodar `npx tsc --noEmit` para listar erros
2. Corrigir todos os erros TypeScript
3. Rodar `npm run lint` para listar warnings
4. Corrigir warnings ESLint importantes
5. Remover flags de ignore

### Comando de Diagnóstico
```bash
# Ver erros TypeScript
npx tsc --noEmit

# Ver warnings ESLint
npm run lint

# Contar erros
npx tsc --noEmit | grep "error TS" | wc -l
```

---

## P6: Falta Tratamento de Erro para Env Vars

### Descrição
Se variáveis Supabase não estão configuradas, sistema falha silenciosamente.

### Código Atual
```typescript
// middleware.ts
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not configured');
  return { supabaseResponse, user: null };
  // ❌ Apenas log, sem feedback ao usuário
}
```

### Impacto
- Usuário vê "loading infinito"
- Erro não é óbvio
- Debug difícil
- Tempo de resolução alto

### Solução
```typescript
// middleware.ts - MELHORADO
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not configured');

  // Em produção, redirecionar para página de erro
  if (process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone();
    url.pathname = '/error/config';
    return NextResponse.redirect(url);
  }

  // Em desenvolvimento, mostrar erro claro
  throw new Error('Missing Supabase configuration. Check your .env.local file.');
}
```

### Criar Página de Erro
`/src/app/error/config/page.tsx`:
```typescript
export default function ConfigErrorPage() {
  return (
    <div className="container py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">Erro de Configuração</h1>
      <p className="text-muted-foreground mb-8">
        O sistema está temporariamente indisponível devido a um erro de configuração.
        Por favor, tente novamente em alguns minutos.
      </p>
      <p className="text-sm text-muted-foreground">
        Código: CONFIG_MISSING_ENV_VARS
      </p>
    </div>
  )
}
```

---

## Resumo de Testes Realizados

### Endpoints Testados
```
✅ = Deveria funcionar
❌ = Retornou 401

❌ /                      (home)
❌ /dashboard             (protegido - esperado 307, obteve 401)
❌ /funcionarios          (protegido - esperado 307, obteve 401)
❌ /ponto                 (protegido - esperado 307, obteve 401)
❌ /ausencias             (protegido - esperado 307, obteve 401)
❌ /relatorios            (protegido - esperado 307, obteve 401)
❌ /recrutamento          (protegido - esperado 307, obteve 401)
❌ /analytics             (protegido - esperado 307, obteve 401)
❌ /vagas                 (público - esperado 200, obteve 401) ⚠️ CRÍTICO
❌ /login                 (público - esperado 200, obteve 401) ⚠️ CRÍTICO
❌ /manifest.json         (público - esperado 200, obteve 401) ⚠️ CRÍTICO
❌ /sw.js                 (público - esperado 200, obteve 401) ⚠️ CRÍTICO
❌ /favicon.ico           (público - esperado 200, obteve 401) ⚠️ CRÍTICO
```

**Taxa de Sucesso**: 0/13 (0%)
**Taxa de Falha Crítica**: 5/13 (38%)

---

## Arquitetura do Problema

```
┌─────────────┐
│   Usuário   │
└─────┬───────┘
      │
      ▼
┌─────────────────┐
│  Vercel Edge    │
└─────┬───────────┘
      │
      ▼
┌─────────────────────────────────┐
│  Middleware (middleware.ts)     │ ◄── PROBLEMA AQUI
│  - Verifica autenticação        │
│  - Bloqueia TUDO (401)          │
│  - Não permite rotas públicas   │
└─────┬───────────────────────────┘
      │
      ▼
┌─────────────────┐
│   Next.js App   │ ◄── Nunca alcançado
│   - /vagas      │
│   - /login      │
│   - /dashboard  │
└─────────────────┘
```

### Fluxo Correto

```
┌─────────────┐
│   Usuário   │
└─────┬───────┘
      │
      ▼
┌─────────────────┐
│  Vercel Edge    │
└─────┬───────────┘
      │
      ▼
┌─────────────────────────────────┐
│  Middleware (middleware.ts)     │ ✅ CORRIGIDO
│  1. Verifica se rota é pública  │
│  2. Se público: permite         │
│  3. Se protegido: verifica auth │
└─────┬───────────────────────────┘
      │
      ├─── Público → Permite
      │         │
      │         ▼
      │    ┌─────────────┐
      │    │   /vagas    │
      │    │   /login    │
      │    └─────────────┘
      │
      └─── Protegido → Verifica auth
                │
                ├─── Autenticado → Permite
                │         │
                │         ▼
                │    ┌─────────────┐
                │    │  /dashboard │
                │    │  /ponto     │
                │    └─────────────┘
                │
                └─── Não autenticado → Redireciona /login
```

---

## Checklist de Correção

### Fase 1: Correções Críticas (15 min)
- [ ] P1: Adicionar rotas públicas no middleware
- [ ] P2: Mudar redirect da home para /vagas
- [ ] P3: Excluir arquivos PWA do matcher
- [ ] Commit e push
- [ ] Validar deploy

### Fase 2: Correções Altas (1h)
- [ ] P4: Criar página /sobre
- [ ] P4: Criar página /privacidade
- [ ] Verificar env vars no Vercel
- [ ] Testar todas funcionalidades

### Fase 3: Correções Médias (2-3h)
- [ ] P5: Resolver erros TypeScript
- [ ] P5: Resolver warnings ESLint
- [ ] P5: Remover flags de ignore
- [ ] P6: Adicionar tratamento de erro env vars
- [ ] P6: Criar página de erro de config

### Fase 4: Validação Final (30 min)
- [ ] Testar todos endpoints
- [ ] Testar PWA no mobile
- [ ] Testar fluxo de candidatura
- [ ] Verificar logs de erro
- [ ] Monitorar performance

---

## Métricas de Sucesso

### KPIs Antes da Correção
- Páginas acessíveis: 0/64 (0%)
- Taxa de erro: 100%
- Candidatos alcançados: 0
- PWA instalável: Não
- Conversão: 0%

### KPIs Após Correção (Meta)
- Páginas públicas acessíveis: 100%
- Taxa de erro: < 5%
- Candidatos alcançados: 100%
- PWA instalável: Sim
- Conversão: > 2%

### Lighthouse Scores (Meta)
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: > 90

---

**Próxima Ação**: Aplicar correções do arquivo `CORRECOES_CODIGO.md`
