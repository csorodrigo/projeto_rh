# Sesame HR - Módulo de Funcionários

## URL de Acesso
- **Lista de Funcionários**: https://app.sesametime.com/admin/employees
- **Perfil Individual**: https://app.sesametime.com/admin/employees/{id}/profile/personal-data

---

## Visão Geral da Lista de Funcionários

### Header da Página
- **Busca**: Campo de pesquisa rápida
- **Visualização**: Toggle grid/lista
- **Exportar**: Botão de download (exportar dados)
- **Filtros**: Botão de filtros avançados
- **Importar**: Importação em massa de funcionários
- **Criar funcionário**: Botão principal de cadastro

### Estatísticas Resumidas
- Total de funcionários dispensados: X
- Total de funcionários ativos: X
- Total de funcionários desabilitados: X

### Colunas da Tabela de Funcionários
| Coluna | Descrição |
|--------|-----------|
| Checkbox | Seleção múltipla para ações em lote |
| Funcionário | Avatar + Nome completo |
| Estado | Status atual (Novo, Ativo, etc.) |
| Horário | Jornada de trabalho (ex: 08h/40h semana) |
| Horas hoje | Tempo trabalhado no dia atual |
| % Computado | Percentual de jornada cumprida |
| Registro de ponto | Último registro ou status |

### Funcionalidades da Lista
- Seleção múltipla de funcionários
- Ordenação por colunas
- Paginação (20 itens por página)
- Filtros por:
  - Status (ativo/inativo)
  - Escritório
  - Departamento
  - Cargo
  - Status de trabalho
  - Validador de ponto
  - Validador de ausências
  - Data de início/fim de contrato
  - Antiguidade

---

## Perfil do Funcionário

### Tabs do Perfil
1. **Perfil** - Dados pessoais e profissionais
2. **Registro de ponto** - Histórico de batidas
3. **Ausências e férias** - Solicitações e saldo
4. **Estatísticas** - Métricas de desempenho
5. **Contratos** - Histórico de contratos
6. **Documentos** - Arquivos anexados
7. **Horários** - Configuração de jornada
8. **Tarefas** - Atividades atribuídas
9. **Mais** - Opções adicionais

### Menu Lateral do Perfil
1. Dados pessoais
2. Dados de trabalho
3. Campos personalizados
4. Formação e habilidades
5. Journey (onboarding/offboarding)
6. Acessos
7. Papéis
8. Automações
9. Configurações

---

## Campos do Cadastro de Funcionário

### 1. Informação Pessoal

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Nome | Texto | Sim | Primeiro nome |
| Sobrenomes | Texto | Sim | Sobrenome completo |
| Tipo de identificação | Dropdown | Não | RG, CPF, Passaporte, etc. |
| Número do documento | Texto | Não | Número do documento selecionado |
| Tipo de identificação secundária | Dropdown | Não | Documento adicional |
| Nacionalidade | Dropdown | Não | País de origem |
| Estado civil | Dropdown | Não | Solteiro, Casado, Divorciado, etc. |
| Data de nascimento | Date | Não | Data de nascimento |
| Gênero | Dropdown | Não | Masculino, Feminino, Outro |
| Compartilhar aniversário | Toggle | Não | Exibir aniversário no dashboard |

### 2. Endereço

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Domicílio | Texto | Não | Endereço completo |
| CEP | Texto | Não | Código postal |
| Cidade | Texto | Não | Cidade |
| Estado | Texto | Não | Estado/UF |

### 3. Descrição do Cargo

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Cargo na empresa | Dropdown | Não | Cargo/função |
| Histórico de cargos | Link | N/A | Ver mudanças de cargo |
| Perfil da posição | Textarea | Não | Descrição do perfil |
| Atividades a desenvolver | Textarea | Não | Descrição das atividades |
| Nível de estudos | Dropdown | Não | Escolaridade |
| CBO | Texto | Não | Classificação Brasileira de Ocupações |
| Funcionário em teletrabalho | Toggle | Não | Indicador de trabalho remoto |

### 4. Dados de Afiliação

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Grupos de cotação | Dropdown | Não | Grupo para folha de pagamento |
| Categoria profissional | Texto | Não | Categoria trabalhista |
| PIS | Texto | Não | Número do PIS/PASEP |
| CTPS | Texto | Não | Carteira de Trabalho |
| Código de contrato | Texto | Não | Identificador do contrato |

### 5. Dados Bancários

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Titular da conta | Texto | Não | Nome do titular |
| Conta bancária / IBAN | Texto | Não | Número da conta |
| BIC | Texto | Não | Código bancário internacional |
| Entidade Bancária | Texto | Não | Nome do banco |

### 6. Dados Econômicos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Divisa | Dropdown | Não | Moeda do salário |
| Faixa salarial | Dropdown/Range | Não | Faixa de remuneração |

---

## Funcionalidades Adicionais

### Formação e Habilidades
- Cadastro de formações acadêmicas
- Skills e competências
- Certificações

### Journey (Onboarding/Offboarding)
- Checklists de integração
- Tarefas de desligamento
- Acompanhamento de progresso

### Acessos
- Permissões do sistema
- Papéis atribuídos
- Controle de funcionalidades

### Automações
- Regras automáticas por funcionário
- Notificações personalizadas
- Workflows específicos

### Configurações Individuais
- Preferências do funcionário
- Configurações de notificação
- Idioma preferido

---

## Departamentos e Estrutura Organizacional

### Departamentos Identificados (Dados de Amostra)
| Departamento | Funcionários |
|--------------|--------------|
| Direção | 2 |
| Marketing | 11 |
| Pós-venda | 10 |
| Produto | 11 |
| Recursos Humanos | 9 |
| Vendas | 9 |
| **Total** | **~52** |

### Funcionalidades de Departamento
- Criar/editar/excluir departamentos
- Atribuir funcionários
- Filtrar relatórios por departamento
- Aplicar regras por grupo

---

## Integrações e Importação

### Importação de Funcionários
- Upload de arquivo (CSV/Excel provável)
- Mapeamento de campos
- Validação de dados
- Importação em lote

### Exportação
- Download da lista de funcionários
- Formato estruturado (CSV/Excel)
- Filtros aplicáveis antes de exportar

---

## Considerações para Implementação

### Campos Críticos (Obrigatórios)
1. Nome e Sobrenome
2. Email (para acesso ao sistema)
3. Departamento
4. Data de admissão

### Campos Brasileiros Específicos
1. CPF
2. RG
3. PIS/PASEP
4. CTPS
5. CBO

### Funcionalidades Prioritárias
1. CRUD completo de funcionários
2. Perfil com múltiplas abas
3. Histórico de alterações
4. Importação em massa
5. Filtros avançados
6. Integração com controle de ponto
7. Vínculo com ausências e férias

### UX Patterns Observados
- Formulários em seções colapsáveis
- Avatar editável
- Campos com validação inline
- Dropdown com busca
- Histórico de mudanças acessível
- Botão "Salvar alterações" fixo
