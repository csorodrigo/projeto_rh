# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-01-29

### Added - Fase 8: Diferenciação

#### PWA Mobile App
- Progressive Web App instalável em dispositivos móveis e desktop
- Service Worker para funcionalidade offline
- Cache inteligente de assets e dados
- Sincronização automática em background quando voltar online
- Push Notifications nativas do sistema operacional
- App Shortcuts para ações rápidas
- Ícones otimizados (192x192 e 512x512)
- Manifest.json completo

#### Organograma Visual Interativo
- Visualização hierárquica da estrutura organizacional
- Navegação interativa (zoom, pan, drag)
- Múltiplos layouts: árvore, horizontal, radial
- Busca de funcionários em tempo real
- Filtros por departamento, cargo e status
- Exportação em PNG, PDF e SVG
- Modo de edição para reorganização (beta)
- Indicadores visuais de status

#### People Analytics Dashboard
- Dashboard completo de métricas de RH
- KPIs principais com tendências
- Análise de Turnover (taxa, custos, por departamento)
- Análise de Absenteísmo (padrões, heatmaps)
- Métricas de Produtividade (horas, overtime, utilização)
- Análise de Recrutamento (time to hire, custo, efetividade)
- Métricas de Diversidade (gênero, idade, tenure)
- Análise de Custos (folha, benefícios, turnover)
- Gráficos interativos (linha, pizza, barra, heatmap)
- Comparação entre períodos
- Filtros avançados

#### AI e Predições
- Predição de Turnover por funcionário
- Projeção de Headcount futuro
- Insights automáticos gerados por IA
- Detecção de padrões e anomalias
- Recomendações acionáveis
- Risk scoring para turnover
- Identificação de fatores de risco

#### Chatbot Inteligente
- Assistente virtual de RH 24/7
- Widget flutuante interativo
- Integração com OpenAI GPT-4
- Base de conhecimento local
- Respostas contextuais baseadas no usuário
- Ações rápidas sugeridas
- Perguntas relacionadas
- Histórico de conversação
- Suporte a múltiplos intents
- Fallback para knowledge base quando IA indisponível

#### APIs REST
- `/api/analytics/dashboard` - Dashboard completo
- `/api/analytics/turnover` - Análise de turnover
- `/api/analytics/absenteeism` - Análise de absenteísmo
- `/api/analytics/predictions/turnover` - Predição de turnover
- `/api/analytics/insights/daily` - Insights diários
- `/api/analytics/headcount/projection` - Projeção de headcount
- `/api/analytics/export` - Exportação de relatórios
- `/api/chatbot/chat` - Enviar mensagem ao chatbot
- `/api/chatbot/knowledge` - Buscar na base de conhecimento
- `/api/chatbot/feedback` - Feedback de resposta
- `/api/organogram/tree` - Estrutura hierárquica
- `/api/organogram/update` - Atualizar hierarquia
- `/api/organogram/export` - Exportar organograma
- `/api/pwa/subscribe` - Registrar push subscription
- `/api/pwa/sync` - Sincronizar dados offline
- `/api/pwa/notification` - Enviar push notification

#### Sistema de Feature Flags
- Controle granular de funcionalidades
- Rollout gradual de features
- Feature groups
- Requirements checking
- A/B testing support
- Metadata de features
- Development helpers

#### Integração e Pontos de Conexão
- `src/lib/integration/phase8.ts` - Pontos de integração centralizados
- `src/lib/features/flags.ts` - Sistema de feature flags
- Integração PWA com sistema existente
- Integração Analytics com dados de RH
- Integração Chatbot com knowledge base
- Integração Organograma com employees

#### Tipos TypeScript
- `src/types/analytics.ts` - Tipos completos para analytics
- Interfaces para todas as métricas
- Tipos para predições e insights
- Tipos para exports
- Tipos para comparações e benchmarks

#### Documentação Completa
- `FASE8_DIFERENCIACAO.md` - Documentação técnica completa
- `SETUP_FASE8.md` - Guia de setup passo a passo
- `GUIA_USUARIO_FASE8.md` - Guia do usuário final
- `API_FASE8.md` - Documentação de APIs REST
- Este CHANGELOG

### Changed

#### Dashboard Principal
- Adicionado widget de "Insight do Dia"
- Adicionado widget de "Ações Sugeridas"
- Links rápidos para Analytics e Organograma
- Melhorias de performance em gráficos

#### Configurações
- Nova tab "Recursos Avançados"
- Toggles para PWA, Chatbot e Analytics
- Configuração de notificações push
- Configuração de automações de IA

#### Performance
- Implementado cache de analytics (5 minutos)
- Lazy loading de gráficos pesados
- Pagination em queries grandes
- Índices otimizados no banco

#### Variáveis de Ambiente
- Adicionadas variáveis para OpenAI
- Adicionadas variáveis para PWA
- Adicionadas variáveis para VAPID keys
- Adicionados feature flags

### Security

- Rate limiting em APIs de chatbot (10 req/min)
- Rate limiting em APIs de analytics (60 req/min)
- Validação de inputs em todas as APIs
- Verificação de company_id em todas as queries
- Encriptação de dados sensíveis no IndexedDB
- VAPID keys para autenticação de push notifications

### Database

#### Novos Índices
```sql
-- Analytics performance
CREATE INDEX idx_time_entries_analytics ON time_entries(company_id, entry_date DESC);
CREATE INDEX idx_absences_analytics ON absences(company_id, start_date, end_date, status);
CREATE INDEX idx_employees_analytics ON employees(company_id, status, hire_date);
CREATE INDEX idx_employees_manager ON employees(company_id, manager_id);
```

#### Novas Funções
```sql
-- Calcular headcount em uma data
get_headcount_at_date(company_id, date)

-- Calcular taxa de turnover
calculate_turnover_rate(company_id, start_date, end_date)
```

#### Novos Storage Buckets
- `analytics-exports` - Exports de relatórios
- `organogram-exports` - Exports de organogramas

### Known Issues

- Push notifications em iOS tem limitações
- Organogram com >500 nós pode ter performance reduzida
- Export de analytics muito grandes pode timeout
- Chatbot AI mode requer créditos OpenAI

### Deprecated

- Nenhuma funcionalidade depreciada nesta versão

### Removed

- Nenhuma funcionalidade removida nesta versão

---

## [1.0.0] - Anteriormente

### Fases 1-7 (Resumo)

#### Fase 1: Fundação
- Setup inicial do projeto Next.js 14
- Integração com Supabase
- Sistema de autenticação
- Dashboard básico

#### Fase 2: Gestão de Funcionários
- CRUD completo de funcionários
- Formulários avançados
- Validações
- Listagem com filtros

#### Fase 3: Controle de Ponto
- Registro de ponto
- Cálculo de horas
- Banco de horas
- Histórico de marcações
- Jornadas de trabalho

#### Fase 4: Férias e Ausências
- Solicitação de férias
- Tipos de ausências
- Workflow de aprovação
- Calendário de ausências
- Relatórios de ausências

#### Fase 5: Compliance e Relatórios
- Relatórios CLT (AFD, AEJ, RE)
- Auditoria de marcações
- Alertas de compliance
- Exportação em múltiplos formatos

#### Fase 6: Recrutamento (Básico)
- Vagas
- Candidatos
- Pipeline de seleção
- Kanban de candidatos

#### Fase 7: Saúde e Segurança
- Gestão de ASOs
- Controle de exames
- Alertas de vencimento
- Histórico médico

---

## Roadmap Futuro

### Fase 8.1 - Enhancements (Q2 2026)
- [ ] Chatbot com voice input
- [ ] Analytics com ML mais avançado
- [ ] Organogram 3D
- [ ] PWA com autenticação biométrica
- [ ] Real-time analytics dashboard
- [ ] Custom reports builder

### Fase 8.2 - Integrations (Q3 2026)
- [ ] Integração com WhatsApp Business
- [ ] Integração com Slack
- [ ] API pública para parceiros
- [ ] Marketplace de apps
- [ ] Webhooks para eventos
- [ ] SSO com provedores externos

### Fase 8.3 - Advanced AI (Q4 2026)
- [ ] Automated hiring recommendations
- [ ] Predictive scheduling
- [ ] Sentiment analysis de feedbacks
- [ ] Automated compliance checks
- [ ] Smart notifications
- [ ] AI-powered skill matching

### Fase 9 - Enterprise Features
- [ ] Multi-tenancy avançado
- [ ] White labeling
- [ ] Custom workflows
- [ ] Advanced permissions
- [ ] Audit logs completo
- [ ] SLA monitoring

---

## Como Contribuir

Ao adicionar uma nova entrada no changelog:

1. Use uma dessas categorias:
   - `Added` para novas funcionalidades
   - `Changed` para mudanças em funcionalidades existentes
   - `Deprecated` para funcionalidades que serão removidas
   - `Removed` para funcionalidades removidas
   - `Fixed` para correções de bugs
   - `Security` para questões de segurança

2. Seja específico e claro
3. Inclua links para issues/PRs quando relevante
4. Mantenha ordem cronológica decrescente

## Versioning

Este projeto segue Semantic Versioning:

- **MAJOR** (2.0.0): Mudanças incompatíveis com versão anterior
- **MINOR** (2.1.0): Novas funcionalidades compatíveis
- **PATCH** (2.1.1): Correções de bugs compatíveis

---

**Última atualização**: 2026-01-29
