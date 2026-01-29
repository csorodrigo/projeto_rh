# Guia de Uso - Configurações de Produtividade

## Visão Geral

Este guia ensina como usar a página de Configurações de Produtividade para otimizar os fluxos de trabalho do sistema RH.

## Acesso à Página

### URL Direta
```
https://seu-dominio.com/configuracoes/produtividade
```

### Via Menu de Navegação
1. Clique em "Configurações" no menu lateral
2. Selecione "Produtividade"

## 1. Configurações de Importação

### Mapeamento de Colunas

**Para que serve**: Define nomes alternativos para colunas em arquivos de importação.

**Como usar**:
1. Acesse a tab "Importação"
2. Localize o campo que deseja configurar (ex: "CPF")
3. Digite um nome alternativo no input (ex: "documento")
4. Clique em "Adicionar"
5. O sistema aceitará ambos os nomes em futuras importações

**Exemplo prático**:
```
Campo: Email
Nomes alternativos: e-mail, email_address, correio
```
Agora o sistema reconhecerá colunas com qualquer um desses nomes.

**Remover nome alternativo**:
- Clique no "X" ao lado do nome na badge

### Regras de Validação

**CPF obrigatório**:
- Ativado: Importações sem CPF ou com CPF inválido serão rejeitadas
- Desativado: CPF é opcional

**Email obrigatório**:
- Ativado: Importações sem email ou com email inválido serão rejeitadas
- Desativado: Email é opcional

**Bloquear duplicados**:
- Ativado: Linhas com CPF/email já cadastrado serão rejeitadas
- Desativado: Permite duplicatas (útil para updates)

### Auto-aprovação

**Como funciona**: Importações pequenas são aprovadas automaticamente.

**Configurar**:
1. Ative o switch "Aprovar automaticamente"
2. Defina o limite de linhas (ex: 10)
3. Importações com até 10 linhas não precisarão de aprovação manual

**Recomendação**: Use limite baixo (5-10) para segurança.

## 2. Configurações de Notificações

### Tipos de Notificação

**Canais disponíveis**:
- **In-app**: Notificação no sistema (sino/badge)
- **Email**: Notificação por email

**Como configurar**:
1. Acesse a tab "Notificações"
2. Na tabela, ative/desative os switches conforme preferência
3. Recomendado:
   - In-app: Tudo ativo
   - Email: Apenas eventos importantes (aprovação necessária, SLA)

**Tipos disponíveis**:

| Tipo | Descrição | Recomendação In-app | Recomendação Email |
|------|-----------|---------------------|---------------------|
| Importação concluída | Quando processamento terminar | ✅ Sim | ❌ Não |
| Aprovação necessária | Quando você precisa aprovar | ✅ Sim | ✅ Sim |
| Aprovação concedida | Quando sua solicitação for aprovada | ✅ Sim | ❌ Não |
| Aprovação rejeitada | Quando sua solicitação for rejeitada | ✅ Sim | ✅ Sim |
| Tarefa atribuída | Quando uma tarefa for sua | ✅ Sim | ✅ Sim |
| Alerta de SLA | Quando prazo estiver próximo | ✅ Sim | ✅ Sim |
| Relatório pronto | Quando relatório for gerado | ✅ Sim | ❌ Não |

### Modo "Não Incomodar"

**Para que serve**: Bloqueia notificações fora do horário de trabalho.

**Como configurar**:
1. Ative o switch "Modo 'Não incomodar'"
2. Defina horário de início (ex: 22:00)
3. Defina horário de fim (ex: 08:00)
4. Notificações entre 22h e 8h não serão enviadas

**Observação**: Notificações in-app ainda aparecerão, mas emails não serão enviados.

### Digest de Notificações

**Para que serve**: Agrupa notificações similares para reduzir interrupções.

**Opções**:
- **Tempo real**: Cada notificação é enviada imediatamente
- **A cada hora**: Notificações agrupadas de hora em hora
- **Diário**: Notificações agrupadas enviadas pela manhã
- **Semanal**: Notificações agrupadas enviadas segunda-feira

**Recomendação**:
- Gerentes: A cada hora
- Diretores: Diário
- Operacional: Tempo real

### Testar Notificações

**Como testar**:
1. Configure suas preferências
2. Clique em "Enviar Notificação de Teste"
3. Verifique se recebeu nos canais configurados
4. Ajuste conforme necessário

## 3. Configurações de Workflows

### Regras de Aprovação por Departamento

**Como configurar**:
1. Acesse a tab "Workflows"
2. Na tabela, localize o departamento
3. Selecione aprovador de Nível 1 (geralmente gerente direto)
4. Selecione aprovador de Nível 2 (opcional, geralmente RH/Diretor)
5. Defina SLA em horas (tempo máximo para aprovação)

**Exemplo**:
```
Departamento: TI
Aprovador Nível 1: João Silva (Gerente de TI)
Aprovador Nível 2: Maria Santos (Diretora de RH)
SLA: 24 horas
```

**Fluxo**:
1. Solicitação criada → Enviada para Nível 1
2. Se Nível 2 configurado → Após Nível 1, vai para Nível 2
3. Se SLA vencer → Alerta enviado / Escalonamento

### SLA e Alertas

**Ativar alertas de SLA**:
- Quando ativado, notificações são enviadas quando aprovação está atrasada
- Recomendado: Sempre ativo

**Escalonamento automático**:
- Quando ativado, após X horas de atraso, aprovação é escalada para superior
- Configure "Escalar após" (ex: 24h após SLA vencer)
- Útil para garantir que processos não travem

**Exemplo prático**:
```
SLA: 24 horas
Escalonamento: Ativado, após 24 horas

Timeline:
Dia 1, 09h: Solicitação criada
Dia 2, 09h: SLA vence → Alerta enviado
Dia 3, 09h: 24h após SLA → Escalonamento automático para superior
```

### Delegações Ativas

**Para que serve**: Visualizar quem delegou aprovações temporariamente.

**Como usar**:
1. Veja lista de delegações ativas
2. Mostra quem delegou para quem
3. Mostra período da delegação
4. Clique no "X" para revogar delegação antecipadamente

**Observação**: Delegações são criadas na página de perfil/aprovações, aqui apenas visualiza.

## 4. Configurações de Relatórios

### Destino Padrão

**Opções**:
- **Download direto**: Relatório baixa automaticamente
- **Enviar por email**: Relatório é enviado para seu email
- **Salvar no storage**: Relatório fica disponível na aba "Relatórios"

**Recomendação**:
- Relatórios frequentes: Storage
- Relatórios pontuais: Download direto
- Relatórios para compartilhar: Email

### Formato Padrão

**Opções**:
- **CSV**: Arquivo de texto, compatível com Excel
- **Excel (XLSX)**: Arquivo Excel nativo com formatação
- **PDF**: Documento formatado, ideal para impressão

**Quando usar cada um**:
- **CSV**: Importar em outros sistemas, análise de dados
- **Excel**: Análises complexas, gráficos, tabelas dinâmicas
- **PDF**: Enviar para stakeholders, arquivar, imprimir

### Templates Favoritos

**Para que serve**: Acesso rápido aos relatórios que você gera frequentemente.

**Como usar**:
1. Favoritar: Na página de relatórios, clique na estrela ao lado do template
2. Gerar: Clique em "Gerar" ao lado do template favorito
3. Desfavoritar: Clique na estrela preenchida

**Dica**: Favorite apenas os 3-5 relatórios que você usa diariamente.

### Agendamentos Ativos

**Para que serve**: Visualizar relatórios configurados para geração automática.

**Como usar**:
1. Veja lista de agendamentos
2. Mostra template, frequência e próxima execução
3. Clique em "Desativar" para pausar agendamento

**Exemplo**:
```
Template: Folha de Ponto Mensal
Frequência: monthly
Próxima Execução: 01/02/2024 às 09:00
```

**Observação**: Agendamentos são criados na página de relatórios, aqui apenas visualiza/desativa.

## Dicas de Produtividade

### Configuração Inicial Recomendada

**Import Settings**:
- ✅ CPF obrigatório: Ativado
- ✅ Email obrigatório: Ativado
- ✅ Bloquear duplicados: Ativado
- ✅ Auto-aprovação: Ativado (limite: 5)

**Notification Settings**:
- ✅ In-app: Tudo ativo
- ✅ Email: Apenas aprovações e SLAs
- ✅ Modo "Não incomodar": 22:00 - 08:00
- ✅ Digest: A cada hora (para gerentes)

**Workflow Settings**:
- ✅ Configurar aprovadores para todos os departamentos
- ✅ SLA: 24h (padrão)
- ✅ Alertas: Ativado
- ✅ Escalonamento: Ativado (24h após SLA)

**Report Settings**:
- ✅ Destino: Storage (para histórico)
- ✅ Formato: Excel (mais versátil)

### Ajustes por Perfil

**Operacional/Assistente**:
- Notificações: Tempo real
- Digest: Desabilitado
- Foco: Import e Notifications

**Gerente/Coordenador**:
- Notificações: A cada hora
- Digest: Habilitado
- Foco: Workflows e Approvals

**Diretor/C-Level**:
- Notificações: Diário
- Digest: Diário
- Foco: Reports e high-level alerts

## Auto-save

**Como funciona**:
- Todas as alterações são salvas automaticamente após 1 segundo
- Você verá um toast de confirmação quando salvar
- Não precisa clicar em "Salvar"

**Se algo der errado**:
- Recarregue a página
- Suas últimas alterações salvas estarão lá
- Se problema persistir, contate suporte

## Segurança e Privacidade

**Quem pode acessar**:
- Configurações de Import e Workflow: Apenas admins/gerentes
- Configurações de Notification e Report: Todos os usuários

**Dados compartilhados**:
- Import e Workflow: Configurações da empresa (todos veem as mesmas)
- Notification e Report: Configurações pessoais (só você vê)

**Auditoria**:
- Todas as alterações são registradas
- Em caso de dúvida, consulte o log de auditoria

## Suporte

**Em caso de problemas**:
1. Tente recarregar a página (Cmd/Ctrl + R)
2. Limpe o cache do navegador
3. Verifique se tem permissões adequadas
4. Contate o suporte técnico

**FAQ**:

**P: As configurações são aplicadas imediatamente?**
R: Sim, assim que você vê o toast de sucesso.

**P: Posso desfazer uma alteração?**
R: Sim, apenas altere novamente. O sistema salva a nova configuração.

**P: Por que não vejo a tab de Workflows?**
R: Você precisa ser admin ou gerente para acessar.

**P: Meus templates favoritos sumiram.**
R: Templates podem ser deletados por admins. Verifique a página de relatórios.

**P: Como desativo um agendamento?**
R: Na tab "Relatórios", clique em "Desativar" ao lado do agendamento.
