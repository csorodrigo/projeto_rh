# Deploy Checklist - Fase 8

Lista completa de verificação antes de fazer deploy da Fase 8 em produção.

## Pré-Deploy

### 1. Ambiente de Desenvolvimento

- [ ] Build local completa sem erros
  ```bash
  npm run build
  ```

- [ ] Todos os testes passando
  ```bash
  npm test
  npm run test:e2e
  ```

- [ ] Lint sem warnings críticos
  ```bash
  npm run lint
  ```

- [ ] TypeScript sem erros
  ```bash
  npx tsc --noEmit
  ```

### 2. Variáveis de Ambiente

- [ ] `.env.example` atualizado com novas variáveis
- [ ] Todas as variáveis configuradas na Vercel/hosting
- [ ] `OPENAI_API_KEY` válida e com créditos
- [ ] `NEXT_PUBLIC_SUPABASE_URL` correto para produção
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` correto para produção
- [ ] `NEXT_PUBLIC_APP_URL` aponta para domínio de produção
- [ ] VAPID keys geradas (se push notifications habilitado)

**Variáveis essenciais da Fase 8:**
```env
NEXT_PUBLIC_PWA_ENABLED=true
OPENAI_API_KEY=sk-proj-...
CHATBOT_ENABLED=true
NEXT_PUBLIC_CHATBOT_ENABLED=true
ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ORGANOGRAM_ENABLED=true
NEXT_PUBLIC_PREDICTIONS_ENABLED=true
```

### 3. Database (Supabase)

#### Migrations

- [ ] Todas as migrations aplicadas
  ```bash
  supabase db push
  ```

- [ ] Migrations testadas em ambiente de staging

#### Índices

- [ ] Índices de analytics criados
  ```sql
  CREATE INDEX idx_time_entries_analytics
  ON time_entries(company_id, entry_date DESC);

  CREATE INDEX idx_absences_analytics
  ON absences(company_id, start_date, end_date, status);

  CREATE INDEX idx_employees_analytics
  ON employees(company_id, status, hire_date);

  CREATE INDEX idx_employees_manager
  ON employees(company_id, manager_id);
  ```

- [ ] Funções auxiliares criadas
  ```sql
  -- get_headcount_at_date
  -- calculate_turnover_rate
  ```

#### Storage

- [ ] Bucket `analytics-exports` criado
- [ ] Bucket `organogram-exports` criado
- [ ] Políticas de acesso configuradas
  ```sql
  -- Usuários podem fazer upload de seus exports
  -- Usuários podem baixar apenas seus exports
  ```

#### RLS (Row Level Security)

- [ ] Políticas RLS revisadas
- [ ] Testado acesso com diferentes roles
- [ ] Company isolation verificado

### 4. Assets PWA

- [ ] `public/manifest.json` válido
- [ ] `public/sw.js` presente e funcional
- [ ] Ícones PWA presentes:
  - [ ] `public/icon-192.png`
  - [ ] `public/icon-512.png`
  - [ ] `public/favicon.ico`

- [ ] Manifest validado em:
  https://manifest-validator.appspot.com/

### 5. Segurança

- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] Headers de segurança configurados
- [ ] Nenhuma chave secreta commitada no código
- [ ] `.env.local` no `.gitignore`
- [ ] Validação de inputs em todas as APIs

### 6. Performance

- [ ] Images otimizadas
- [ ] Lazy loading implementado
- [ ] Code splitting adequado
- [ ] Bundle size dentro do aceitável (<500KB)
  ```bash
  npm run build
  # Verificar output de tamanho dos chunks
  ```

- [ ] Lighthouse score > 90
  - Performance: >90
  - Accessibility: >90
  - Best Practices: >90
  - SEO: >90
  - PWA: >90

## Deploy

### 1. Git

- [ ] Branch `main` atualizada
- [ ] Commits com mensagens claras
- [ ] Tags de versão criadas
  ```bash
  git tag -a v2.0.0 -m "Fase 8 - Diferenciação"
  git push origin v2.0.0
  ```

### 2. Vercel/Hosting

#### Build Settings

- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node version: 18.x ou superior

#### Environment Variables

- [ ] Todas as variáveis configuradas
- [ ] Variáveis sensíveis marcadas como sensíveis
- [ ] Variáveis de preview vs produção separadas

#### Domains

- [ ] Domínio custom configurado
- [ ] HTTPS habilitado
- [ ] Redirects configurados (www → não-www ou vice-versa)

### 3. Deploy

- [ ] Deploy de preview testado
  ```bash
  vercel --preview
  ```

- [ ] Deploy de produção
  ```bash
  vercel --prod
  ```

- [ ] Verificar logs de build
- [ ] Verificar logs de runtime

## Pós-Deploy

### 1. Verificação Funcional

#### PWA

- [ ] Manifest acessível em `/manifest.json`
- [ ] Service Worker registrando corretamente
  ```javascript
  // DevTools > Application > Service Workers
  ```

- [ ] App instalável (botão de instalação aparece)
- [ ] Cache funcionando
- [ ] IndexedDB criado

#### Chatbot

- [ ] Widget aparece no canto inferior direito
- [ ] Clicar abre o chat
- [ ] Enviar mensagem funciona
- [ ] Resposta recebida (IA ou knowledge base)
- [ ] Ações sugeridas funcionam
- [ ] Perguntas relacionadas aparecem

#### Analytics

- [ ] Dashboard `/analytics` carrega
- [ ] KPIs aparecem
- [ ] Gráficos renderizam
- [ ] Filtros de período funcionam
- [ ] Export de relatório funciona
- [ ] Insights aparecem

#### Organograma

- [ ] Página `/funcionarios/organograma` carrega
- [ ] Estrutura hierárquica renderiza
- [ ] Zoom e pan funcionam
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Export funciona (PNG/PDF)

### 2. Performance em Produção

- [ ] Tempo de carregamento < 3s
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Core Web Vitals no verde

Ferramentas:
- Chrome DevTools > Lighthouse
- https://pagespeed.web.dev/
- https://web.dev/measure/

### 3. Mobile

- [ ] Testado em iOS Safari
- [ ] Testado em Android Chrome
- [ ] Responsivo em diferentes tamanhos
- [ ] Touch gestures funcionam
- [ ] Instalação funciona em ambos

### 4. Offline

- [ ] App funciona offline após instalado
- [ ] Dados em cache acessíveis
- [ ] Banner "Offline" aparece
- [ ] Sincronização ao voltar online funciona

### 5. Push Notifications (se habilitado)

- [ ] Permissão solicitada
- [ ] Subscription registrada
- [ ] Notificação de teste enviada
- [ ] Notificação aparece no sistema
- [ ] Click na notificação abre app

### 6. APIs

Testar endpoints principais:

- [ ] GET `/api/analytics/dashboard`
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    https://seu-dominio.com/api/analytics/dashboard?period=30d
  ```

- [ ] POST `/api/chatbot/chat`
  ```bash
  curl -X POST \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Teste"}' \
    https://seu-dominio.com/api/chatbot/chat
  ```

- [ ] GET `/api/organogram/tree`

### 7. Monitoramento

- [ ] Configurar Sentry (ou similar) para error tracking
- [ ] Configurar analytics (Google Analytics, Plausible, etc)
- [ ] Configurar uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configurar alertas para erros críticos

#### Métricas para Monitorar

**PWA:**
- Taxa de instalação
- Taxa de uso offline
- Sucesso de sincronização
- Engagement com push notifications

**Chatbot:**
- Mensagens por dia
- Taxa de resolução
- Tempo médio de resposta
- Fallback para KB vs OpenAI

**Analytics:**
- Tempo de cálculo de métricas
- Cache hit rate
- Queries lentas
- Exports gerados

**Geral:**
- Taxa de erro (< 0.1%)
- Latência de API (< 500ms p95)
- Disponibilidade (> 99.9%)

### 8. Documentação

- [ ] README atualizado
- [ ] Changelog atualizado
- [ ] Docs de API publicadas
- [ ] Guia de usuário disponível

### 9. Comunicação

- [ ] Equipe interna notificada
- [ ] Usuários informados sobre novas features
- [ ] Treinamento agendado (se necessário)
- [ ] Release notes publicadas

### 10. Rollback Plan

- [ ] Backup do banco antes do deploy
- [ ] Snapshot da versão anterior
- [ ] Processo de rollback documentado
  ```bash
  # Rollback rápido
  vercel rollback

  # Ou deploy da versão anterior
  git checkout v1.0.0
  vercel --prod
  ```

## Pós-Lançamento (Primeiras 24h)

### Monitoramento Intensivo

- [ ] Verificar logs a cada hora
- [ ] Monitorar taxa de erros
- [ ] Verificar performance
- [ ] Monitorar custos (OpenAI API)

### Métricas de Sucesso

**Dia 1:**
- [ ] < 0.5% taxa de erro
- [ ] Nenhum downtime
- [ ] Feedback positivo de usuários
- [ ] PWA instalado por pelo menos 10% dos usuários ativos

**Semana 1:**
- [ ] > 20% dos usuários experimentaram chatbot
- [ ] > 30% visitaram analytics
- [ ] > 50% instalaram PWA (mobile users)
- [ ] Nenhum bug crítico reportado

### Problemas Comuns e Soluções

#### PWA não instalando

**Causa**: HTTPS não configurado ou manifest inválido
**Solução**:
1. Verificar HTTPS está ativo
2. Validar manifest: https://manifest-validator.appspot.com/
3. Limpar cache do browser

#### Chatbot não respondendo

**Causa**: OpenAI API key inválida ou sem créditos
**Solução**:
1. Verificar API key na Vercel
2. Verificar saldo em https://platform.openai.com/usage
3. Verificar rate limits

#### Analytics muito lentos

**Causa**: Falta de índices ou dados muito grandes
**Solução**:
1. Verificar índices criados
2. Implementar pagination
3. Aumentar cache time

#### Service Worker não atualizando

**Causa**: Cache agressivo
**Solução**:
1. Incrementar versão do cache em `sw.js`
2. Forçar atualização:
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
     reg.update()
   })
   ```

## Rollback de Emergência

Se algo der muito errado:

```bash
# 1. Rollback imediato no Vercel
vercel rollback

# 2. Ou deploy da versão anterior
git checkout v1.0.0
vercel --prod

# 3. Reverter migrations se necessário
supabase db reset

# 4. Notificar usuários
# Enviar email/notificação sobre manutenção
```

## Checklist Final de Lançamento

### Antes de Anunciar

- [ ] Tudo acima verificado
- [ ] Sem erros críticos nos logs
- [ ] Performance aceitável
- [ ] Feedback interno positivo
- [ ] Documentação completa
- [ ] Suporte preparado para dúvidas

### Anúncio

- [ ] Post no blog/site
- [ ] Email para usuários
- [ ] Redes sociais
- [ ] Changelog publicado
- [ ] Vídeo demo (opcional)

### Suporte

- [ ] FAQ atualizado
- [ ] Chatbot treinado com novas features
- [ ] Equipe de suporte briefada
- [ ] Canal de feedback aberto

---

## Assinaturas

**Deploy realizado por**: _______________
**Data**: _______________
**Versão**: v2.0.0
**Status**: ✅ Aprovado / ❌ Problemas

**Notas adicionais**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Última atualização**: 2026-01-29
