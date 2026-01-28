# Sesame HR - Módulo de Férias e Ausências

## URL de Acesso
- **Solicitações Pendentes**: https://app.sesametime.com/admin/incidences/requests
- **Ausências do Funcionário**: https://app.sesametime.com/admin/employees/{id}/absences?year=2026

---

## Visão Geral do Módulo

O módulo "Ausências" gerencia todo o ciclo de vida de ausências dos funcionários:
- Solicitação e atribuição de férias/ausências
- Workflow de aprovação multinível
- Controle de saldo e calendários
- Visualização em calendário anual
- Relatórios de conformidade

---

## Interface de Ausências do Funcionário

### URL Pattern
`/admin/employees/{employee_id}/absences?year={ano}`

### Header
| Elemento | Descrição |
|----------|-----------|
| Seletor de Ano | Navegação < 2026 > |
| Download | Exportar dados |
| Zoom | Visualização ampliada |
| Atribuir ausência | Botão principal de ação |

### Card de Saldo de Férias
```
📅 Férias
Sesame HR (política)
22 / 22 Disponível ✏️    0 Solicitado ↓
[Visualizar tudo]
```

**Campos do Card**:
- Nome da política de férias
- Saldo: X / Y Disponível
- Quantidade solicitada (pendente)
- Link para detalhes

### Calendário Visual Anual
- **Layout**: 2 meses por linha (Janeiro-Fevereiro, Março-Abril, etc.)
- **Dias da semana**: S T Q Q S S D
- **Dia atual**: Destacado com círculo
- **Cores por tipo de ausência**:
  - 🟢 Verde: Férias confirmadas
  - 🟡 Amarelo: Pendente aprovação
  - 🔴 Rosa: Feriados
  - 🔵 Azul: Outros tipos de ausência

### Filtros do Calendário
| Filtro | Opções |
|--------|--------|
| **Estado** | ✅ Pendente |
|            | ✅ Confirmados |
| **Feriado** | ✅ Feriados |

---

## Modal de Atribuir Ausência

### Campos do Formulário
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Tipo | Dropdown | Sim | Tipo de ausência (Férias, Médico, etc.) |
| Data início/fim | DateRange | Sim | Período da ausência |
| Comentário | Textarea | Não | "Explique o motivo" |

### Resumo (Preview)
**Seção Geral**:
- Funcionário selecionado: Nome
- Tipo: Categoria da ausência
- Data: Período selecionado

**Seção Calendários**:
- Lista de calendários de férias disponíveis
- Saldo por calendário (ex: Férias 2025, Férias 2026)
- Dias selecionados vs disponíveis
- Data de expiração do saldo
- Regras de dias úteis

### Exemplo de Calendário de Férias
```
📅 Férias 2025 (22 dias restantes)    +1 dia selecionado
[████████░░░░░░░░░░░░░░]  0 +1 / 22
Disponível até 29/01/2026. Esse calendário é para dias úteis.
Ele afetará apenas os dias em que você trabalha.

📅 Férias 2026 (22 dias restantes)    0 dias selecionados
[░░░░░░░░░░░░░░░░░░░░░░]  0 0 / 22
Disponível até 29/01/2027.
```

---

## Página de Solicitações (Workflow de Aprovação)

### URL
`/admin/incidences/requests`

### Filtros Disponíveis
| Filtro | Descrição |
|--------|-----------|
| Centro | Filtrar por localidade |
| Departamento | Filtrar por departamento |
| Validador de ausência | Filtrar por aprovador |
| Busca | Busca textual |
| Visualizar histórico | Ver solicitações passadas |

### Abas de Visualização
| Aba | Descrição |
|-----|-----------|
| Todas | Total de solicitações pendentes |
| Minhas gestões | Solicitações que eu devo aprovar |
| Outros gerenciamento | Solicitações de outros validadores |

### Colunas da Tabela de Solicitações
| Coluna | Descrição |
|--------|-----------|
| Checkbox | Seleção para ações em lote |
| Quando | Data relativa (Ontem, Hoje, etc.) |
| Funcionário | Avatar + Nome + Departamento |
| Ação | Badge indicando tipo de ação (Criar, Editar) |
| Tipo de ausência | Indicador colorido + Nome do tipo |
| Dias solicitados | Mês + Intervalo de dias + Horário |
| Duração | Tempo total (dias/horas) |
| Tempo restante | Saldo disponível após aprovação |
| Sobreposições | Indicador de conflitos |
| Validadores | Avatar do aprovador responsável |
| Ações | Botões Aprovar ✓ / Rejeitar ✗ |

### Tipos de Ausência Identificados
| Tipo | Cor | Duração Típica | Descrição |
|------|-----|----------------|-----------|
| Férias | 🟢 Verde | Dias | Férias remuneradas anuais |
| Consulta médica | 🔵 Azul | Horas | Consulta médica programada |
| Médico Privado | 🔵 Azul | Horas | Atendimento médico particular |
| Baixa IT | 🟢 Verde | Dias | Licença por incapacidade temporária |
| Casamento | 🟢 Verde | Dias | Licença matrimonial |

---

## Relatórios de Férias e Ausências

### Relatórios Disponíveis (8 tipos)
| Relatório | Descrição | Uso Principal |
|-----------|-----------|---------------|
| **Ausências por estado** | Organiza por status: aprovado, pendente, rejeitado | Acompanhamento de workflow |
| **Feriados trabalhados** | Feriados trabalhados e compensações | Cálculo de compensação |
| **Histórico de atribuições** | Histórico de atribuições de ausências | Auditoria |
| **Ausências não justificadas e saldos** | Dias sem trabalho e sem ausência aprovada | Identificar faltas |
| **Ausências e férias aprovadas** | Lista detalhada de aprovações | Conformidade |
| **Ausências e férias aprovadas (simples)** | Versão resumida | Visão rápida |
| **Saldo de férias** | Saldo de férias por funcionário | Planejamento |
| **Histórico de solicitações** | Entradas e saídas dos funcionários | Rastreamento |

---

## Workflow de Aprovação

### Fluxo Padrão
```
1. Funcionário solicita ausência
   ↓
2. Notificação para validador
   ↓
3. Validador visualiza na fila "Minhas gestões"
   ↓
4. Validador verifica:
   - Sobreposições com outros funcionários
   - Saldo disponível
   - Tempo restante
   ↓
5. Aprovar ✓ ou Rejeitar ✗
   ↓
6. Funcionário notificado do resultado
   ↓
7. Calendário atualizado
```

### Níveis de Validação
- **Validador de ausências**: Definido por funcionário no perfil
- **Gestor do departamento**: Aprovação hierárquica
- **RH**: Aprovação final (quando configurado)

### Verificações Automáticas
- Conflitos de datas com outros funcionários
- Saldo suficiente no calendário
- Período dentro da validade do saldo
- Dias úteis vs calendário completo

---

## Configuração de Políticas

### Elementos Configuráveis
| Elemento | Descrição |
|----------|-----------|
| Nome da política | Ex: "Sesame HR", "Férias 2025" |
| Dias disponíveis | Saldo anual (ex: 22 dias) |
| Período de validade | Data limite para uso |
| Tipo de contagem | Dias úteis ou corridos |
| Regras de acúmulo | Se pode acumular ano anterior |

### Tipos de Ausência Padrão (Configuráveis)
1. Férias
2. Consulta médica
3. Médico privado
4. Licença maternidade/paternidade
5. Casamento
6. Falecimento familiar
7. Baixa por incapacidade temporária (IT)
8. Outros (personalizáveis)

---

## Integrações

### Com Outros Módulos Sesame
- **Funcionários**: Vínculo ao perfil e validadores
- **Controle de Ponto**: Ajuste automático de horas esperadas
- **Turnos**: Verificação de conflitos
- **Calendário de Feriados**: Integração com feriados

### Notificações
- Email para funcionário (solicitação, aprovação, rejeição)
- Email para validador (nova solicitação)
- Push notification (app mobile)
- Alertas no dashboard

---

## Considerações para Implementação

### Funcionalidades Críticas
1. Calendário visual de ausências por funcionário
2. Sistema de saldo com múltiplos calendários
3. Workflow de aprovação com validadores
4. Verificação de sobreposições
5. Tipos de ausência configuráveis
6. Relatório de saldo de férias

### Funcionalidades Desejáveis
1. Aprovação em lote
2. Notificações por email/push
3. Integração com calendário externo (Google, Outlook)
4. Planejamento de férias em equipe
5. Regras de ausência por departamento

### Modelo de Dados Sugerido

**Tabela: absence_policies**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | String | Nome da política |
| year | Integer | Ano de referência |
| total_days | Integer | Dias disponíveis |
| expiration_date | Date | Data limite de uso |
| count_type | Enum | working_days, calendar_days |
| can_accumulate | Boolean | Permite acumular saldo |

**Tabela: absence_types**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | String | Nome do tipo |
| color | String | Cor hexadecimal |
| requires_approval | Boolean | Precisa de aprovação |
| deducts_from_vacation | Boolean | Desconta das férias |
| max_duration | Integer | Duração máxima (dias) |

**Tabela: absence_requests**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| employee_id | FK | Funcionário |
| type_id | FK | Tipo de ausência |
| policy_id | FK | Política de férias |
| start_date | DateTime | Início |
| end_date | DateTime | Fim |
| duration | Interval | Duração calculada |
| status | Enum | pending, approved, rejected |
| validator_id | FK | Aprovador |
| comment | Text | Justificativa |
| created_at | DateTime | Data da solicitação |
| updated_at | DateTime | Última atualização |

**Tabela: employee_balances**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| employee_id | FK | Funcionário |
| policy_id | FK | Política |
| total_days | Integer | Dias totais |
| used_days | Integer | Dias utilizados |
| pending_days | Integer | Dias pendentes |
| available_days | Integer | Dias disponíveis |

### UX Patterns Observados
- Calendário anual com visualização de 2 meses por linha
- Cards de saldo com barra de progresso visual
- Cores distintas para cada tipo de ausência
- Filtros rápidos por status
- Preview de impacto antes de confirmar
- Botões de aprovação/rejeição direto na listagem
- Indicadores visuais de sobreposições
- Tempo relativo para solicitações recentes

---

## Próximos Passos
- [ ] Explorar módulo de Recrutamento
- [ ] Explorar Configurações do Sistema
- [ ] Documentar integração com Turnos
