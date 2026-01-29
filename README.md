# Sistema RH - Gestão Completa de Recursos Humanos

Sistema completo de gestão de RH com funcionalidades avançadas de PWA, Analytics, IA e muito mais.

## Funcionalidades Principais

### Core Features (Fases 1-7)
- Gestão de Funcionários
- Controle de Ponto (Clock In/Out)
- Férias e Ausências
- Gestão de ASOs (Saúde)
- Recrutamento Básico
- Relatórios de Compliance (AFD, AEJ, RE)
- Folha de Pagamento

### Fase 8 - Diferenciação
- **PWA Mobile App**: Aplicativo instalável que funciona offline
- **Organograma Visual**: Visualização interativa da hierarquia organizacional
- **People Analytics**: Dashboard avançado com métricas, predições e insights
- **AI Chatbot**: Assistente virtual inteligente com IA

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **AI**: OpenAI GPT-4
- **PWA**: Service Workers, Cache API, IndexedDB

## Quick Start

### Pré-requisitos

- Node.js 18+
- Conta Supabase
- Conta OpenAI (para chatbot com IA)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/rh-rickgay.git
cd rh-rickgay

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Configuração Rápida

Edite `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Fase 8 - Features Avançadas
NEXT_PUBLIC_PWA_ENABLED=true
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_CHATBOT_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ORGANOGRAM_ENABLED=true
```

Para configuração completa, veja [SETUP_FASE8.md](./SETUP_FASE8.md).

## Documentação

### Para Desenvolvedores
- [FASE8_DIFERENCIACAO.md](./FASE8_DIFERENCIACAO.md) - Arquitetura técnica completa
- [SETUP_FASE8.md](./SETUP_FASE8.md) - Guia de configuração e setup
- [API_FASE8.md](./API_FASE8.md) - Documentação das APIs REST
- [DEPLOY_FASE8.md](./DEPLOY_FASE8.md) - Checklist de deploy
- [CHANGELOG.md](./CHANGELOG.md) - Histórico de mudanças

### Para Usuários
- [GUIA_USUARIO_FASE8.md](./GUIA_USUARIO_FASE8.md) - Como usar as funcionalidades

### Consolidado
- [FASE8_COMPLETO.md](./FASE8_COMPLETO.md) - Resumo completo da Fase 8

## Recursos da Fase 8

### PWA Mobile App

Progressive Web App instalável:
- Funciona offline
- Notificações push
- Instalável em mobile e desktop
- Sincronização automática

**Como instalar:**
1. Acesse o site em HTTPS
2. Clique no botão de instalação
3. Use como app nativo

### People Analytics

Dashboard avançado de analytics:
- Turnover (taxa, custos, predições)
- Absenteísmo (padrões, heatmaps)
- Produtividade (horas, overtime)
- Recrutamento (time to hire, custo)
- Diversidade (gênero, idade, tenure)
- Predições com IA
- Insights automáticos

**Acesso:** `/analytics`

### Organograma Visual

Visualização interativa da estrutura:
- Hierarquia completa
- Busca de funcionários
- Export PNG/PDF/SVG
- Múltiplos layouts

**Acesso:** `/funcionarios/organograma`

### AI Chatbot

Assistente virtual 24/7:
- Respostas com IA (GPT-4)
- Base de conhecimento
- Ações rápidas
- Contexto do usuário

**Acesso:** Widget no canto inferior direito

## Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção

# Testes
npm test             # Testes unitários
npm run test:watch   # Testes em modo watch
npm run test:e2e     # Testes E2E
npm run test:coverage # Cobertura de testes

# Qualidade
npm run lint         # Verificar código
```

## Variáveis de Ambiente

### Essenciais

```env
NEXT_PUBLIC_SUPABASE_URL=           # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Chave pública Supabase
SUPABASE_SERVICE_ROLE_KEY=          # Chave service role
```

### Fase 8 (Opcionais mas Recomendadas)

```env
OPENAI_API_KEY=                     # OpenAI API key
NEXT_PUBLIC_PWA_ENABLED=true        # Habilitar PWA
NEXT_PUBLIC_CHATBOT_ENABLED=true    # Habilitar chatbot
NEXT_PUBLIC_ANALYTICS_ENABLED=true  # Habilitar analytics
```

Veja [.env.example](./.env.example) para lista completa.

## Estrutura do Projeto

```
rh-rickgay/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   │   ├── ui/               # UI primitives
│   │   └── ...               # Componentes de features
│   ├── lib/                   # Bibliotecas e utilitários
│   │   ├── supabase/         # Cliente Supabase
│   │   ├── integration/      # Integrações Fase 8
│   │   ├── features/         # Feature flags
│   │   └── ...
│   └── types/                 # Tipos TypeScript
├── public/                    # Assets estáticos
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker
│   └── icons/                # Ícones PWA
├── supabase/                  # Configuração Supabase
│   └── migrations/           # Migrations SQL
└── docs/                      # Documentação
```

## Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Requisitos para PWA

- **HTTPS obrigatório** (Vercel fornece automaticamente)
- Certificado SSL válido
- Service Worker registrado

Veja [DEPLOY_FASE8.md](./DEPLOY_FASE8.md) para checklist completo.

## Features Flags

Controle de features via environment variables:

```typescript
import { isFeatureEnabled } from '@/lib/features/flags'

if (isFeatureEnabled('pwa_enabled')) {
  // PWA features
}
```

Features disponíveis:
- `pwa_enabled` - PWA Mobile App
- `chatbot_enabled` - Chatbot
- `chatbot_ai_mode` - Chatbot com IA
- `analytics_enabled` - People Analytics
- `analytics_predictions` - Predições
- `organogram_enabled` - Organograma
- `push_notifications_enabled` - Push Notifications

## Limitações Conhecidas

- Push notifications em iOS têm limitações
- Organograma com >500 funcionários pode ter performance reduzida
- Chatbot requer créditos OpenAI (custos ~$30-50/mês)
- PWA requer HTTPS em produção

## Performance

- Lighthouse Score: >90
- First Contentful Paint: <1.8s
- Time to Interactive: <3.8s
- Core Web Vitals: Verde

## Segurança

- Rate limiting em APIs
- Row Level Security (RLS) no Supabase
- Validação de inputs
- Autenticação JWT
- HTTPS obrigatório em produção

## Custos Estimados

### APIs e Serviços (mensal)
- Supabase Pro: $25
- OpenAI GPT-4: $30-50 (baseado em uso)
- Vercel Pro: $20 (opcional)
- **Total**: ~$75-95/mês

## Roadmap

### v2.1 - Q2 2026
- [ ] Chatbot com voice input
- [ ] Analytics com ML avançado
- [ ] Organogram edit mode
- [ ] Real-time analytics

### v2.2 - Q3 2026
- [ ] Integração WhatsApp
- [ ] Integração Slack
- [ ] API pública
- [ ] Marketplace de apps

### v3.0 - Q4 2026
- [ ] AI automated hiring
- [ ] Predictive scheduling
- [ ] Sentiment analysis
- [ ] Advanced ML features

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Suporte

- **Email**: suporte@seu-dominio.com
- **Documentação**: [docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/rh-rickgay/issues)
- **Chatbot**: Disponível no sistema

## Licença

[MIT](./LICENSE)

## Autores

- Time de Desenvolvimento RH Sistema
- Fase 8 implementada por agentes especializados

## Agradecimentos

- Next.js team
- Supabase team
- OpenAI
- Comunidade open source

---

**Versão**: 2.0.0 (Fase 8 - Diferenciação)
**Última atualização**: 2026-01-29
