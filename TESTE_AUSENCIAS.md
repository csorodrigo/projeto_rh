# Testes do Sistema de Solicitação de Ausências

## Casos de Teste Manuais

### 1. Teste de Solicitação de Férias

#### Pré-requisitos:
- Usuário logado com perfil vinculado a um funcionário
- Funcionário com saldo de férias disponível

#### Passos:
1. Acessar `/ausencias/solicitar`
2. Selecionar tipo: "Férias"
3. Selecionar data início: (próximo dia útil)
4. Selecionar data fim: (5 dias úteis após)
5. Verificar que:
   - Sistema calcula 5 dias úteis
   - Saldo de férias é exibido na sidebar
   - Não há alertas de erro
6. Clicar em "Enviar Solicitação"
7. Verificar toast de sucesso
8. Verificar redirecionamento para `/ausencias`

#### Resultado Esperado:
- Solicitação criada com status "pending"
- Visível em "Minhas Solicitações"

---

### 2. Teste de Validação de Saldo Insuficiente

#### Passos:
1. Acessar `/ausencias/solicitar`
2. Selecionar tipo: "Férias"
3. Selecionar período maior que o saldo disponível
4. Verificar que:
   - Alerta vermelho é exibido
   - Botão "Enviar" fica desabilitado
   - Mensagem indica saldo insuficiente

#### Resultado Esperado:
- Não é possível enviar a solicitação
- Alertas visuais claros

---

### 3. Teste de Sobreposição de Ausências

#### Pré-requisitos:
- Funcionário com ausência aprovada no período X

#### Passos:
1. Acessar `/ausencias/solicitar`
2. Selecionar qualquer tipo
3. Selecionar período que sobrepõe ausência existente
4. Verificar que:
   - Alerta de conflito é exibido
   - Botão "Enviar" fica desabilitado

#### Resultado Esperado:
- Sistema previne sobreposição
- Mensagem clara sobre o conflito

---

### 4. Teste de Cálculo de Dias Úteis

#### Casos:
| Data Início  | Data Fim     | Dias Esperados | Observação           |
|--------------|--------------|----------------|----------------------|
| 03/02/2026 (seg) | 07/02/2026 (sex) | 5              | Semana completa      |
| 03/02/2026 (seg) | 10/02/2026 (seg) | 6              | Inclui próxima seg   |
| 06/02/2026 (sex) | 09/02/2026 (seg) | 2              | Pula fim de semana   |
| 03/02/2026 (seg) | 03/02/2026 (seg) | 1              | Mesmo dia            |

#### Passos:
1. Para cada caso, inserir as datas no formulário
2. Verificar contador de dias úteis

#### Resultado Esperado:
- Contagem correta conforme tabela
- Sábados e domingos não contabilizados

---

### 5. Teste de Validação de Datas

#### Casos Inválidos:
1. **Data início no passado:**
   - Inserir data anterior a hoje
   - Resultado: Erro ao tentar enviar

2. **Data fim antes da data início:**
   - Data fim < data início
   - Resultado: Contador mostra 0 dias, envio bloqueado

---

### 6. Teste de Licença Médica (Campo Obrigatório)

#### Passos:
1. Selecionar tipo: "Licença Médica"
2. Preencher datas
3. Tentar enviar SEM preencher motivo
4. Verificar mensagem de erro

#### Resultado Esperado:
- Toast de erro: "Motivo/observação é obrigatório..."
- Formulário não é enviado

---

### 7. Teste de Listagem - Minhas Solicitações

#### Passos:
1. Criar várias solicitações com status diferentes
2. Acessar `/ausencias/minhas`
3. Verificar cards de estatísticas
4. Testar filtros de abas:
   - "Todas" - mostra todas
   - "Pendentes" - apenas pending
   - "Aprovadas" - apenas approved
   - "Rejeitadas" - apenas rejected

#### Resultado Esperado:
- Contadores corretos nos cards
- Filtros funcionando
- Tabela atualizada conforme aba

---

### 8. Teste de Cancelamento

#### Pré-requisitos:
- Solicitação com status "pending"

#### Passos:
1. Acessar `/ausencias/minhas`
2. Clicar no ícone de lixeira na solicitação pendente
3. Confirmar no diálogo
4. Verificar:
   - Toast de sucesso
   - Status muda para "cancelled"
   - Contador de pendentes diminui

#### Resultado Esperado:
- Solicitação cancelada com sucesso
- UI atualizada imediatamente

---

### 9. Teste de Responsividade

#### Passos:
1. Acessar páginas em diferentes tamanhos de tela:
   - Desktop (>1024px)
   - Tablet (768-1024px)
   - Mobile (<768px)

#### Verificar:
- Formulário responsivo
- Sidebar move para baixo em mobile
- Tabela tem scroll horizontal se necessário
- Cards empilham corretamente

---

### 10. Teste de Loading States

#### Verificar estados de carregamento:
1. Ao carregar página de solicitação
2. Ao enviar formulário
3. Ao cancelar solicitação
4. Ao carregar listagem

#### Resultado Esperado:
- Spinner ou skeleton visível
- Botões desabilitados durante operação
- Sem interface "piscando"

---

## Testes de Integração

### API/Database

1. **Criar Ausência:**
```typescript
// Query deve inserir com campos corretos
INSERT INTO absences (
  company_id, employee_id, type,
  start_date, end_date, status,
  requested_at, requested_by
) VALUES (...)
```

2. **Buscar Minhas Ausências:**
```typescript
// Query deve filtrar por employee_id
SELECT * FROM absences
WHERE employee_id = ?
ORDER BY start_date DESC
```

3. **Verificar Sobreposição:**
```typescript
// Query deve detectar overlap corretamente
WHERE employee_id = ?
  AND status = 'approved'
  AND (
    (start_date <= ? AND end_date >= ?) OR
    (start_date <= ? AND end_date >= ?)
  )
```

---

## Checklist de Validação

### Funcionalidades Core
- [ ] Formulário de solicitação carrega sem erros
- [ ] Tipos de ausência são listados corretamente
- [ ] Datas são validadas (formato, lógica)
- [ ] Cálculo de dias úteis está correto
- [ ] Saldo de férias é exibido (quando aplicável)
- [ ] Validação de saldo funciona
- [ ] Detecção de sobreposição funciona
- [ ] Motivo obrigatório para tipos corretos
- [ ] Envio cria ausência com status "pending"
- [ ] Toast de sucesso é exibido

### Listagem
- [ ] Cards de estatísticas corretos
- [ ] Filtros de abas funcionam
- [ ] Tabela exibe dados corretos
- [ ] Badges de status corretos (cores e textos)
- [ ] Ação de cancelamento funciona
- [ ] Apenas pendentes podem ser canceladas
- [ ] Botão "Ver detalhes" funciona

### UX/UI
- [ ] Loading states visíveis
- [ ] Feedbacks de erro claros
- [ ] Alertas visuais apropriados
- [ ] Layout responsivo
- [ ] Navegação entre páginas funciona
- [ ] Abas do layout destacam página atual

### Segurança
- [ ] Usuário só vê suas próprias ausências
- [ ] Validações no servidor (RLS)
- [ ] Não é possível manipular ausências de outros

### Performance
- [ ] Páginas carregam rapidamente (<2s)
- [ ] Queries otimizadas
- [ ] Sem re-renders desnecessários
- [ ] Imagens/assets otimizados

---

## Bugs Conhecidos / Limitações

### A Implementar Futuramente:
1. Feriados não são considerados no cálculo de dias úteis
2. Não há upload de documentos (atestados)
3. Notificações por email não implementadas
4. Histórico de mudanças não é exibido
5. Regras de fracionamento de férias não validadas
6. Antecedência mínima (30 dias) não validada
7. Não há página de detalhes individual

### Possíveis Melhorias:
1. Cache de saldo de férias (evitar query repetida)
2. Autocomplete de datas com períodos sugeridos
3. Prévia do impacto no saldo antes de enviar
4. Integração com calendário do funcionário
5. Sugestões de melhores períodos para férias
6. Notificações push quando status muda
7. Comentários/chat na solicitação
8. Histórico completo com timeline visual

---

## Ambiente de Teste

### Dados de Teste Necessários:
1. Empresa ativa (company)
2. Perfil de usuário (profile) com employee_id
3. Funcionário ativo (employee)
4. Saldo de férias (vacation_balance) - opcional
5. Ausências existentes - para testar sobreposição

### SQL para Criar Dados de Teste:
```sql
-- Criar saldo de férias de teste
INSERT INTO vacation_balances (
  company_id, employee_id,
  period_start, period_end,
  accrued_days, used_days, sold_days,
  status
) VALUES (
  'company-uuid', 'employee-uuid',
  '2025-01-01', '2025-12-31',
  30, 0, 0,
  'active'
);

-- Criar ausência aprovada (para testar sobreposição)
INSERT INTO absences (
  company_id, employee_id,
  type, start_date, end_date,
  status
) VALUES (
  'company-uuid', 'employee-uuid',
  'vacation', '2026-03-10', '2026-03-14',
  'approved'
);
```

---

## Relatório de Testes

### Data: [DATA DO TESTE]
### Testador: [NOME]
### Ambiente: [Dev/Staging/Prod]

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| 1 | Solicitação de Férias | ⏳ | |
| 2 | Validação de Saldo | ⏳ | |
| 3 | Sobreposição | ⏳ | |
| 4 | Cálculo de Dias | ⏳ | |
| 5 | Validação de Datas | ⏳ | |
| 6 | Licença Médica | ⏳ | |
| 7 | Listagem | ⏳ | |
| 8 | Cancelamento | ⏳ | |
| 9 | Responsividade | ⏳ | |
| 10 | Loading States | ⏳ | |

**Legenda:** ⏳ Pendente | ✅ Passou | ❌ Falhou | ⚠️ Com ressalvas

---

## Notas Finais

Este documento deve ser atualizado conforme novos testes são realizados e bugs são descobertos/corrigidos.
