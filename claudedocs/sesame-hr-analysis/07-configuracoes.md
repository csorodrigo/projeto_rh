# Sesame HR - Módulo de Configurações

## URLs de Acesso
- **Empresa/Geral**: https://app.sesametime.com/admin/configuration/company/general
- **Horários**: https://app.sesametime.com/admin/configuration/schedules/schedules
- **Calendários**: https://app.sesametime.com/admin/configuration/calendars/festives
- **Automações**: https://app.sesametime.com/admin/configuration/automations/signings
- **Dispositivos**: https://app.sesametime.com/admin/configuration/devices/information

---

## Visão Geral do Módulo

O módulo de Configurações centraliza todas as configurações administrativas do sistema:
- Dados da empresa
- Jornadas de trabalho e turnos
- Calendários de feriados e férias
- Automações e regras de negócio
- Dispositivos de registro de ponto
- Planos e cobrança

---

## Estrutura de Abas

| Aba | Descrição |
|-----|-----------|
| **Empresa** | Dados gerais, fiscais, estrutura organizacional |
| **Horários** | Jornadas de trabalho, descansos, turnos |
| **Calendários** | Feriados, políticas de férias, ausências |
| **Automações** | Regras automáticas, notificações, workflows |
| **Dispositivos** | Canais de registro de ponto |
| **Plano** | Planos de preços e cobrança |

---

## Aba Empresa

### Menu Lateral
| Seção | Descrição |
|-------|-----------|
| Geral | Dados básicos da empresa |
| Dados fiscais | Informações de cobrança e fiscais |
| Centros | Escritórios/Localizações |
| Departamentos | Estrutura departamental |
| Papéis e acessos | Permissões e perfis |
| Cargos na empresa | Funções disponíveis |
| Legal | Configurações legais |
| Campos personalizados | Campos customizados |
| Configuração avançada | Opções avançadas |

### Seção: Geral
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome da empresa | Text | Nome da organização |
| E-mail para notificações | Email | Email principal |
| Idioma da empresa | Dropdown | Idioma do sistema |
| Divisa | Dropdown | Moeda (BRL, EUR, USD) |
| País | Dropdown | País da empresa |
| Indústria/Setor | Dropdown | Segmento de atuação |
| Logo | Image | Logo principal e secundário |
| Personalizar painel | Toggle | Customização do dashboard |

### Seção: Dados Fiscais
| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome da empresa | Text | Razão social |
| E-mail para cobrança | Email | Email de faturamento |
| Domicílio de cobrança | Text | Endereço fiscal |
| País | Dropdown | País |
| Estado/Distrito | Text | UF |
| Cidade | Text | Cidade |
| CEP | Text | Código postal |
| CNPJ | Text | Cadastro Nacional de Pessoa Jurídica |

### Seção: Centros
- **Funcionalidade**: Gerenciar escritórios/localizações
- **Mapa integrado**: Visualização geográfica
- **Campos por centro**:
  - Nome do centro
  - Endereço/Coordenadas
  - Funcionários vinculados

### Seção: Departamentos
| Coluna | Descrição |
|--------|-----------|
| Departamento | Nome do departamento |
| Funcionários | Quantidade de funcionários |
| Ações | Editar, excluir |

**Exemplo de departamentos**:
- Direção (2)
- Marketing (11)
- Pós-venda (10)
- Produto (11)
- Recursos humanos (9)
- Vendas (9)

### Seção: Papéis e Acessos
| Perfil | Tipo | Descrição |
|--------|------|-----------|
| Administrador | Geral padrão | Acesso completo |
| Administrador de centro | Específico padrão | Gerencia um centro |
| Administrador de departamento | Específico padrão | Gerencia um departamento |
| Administrador de projetos | Específico padrão | Gerencia projetos |
| Comunicador | Específico padrão | Comunicação interna |
| Gerente de ausências privadas | Específico padrão | Gerencia ausências |
| Gestor de turnos | Específico padrão | Gerencia turnos |

---

## Aba Horários

### Menu Lateral
| Seção | Descrição |
|-------|-----------|
| Horários | Jornadas de trabalho |
| Descansos | Intervalos e pausas |
| Turnos | Escalas de trabalho |
| Tipos de registros de ponto | Categorias de registro |
| Horas categorizadas | Classificação de horas |

### Jornadas de Trabalho Disponíveis
| Nome | Horas/Semana | Dias | Resumo |
|------|--------------|------|--------|
| Horário livre | 0h 00min | 5 dias | Sem horário fixo |
| Jornada intermitente | 30h 00min | 5 dias | Trabalho esporádico |
| Jornada Parcial | 30h 00min | 5 dias | Meio período |
| Horário flexível | 40h 00min | 5 dias | Horário variável |
| Jornada ordinária | 44h 00min | 6 dias | CLT padrão |

### Campos de Jornada
- Nome do horário
- Horas semanais
- Dias semanais
- Resumo das jornadas (indicador visual por dia)
- Descansos associados

---

## Aba Calendários

### Menu Lateral
| Seção | Descrição |
|-------|-----------|
| Feriados | Feriados nacionais e regionais |
| Férias | Políticas de férias |
| Ausências | Tipos de ausência |

### Seção: Feriados
- **Seletor de país**: Dropdown (Brasil selecionado)
- **Botão Importar**: Importar feriados oficiais
- **Atribuir funcionários**: Vincular funcionários ao calendário
- **Navegação por ano**: < 2026 >
- **Visualização**: Calendário ou lista
- **Calendário visual**: 2 meses por linha

---

## Aba Automações

### Menu Lateral
| Seção | Descrição |
|-------|-----------|
| Registro de ponto | Regras de ponto |
| Notificações | Alertas automáticos |
| Fluxos de aprovação | Workflows |
| Validações | Regras de validação |
| Permissões de usuário | Controle de acesso |
| Visibilidade de seções | Interface personalizada |

### Seção: Registro de Ponto

#### Abas Internas
- Geral | Por departamento

#### Notificações Disponíveis
| Notificação | Destinatário |
|-------------|--------------|
| E-mail ao admin | Administrador |
| E-mail ao funcionário | Funcionário |
| Notificação ao app | Push notification |

#### Incidentes de Registros de Ponto
| Opção | Descrição |
|-------|-----------|
| Tempo conta desde criação | Horas contabilizadas desde o registro do incidente |
| Tempo não conta até resolução | Horas pendentes até aprovação do supervisor |

#### Automações de Saída
| Configuração | Descrição |
|--------------|-----------|
| Registro automático de saída | Sistema registra quando horário é cumprido |
| Bloquear check-in | Impede novo registro após cumprir horário |
| Encerrar automaticamente | Fecha registro se funcionário esquecer |

---

## Aba Dispositivos

### Menu Lateral
| Seção | Descrição |
|-------|-----------|
| Informação | Visão geral dos dispositivos |
| Painel web | Configurações web |
| Celular | Configurações mobile |
| Tablet | Configurações tablet |

### Dispositivos Disponíveis

#### 1. Painel Web (Toggle)
- **Descrição**: Permite registro via navegador
- **Funcionalidades**:
  - Geolocalização
  - Link para painel do site

#### 2. Celular (Toggle)
- **Descrição**: App mobile completo
- **Funcionalidades**:
  - Geolocalização
  - QR Code
- **Disponível**: App Store | Google Play

#### 3. Tablet (Toggle)
- **Descrição**: Relógio de ponto digital
- **Funcionalidades**:
  - QR Code
  - Câmera (foto)
  - Teclado PIN
  - Reconhecimento facial
- **Disponível**: App Store | Google Play

### Autenticação de Dois Fatores
- Toggle para forçar 2FA nos funcionários

---

## Aba Plano

### Ciclos de Cobrança
- Mensal
- Semestral
- Anual (selecionado)

### Planos Disponíveis
| Plano | Preço/funcionário/mês | Descrição |
|-------|----------------------|-----------|
| **HR Starter** | R$ 19,00 | Equipe no centro das decisões |
| **HR Professional** | R$ 25,00 | Faça brilhar o talento |
| **HR Enterprise** | R$ 40,00 | RH sob medida |

### Add-ons
| Add-on | Preço | Descrição |
|--------|-------|-----------|
| Sesame AI | R$ 166,67/mês | IA para análise de dados e geração de conteúdo |
| GB Gerenciador de Documentos | Variável | Armazenamento adicional |

### Painel de Cobrança
- Nº de funcionários
- Plano atual
- Total anual
- Próxima cobrança
- Dados de cobrança

---

## Considerações para Implementação

### Funcionalidades Críticas
1. Configuração multi-tenant (empresa, centros, departamentos)
2. Sistema de papéis e permissões granular
3. Jornadas de trabalho flexíveis
4. Calendários de feriados por país
5. Automações configuráveis
6. Multi-dispositivo (web, mobile, tablet)

### Funcionalidades Desejáveis
1. Geolocalização para registro de ponto
2. Reconhecimento facial
3. QR Code para registro
4. 2FA opcional
5. Campos personalizados
6. Integração com calendários externos

### Modelo de Dados Sugerido

**Tabela: companies**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | String | Nome da empresa |
| notification_email | String | Email principal |
| language | Enum | Idioma do sistema |
| currency | Enum | Moeda |
| country | String | País |
| industry | String | Setor |
| logo_url | String | URL do logo |
| settings | JSON | Configurações gerais |

**Tabela: centers**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| name | String | Nome do centro |
| address | Text | Endereço |
| coordinates | GeoJSON | Lat/Long |

**Tabela: departments**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| name | String | Nome do departamento |
| parent_id | FK | Departamento pai |

**Tabela: roles**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| name | String | Nome do perfil |
| type | Enum | general, specific |
| permissions | JSON | Permissões |
| is_default | Boolean | Perfil padrão |

**Tabela: work_schedules**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| name | String | Nome da jornada |
| weekly_hours | Interval | Horas semanais |
| weekly_days | Integer | Dias por semana |
| schedule_config | JSON | Configuração detalhada |

**Tabela: holidays**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| name | String | Nome do feriado |
| date | Date | Data |
| is_national | Boolean | Feriado nacional |
| country | String | País |

**Tabela: automation_rules**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| company_id | FK | Empresa |
| type | Enum | Tipo de automação |
| trigger | String | Gatilho |
| action | String | Ação |
| config | JSON | Configurações |
| is_active | Boolean | Ativo |

### UX Patterns Observados
- Abas horizontais para categorias principais
- Menu lateral para subcategorias
- Formulários em seções colapsáveis
- Toggles para ativar/desativar funcionalidades
- Dropdowns com busca
- Cards para planos de preços
- Mapa integrado para centros
- Tabelas com ações inline

---

## Integrações

### Apps de Registro
- App Store (iOS)
- Google Play (Android)
- Navegadores web

### Autenticação
- Login/Senha
- 2FA opcional
- SSO (provável)

### Calendários
- Importação de feriados por país
- Sincronização com calendários externos

---

## Próximos Passos
- [ ] Criar análise comparativa final
- [ ] Documentar integrações entre módulos
- [ ] Especificar prioridades de implementação

