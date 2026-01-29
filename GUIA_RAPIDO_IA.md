# Guia Rápido - IA Chatbot e Automações

## Como Começar em 5 Minutos

### 1. Instalar Dependências (se ainda não fez)

```bash
npm install
# ou
pnpm install
```

### 2. Configurar (Opcional - funciona sem API)

**Opção A: Usar Modo Local (Sem API - Recomendado para Testar)**

Não precisa fazer nada! O sistema funciona com fallback local baseado em regras.

**Opção B: Usar OpenAI**

```bash
# Criar arquivo .env.local
cp .env.ai.example .env.local

# Editar .env.local e adicionar sua API key
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_AI_PROVIDER=openai
```

### 3. Executar

```bash
npm run dev
```

### 4. Testar

1. Acesse http://localhost:3000
2. Faça login
3. Veja o botão de chat no canto inferior direito
4. Clique e comece a conversar!

## Perguntas de Teste

Experimente fazer estas perguntas ao chatbot:

### Sobre Férias
- "Como solicitar férias?"
- "Posso vender férias?"
- "Qual meu saldo de férias?"

### Sobre Ponto
- "Como funciona o banco de horas?"
- "Como registrar ponto?"
- "Esqueci de bater o ponto, o que fazer?"

### Sobre Holerite
- "Como entender meu holerite?"
- "Quando recebo meu salário?"
- "O que é IRRF?"

### Sobre Documentos
- "Como solicitar declaração?"
- "Como apresentar atestado médico?"

### Sobre Benefícios
- "Quais benefícios a empresa oferece?"
- "Como usar o vale refeição?"

## Acessar Dashboard de IA

1. No menu lateral, vá em **Analytics > Insights de IA**
2. Ou acesse diretamente: http://localhost:3000/analytics/ai

Você verá:
- Sugestões inteligentes
- Insights automáticos
- Padrões detectados
- Predições de turnover

## Configurar Automações

1. Vá em **Analytics > Configurações**
2. Ou acesse: http://localhost:3000/analytics/configuracoes

Você pode:
- Habilitar/desabilitar chatbot
- Configurar regras de automação
- Ajustar sensibilidade de insights
- Configurar notificações

## Regras de Automação Disponíveis

Estas regras já estão pré-configuradas:

1. **Pesquisa aos 90 dias** - Envia pesquisa de satisfação
2. **Alerta de ausências** - Notifica sobre 3+ dias de falta
3. **Alerta de horas extras** - Avisa sobre excesso (20h+)
4. **Aniversário de empresa** - Parabéns automático
5. **Lembrete de avaliação** - 7 dias antes do prazo
6. **Onboarding** - Tarefas automáticas para novos funcionários
7. **Renovação de ASO** - Alerta 30 dias antes
8. **Férias vencendo** - Aviso sobre férias não agendadas

## Recursos Principais

### Chatbot
- ✅ Responde dúvidas sobre RH
- ✅ Explica políticas da empresa
- ✅ Ajuda com processos
- ✅ Fornece quick replies
- ✅ Detecta intenção automaticamente

### Automações
- ✅ Ações automáticas baseadas em eventos
- ✅ Agendamento com cron
- ✅ Condições customizáveis
- ✅ Múltiplas ações por regra

### Insights
- ✅ Detecção de padrões de absenteísmo
- ✅ Detecção de horas extras excessivas
- ✅ Identificação de risco de burnout
- ✅ Predição de turnover
- ✅ Sugestões de melhoria

### Smart Suggestions
- ✅ Sugestões contextuais
- ✅ Cálculo de impacto
- ✅ Priorização automática
- ✅ Ações rápidas

## Personalizando

### Adicionar FAQs

Edite `src/lib/ai/knowledge-base.ts`:

```typescript
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'kb-custom-001',
    category: 'Minha Categoria',
    question: 'Minha pergunta?',
    answer: 'Minha resposta detalhada...',
    keywords: ['palavra1', 'palavra2'],
    lastUpdated: new Date(),
  },
  // ... mais entradas
]
```

### Criar Nova Regra de Automação

Edite `src/lib/ai/automation-rules.ts`:

```typescript
{
  name: 'Minha Regra',
  description: 'Descrição da regra',
  enabled: true,
  trigger: {
    type: 'event',
    config: { eventType: 'employee.created' }
  },
  conditions: [
    { field: 'department', operator: 'eq', value: 'TI' }
  ],
  actions: [
    {
      type: 'send_email',
      config: { template: 'welcome_it', subject: 'Bem-vindo ao TI' }
    }
  ],
  priority: 1,
}
```

## Troubleshooting

### Chatbot não responde?
1. Verifique o console do navegador para erros
2. Verifique se a API está rodando
3. Se usando OpenAI, verifique se a API key está correta
4. Tente modo local: remova `OPENAI_API_KEY` do `.env.local`

### Erro de rate limit?
- Aguarde 1 minuto
- Ou aumente o limite em `src/app/api/ai/chat/route.ts`

### Sugestões não aparecem?
- Verifique se há dados suficientes no sistema
- Mock data está ativo por padrão
- Ajuste `NEXT_PUBLIC_AI_CONFIDENCE_THRESHOLD` para valor menor

### Automações não executam?
- Verifique se estão habilitadas em Configurações
- Verifique logs no console
- Implementação de ações ainda é mock (precisa integrar com sistemas reais)

## Próximos Passos

1. **Integrar com banco de dados real**
   - Salvar conversas
   - Histórico de execuções
   - Feedback dos usuários

2. **Implementar ações de automação reais**
   - Envio de emails (Resend/SendGrid)
   - Criação de tarefas (Supabase)
   - Notificações (Push/Email)

3. **Treinar com dados da empresa**
   - Upload de políticas
   - Documentos customizados
   - Fine-tuning (se usar OpenAI)

4. **Analytics avançados**
   - Dashboard de performance
   - Métricas de satisfação
   - A/B testing de prompts

## Suporte

Se tiver dúvidas:
1. Leia `IMPLEMENTACAO_IA_CHATBOT.md` para detalhes técnicos
2. Verifique os comentários no código
3. Consulte a documentação do OpenAI/Anthropic

## Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Radix UI Docs](https://www.radix-ui.com)

Bom uso! 🚀
