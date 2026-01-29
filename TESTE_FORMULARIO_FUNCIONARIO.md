# Teste do Formulário de Novo Funcionário

## Como Testar

### 1. Acessar a Página
```
http://localhost:3000/funcionarios/novo
```

### 2. Testar Validações de Campos Obrigatórios

#### Teste 1: Campos Vazios
- Deixar todos os campos em branco
- Clicar em "Salvar Funcionário"
- **Esperado**: Mensagens de erro em todos os campos obrigatórios

#### Teste 2: CPF Inválido
- Nome: "João da Silva"
- CPF: "111.111.111-11"
- **Esperado**: "CPF inválido"

#### Teste 3: Email Inválido
- Email: "joao.silva"
- **Esperado**: "Email inválido"

#### Teste 4: Data de Nascimento Futura
- Data de Nascimento: data futura (ex: 2030-01-01)
- **Esperado**: "Data de nascimento deve ser anterior a hoje"

#### Teste 5: Data de Admissão Futura
- Data de Admissão: data futura (ex: 2030-01-01)
- **Esperado**: "Data de admissão não pode ser no futuro"

#### Teste 6: Salário Inválido
- Salário Base: deixar em branco ou "0,00"
- **Esperado**: "Salário deve ser maior que zero"

### 3. Testar Máscaras

#### CPF
- Digitar: "12345678900"
- **Esperado**: Formatação automática para "123.456.789-00"

#### Telefone
- Digitar: "11987654321"
- **Esperado**: Formatação automática para "(11) 98765-4321"

#### Salário
- Digitar números: "250000"
- **Esperado**: Formatação automática para "2.500,00"

### 4. Testar Cadastro Completo

#### Dados Válidos:
```
DADOS PESSOAIS:
Nome Completo: Maria Santos
CPF: 123.456.789-09 (gerar um CPF válido real)
Email: maria.santos@email.com
Data de Nascimento: 1990-01-15
Telefone: (11) 98765-4321

DADOS PROFISSIONAIS:
Cargo: Analista de RH
Departamento: Recursos Humanos
Data de Admissão: 2024-01-15
Salário Base: 5.000,00
Status: Ativo

ENDEREÇO (opcional):
CEP: 01310-100
Rua: Avenida Paulista
Número: 1000
Bairro: Bela Vista
Cidade: São Paulo
Estado: SP
```

- Preencher todos os campos
- Clicar em "Salvar Funcionário"
- **Esperado**:
  - Loading spinner aparece
  - Toast de sucesso: "Funcionário cadastrado com sucesso!"
  - Redirecionamento para `/funcionarios`
  - Funcionário aparece na lista

### 5. Testar CPF Duplicado
- Cadastrar um funcionário
- Tentar cadastrar outro com o mesmo CPF
- **Esperado**: "CPF já cadastrado para outro funcionário"

### 6. Testar Botão Cancelar
- Preencher alguns campos
- Clicar em "Cancelar"
- **Esperado**: Redirecionamento para `/funcionarios`

### 7. Testar Responsividade
- Desktop (>= 768px): Layout em 2 colunas
- Mobile (< 768px): Layout em 1 coluna
- **Esperado**: Layout se ajusta corretamente

### 8. Testar Campos Opcionais
- Preencher apenas campos obrigatórios
- Deixar RG, Telefone e Endereço vazios
- **Esperado**: Cadastro funciona normalmente

## Casos de Erro Esperados

### Erro 1: Usuário Não Autenticado
- Fazer logout
- Tentar acessar `/funcionarios/novo`
- **Esperado**: Redirecionamento para login

### Erro 2: Empresa Não Identificada
- Usuário sem company_id no profile
- **Esperado**: "Erro ao identificar empresa"

### Erro 3: Erro de Conexão
- Desabilitar internet
- Tentar salvar
- **Esperado**: "Erro ao cadastrar funcionário"

## Checklist de Validação

- [ ] Validação de nome (mínimo 2 caracteres)
- [ ] Validação de CPF (válido e formatado)
- [ ] Validação de email (formato válido)
- [ ] Validação de data de nascimento (< hoje)
- [ ] Validação de data de admissão (<= hoje)
- [ ] Validação de salário (> 0)
- [ ] Validação de status (required)
- [ ] Máscara de CPF funcionando
- [ ] Máscara de telefone funcionando
- [ ] Máscara de salário funcionando
- [ ] Loading state durante submit
- [ ] Toast de sucesso
- [ ] Toast de erro
- [ ] Redirecionamento após sucesso
- [ ] Botão cancelar funciona
- [ ] Responsividade mobile
- [ ] Responsividade desktop
- [ ] Campos opcionais podem ficar vazios
- [ ] CPF duplicado é detectado
- [ ] company_id é preenchido automaticamente

## Comandos de Teste

### Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

### Verificar erros de build:
```bash
npm run build
```

### Verificar erros de linting:
```bash
npm run lint
```

### Verificar tipos TypeScript:
```bash
npx tsc --noEmit
```

## Resultado Esperado

Todos os testes devem passar e o formulário deve:
1. Validar corretamente todos os campos
2. Aplicar máscaras automaticamente
3. Salvar dados no Supabase
4. Mostrar feedback apropriado
5. Redirecionar após sucesso
6. Ser responsivo
7. Ter boa UX (loading states, mensagens claras)
