# Sesame HR - Módulo de Controle de Ponto

## URL de Acesso
- **Relatórios de Ponto**: https://app.sesametime.com/admin/company/reports/reports-list
- **Registro Individual**: https://app.sesametime.com/admin/employees/{id}/signings/

---

## Visão Geral do Módulo

O módulo "Controle horário" é um dos aplicativos principais do Sesame HR, focado em:
- Digitalização da gestão de registros de ponto
- Suporte a múltiplos dispositivos (web, celular, tablet, biométrico)
- Automações personalizáveis
- Relatórios abrangentes para compliance legal

---

## Funcionalidades Principais

### 1. Registro de Jornada Multi-dispositivo
| Dispositivo | Descrição |
|-------------|-----------|
| Web | Registro via navegador |
| App Mobile | Aplicativo para celular |
| Tablet | Interface para dispositivos tablet |
| Biométrico | Reconhecimento facial ou impressão digital |

### 2. Tipos de Registros de Ponto
- **Entrada/Saída básica**: Clock in / Clock out
- **Tipos personalizados**: Cores e categorias configuráveis
- **Atribuição por funcionário**: Tipos específicos por perfil
- **Visualização em tempo real**: Status de jornada atual

### 3. Alertas e Notificações
- Automações personalizadas por evento
- Alertas sobre registros de ponto
- Sistema de permissões multinível
- Gerenciamento de solicitações de aprovação

---

## Interface de Registro de Ponto

### Header (Barra Superior)
- **Data/Hora atual**: Formato completo (ex: "Ter., 27 de jan. de 2026, 12:29:24 BRT")
- **Contador de horas**: Tempo trabalhado no dia (ex: "0h 00min")
- **Botão Entrar/Sair**: Verde para entrada, vermelho para saída
- **Seletor de usuário**: Avatar com iniciais

### Widget "Who's in" (Dashboard)
Exibe status da equipe em tempo real:
| Status | Descrição | Cor/Ícone |
|--------|-----------|-----------|
| Trabalhando | Funcionários no escritório | +26 (presencial) |
| Remoto | Funcionários em home office | +10 |
| Descanso | Funcionários em pausa | +4 |
| Férias | Funcionários ausentes por férias | Lista |

---

## Registro Individual do Funcionário

### URL Pattern
`/admin/employees/{employee_id}/signings/`

### Informações Exibidas
- **Resumo mensal**: "131h 02min / 176h 00min teóricas"
- **Filtro de período**: Seletor de mês/ano
- **Timeline visual**: Visualização dia a dia

### Timeline de Registros
| Elemento | Descrição |
|----------|-----------|
| Barra azul | Período de trabalho contínuo |
| Barra verde | Trabalho presencial |
| Barra amarela | Pausas/descansos |
| Indicador 🏠 | Trabalho remoto |

### Detalhes por Dia (Expandido)
- Horário de entrada (ex: "09:01")
- Horário de saída (ex: "13:00")
- Duração do período (ex: "3h 59min")
- Indicador de remoto (ícone casa)
- Botões de ação: Editar | Excluir

---

## Relatórios de Registro de Ponto

### Categoria: Registro de Ponto (19 relatórios)

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
| **Relatório de assistência** | Presença e pontualidade | Performance |
| **Saídas antes da jornada** | Saídas antecipadas | Monitoramento |
| **Relatório resumido** | Ausências, ponto e férias consolidado | Visão geral |
| **Consumo de tempo diário** | Primeiro e último registro do dia | Resumo rápido |
| **Horas teóricas e ausências diárias** | Horários planejados x ausências | Comparativo |
| **Centros de Registro de ponto** | Horas por centro/local | Multi-localidade |
| **Arquivo Fonte de Dados (AFD)** | Compliance Portaria 671 | Legal/Fiscal |
| **Escala de turnos** | Escala por filtros selecionados | Gestão de turnos |
| **Contagem de tipos de registros/descansos** | Frequência de cada tipo | Análise estatística |
| **Relatório resumido de presença** | Visão abrangente de presença | Dashboard gerencial |
| **Histórico de solicitações de registros** | Entradas e saídas solicitadas | Workflow aprovação |

### Filtros Disponíveis nos Relatórios
| Filtro | Opções |
|--------|--------|
| Centro | Todos / Específico |
| Departamento | Todos / Específico |
| Grupos | Todos / Específico |
| Funcionários | Todos / Seleção múltipla |
| Tipo de relatório | Dropdown específico |
| Agrupar por | Funcionário / Departamento / etc. |
| Período | Mês atual / Personalizado |
| Incluir no relatório | Opções adicionais |

### Exportação
- Aba "Downloads" para relatórios gerados
- Formatos disponíveis: Excel, PDF (provável)

---

## Compliance Legal Brasileiro

### Portaria 671/2021
O módulo oferece relatórios específicos para atender a legislação:
- **AFD (Arquivo Fonte de Dados)**: Formato obrigatório
- **AEJ (Arquivo Eletrônico de Jornada)**: Registro completo

### Campos de Conformidade
- Registro de entrada/saída com timestamp
- Identificação do funcionário
- Local de registro (geolocalização)
- Tipo de jornada
- Justificativas para alterações

---

## Integrações do Módulo

### Com Outros Módulos Sesame
- **Funcionários**: Vínculo de registros ao perfil
- **Ausências**: Cruzamento com férias/faltas
- **Turnos**: Validação de horários
- **Tarefas**: Associação tempo x atividade

### Dispositivos Externos
- Relógios de ponto biométricos
- Aplicativo mobile Sesame
- Integração com sistemas de acesso

---

## Workflows de Aprovação

### Solicitações de Ajuste
1. Funcionário solicita ajuste de ponto
2. Notificação enviada ao validador
3. Validador aprova/rejeita
4. Registro atualizado com histórico

### Níveis de Aprovação
- Validador de ponto (por funcionário)
- Gestor do departamento
- RH (aprovação final)

---

## Considerações para Implementação

### Funcionalidades Críticas
1. Registro de ponto web com geolocalização
2. Timeline visual de jornada
3. Cálculo automático de horas
4. Relatório AFD/AEJ para compliance
5. Sistema de aprovação de ajustes
6. Alertas de atrasos/saídas antecipadas

### Funcionalidades Desejáveis
1. App mobile para registro
2. Integração biométrica
3. Tipos de registro personalizáveis
4. Dashboard "Who's in" em tempo real
5. Banco de horas automático

### Campos Obrigatórios por Registro
| Campo | Tipo | Descrição |
|-------|------|-----------|
| employee_id | FK | Referência ao funcionário |
| timestamp | DateTime | Data/hora do registro |
| type | Enum | Entrada/Saída/Pausa/etc. |
| location | GeoJSON | Coordenadas (opcional) |
| device | String | Dispositivo utilizado |
| is_remote | Boolean | Indicador de trabalho remoto |
| notes | Text | Observações (opcional) |

### UX Patterns Observados
- Timeline horizontal por dia
- Cores para diferenciar tipos de registro
- Expansão/colapso de detalhes diários
- Botão de ação flutuante para registro
- Indicadores visuais de status (ícones)
- Filtros rápidos por período

---

## Métricas Calculadas

### Por Funcionário
- Horas trabalhadas (dia/semana/mês)
- Horas teóricas vs realizadas
- Saldo de banco de horas
- Taxa de pontualidade
- Dias com registro incompleto

### Por Equipe/Departamento
- Total de horas por departamento
- Média de horas por funcionário
- Distribuição presencial vs remoto
- Tendências de atrasos

---

## Próximos Passos
- [ ] Explorar módulo de Férias e Ausências
- [ ] Documentar integração com Turnos
- [ ] Verificar configurações de jornada em Configurações
