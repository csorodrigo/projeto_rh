# 🚀 Teste Rápido - Fase 2 (5 minutos)

## Executar Agora

### 1. Iniciar Servidor (1 min)
```bash
cd "/Users/rodrigooliveira/Documents/workspace 2/Claude-code/rh-rickgay"

# Limpar processos anteriores
pkill -f "next dev"

# Limpar cache (se problemas)
rm -rf .next

# Iniciar servidor
npm run dev
```

**Aguardar**: `✓ Ready in X seconds` aparecer

---

### 2. Teste Básico no Navegador (3 min)

#### Teste 1: Relatórios (30s)
1. Abrir: http://localhost:3000/relatorios
2. Verificar: 4 cards coloridos aparecem
3. Click: "Registro de ponto"
4. Verificar: Empty state aparece
5. Click: "Voltar para Relatórios"

✅ **Passou?** [ ] Sim [ ] Não

#### Teste 2: Automações (30s)
1. Ir: http://localhost:3000/config
2. Click: Aba "Automações" (ícone raio)
3. Verificar: 6 cards aparecem
4. Click: Alternar um switch
5. Verificar: Botão "Salvar Alterações" aparece

✅ **Passou?** [ ] Sim [ ] Não

#### Teste 3: Calendários (30s)
1. Ainda em: http://localhost:3000/config
2. Click: Aba "Calendários"
3. Verificar: Menu lateral esquerdo aparece
4. Click: "Férias"
5. Verificar: Destaque move para "Férias"

✅ **Passou?** [ ] Sim [ ] Não

#### Teste 4: Chat Widget (30s)
1. Qualquer página do dashboard
2. Verificar: Botão roxo no canto inferior direito
3. Click: No botão
4. Verificar: Card de chat abre
5. Click: X para fechar

✅ **Passou?** [ ] Sim [ ] Não

---

### 3. Console do Navegador (30s)

1. Abrir DevTools (F12)
2. Ir para aba "Console"
3. Verificar: **Nenhum erro vermelho**

✅ **Nenhum erro?** [ ] Sim [ ] Não - Enviar screenshot

---

## 📊 Resultado

### ✅ Todos os 4 testes passaram?
→ **PERFEITO!** A implementação está funcionando.

### ❌ Algum teste falhou?
→ Me informe qual teste falhou e o que aconteceu.

### 🔴 Erro no console?
→ Me envie o erro completo.

---

## 🆘 Problemas Comuns

### Problema: Servidor não inicia
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Problema: Página em branco
- Aguardar compilação terminar
- Verificar console do navegador
- Refresh (Cmd+R)

### Problema: 404
- Verificar URL está correta
- Verificar arquivo da rota existe
- Limpar cache (.next)

---

**Tempo total**: ~5 minutos
**Prioridade**: 🔴 ALTA - Testar antes de continuar
