# Quick Start - Templates de Relatórios

Guia rápido para começar a usar o sistema de templates de relatórios.

## 1. Setup Inicial (5 minutos)

### Aplicar Migration

```bash
# Via Supabase CLI
cd seu-projeto
supabase db push

# OU manualmente:
# 1. Abra o Supabase Dashboard
# 2. Vá em SQL Editor
# 3. Cole o conteúdo de supabase/migrations/020_report_templates.sql
# 4. Execute
```

### Configurar Cron Secret

```bash
# Gerar secret
openssl rand -base64 32

# Adicionar no .env.local
CRON_SECRET=seu_secret_gerado_aqui
```

### Deploy (Vercel)

```bash
# Commit e push
git add .
git commit -m "feat: Sistema de templates de relatórios"
git push

# O cron será configurado automaticamente via vercel.json
```

## 2. Criar Primeiro Template (2 minutos)

### Passo a Passo

1. **Acesse**: `/relatorios/templates`

2. **Clique**: "Novo Template"

3. **Etapa 1 - Configuração**:
   - Nome: "Relatório de Funcionários Ativos"
   - Tipo: Funcionários
   - Formato: Excel

4. **Etapa 2 - Colunas**:
   - Selecione: Nome, CPF, Departamento, Cargo, Status
   - Arraste para reordenar se quiser

5. **Etapa 3 - Filtros**:
   - Adicione: Status = "active"

6. **Etapa 4 - Preview**:
   - Revise e clique "Salvar Template"

✅ Pronto! Seu primeiro template está criado.

## 3. Gerar Relatório (30 segundos)

1. Na listagem de templates
2. Clique em "Gerar" no card do template
3. Arquivo será baixado automaticamente

## 4. Agendar Relatório (1 minuto)

### Exemplo: Relatório Mensal

1. No card do template, clique no ícone 📅 de calendário

2. Configure:
   - **Frequência**: Mensal
   - **Dia do mês**: 1
   - **Horário**: 09:00
   - **Período dos dados**: Último mês
   - **Destinatários**: admin@empresa.com, rh@empresa.com

3. Clique "Salvar Agendamento"

✅ Todo dia 1º às 9h, o relatório será gerado e enviado por email!

## 5. Casos de Uso Comuns

### Relatório de Ponto Diário

```
Tipo: Registro de Ponto
Colunas: Funcionário, Data, Entrada, Saída, Horas
Filtros: Data = Ontem
Agendamento: Diário às 8h
```

### Ausências da Semana

```
Tipo: Ausências
Colunas: Funcionário, Tipo, Data Início, Data Fim, Status
Filtros: Status = "approved"
Agendamento: Semanal (Segunda) às 9h
Período: Última semana
```

### Folha de Pagamento Mensal

```
Tipo: Folha de Pagamento
Colunas: Funcionário, Salário Base, Horas Extras, Descontos, Líquido
Filtros: Status = "approved"
Agendamento: Mensal (dia 25) às 10h
Período: Mês atual
```

## 6. Comandos Úteis

### Testar Cron Manualmente

```bash
# Com CRON_SECRET
curl -X POST https://seu-app.vercel.app/api/cron/reports \
  -H "Authorization: Bearer SEU_CRON_SECRET"

# Resposta esperada:
{
  "success": true,
  "timestamp": "2024-01-29T10:00:00Z",
  "results": {
    "processed": 3,
    "succeeded": 3,
    "failed": 0,
    "errors": []
  }
}
```

### Verificar Histórico (SQL)

```sql
-- Últimos 10 relatórios gerados
SELECT
  h.generated_at,
  t.name as template_name,
  h.format,
  h.record_count,
  h.status,
  h.processing_time_ms
FROM report_history h
JOIN report_templates t ON h.template_id = t.id
ORDER BY h.generated_at DESC
LIMIT 10;
```

### Ver Próximos Agendamentos

```sql
-- Próximos relatórios a serem gerados
SELECT
  t.name,
  s.frequency,
  s.next_run,
  s.recipients
FROM report_schedules s
JOIN report_templates t ON s.template_id = t.id
WHERE s.active = TRUE
ORDER BY s.next_run
LIMIT 10;
```

## 7. Troubleshooting Rápido

### Cron não está executando

```bash
# 1. Verificar logs do Vercel
vercel logs --follow

# 2. Verificar se o cron está configurado
vercel project settings

# 3. Testar manualmente
curl -X POST https://seu-app.vercel.app/api/cron/reports
```

### Relatório não gera

```sql
-- Verificar erros no histórico
SELECT * FROM report_history
WHERE status = 'error'
ORDER BY generated_at DESC
LIMIT 5;
```

### Arquivo não aparece

```sql
-- Verificar storage bucket
-- No Supabase Dashboard > Storage > reports
-- Deve existir o bucket 'reports'
```

## 8. Dicas Pro

### Usar Favoritos

Marque templates usados frequentemente como favoritos para acesso rápido.

### Duplicar Templates

Clone templates existentes para criar variações rapidamente.

### Categorizar

Crie categorias para organizar templates por departamento ou finalidade.

### Compartilhar

Compartilhe templates com gestores dando permissão "executar" apenas.

### Histórico

Use a aba de histórico para redownload de relatórios antigos.

## 9. Exemplos de Filtros

### Funcionários Ativos do TI

```
Campo: status
Operador: Igual a
Valor: active

E

Campo: department
Operador: Igual a
Valor: TI
```

### Ausências Pendentes dos Últimos 7 Dias

```
Campo: status
Operador: Igual a
Valor: pending

E

Campo: start_date
Operador: Maior ou igual a
Valor: (hoje - 7 dias)
```

### Salários Acima de R$ 5.000

```
Campo: base_salary
Operador: Maior que
Valor: 5000
```

## 10. Next Steps

Depois de dominar o básico:

1. ✅ Explore diferentes tipos de relatórios
2. ✅ Experimente filtros avançados
3. ✅ Configure múltiplos agendamentos
4. ✅ Use as 3 opções de formato (CSV, Excel, PDF)
5. ✅ Compartilhe templates com a equipe
6. ✅ Analise o histórico para insights

## Suporte

- 📖 **Documentação Completa**: `README_REPORT_TEMPLATES.md`
- 🔧 **Detalhes Técnicos**: `IMPLEMENTACAO_TEMPLATES_RELATORIOS.md`
- 💬 **Issues**: Abra uma issue no repositório

## Checklist de Primeira Vez

- [ ] Migration aplicada
- [ ] CRON_SECRET configurado
- [ ] Deploy feito
- [ ] Primeiro template criado
- [ ] Primeiro relatório gerado
- [ ] Primeiro agendamento configurado
- [ ] Cron testado manualmente
- [ ] Email de teste recebido (após implementar email service)

---

**Pronto para começar!** 🚀

O sistema está configurado e funcionando. Agora é só criar seus templates e automatizar seus relatórios!
