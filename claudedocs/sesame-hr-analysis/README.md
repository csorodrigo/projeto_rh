# Análise do Sesame HR

Documentação completa da plataforma Sesame HR para replicação de funcionalidades.

## Índice de Documentos

| # | Documento | Descrição |
|---|-----------|-----------|
| 01 | [Dashboard](01-dashboard.md) | Widgets, menu lateral, marketplace de apps |
| 02 | [Funcionários](02-funcionarios.md) | Cadastro, perfil, campos brasileiros |
| 03 | [Controle de Ponto](03-controle-ponto.md) | Registros, timeline, relatórios AFD/AEJ |
| 04 | [Férias e Ausências](04-ferias-ausencias.md) | Solicitações, aprovação, saldo |
| 05 | [Recrutamento](05-recrutamento.md) | Vagas, pipeline Kanban, candidatos |
| 06 | [Relatórios](06-relatorios.md) | 35+ relatórios, compliance |
| 07 | [Configurações](07-configuracoes.md) | Empresa, horários, automações |
| 08 | [Análise Comparativa](08-analise-comparativa.md) | Prioridades, roadmap, especificações |

## Acesso ao Sistema

- **URL**: https://app.sesametime.com/
- **Credenciais de Teste**: Disponíveis em período de trial (14 dias)

## Resumo da Análise

### Módulos Principais
- **Funcionários**: CRUD completo com campos brasileiros (CPF, PIS, CTPS)
- **Controle de Ponto**: Multi-dispositivo com compliance Portaria 671
- **Férias/Ausências**: Workflow de aprovação com saldo automático
- **Recrutamento**: Pipeline Kanban com conversão para funcionário
- **Relatórios**: 35+ relatórios com export Excel/PDF
- **Configurações**: Multi-tenant com papéis e permissões

### Funcionalidades Críticas
1. Registro de ponto multi-dispositivo
2. Relatórios AFD/AEJ (compliance legal)
3. Workflow de aprovação de ausências
4. Sistema de papéis e permissões
5. Dashboard com visibilidade em tempo real

### Stack Sugerida
```
Frontend: Next.js + Tailwind + shadcn/ui
Backend: Supabase (PostgreSQL + Auth)
Deploy: Vercel + Supabase Cloud
```

## Roadmap Sugerido

| Fase | Duração | Entregáveis |
|------|---------|-------------|
| MVP | 4-6 semanas | Funcionários, Ponto, Ausências básicos |
| Compliance | 2-3 semanas | AFD/AEJ, campos brasileiros |
| Produtividade | 3-4 semanas | Automações, imports, workflows |
| Recrutamento | 3-4 semanas | Vagas, Kanban, conversão |

## Contato

Documentação gerada via análise automatizada do Sesame HR em Janeiro de 2026.

