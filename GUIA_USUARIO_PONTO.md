# Guia do Usuário - Sistema de Ponto Eletrônico

## Como usar o sistema de registro de ponto

---

## Acesso ao Sistema

### 1. Fazer Login
1. Acesse o sistema RH da sua empresa
2. Faça login com seu e-mail e senha
3. No menu lateral, clique em **"Ponto"**

### 2. Tela Principal
Ao acessar, você verá:

```
┌─────────────────────────────────────────────────┐
│                   14:30:25                      │
│         quarta-feira, 29 de janeiro de 2026     │
│            📍 Localização automática ativada     │
└─────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│   Status     │ Horas Hoje   │ Banco Horas  │
│ 🟢Trabalhando│   4h 23min   │  +1h 45min   │
└──────────────┴──────────────┴──────────────┘
```

---

## Como Registrar Ponto

### Entrada (Início do Expediente)

**Quando usar**: Ao chegar no trabalho

1. Clique no botão verde **"Entrada"**
2. Aguarde a confirmação
3. Pronto! Seu ponto foi registrado

✅ **Você verá**:
- Toast verde: "Ponto registrado! Entrada registrada"
- Status muda para: 🟢 Trabalhando
- Aparece na timeline: 🟢 Entrada 08:00

---

### Início do Intervalo (Pausa para Almoço)

**Quando usar**: Ao sair para almoço ou intervalo

1. Clique no botão amarelo **"Intervalo"**
2. Aguarde a confirmação
3. Aproveite seu intervalo!

✅ **Você verá**:
- Toast: "Ponto registrado! Intervalo iniciado"
- Status muda para: 🔵 Intervalo
- Aparece na timeline: ☕ Início Intervalo 12:00

---

### Retorno do Intervalo

**Quando usar**: Ao voltar do almoço/intervalo

1. Clique no botão azul **"Retorno"**
2. Aguarde a confirmação
3. Volte ao trabalho!

✅ **Você verá**:
- Toast: "Ponto registrado! Retorno registrado"
- Status muda para: 🟢 Trabalhando
- Aparece na timeline: ⏸️ Fim Intervalo 13:00

---

### Saída (Fim do Expediente)

**Quando usar**: Ao finalizar o dia de trabalho

1. Clique no botão vermelho **"Saída"**
2. Aguarde a confirmação
3. Tenha um bom descanso!

✅ **Você verá**:
- Toast: "Ponto registrado! Saída registrada"
- Status muda para: ✅ Finalizado
- Aparece na timeline: 🔴 Saída 17:00
- Total de horas trabalhadas atualizado

---

## Entendendo a Tela

### Card de Status
```
┌─────────────────┐
│     Status      │
│  🟢 Trabalhando │
└─────────────────┘
```

**Possíveis status**:
- ⏸️ **Aguardando**: Você ainda não registrou entrada hoje
- 🟢 **Trabalhando**: Você está no expediente
- 🔵 **Intervalo**: Você está em pausa
- ✅ **Finalizado**: Você já completou o dia

---

### Card de Horas Trabalhadas
```
┌──────────────────┐
│  Trabalhado Hoje │
│     4h 23min     │
└──────────────────┘
```

**O que mostra**:
- Tempo total trabalhado até agora
- Desconta automaticamente os intervalos
- Atualiza em tempo real enquanto você trabalha

---

### Card de Banco de Horas
```
┌──────────────────┐
│  Banco de Horas  │
│    +1h 45min     │
└──────────────────┘
```

**O que significa**:
- **+** (azul): Você tem horas extras acumuladas
- **-** (vermelho): Você tem horas a compensar
- **0** (cinza): Você está em dia

---

### Timeline do Dia
```
Registros de Hoje:
─────────────────────────
🟢 Entrada      08:00
☕ Intervalo    12:00
⏸️ Retorno      13:00
🔴 Saída        17:00
```

**O que mostra**:
- Todos os seus registros do dia
- Em ordem cronológica
- Com ícones coloridos para fácil identificação

---

### Quem Está Presente
```
Presente Agora:
────────────────────────────────
João Silva      🟢 Trabalhando
Maria Santos    🔵 Intervalo
Pedro Oliveira  ✅ Finalizado
Ana Costa       ⏸️ Aguardando
```

**O que mostra**:
- Quem está trabalhando agora
- Status de cada pessoa
- Útil para saber quem está disponível

---

## Regras Importantes

### ✅ O que você PODE fazer:
- Registrar entrada ao chegar
- Iniciar intervalo quando precisar
- Retornar do intervalo
- Registrar saída ao finalizar

### ❌ O que você NÃO pode fazer:
- Registrar entrada duas vezes seguidas
- Registrar saída sem ter entrada
- Registrar retorno sem ter intervalo
- Alterar o horário manualmente (sempre usa hora atual)
- Registrar novamente antes de 1 minuto

---

## Cenários Comuns

### Cenário 1: Dia Normal (com intervalo)
```
08:00 → Entrada
12:00 → Início Intervalo
13:00 → Retorno
17:00 → Saída

Total: 8h (9h - 1h de intervalo)
```

### Cenário 2: Dia sem Intervalo
```
08:00 → Entrada
12:00 → Saída (meio período)

Total: 4h
```

### Cenário 3: Múltiplos Intervalos
```
08:00 → Entrada
10:00 → Intervalo (café)
10:15 → Retorno
12:00 → Intervalo (almoço)
13:00 → Retorno
15:00 → Intervalo (café)
15:15 → Retorno
17:00 → Saída

Total: 8h 30min
```

### Cenário 4: Esqueci de Registrar
- **Solução**: Entre em contato com o RH
- O RH pode fazer ajustes manuais no sistema
- Sempre comunique imediatamente

---

## Dicas Importantes

### 🕐 Horário
- O sistema usa sempre a hora atual
- Não é possível alterar manualmente
- Garante precisão e transparência

### 📱 Dispositivo
- Funciona em qualquer navegador
- Desktop, tablet ou celular
- Recomendado: Chrome, Firefox, Safari

### 🌐 Internet
- Necessária conexão com internet
- Se cair, tente novamente quando voltar
- Os registros ficam salvos no servidor

### 🔄 Atualização
- Página atualiza automaticamente
- Relógio funciona em tempo real
- Timeline aparece instantaneamente

---

## Problemas Comuns e Soluções

### Problema: Botão está cinza (desabilitado)
**Solução**: Você já registrou essa ação ou não pode fazê-la agora
- Exemplo: Não pode fazer entrada se já fez
- Verifique seu status atual

### Problema: Aparece mensagem de erro
**Solução**: Leia a mensagem, ela explica o problema
- Exemplos:
  - "Já existe entrada registrada hoje"
  - "Registre entrada antes do intervalo"
  - "Aguarde 1 minuto entre registros"

### Problema: Não aparece meu nome
**Solução**: Você pode não estar vinculado como funcionário
- Entre em contato com o RH
- Eles vão fazer o vínculo da sua conta

### Problema: Horário errado
**Solução**: Verifique o fuso horário do seu computador
- Sistema usa horário do servidor
- Geralmente horário de Brasília

### Problema: Esqueci de registrar ontem
**Solução**: Não tente registrar manualmente
- Fale com o RH imediatamente
- Eles podem fazer ajuste retroativo

---

## Perguntas Frequentes

### Posso registrar ponto de casa?
**Depende**. Consulte seu RH sobre home office e trabalho remoto.

### Posso usar o celular?
**Sim**. O sistema funciona em qualquer dispositivo com navegador.

### O que acontece se eu esquecer de registrar?
**Entre em contato com o RH**. Eles podem fazer ajustes manuais.

### Como sei se meu registro foi salvo?
**Você verá**:
1. Toast de confirmação verde
2. Registro aparece na timeline
3. Status atualizado

### Posso cancelar um registro?
**Não**. Uma vez registrado, não pode ser cancelado pelo funcionário.
- Apenas o RH pode fazer ajustes
- Isso garante transparência

### O banco de horas expira?
**Depende da política da empresa**. Consulte seu RH.

### Preciso registrar aos sábados/domingos?
**Depende**. Se você trabalha nesses dias, sim. Senão, não.

### O que é "Localização automática"?
**É opcional**. Alguns recursos futuros podem usar sua localização
para validar que você está no local de trabalho.

---

## Contato com RH

### Quando procurar o RH:
- Esqueceu de registrar ponto
- Precisa ajustar horário
- Dúvidas sobre banco de horas
- Problemas técnicos persistentes
- Não consegue acessar o sistema

### Informações a fornecer:
- Seu nome completo
- Matrícula (se tiver)
- Data e horário do problema
- Mensagem de erro (se houver)
- Screenshot da tela (ajuda muito!)

---

## Boas Práticas

### ✅ Faça:
- Registre sempre no horário correto
- Verifique se o registro apareceu
- Comunique problemas imediatamente
- Mantenha consistência diária

### ❌ Evite:
- Pedir para outra pessoa registrar por você
- Esquecer de registrar
- Tentar burlar o sistema
- Registrar fora do horário de trabalho

---

## Glossário

**Entrada/Clock In**: Registro de chegada ao trabalho

**Saída/Clock Out**: Registro de saída do trabalho

**Intervalo/Break**: Pausa no trabalho (almoço, café)

**Banco de Horas**: Saldo de horas trabalhadas a mais ou a menos

**Timeline**: Lista cronológica dos seus registros

**Status**: Situação atual do seu ponto (trabalhando, intervalo, etc)

**RLS**: Segurança que garante que você só vê seus dados

**Toast**: Mensagem de confirmação que aparece no canto da tela

---

## Atalhos de Teclado (Futuro)

Em breve, você poderá usar:
- `E` - Registrar Entrada
- `I` - Iniciar Intervalo
- `R` - Retornar do Intervalo
- `S` - Registrar Saída
- `F5` - Atualizar página

---

## Suporte Técnico

### Problemas Técnicos:
- Email: suporte@suaempresa.com.br
- Telefone: (XX) XXXX-XXXX
- Ramal: XXX

### Horário de Atendimento:
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 12h
- Domingo e Feriados: Fechado

---

## Atualizações do Sistema

O sistema é atualizado regularmente com:
- Correções de bugs
- Novos recursos
- Melhorias de segurança
- Performance otimizada

Você será notificado sobre:
- Novas funcionalidades
- Mudanças importantes
- Manutenções programadas

---

## Segurança e Privacidade

### Seus dados estão seguros:
- ✅ Criptografia em todas as comunicações
- ✅ Apenas você vê seus registros
- ✅ RH e gestores têm acesso controlado
- ✅ Logs de auditoria de todas as ações
- ✅ Backup diário automático

### Suas responsabilidades:
- 🔒 Mantenha sua senha segura
- 🔒 Não compartilhe seu login
- 🔒 Faça logout ao sair
- 🔒 Use apenas seu dispositivo

---

## Conclusão

O sistema de ponto eletrônico é simples e intuitivo:

1. **Entrada** ao chegar
2. **Intervalo** ao pausar
3. **Retorno** ao voltar
4. **Saída** ao finalizar

Registre sempre no momento certo e acompanhe suas horas trabalhadas em tempo real!

**Em caso de dúvidas, procure o RH. Estamos aqui para ajudar!**

---

**Versão do Guia**: 1.0
**Última Atualização**: 29/01/2026
**Sistema**: RH Rick Gay - Ponto Eletrônico
