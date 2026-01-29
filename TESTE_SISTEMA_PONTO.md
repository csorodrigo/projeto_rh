# Teste Manual - Sistema de Registro de Ponto

## Checklist de Testes - Task #18

Data: 29/01/2026

---

## 1. Teste de Acesso

### 1.1. Acessar página de ponto
- [ ] Abrir navegador e acessar: `http://localhost:3000/ponto`
- [ ] Verificar se a página carrega sem erros
- [ ] Verificar se o relógio está funcionando em tempo real
- [ ] Verificar se a data está correta e em português

**Resultado Esperado**: Página carrega com relógio digital mostrando hora atual.

---

## 2. Teste de Autenticação

### 2.1. Verificar usuário logado
- [ ] Confirmar que há um usuário autenticado
- [ ] Verificar se o perfil tem `employee_id` vinculado
- [ ] Se não tiver, deve mostrar: "Funcionário não vinculado. Entre em contato com RH."

**Resultado Esperado**: Sistema detecta o funcionário automaticamente.

---

## 3. Teste de Registro de Entrada

### 3.1. Primeira entrada do dia
- [ ] Clicar no botão verde "Entrada"
- [ ] Verificar se aparece toast de sucesso: "Ponto registrado! Entrada registrada"
- [ ] Verificar se o status muda para "🟢 Trabalhando"
- [ ] Verificar se aparece na timeline: "🟢 Entrada XX:XX"
- [ ] Verificar se o contador "Trabalhado Hoje" começa a aumentar

**Resultado Esperado**: Entrada registrada com sucesso e status atualizado.

### 3.2. Validação de entrada duplicada
- [ ] Tentar clicar novamente no botão "Entrada"
- [ ] Verificar se o botão está desabilitado
- [ ] Ou se mostra erro: "Já existe entrada registrada hoje"

**Resultado Esperado**: Sistema impede entrada duplicada.

---

## 4. Teste de Intervalo

### 4.1. Iniciar intervalo
- [ ] Após registrar entrada, clicar em "Intervalo" (botão amarelo)
- [ ] Verificar toast: "Ponto registrado! Intervalo iniciado"
- [ ] Verificar se status muda para "🔵 Intervalo"
- [ ] Verificar na timeline: "☕ Início Intervalo XX:XX"

**Resultado Esperado**: Intervalo iniciado corretamente.

### 4.2. Retornar do intervalo
- [ ] Clicar em "Retorno" (botão azul)
- [ ] Verificar toast: "Ponto registrado! Retorno registrado"
- [ ] Verificar se status volta para "🟢 Trabalhando"
- [ ] Verificar na timeline: "⏸️ Fim Intervalo XX:XX"

**Resultado Esperado**: Retorno registrado e status atualizado.

---

## 5. Teste de Saída

### 5.1. Registrar saída
- [ ] Clicar em "Saída" (botão vermelho)
- [ ] Verificar toast: "Ponto registrado! Saída registrada"
- [ ] Verificar se status muda para "✅ Finalizado"
- [ ] Verificar na timeline: "🔴 Saída XX:XX"
- [ ] Verificar se "Trabalhado Hoje" mostra total de horas

**Resultado Esperado**: Saída registrada e total de horas calculado.

### 5.2. Validação de saída sem entrada
- [ ] Tentar registrar saída sem ter entrada
- [ ] Deve mostrar erro ou botão desabilitado

**Resultado Esperado**: Sistema impede saída sem entrada.

---

## 6. Teste de Cálculos

### 6.1. Horas trabalhadas
- [ ] Verificar se o campo "Trabalhado Hoje" mostra tempo correto
- [ ] Formato deve ser: "Xh Ymin"
- [ ] Deve descontar o tempo de intervalo

**Exemplo**:
- Entrada: 08:00
- Intervalo: 12:00 - 13:00 (1h)
- Saída: 17:00
- Total: 8h (9h - 1h de intervalo)

### 6.2. Banco de horas
- [ ] Verificar se o saldo é calculado corretamente
- [ ] Positivo em azul: "+Xh Ymin"
- [ ] Negativo em vermelho: "-Xh Ymin"
- [ ] Zero em cinza: "0h 0min"

**Resultado Esperado**: Cálculos automáticos e precisos.

---

## 7. Teste de Timeline

### 7.1. Visualização de registros
- [ ] Verificar se todos os registros do dia aparecem
- [ ] Ordem cronológica (mais antigo primeiro)
- [ ] Ícones corretos:
  - 🟢 Entrada
  - ☕ Início Intervalo
  - ⏸️ Fim Intervalo
  - 🔴 Saída

### 7.2. Formatação de horários
- [ ] Todos os horários no formato "HH:MM"
- [ ] Horários em ordem crescente

**Resultado Esperado**: Timeline clara e organizada.

---

## 8. Teste de Presença

### 8.1. Lista "Quem está presente"
- [ ] Verificar se mostra outros funcionários ativos
- [ ] Status corretos:
  - 🟢 Trabalhando
  - 🔵 Intervalo
  - ✅ Finalizado
  - ⏸️ Aguardando
- [ ] Botão de refresh funciona
- [ ] Loading spinner ao atualizar

**Resultado Esperado**: Lista de presença atualizada.

---

## 9. Teste de Validações

### 9.1. Tempo mínimo entre registros
- [ ] Registrar uma entrada
- [ ] Tentar registrar novamente antes de 1 minuto
- [ ] Deve mostrar: "Aguarde pelo menos 1 minuto entre registros"

### 9.2. Sequência lógica
- [ ] Não permite saída antes de entrada
- [ ] Não permite retorno sem intervalo
- [ ] Não permite intervalo antes de entrada

**Resultado Esperado**: Validações impedem ações inválidas.

---

## 10. Teste de Interface

### 10.1. Responsividade
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768px)
- [ ] Testar em mobile (375px)
- [ ] Todos os elementos devem se ajustar

### 10.2. Estados dos botões
- [ ] Botão ativo: colorido e clicável
- [ ] Botão desabilitado: cinza e não clicável
- [ ] Loading: spinner animado

### 10.3. Visual
- [ ] Cores corretas por status
- [ ] Ícones apropriados
- [ ] Textos legíveis
- [ ] Cards bem organizados

**Resultado Esperado**: Interface responsiva e agradável.

---

## 11. Teste de Performance

### 11.1. Tempo de carregamento
- [ ] Página carrega em menos de 2 segundos
- [ ] Registros aparecem instantaneamente
- [ ] Sem travamentos ou lags

### 11.2. Atualizações
- [ ] Timeline atualiza imediatamente após registro
- [ ] Status muda instantaneamente
- [ ] Contadores atualizam em tempo real

**Resultado Esperado**: Sistema rápido e fluido.

---

## 12. Teste de Banco de Dados

### 12.1. Verificar registros salvos
```sql
-- No Supabase SQL Editor
SELECT * FROM time_records
WHERE employee_id = 'SEU_EMPLOYEE_ID'
AND DATE(recorded_at) = CURRENT_DATE
ORDER BY recorded_at;
```

- [ ] Verificar se todos os registros estão salvos
- [ ] `record_type` correto (clock_in, clock_out, etc)
- [ ] `recorded_at` com timestamp preciso
- [ ] `source` = 'web'
- [ ] `device_info` preenchido

### 12.2. Verificar consolidação diária
```sql
SELECT * FROM time_tracking_daily
WHERE employee_id = 'SEU_EMPLOYEE_ID'
AND date = CURRENT_DATE;
```

- [ ] Registro consolidado criado
- [ ] `clock_in` e `clock_out` corretos
- [ ] `worked_minutes` calculado
- [ ] `break_minutes` correto

**Resultado Esperado**: Dados consistentes no banco.

---

## 13. Teste de Permissões (RLS)

### 13.1. Funcionário comum
- [ ] Só vê seus próprios registros
- [ ] Não vê registros de outros
- [ ] Pode criar apenas seus registros

### 13.2. RH/Admin
- [ ] Vê registros de todos
- [ ] Pode editar/ajustar registros
- [ ] Acessa relatórios completos

**Resultado Esperado**: RLS funcionando corretamente.

---

## 14. Teste de Erros

### 14.1. Sem conexão
- [ ] Desconectar internet
- [ ] Tentar registrar ponto
- [ ] Deve mostrar erro apropriado

### 14.2. Funcionário inativo
- [ ] Desativar funcionário no banco
- [ ] Tentar registrar ponto
- [ ] Deve bloquear com mensagem clara

### 14.3. Sessão expirada
- [ ] Esperar sessão expirar ou forçar logout
- [ ] Tentar acessar /ponto
- [ ] Deve redirecionar para login

**Resultado Esperado**: Erros tratados graciosamente.

---

## 15. Teste de Dispositivo

### 15.1. Informações do dispositivo
- [ ] Verificar se mostra browser correto
- [ ] Verificar se mostra plataforma (Windows/Mac/Linux)
- [ ] Dados salvos em `device_info` JSON

**Resultado Esperado**: Informações do dispositivo capturadas.

---

## Resultado dos Testes

### Resumo:
- **Total de testes**: 50+
- **Testes passados**: ___
- **Testes falhados**: ___
- **Bugs encontrados**: ___

### Bugs Críticos:
(listar aqui se houver)

### Melhorias Sugeridas:
(listar aqui se houver)

### Status Final:
- [ ] ✅ Aprovado para produção
- [ ] ⚠️ Aprovado com ressalvas
- [ ] ❌ Requer correções

---

## Comandos Úteis

### Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

### Acessar aplicação:
```
http://localhost:3000/ponto
```

### Ver logs do Supabase:
```bash
# No console do navegador (F12)
# Ver network requests
# Ver console logs
```

### Verificar build:
```bash
npm run build
npm run start
```

---

## Notas Adicionais

### Dados de Teste Recomendados:
1. Criar funcionário de teste
2. Vincular com usuário (profile.employee_id)
3. Definir jornada de trabalho (8h/dia)
4. Configurar banco de horas inicial

### Cenários de Teste Avançados:
1. Múltiplos intervalos no mesmo dia
2. Horas extras (trabalhar mais de 8h)
3. Falta de horas (trabalhar menos de 8h)
4. Ajustes manuais (RH)
5. Aprovação de registros

---

**Testador**: _______________
**Data**: 29/01/2026
**Versão**: 1.0.0
**Assinatura**: _______________
