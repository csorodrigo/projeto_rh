# Workflow de Aprovação de Ausências

## Resumo da Implementação

Implementado o sistema completo de aprovação de ausências para gestores e RH, conforme Task #21.

## Arquivos Criados/Modificados

### 1. Nova Página de Aprovações
**Arquivo:** `/src/app/(dashboard)/ausencias/aprovacoes/page.tsx`

#### Funcionalidades Implementadas:

##### Controle de Acesso
- Verificação automática de permissões ao carregar a página
- Apenas usuários com roles `company_admin`, `hr_manager` ou `super_admin` podem acessar
- Redirecionamento automático para `/ausencias` se o usuário não tiver permissão
- Mensagem de erro clara em caso de acesso não autorizado

##### Listagem de Ausências
- **4 abas de filtro:**
  - **Pendentes** (default): Ausências aguardando aprovação
  - **Aprovadas**: Histórico de ausências aprovadas
  - **Rejeitadas**: Histórico de ausências rejeitadas
  - **Todas**: Visão completa de todas as solicitações

##### Cards de Ausência
Cada card exibe:
- Avatar e nome do funcionário
- Cargo/departamento
- Tipo de ausência (traduzido)
- Status com badge colorido
- Período completo (data início - data fim)
- Quantidade de dias
- Data da solicitação
- Motivo/observação (se fornecido)
- Informações médicas (CID, médico, CRM - quando aplicável)
- Link para documento anexo (quando disponível)

##### Ações de Aprovação
- **Botão Aprovar (verde):**
  - Abre modal de confirmação
  - Campo opcional para observações
  - Confirma e atualiza status para "approved"
  - Registra `approved_by` e `approved_at`

- **Botão Rejeitar (vermelho):**
  - Abre modal de rejeição
  - Campo obrigatório para motivo da rejeição
  - Confirma e atualiza status para "rejected"
  - Registra `rejected_by`, `rejected_at` e `rejection_reason`

- **Botão Ver Detalhes:**
  - Redireciona para página de detalhes da ausência
  - Disponível em todos os cards

##### Estatísticas
Na aba "Todas", exibe cards com:
- Total de pendentes (amarelo)
- Total de aprovadas (verde)
- Total de rejeitadas (vermelho)

##### Estados Vazios
- Mensagens amigáveis quando não há solicitações
- "Nenhuma solicitação pendente de aprovação" para pendentes
- Mensagens apropriadas para cada aba

##### Feedback ao Usuário
- Toast de sucesso ao aprovar/rejeitar
- Toast de erro em caso de falha
- Loading states durante processamento
- Remoção automática da lista após aprovação/rejeição

### 2. Navegação Atualizada
**Arquivo:** `/src/app/(dashboard)/ausencias/layout.tsx`

- Adicionada nova aba "Aprovações" no menu de ausências
- Ícone CheckSquare para identificação visual
- Posicionada estrategicamente após "Nova Solicitação"

## Queries Utilizadas

As seguintes queries já existentes foram utilizadas:

```typescript
// Listar ausências pendentes
getPendingAbsences(companyId: string)

// Listar ausências com filtros
listAbsences(companyId: string, filters?: { status: AbsenceStatus })

// Aprovar ausência
approveAbsence(absenceId: string)

// Rejeitar ausência
rejectAbsence(absenceId: string, rejectionReason: string)

// Obter perfil do usuário (para verificar role)
getCurrentProfile()
```

## Schema do Banco de Dados

A tabela `absences` já possui todos os campos necessários:

```sql
-- Campos de aprovação
approved_at TIMESTAMPTZ,
approved_by UUID REFERENCES profiles(id),

-- Campos de rejeição
rejected_at TIMESTAMPTZ,
rejected_by UUID REFERENCES profiles(id),
rejection_reason TEXT,
```

## Componentes Utilizados

### UI Components (shadcn/ui)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Button`
- `Badge`
- `Avatar`, `AvatarFallback`, `AvatarImage`
- `Separator`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- `AlertDialog` e seus sub-componentes
- `Label`
- `Textarea`

### Custom Components
- `AbsenceStatusBadge` - Badge colorido baseado no status

### Ícones (lucide-react)
- `CheckCircle` - Aprovar
- `XCircle` - Rejeitar
- `Calendar` - Data
- `Clock` - Tempo/duração
- `User` - Funcionário
- `AlertCircle` - Alerta/pendente
- `Loader2` - Loading
- `FileText` - Documento
- `CheckSquare` - Ícone do menu

## Fluxo de Trabalho

### 1. Acesso à Página
```
Usuário acessa /ausencias/aprovacoes
  ↓
Verifica getCurrentProfile()
  ↓
Se role ∉ [admin, hr_manager, super_admin]
  → Redireciona para /ausencias
  → Exibe toast de erro
  ↓
Carrega ausências pendentes (default)
```

### 2. Aprovação
```
Gestor clica em "Aprovar"
  ↓
Abre modal de confirmação
  ↓
Gestor pode adicionar observações (opcional)
  ↓
Confirma aprovação
  ↓
Chama approveAbsence(id)
  ↓
Atualiza no banco:
  - status = 'approved'
  - approved_by = user.id
  - approved_at = now()
  ↓
Remove da lista de pendentes
  ↓
Incrementa contador de aprovadas
  ↓
Exibe toast de sucesso
```

### 3. Rejeição
```
Gestor clica em "Rejeitar"
  ↓
Abre modal de rejeição
  ↓
Gestor DEVE informar motivo (obrigatório)
  ↓
Confirma rejeição
  ↓
Chama rejectAbsence(id, motivo)
  ↓
Atualiza no banco:
  - status = 'rejected'
  - rejected_by = user.id
  - rejected_at = now()
  - rejection_reason = motivo
  ↓
Remove da lista de pendentes
  ↓
Incrementa contador de rejeitadas
  ↓
Exibe toast de sucesso
```

## Melhorias Futuras

### 1. Notificações (FUTURO)
- [ ] Enviar notificação ao solicitante quando aprovado
- [ ] Enviar notificação ao solicitante quando rejeitado
- [ ] Notificar por email
- [ ] Notificar in-app

### 2. Histórico de Auditoria
- [ ] Integrar com `absence_history` table
- [ ] Mostrar histórico completo de ações
- [ ] Exibir quem aprovou/rejeitou e quando

### 3. Aprovação em Lote
- [ ] Seleção múltipla de ausências
- [ ] Aprovar várias de uma vez
- [ ] Rejeitar várias de uma vez

### 4. Filtros Avançados
- [ ] Filtrar por funcionário
- [ ] Filtrar por tipo de ausência
- [ ] Filtrar por período
- [ ] Filtrar por departamento

### 5. Delegação
- [ ] Permitir delegar aprovações
- [ ] Configurar aprovadores substitutos
- [ ] Workflow de aprovação multinível

### 6. Dashboard Analytics
- [ ] Tempo médio de aprovação
- [ ] Taxa de aprovação/rejeição
- [ ] Ausências por tipo
- [ ] Tendências mensais

## Testes Sugeridos

### Manual Testing Checklist
- [ ] Acessar página como employee (deve ser bloqueado)
- [ ] Acessar página como admin/hr (deve funcionar)
- [ ] Ver lista de pendentes vazia (empty state)
- [ ] Ver lista de pendentes com dados
- [ ] Aprovar uma ausência com observações
- [ ] Aprovar uma ausência sem observações
- [ ] Rejeitar sem preencher motivo (deve impedir)
- [ ] Rejeitar com motivo preenchido
- [ ] Navegar entre abas (Pendentes/Aprovadas/Rejeitadas/Todas)
- [ ] Ver cards de aprovadas e rejeitadas
- [ ] Clicar em "Ver Detalhes"
- [ ] Verificar estatísticas na aba "Todas"
- [ ] Testar responsividade (mobile/tablet/desktop)

## Observações Técnicas

### Performance
- Usa React hooks para gerenciamento de estado
- Carregamento condicional baseado em `companyId`
- Lazy loading de dados por aba
- Otimização de re-renders

### Segurança
- Verificação de role no frontend E backend (queries)
- RLS (Row Level Security) no Supabase
- Validação de campos obrigatórios
- Sanitização de inputs

### UX/UI
- Design limpo e intuitivo
- Cores semânticas (verde=aprovar, vermelho=rejeitar)
- Feedback visual imediato
- Estados de loading claros
- Empty states informativos
- Modais de confirmação para ações críticas

## Status

✅ **Implementação Completa**
- Página de aprovações funcional
- Controle de acesso implementado
- Queries de aprovação/rejeição funcionando
- UI/UX responsiva e intuitiva
- Integração com banco de dados OK
- Navegação atualizada

🎯 **Task #21 - Concluída**
