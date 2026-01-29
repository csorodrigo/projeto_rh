# Implementação: Edição de Funcionário

**Task #17** - Implementar edição de funcionário

## Arquivos Criados/Modificados

### 1. Página de Edição
**Arquivo:** `src/app/(dashboard)/funcionarios/[id]/editar/page.tsx`

**Funcionalidades:**
- Carregamento dos dados atuais do funcionário via `getEmployee(id)`
- Pré-preenchimento de todos os campos do formulário
- Reutilização completa do wizard de admissão (7 etapas)
- Validação de mudanças (detecta se houve alteração)
- CPF em modo readonly (não editável)
- Toast de feedback (sucesso/erro)
- Redirecionamento para perfil após sucesso
- Loading state durante carregamento inicial
- Error state com opção de retry

**Validações:**
- Mesmas regras do formulário de criação
- Campos obrigatórios por etapa
- Verificação de mudanças antes de salvar
- Prevenção de submissão sem alterações

**Fluxo:**
1. Usuário acessa `/funcionarios/[id]/editar`
2. Sistema carrega dados do funcionário
3. Formulário é pré-preenchido
4. Usuário navega pelas etapas editando campos
5. Sistema valida cada etapa
6. Na última etapa, usuário revisa mudanças
7. Ao salvar:
   - Valida todos os campos
   - Verifica se houve mudanças
   - Atualiza via `updateEmployee(id, data)`
   - Mostra toast de sucesso
   - Redireciona para perfil

### 2. Componente PersonalDataStep (Atualizado)
**Arquivo:** `src/components/admission-wizard/steps/personal-data-step.tsx`

**Mudanças:**
- Adicionada prop `isEditing?: boolean`
- CPF fica readonly e disabled quando `isEditing = true`
- Estilização visual para indicar campo não editável (bg-muted)

### 3. WizardContainer (Atualizado)
**Arquivo:** `src/components/admission-wizard/wizard-container.tsx`

**Mudanças:**
- Adicionada prop `submitButtonText?: string` (padrão: "Salvar Funcionario")
- Adicionada prop `onCancel?: () => void`
- Botão "Cancelar" exibido quando `onCancel` é fornecido
- Texto do botão de submit customizável

## Campos Editáveis

### ✅ Permitidos
- Todos os dados pessoais (exceto CPF)
- Dados profissionais
- Documentos trabalhistas
- Dados bancários
- Contato e endereço
- Salário base
- Status do funcionário

### ❌ Não Editáveis
- CPF (readonly)
- ID do funcionário
- company_id
- created_at
- updated_at (atualizado automaticamente pelo Supabase)

## Integração com Backend

**Função utilizada:** `updateEmployee(id, data)`
- Localização: `src/lib/supabase/queries.ts`
- Retorna: `{ employee: Employee | null; error: string | null }`
- Atualiza automaticamente o campo `updated_at`

## Histórico de Auditoria

O campo `updated_at` é atualizado automaticamente pelo Supabase sempre que um registro é modificado, mantendo o histórico de quando foi a última alteração.

## Navegação

**Botões de ação:**
- **Voltar**: Navega entre as etapas do wizard
- **Cancelar**: Volta para o perfil sem salvar (disponível em todas as etapas)
- **Próximo**: Avança para próxima etapa (valida campos obrigatórios)
- **Salvar Alterações**: Submete as mudanças (última etapa)

**Redirecionamentos:**
- Sucesso → `/funcionarios/[id]` (perfil)
- Cancelar → `/funcionarios/[id]` (perfil)
- Erro → Permanece na página com mensagem

## Conversão de Dados

**Função:** `employeeToFormData(employee: Employee): EmployeeInput`

Converte os dados do banco (formato Employee) para o formato do formulário (EmployeeInput):
- Mapeia campos com nomes diferentes (ex: `full_name` → `name`)
- Trata campos nulos com valores padrão
- Converte tipos complexos (ex: address JSON)
- Normaliza valores de enum

## Tecnologias Utilizadas

- **React Hook Form**: Gerenciamento de formulário
- **Zod**: Validação de schema
- **Next.js**: Framework e roteamento
- **Sonner**: Toast notifications
- **Supabase**: Persistência de dados

## Testes Recomendados

1. ✅ Carregar funcionário existente
2. ✅ Verificar pré-preenchimento correto
3. ✅ CPF deve estar readonly
4. ✅ Editar cada tipo de campo
5. ✅ Validação de campos obrigatórios
6. ✅ Cancelar sem salvar
7. ✅ Salvar sem fazer mudanças (deve avisar)
8. ✅ Salvar com mudanças válidas
9. ✅ Tratamento de erros de API
10. ✅ Redirecionamento após sucesso

## Melhorias Futuras

1. **Histórico de Alterações**: Criar tabela `employee_history` para rastrear mudanças
2. **Campos Bloqueados por Permissão**: Alguns campos só editáveis por admin
3. **Confirmação de Mudanças**: Modal antes de salvar alterações importantes
4. **Diff Visual**: Mostrar o que foi alterado na etapa de revisão
5. **Undo/Redo**: Permitir desfazer mudanças durante edição

## Status

✅ **CONCLUÍDO** - Task #17

A funcionalidade de edição de funcionário está totalmente implementada e integrada ao sistema.
