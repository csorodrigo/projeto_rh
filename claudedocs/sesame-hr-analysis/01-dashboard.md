# Sesame HR - Análise do Dashboard

## URL de Acesso
- **Login**: https://app.sesametime.com/login
- **Dashboard**: https://app.sesametime.com/admin/portal

## Observações Gerais
- Sistema está em período de teste (13 dias restantes)
- Possui dados de amostra para demonstração
- Interface em português brasileiro
- Design moderno com gradientes e avatares
- Arquitetura modular (30 aplicações disponíveis no marketplace)

---

## Widgets do Dashboard

### 1. Card de Boas-vindas
- **Localização**: Topo esquerdo
- **Conteúdo**:
  - Saudação personalizada ("Olá [Nome], Bem-vindo/a!")
  - Data atual completa (dia da semana, dia, mês, ano)
- **Cor**: Gradiente roxo/azul

### 2. Botão de Ponto (Header)
- **Localização**: Header direito
- **Funcionalidades**:
  - Exibe data/hora atual (formato: "Ter., 27 de jan. de 2026, 12:05:29 BRT")
  - Contador de horas trabalhadas ("0h 00min")
  - Botão "Entrar" (verde) para registrar ponto
  - Seletor de usuário com iniciais (RO)

### 3. Who's in (Quem está trabalhando)
- **Localização**: Esquerda, abaixo do card de boas-vindas
- **Categorias**:
  - **Trabalhando**: +26 funcionários presenciais
  - **Remoto**: +10 funcionários em trabalho remoto
  - **Descanso**: +4 funcionários em pausa
  - **Férias**: Indicador de quem está de férias
- **Funcionalidade**: Visão rápida do status da equipe em tempo real

### 4. Próximos Aniversários
- **Localização**: Centro
- **Conteúdo**:
  - Lista cronológica com datas (11 fev, 14 fev, 23 fev)
  - Avatares dos aniversariantes
- **Funcionalidade**: Celebração e engajamento da equipe

### 5. Próximos Feriados
- **Localização**: Centro, abaixo de aniversários
- **Conteúdo**: Lista de feriados configurados
- **Estado atual**: "Não há feriados"
- **Link**: "Configurar calendário de feriados"
- **Funcionalidade**: Planejamento de ausências

### 6. Últimos Relatórios
- **Localização**: Centro inferior
- **Conteúdo**: Acesso rápido aos relatórios recentes
- **Exemplo**: "Relatório de registros de ponto diários"
- **Funcionalidade**: Atalhos para reports frequentes

### 7. Vagas (Recrutamento)
- **Localização**: Direita
- **Conteúdo**:
  - Contador de vagas abertas (2)
  - Dropdown por departamento:
    - "Comercial Vendas" - 6 candidatos
    - "Técnico/a Financeiro" - 5 candidatos
- **Funcionalidade**: Overview do pipeline de recrutamento

### 8. Tarefas Ativas
- **Localização**: Direita, centro
- **Conteúdo**:
  - Lista de tarefas pendentes do usuário
  - Link "Começar uma nova tarefa"
  - Indicador de tarefas da equipe
- **Estado atual**: "Você não possui tarefas em curso"
- **Funcionalidade**: Gestão de atividades pessoais e da equipe

### 9. Formação e Habilidades
- **Localização**: Direita superior
- **Conteúdo**: Training e desenvolvimento
- **Estado atual**: "Ainda não adicionaram novas formações e habilidades"
- **Funcionalidade**: Gestão de competências

### 10. Artigos (Comunicação Interna)
- **Localização**: Direita inferior
- **Conteúdo**:
  - Tabs: Todos | Novidades | Recursos
  - Cards de artigos com:
    - Imagem/thumbnail
    - Título (ex: "Plano de Prevenção de Ris...")
    - Métricas: anexos, visualizações, likes, data
- **Funcionalidade**: Base de conhecimento e comunicação

---

## Menu Lateral (Sidebar) - Mapeamento Completo

| Posição | Ícone | Nome | Funcionalidade |
|---------|-------|------|----------------|
| 1 | Logo | NO | Área de workspace/empresa |
| 2 | Sino | Notificações | Central de notificações |
| 3 | Calendário | Solicitações | Aprovações pendentes (badge: 5) |
| 4 | Headphones | Ajuda | Suporte ao usuário |
| 5 | Link | Propor funcionalidade | Sugestões de features |
| 6 | Escudo | What's new | Novidades do sistema |
| 7 | Engrenagem | Configurações | Configurações do sistema |
| 8 | Grid | Aplicações | Marketplace de módulos (30 apps) |

---

## Sesame Store - Marketplace de Aplicações (30 total)

### Categorias de Aplicações
1. **Gerenciamento de tempo**
2. **Gerenciamento de funcionários**
3. **Finanças**
4. **Talento e cultura**
5. **Utilidades**
6. **Integrações**

### Aplicações Disponíveis para Instalar

| App | Descrição | Categoria |
|-----|-----------|-----------|
| Banco de horas | Monitorar horas extras e compensação | Tempo |
| Solicitações personalizadas | Controle de solicitações internas | Utilidades |
| Boost | Engajamento de funcionários | Cultura |
| Assinatura avançada | Assinatura digital de documentos | Utilidades |
| Controle de despesas | Notas fiscais e recibos | Finanças |
| Holerites | Geração de holerites | Finanças |
| Reserva de Espaços | Reservar salas de reunião | Utilidades |
| Metas | Acompanhamento de metas em tempo real | Cultura |
| 1 On 1 | Reuniões pessoais | Cultura |
| Apps externos | Integração com ferramentas externas | Integrações |
| Chat RH | Comunicação direta com RH | Comunicação |
| Comunidade | Colaboração entre funcionários | Cultura |

### Aplicações Já Instaladas (Ativas)

| App | Descrição | Prioridade para Replicação |
|-----|-----------|---------------------------|
| **Sesame AI** | IA para automatizar tarefas, seleção de talentos, análise de desempenho | Alta |
| **Controle horário** | Gestão de registros de ponto de qualquer dispositivo | Crítica |
| **Tarefas** | Gestão de tarefas com avaliação de custo/lucratividade | Alta |
| **Ausências** | Gerenciar solicitações de ausência e férias | Crítica |
| **Comunicados** | Comunicados internos em tempo real | Média |
| **Formação** | Coordenar cursos de treinamento | Média |
| **Organograma** | Representação gráfica da estrutura organizacional | Alta |
| **Artigos** | Compartilhar informações (Notícias/Recursos) | Média |
| **Recrutamento** | Processos seletivos e contratações | Alta |
| **Gestor de Documentos** | Armazenar e gerenciar documentos trabalhistas | Alta |
| **Canal de denúncias** | Espaço para denúncias anônimas | Média |
| **Turnos** | Criar e atribuir turnos de trabalho | Alta |
| **Envio de holerites** | Entregar holerites com um clique | Alta |
| **Pesquisas** | Questionários de clima organizacional, eNPS | Média |
| **People Analytics** | Gestão de RH baseada em dados | Alta |
| **Avaliações** | Avaliações 360° e 9 Box | Alta |
| **On/offboardings** | Plano de recepção para novos funcionários | Alta |

---

## Funcionalidades Identificadas no Dashboard

### Registro de Ponto
- Integrado no header
- Contagem de horas em tempo real
- Botão de entrada/saída visível

### Gestão de Presença
- Visão em tempo real de quem está trabalhando
- Categorização: presencial, remoto, descanso, férias
- Contagem de funcionários por status

### Calendário Organizacional
- Aniversários da equipe
- Feriados configuráveis
- Planejamento visual

### Pipeline de Recrutamento
- Vagas abertas com contador
- Candidatos por vaga
- Filtro por departamento

### Gestão de Tarefas
- Tarefas pessoais e de equipe
- Criação rápida de tarefas
- Status tracking

### Comunicação Interna
- Artigos e recursos
- Sistema de categorização
- Métricas de engajamento

---

## Arquitetura do Sistema

### Modelo de Negócio
- **Modelo**: SaaS modular com marketplace de aplicações
- **Preço**: Planos e preços disponíveis no Sesame Store
- **Trial**: 14 dias de teste gratuito
- **Período atual**: 13 dias restantes

### Arquitetura Técnica Observada
- **Frontend**: React (provável, baseado em padrões de UI)
- **URL Pattern**: `/admin/portal` para dashboard principal
- **Modal System**: Modais para marketplace e configurações
- **Responsive**: Design responsivo com sidebar colapsável

### Integrações Disponíveis
- Seção dedicada "Integrações" no Sesame Store
- Apps externos para conexão com outras ferramentas

---

## Próximos Passos de Exploração
- [x] Mapear menu lateral completo
- [x] Identificar todas as aplicações do marketplace
- [ ] Explorar módulo de Funcionários em detalhes
- [ ] Explorar Controle de Ponto/Horário
- [ ] Explorar Recrutamento
- [ ] Explorar Configurações
- [ ] Documentar workflows de cada módulo
