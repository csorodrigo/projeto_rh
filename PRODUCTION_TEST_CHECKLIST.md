# Checklist de Teste em Produção - Migração 018

## 🎯 Objetivo
Validar que a aplicação em produção funciona sem erros 400 após aplicação da migração 018.

---

## ✅ Pré-requisitos

- [x] Migração 018 aplicada no Supabase
- [x] Validação da estrutura do banco (via scripts)
- [x] Testes de API REST (status 200 confirmado)
- [ ] Deploy da aplicação no Vercel
- [ ] Acesso à aplicação em produção

---

## 📋 Checklist de Teste

### 1. Preparação (5 min)

- [ ] Abrir aplicação em produção no navegador
- [ ] Abrir DevTools (F12)
- [ ] Ir para aba **Network**
- [ ] Marcar "Preserve log" (manter logs entre navegações)
- [ ] Ir para aba **Console**
- [ ] Marcar "Preserve log" (manter logs entre navegações)
- [ ] Limpar console (botão 🚫 ou Ctrl+L)
- [ ] Limpar network (botão 🚫)

---

### 2. Teste de Login (2 min)

- [ ] Fazer login na aplicação
- [ ] ✅ Login bem-sucedido
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network

**Se houver erro:**
```
❌ Anotar:
- URL do erro
- Status code
- Mensagem de erro
- Payload da request
```

---

### 3. Teste do Dashboard (3 min)

- [ ] Navegar para Dashboard
- [ ] Aguardar carregamento completo (até spinner parar)
- [ ] ✅ Página carrega completamente
- [ ] ✅ Cards de métricas exibem dados
- [ ] ✅ Gráficos renderizam
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network
- [ ] ❌ Sem mensagens "column full_name does not exist"

**Verificar especificamente:**
- [ ] Request para `/rest/v1/employees` retorna 200
- [ ] Response inclui campos `full_name` e `photo_url`

---

### 4. Teste de Funcionários (3 min)

- [ ] Navegar para página de Funcionários
- [ ] Aguardar carregamento da lista
- [ ] ✅ Lista de funcionários exibe
- [ ] ✅ Nomes aparecem corretamente
- [ ] ✅ Fotos carregam (se houver)
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network

**Ações adicionais:**
- [ ] Tentar buscar por nome
- [ ] ✅ Busca funciona
- [ ] ❌ Sem erros durante busca

- [ ] Tentar ordenar lista
- [ ] ✅ Ordenação funciona
- [ ] ❌ Sem erros durante ordenação

---

### 5. Teste de Ausências (3 min)

- [ ] Navegar para página de Ausências
- [ ] Aguardar carregamento
- [ ] ✅ Lista de ausências exibe
- [ ] ✅ Nomes de funcionários aparecem
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network

**Verificar:**
- [ ] Request para `/rest/v1/absences` (ou similar) retorna 200
- [ ] Joins com `employees` funcionam corretamente

---

### 6. Teste de ASOs (3 min)

- [ ] Navegar para página de ASOs
- [ ] Aguardar carregamento
- [ ] ✅ Lista de ASOs exibe
- [ ] ✅ Informações de funcionários aparecem
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network

---

### 7. Teste de Relatórios (3 min)

- [ ] Navegar para página de Relatórios (se existir)
- [ ] Aguardar carregamento
- [ ] ✅ Relatórios exibem
- [ ] ❌ Sem erros no console
- [ ] ❌ Sem erros 400 no network

---

### 8. Análise de Network (5 min)

- [ ] Revisar aba Network (F12)
- [ ] Filtrar por status: `status-code:400`
- [ ] ❌ **ZERO** requests com status 400
- [ ] ❌ **ZERO** requests falhando relacionados a `employees`

**Se encontrar erro 400:**
```
❌ Capturar:
1. Clicar com botão direito na request
2. "Copy > Copy as cURL"
3. Colar em arquivo de log
4. Anotar URL, headers, payload
```

---

### 9. Análise de Console (5 min)

- [ ] Revisar aba Console (F12)
- [ ] ❌ Sem mensagens de erro em vermelho
- [ ] ❌ Sem "column full_name does not exist"
- [ ] ❌ Sem "column photo_url does not exist"
- [ ] ⚠️ Warnings aceitáveis (anotar se houver)

**Filtros úteis:**
- Filtrar por `error` ou `full_name` na barra de busca

---

### 10. Teste de Funcionalidades CRUD (opcional, 5 min)

- [ ] Criar novo funcionário
- [ ] ✅ Criação bem-sucedida
- [ ] ❌ Sem erros

- [ ] Editar funcionário existente
- [ ] ✅ Edição bem-sucedida
- [ ] ❌ Sem erros

- [ ] Visualizar detalhes de funcionário
- [ ] ✅ Detalhes exibem
- [ ] ❌ Sem erros

---

## 📊 Resultado Final

### Contagem de Erros

| Categoria | Quantidade |
|-----------|------------|
| Erros 400 | ____ |
| Erros de Console | ____ |
| Erros relacionados a `full_name` | ____ |
| Erros relacionados a `photo_url` | ____ |
| Outros erros | ____ |

---

### Decisão

**Se TODOS os erros = 0:**
```
✅ APROVADO - Migração 018 resolveu os problemas!
🎉 Deploy validado com sucesso
📝 Atualizar status no projeto
🔒 Fechar issues relacionadas
```

**Se ALGUM erro > 0:**
```
❌ FALHA - Investigação necessária
📋 Revisar logs detalhados abaixo
🔍 Comparar com erros pré-migração
🛠️ Aplicar correções conforme necessário
```

---

## 📝 Logs Detalhados

### Erros Encontrados

**Erro 1:**
```
URL:
Status:
Mensagem:
Stack trace:
```

**Erro 2:**
```
URL:
Status:
Mensagem:
Stack trace:
```

---

## 🔧 Troubleshooting

### Se ainda houver erros 400 relacionados a `full_name`:

1. **Verificar se deploy incluiu todas as mudanças:**
   ```bash
   # Verificar último commit no Vercel
   # Comparar com commit local
   ```

2. **Verificar variáveis de ambiente:**
   - Confirmar `NEXT_PUBLIC_SUPABASE_URL`
   - Confirmar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Verificar se apontam para projeto correto

3. **Forçar rebuild:**
   - No Vercel Dashboard
   - Deployments > Redeploy (sem cache)

4. **Verificar banco de dados:**
   - Executar no Supabase SQL Editor:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'employees'
     AND column_name IN ('full_name', 'photo_url');
   ```

---

## 📸 Capturas de Tela

**Salvar screenshots de:**
- [ ] Console sem erros
- [ ] Network sem erros 400
- [ ] Dashboard funcionando
- [ ] Funcionários carregando
- [ ] Qualquer erro encontrado (se houver)

**Usar:** F12 > Network > Clicar direito > "Save all as HAR with content"

---

## ✍️ Assinatura

- **Testado por:** ________________
- **Data:** ________________
- **Hora:** ________________
- **Resultado:** [ ] APROVADO  [ ] REPROVADO
- **Observações:**
  ```



  ```

---

**Última atualização:** 2026-01-28
