# Sesame HR - Módulo de Recrutamento

## URLs de Acesso
- **Lista de Vagas**: https://app.sesametime.com/admin/talent/recruitment/vacancies/vacancies-table
- **Pipeline de Candidatos**: https://app.sesametime.com/admin/talent/recruitment/vacancies/vacancie-profile/{vacancy_id}

---

## Visão Geral do Módulo

O módulo "Recrutamento" centraliza todo o processo de seleção:
- Publicação de vagas em portal próprio ou externos
- Pipeline Kanban de candidatos
- Formulários de candidatura customizáveis
- Questionários para triagem
- Conversão de candidato para funcionário
- Gestão de equipes de recrutamento

---

## Lista de Vagas

### URL Pattern
`/admin/talent/recruitment/vacancies/vacancies-table`

### Filtros Disponíveis
| Filtro | Descrição |
|--------|-----------|
| Categoria | Filtrar por categoria da vaga |
| Recrutadores | Filtrar por recrutador responsável |
| Localização | Filtrar por centro/escritório |
| Publicada | Status de publicação |

### Visualizações
- **Visualização em lista**: Cards com pipeline visual
- **Tabela**: Dados estruturados em colunas

### Colunas da Tabela de Vagas
| Coluna | Descrição |
|--------|-----------|
| Vaga | Nome e localização da vaga |
| Categorias | Pipeline visual (quantidade por fase) |
| Estado | Ativa / Inativa / Arquivada |
| Tipo | Pública / Privada |
| Principal | Recrutador principal |
| Recrutadores | Quantidade de recrutadores |
| Notificados | Candidatos notificados |
| Dias | Tempo desde criação |
| Mais | Ações (compartilhar, comentários, menu) |

---

## Wizard de Criação de Vaga

### Estrutura do Wizard (5 etapas)

#### 1. Descrição
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Capa | Image | Não | 1500x500px (altura mínima 250px) |
| Título da vaga | Text | Sim | Nome da posição |
| Descrição da vaga | Textarea | Sim | Descrição completa |

#### 2. Configurações

**Publicação de vagas**:
- Toggle "Meu portal de vagas" para publicar externamente
- Opção de selecionar outros portais de emprego

**Detalhes do posto**:
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Centro | Dropdown | Sim |
| Departamento | Dropdown | Não |
| Categoria do portal de vagas | Dropdown | Sim |
| Tipo de jornada | Dropdown | Sim |
| Modalidade de trabalho | Dropdown | Não |
| Estudos exigidos | Dropdown | Sim |
| Vagas disponíveis | Number | Não |
| Tipo de contrato | Dropdown | Não |

#### 3. Formulário de Candidatura

Campos configuráveis para o candidato preencher:

**Dados Pessoais**:
| Campo | Padrão | Obrigatório Configurável |
|-------|--------|-------------------------|
| E-mail | Ativo | Sim |
| Nome completo | Ativo | Sim |
| Telefone | Ativo | Sim |
| Localização | Inativo | Sim |
| Gênero | Inativo | Sim |

**Dados de Trabalho**:
| Campo | Padrão | Obrigatório Configurável |
|-------|--------|-------------------------|
| Curriculum | Ativo | Sim |
| Data de início disponível | Inativo | Sim |
| Expectativas salariais | Inativo | Sim |

#### 4. Categorias (Modelos de Pipeline)

**Modelo Básico**:
- Novo → Em curso → Oferta → Selecionado → Descartado

**Processo Técnico**:
- Novo → Em curso (3 sub-fases) → Oferta (3 sub-fases) → Selecionado → Descartado (3 sub-fases)

Funcionalidades:
- Personalizar modelo existente
- Adicionar estados customizados
- Definir sub-fases por categoria

#### 5. Equipe de Recrutamento

**Recrutador Principal**:
- Criador da vaga é automaticamente o recrutador principal
- Pode ser substituído a qualquer momento

**Recrutadores**:
- Papéis gerais têm acesso a todas candidaturas
- Papéis específicos podem ser atribuídos
- Configuração de notificações por recrutador

---

## Pipeline de Candidatos (Kanban)

### URL Pattern
`/admin/talent/recruitment/vacancies/vacancie-profile/{vacancy_id}`

### Header da Vaga
| Elemento | Descrição |
|----------|-----------|
| Nome da vaga | Título da posição |
| Tags | Vaga pública, Jornada completa, Localização, Questionário |
| Link portal | "Meu portal de vagas" |
| Buscar | Campo de busca de candidatos |
| Publicar | Botão com contagem pendente |
| Adicionar candidato | Adicionar manualmente |

### Colunas do Kanban
| Coluna | Cor | Descrição |
|--------|-----|-----------|
| **Novo** | 🟢 Verde | Candidatos recém-chegados |
| **Em curso** | 🟡 Amarelo | Em processo de avaliação |
| **Oferta** | 🟠 Laranja | Proposta enviada |
| **Selecionado** | 🔵 Azul | Candidatos aprovados |
| **Descartado** | 🔴 Vermelho | Candidatos rejeitados |

### Sub-fases Configuráveis
- Cada coluna pode ter sub-fases (ex: Entrevista, Teste técnico)
- Indicador de quantidade por sub-fase

---

## Perfil do Candidato

### Header
| Campo | Descrição |
|-------|-----------|
| Nome | Nome completo do candidato |
| Data aplicação | Timestamp da candidatura |
| Telefone | Contato telefônico |
| Email | Endereço de e-mail |
| Navegação | Anterior/Próximo entre candidatos |

### Tabs do Perfil

#### 1. Informação
**Campos do Candidato**:
| Campo | Tipo |
|-------|------|
| Localização | Text/Dropdown |
| Gênero | Dropdown |
| Expectativas salariais | Text |
| Disponível desde | Date |
| Como você nos conheceu? | Dropdown |
| Sobre você | Textarea |

**Seções Laterais**:
- **Anexos**: Upload de documentos (CV, portfólio)
- **Links**: LinkedIn URL, Site pessoal
- **Vagas**: Lista de vagas que o candidato aplicou

#### 2. Questionários
- Lista de questionários vinculados à vaga
- Respostas do candidato
- Status: Respondido / Pendente

#### 3. Atividade
- Log de ações no perfil
- Quem visualizou
- Mudanças de status
- Comentários

#### 4. Banco de Talentos
- Salvar candidato para futuras vagas
- Tags e categorização

#### 5. Reviews
- Avaliações da equipe
- Notas e comentários estruturados

### Painel de Notas (Lateral)
- Comentários sobre o candidato
- Lembretes com data
- Histórico de interações

### Barra de Ações (Footer)
| Ação | Descrição |
|------|-----------|
| ✅ Marcar como não visto | Resetar status de visualização |
| Mover para outro status | Dropdown com fases do pipeline |
| Status atual | Badge com fase atual |
| Mover para vaga | Transferir para outra vaga |
| **Adicionar como funcionário** | Converter em perfil de funcionário |

---

## Integração Candidato → Funcionário

Fluxo de contratação:
```
1. Candidato aprovado (fase "Selecionado")
   ↓
2. Clique em "Adicionar como funcionário"
   ↓
3. Dados transferidos para perfil de funcionário
   - Nome, email, telefone
   - Documentos anexados
   ↓
4. Completar dados faltantes no módulo Funcionários
   ↓
5. Iniciar processo de onboarding
```

---

## Relatórios de Recrutamento

### Relatórios Disponíveis
| Relatório | Descrição |
|-----------|-----------|
| Funil de recrutamento | Conversão entre fases |
| Tempo médio de contratação | Duração do processo |
| Vagas por departamento | Distribuição de posições |
| Candidatos por fonte | Origem das candidaturas |
| Performance de recrutadores | Eficiência por recrutador |

---

## Considerações para Implementação

### Funcionalidades Críticas
1. Wizard de criação de vaga multi-step
2. Pipeline Kanban customizável
3. Formulário de candidatura configurável
4. Drag-and-drop entre fases
5. Conversão candidato → funcionário
6. Notificações para recrutadores

### Funcionalidades Desejáveis
1. Portal de vagas público
2. Integração com LinkedIn/Indeed
3. Questionários de triagem automática
4. Agendamento de entrevistas
5. Templates de email
6. Scorecards de avaliação

### Modelo de Dados Sugerido

**Tabela: vacancies**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| title | String | Título da vaga |
| description | Text | Descrição completa |
| department_id | FK | Departamento |
| location_id | FK | Centro/Escritório |
| job_type | Enum | full_time, part_time, contract |
| work_mode | Enum | on_site, remote, hybrid |
| status | Enum | active, inactive, archived |
| is_public | Boolean | Visível no portal |
| cover_image | String | URL da imagem de capa |
| created_by | FK | Criador/Recrutador principal |
| created_at | DateTime | Data de criação |

**Tabela: vacancy_pipeline_stages**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| vacancy_id | FK | Vaga |
| name | String | Nome da fase |
| color | String | Cor hexadecimal |
| order | Integer | Ordem no pipeline |
| parent_stage_id | FK | Fase pai (sub-fases) |

**Tabela: candidates**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| vacancy_id | FK | Vaga |
| stage_id | FK | Fase atual no pipeline |
| name | String | Nome completo |
| email | String | E-mail |
| phone | String | Telefone |
| location | String | Localização |
| gender | Enum | Gênero |
| cv_url | String | URL do currículo |
| linkedin_url | String | Perfil LinkedIn |
| salary_expectation | Decimal | Expectativa salarial |
| available_from | Date | Disponibilidade |
| source | String | Origem da candidatura |
| status | Enum | new, viewed, contacted |
| applied_at | DateTime | Data da candidatura |

**Tabela: candidate_notes**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| candidate_id | FK | Candidato |
| author_id | FK | Autor da nota |
| content | Text | Conteúdo |
| reminder_date | DateTime | Data do lembrete |
| created_at | DateTime | Data de criação |

**Tabela: candidate_activities**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| candidate_id | FK | Candidato |
| user_id | FK | Usuário que executou |
| action | String | Tipo de ação |
| details | JSON | Detalhes da ação |
| created_at | DateTime | Timestamp |

**Tabela: vacancy_recruiters**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| vacancy_id | FK | Vaga |
| user_id | FK | Recrutador |
| is_primary | Boolean | É recrutador principal |
| notifications | JSON | Configuração de notificações |

### UX Patterns Observados
- Wizard multi-step para criação de vaga
- Kanban com drag-and-drop
- Cards de candidato com preview rápido
- Sidebar com detalhes completos
- Toggle para campos obrigatórios
- Pipeline visual compacto na lista de vagas
- Navegação entre candidatos sem voltar à lista
- Botão de conversão direta para funcionário

---

## Próximos Passos
- [ ] Explorar módulo de Relatórios
- [ ] Explorar Configurações do Sistema
- [ ] Documentar integração com On/Offboarding

