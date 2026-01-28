# Sesame HR - Módulo de Relatórios

## URLs de Acesso
- **Lista de Relatórios**: https://app.sesametime.com/admin/company/reports/reports-list
- **Downloads**: https://app.sesametime.com/admin/company/reports/latest-reports
- **Relatório Individual**: https://app.sesametime.com/admin/reports/{tipo_relatorio}

---

## Visão Geral do Módulo

O módulo "Relatórios" centraliza a geração de todos os relatórios do sistema:
- Relatórios organizados por categorias
- Filtros configuráveis por relatório
- Sistema de download assíncrono
- Compliance com legislação brasileira (AFD, AEJ)
- Busca textual de relatórios

---

## Estrutura da Interface

### Header
| Elemento | Descrição |
|----------|-----------|
| Título | "Relatórios" |
| Busca | Campo de pesquisa de relatórios |
| Período | Seletor de período (ex: "Mês passado") |

### Abas
| Aba | Descrição |
|-----|-----------|
| **Relatórios** | Lista de todos os relatórios disponíveis |
| **Downloads** | Relatórios gerados aguardando download |

---

## Categorias de Relatórios

### 1. Registro de Ponto (19 relatórios)

| Relatório | Descrição | Uso Principal |
|-----------|-----------|---------------|
| **Arquivo Eletrônico de Jornada (AEJ)** | Registro completo para requisitos legais | Compliance trabalhista |
| **Relatório de registros de ponto diários** | Registros diários de todos funcionários | Acompanhamento diário |
| **Espelho de ponto** | Registros e horas por jornada/funcionário | Conferência individual |
| **Relatório de registros de ponto detalhados** | Detalhamento completo de registros | Auditoria |
| **Saldo total de horas** | Total de horas (positivo/negativo) | Banco de horas |
| **Grupos e tipos de registros de ponto** | Análise por grupos e tipos | Categorização |
| **Registros de ponto por turnos e ausências** | Cruzamento turnos x ausências | Planejamento |
| **Relatório de horas categorizadas** | Horas por categoria | Análise de tempo |
| **Relatório de assistência** | Dados de presença e pontualidade | Performance |
| **Saídas antes da jornada** | Saídas antecipadas | Monitoramento |
| **Relatório resumido** | Ausências, ponto e férias consolidado | Visão geral |
| **Consumo de tempo diário** | Primeiro e último registro do dia | Resumo rápido |
| **Horas teóricas e ausências diárias** | Horários planejados x ausências | Comparativo |
| **Centros de Registro de ponto** | Horas por centro/local | Multi-localidade |
| **Arquivo Fonte de Dados (AFD)** | Compliance Portaria 671 | Legal/Fiscal |
| **Escala de turnos** | Escala por filtros selecionados | Gestão de turnos |
| **Contagem de tipos de registros/descansos** | Frequência de cada tipo | Análise estatística |
| **Relatório resumido de presença** | Visão abrangente de presença | Dashboard gerencial |
| **Histórico de solicitações de registros horários** | Entradas e saídas solicitadas | Workflow aprovação |

### 2. Férias e Ausências (8 relatórios)

| Relatório | Descrição | Uso Principal |
|-----------|-----------|---------------|
| **Ausências por estado** | Organiza por status: aprovado, pendente, rejeitado | Acompanhamento de workflow |
| **Feriados trabalhados** | Feriados trabalhados e compensações | Cálculo de compensação |
| **Histórico de atribuições de ausências** | Histórico de atribuições de ausências | Auditoria |
| **Ausências não justificadas e saldos** | Dias sem trabalho e sem ausência aprovada | Identificar faltas |
| **Ausências e férias aprovadas** | Lista detalhada de aprovações | Conformidade |
| **Ausências e férias aprovadas (simples)** | Versão resumida | Visão rápida |
| **Saldo de férias** | Saldo de férias por funcionário | Planejamento |
| **Histórico de solicitações de ausência** | Férias e permissões dos funcionários | Rastreamento |

### 3. Dados Pessoais (6 relatórios)

| Relatório | Descrição | Uso Principal |
|-----------|-----------|---------------|
| **Relatório de gênero** | Gênero de todos os funcionários | Diversidade |
| **Relatório de dados incompletos** | Dados faltantes de cada funcionário | Qualidade de dados |
| **Informação completa dos funcionários** | Todas informações incluindo campos personalizados | Cadastro completo |
| **Relatório de dados de contrato** | Informação do contrato | Gestão contratual |
| **Histórico de dados pessoais** | Mudanças nos dados pessoais | Auditoria |
| **Histórico de dados trabalhistas** | Mudanças nos dados trabalhistas | Auditoria |

### 4. Projetos e Tarefas (2 relatórios)

| Relatório | Descrição | Uso Principal |
|-----------|-----------|---------------|
| **Relatório rentabilidade de projetos** | Rentabilidade de projetos | Análise financeira |
| **Resumo de projetos** | Resumo de projetos | Visão geral |

---

## Interface de Relatório Individual

### URL Pattern
`/admin/reports/{tipo_relatorio}`

Exemplos:
- `/admin/reports/brazilAEJ` - Arquivo Eletrônico de Jornada
- `/admin/reports/dailySignings` - Registros diários

### Filtros Disponíveis
| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Centro | Dropdown | Todos / Centro específico |
| Funcionários | Multi-select | Selecionar funcionários |
| Período | Dropdown | Mês passado / Personalizado |

### Filtros Adicionais (variam por relatório)
| Filtro | Opções |
|--------|--------|
| Departamento | Todos / Específico |
| Grupos | Todos / Específico |
| Tipo de relatório | Dropdown específico |
| Agrupar por | Funcionário / Departamento / etc. |
| Incluir no relatório | Opções adicionais |

### Fluxo de Geração
```
1. Usuário seleciona relatório
   ↓
2. Configura filtros (Centro, Funcionários, Período)
   ↓
3. Clica em "Baixar" ou "Gerar"
   ↓
4. Relatório é processado (background)
   ↓
5. Disponível na aba "Downloads"
   ↓
6. Download em Excel/PDF
```

---

## Aba Downloads

### Estado Vazio
- Mensagem: "Ainda não há relatórios criados"
- Botão: "Ir para relatórios"

### Com Relatórios
| Coluna | Descrição |
|--------|-----------|
| Nome | Tipo do relatório |
| Data | Data de geração |
| Status | Processando / Concluído / Erro |
| Ação | Download / Excluir |

---

## Compliance Legal Brasileiro

### Portaria 671/2021
O módulo oferece relatórios específicos para atender a legislação:

| Relatório | Obrigatoriedade | Formato |
|-----------|-----------------|---------|
| **AFD (Arquivo Fonte de Dados)** | Obrigatório | TXT padrão MTE |
| **AEJ (Arquivo Eletrônico de Jornada)** | Obrigatório | TXT/PDF |

### Campos de Conformidade AFD
- NSR (Número Sequencial de Registro)
- Tipo de registro (1-5)
- Data e hora
- PIS do funcionário
- Identificação do REP

---

## Considerações para Implementação

### Funcionalidades Críticas
1. Sistema de categorias colapsáveis
2. Filtros configuráveis por tipo de relatório
3. Geração assíncrona com fila
4. Download de relatórios gerados
5. Relatórios AFD/AEJ para compliance brasileiro
6. Busca textual de relatórios

### Funcionalidades Desejáveis
1. Agendamento de relatórios recorrentes
2. Envio automático por email
3. Relatórios personalizados
4. Favoritos/Atalhos de relatórios
5. Exportação em múltiplos formatos (Excel, PDF, CSV)
6. Preview antes de download

### Modelo de Dados Sugerido

**Tabela: report_types**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | String | Nome do relatório |
| slug | String | URL slug (ex: brazilAEJ) |
| category | Enum | registro_ponto, ferias, dados_pessoais, projetos |
| description | Text | Descrição do relatório |
| filters | JSON | Filtros disponíveis |
| is_compliance | Boolean | Relatório de compliance |
| output_formats | Array | Formatos disponíveis |

**Tabela: report_requests**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| report_type_id | FK | Tipo de relatório |
| user_id | FK | Usuário solicitante |
| filters | JSON | Filtros aplicados |
| status | Enum | pending, processing, completed, failed |
| file_url | String | URL do arquivo gerado |
| created_at | DateTime | Data da solicitação |
| completed_at | DateTime | Data de conclusão |
| expires_at | DateTime | Data de expiração |

**Tabela: report_schedules**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| report_type_id | FK | Tipo de relatório |
| user_id | FK | Usuário responsável |
| filters | JSON | Filtros padrão |
| frequency | Enum | daily, weekly, monthly |
| recipients | Array | Emails para envio |
| is_active | Boolean | Agendamento ativo |
| next_run | DateTime | Próxima execução |

### UX Patterns Observados
- Cards de relatório em grid de 2 colunas
- Categorias colapsáveis com seta
- Ícones coloridos por categoria (verde para ponto, laranja para ausências, azul para pessoal)
- Campo de busca com placeholder "Buscar"
- Abas para separar lista de downloads
- Filtros em linha horizontal
- Botão de download destacado
- Estado vazio com ilustração e CTA

---

## Integrações

### Com Outros Módulos Sesame
- **Funcionários**: Dados de cadastro para relatórios
- **Controle de Ponto**: Registros de entrada/saída
- **Ausências**: Dados de férias e faltas
- **Tarefas/Projetos**: Horas por projeto

### Exportação
- Excel (.xlsx)
- PDF
- TXT (para AFD/AEJ)
- CSV (provável)

---

## Métricas de Uso

### KPIs Recomendados
- Relatórios mais gerados
- Tempo médio de processamento
- Taxa de erro de geração
- Uso por categoria
- Frequência de downloads

---

## Próximos Passos
- [ ] Explorar Configurações do Sistema
- [ ] Documentar integração com módulos
- [ ] Criar análise comparativa final

