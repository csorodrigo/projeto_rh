# Widget de Alertas de Compliance - Exemplos e Casos de Uso

## Exemplos Visuais de Alertas

### 1. Funcionários sem PIS

```
╔══════════════════════════════════════════════════════════╗
║ 🔴 Funcionários sem PIS                            [3]   ║
╠══════════════════════════════════════════════════════════╣
║ Cadastro de PIS é obrigatório para geração de AFD e AEJ ║
║                                                          ║
║ João Silva, Maria Santos, Pedro Costa                   ║
║ → Corrigir problema                                      ║
╚══════════════════════════════════════════════════════════╝
```

### 2. Registros Faltantes Hoje

```
╔══════════════════════════════════════════════════════════╗
║ 🟡 Registros faltantes hoje                        [5]   ║
╠══════════════════════════════════════════════════════════╣
║ Funcionários sem marcação de entrada/saída              ║
║                                                          ║
║ Ana Paula, Carlos Lima, Juliana Souza...                ║
║ → Corrigir problema                                      ║
╚══════════════════════════════════════════════════════════╝
```

### 3. Violações de Jornada

```
╔══════════════════════════════════════════════════════════╗
║ 🔴 Violações de jornada                            [8]   ║
╠══════════════════════════════════════════════════════════╣
║ Funcionários com mais de 10h trabalhadas/dia            ║
║                                                          ║
║ Roberto Alves (3x), Fernanda Costa (2x)...              ║
║ → Corrigir problema                                      ║
╚══════════════════════════════════════════════════════════╝
```

### 4. Estado Vazio (Tudo OK)

```
╔══════════════════════════════════════════════════════════╗
║                    ✅                                    ║
║              Tudo em conformidade!                       ║
║       Nenhum problema detectado no momento              ║
╚══════════════════════════════════════════════════════════╝
```

## Casos de Uso Práticos

### Caso 1: Novo Funcionário sem PIS

**Cenário**: RH cadastra funcionário mas esquece de preencher PIS

**Fluxo**:
1. Dashboard exibe alerta vermelho "Funcionários sem PIS"
2. Badge mostra [1]
3. Tooltip mostra nome do funcionário
4. Gerente clica "Corrigir problema"
5. Navega para /funcionarios
6. Edita cadastro e adiciona PIS
7. Alerta desaparece no próximo refresh

### Caso 2: Jornada Excessiva

**Cenário**: Funcionário trabalha 12h devido a demanda

**Fluxo**:
1. Sistema calcula horas trabalhadas no `time_tracking_daily`
2. Widget detecta `worked_minutes = 720` (12h > 10h)
3. Dashboard exibe alerta vermelho
4. Mostra "Roberto Alves (1x)"
5. Gerente clica para ver relatório completo
6. Verifica se há justificativa
7. Aprova banco de horas ou registra hora extra

### Caso 3: Interjornada Violada

**Cenário**: Funcionário sai 23h e entra 7h (8h de descanso)

**Fluxo**:
1. Widget compara `clock_out` com `clock_in` do dia seguinte
2. Calcula: 7h - 23h = 8 horas (< 11h)
3. Exibe alerta: "Interjornada não respeitada"
4. Gerente revisa escala
5. Ajusta horário ou registra exceção
6. Evita multa trabalhista

### Caso 4: Marcações Duplicadas

**Cenário**: Funcionário bate ponto 2x por engano

**Fluxo**:
1. Sistema detecta dois `clock_in` às 8:00 e 8:02
2. Widget alerta marcações duplicadas
3. Gerente acessa /ponto
4. Remove registro duplicado
5. Limpa inconsistência no banco

## Exemplos de Queries SQL

### Query 1: Buscar Funcionários sem PIS

```sql
SELECT
  id,
  name,
  pis
FROM employees
WHERE
  company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'active'
  AND (pis IS NULL OR pis = '');
```

### Query 2: Violações de Jornada (Últimos 7 dias)

```sql
SELECT
  td.id,
  td.employee_id,
  td.date,
  td.worked_minutes,
  e.name
FROM time_tracking_daily td
INNER JOIN employees e ON e.id = td.employee_id
WHERE
  td.company_id = '123e4567-e89b-12d3-a456-426614174000'
  AND td.date >= CURRENT_DATE - INTERVAL '7 days'
  AND td.worked_minutes > 600
ORDER BY td.date DESC, e.name;
```

### Query 3: Registros Faltantes Hoje

```sql
-- Funcionários ativos
SELECT id, name FROM employees
WHERE company_id = '...' AND status = 'active';

-- Menos ausentes
SELECT DISTINCT employee_id FROM absences
WHERE
  company_id = '...'
  AND status IN ('approved', 'in_progress')
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE;

-- Menos com registros
SELECT DISTINCT employee_id FROM time_records
WHERE
  company_id = '...'
  AND recorded_at::date = CURRENT_DATE;
```

## Testes Automatizados (Sugestão)

### Teste 1: Verificar Alerta de PIS

```typescript
test('deve exibir alerta quando funcionário não tem PIS', async () => {
  // Criar funcionário sem PIS
  await createEmployee({ name: 'João Silva', pis: null })

  // Renderizar widget
  render(<ComplianceAlertsWidget companyId="..." />)

  // Aguardar carregamento
  await waitFor(() => {
    expect(screen.getByText('Funcionários sem PIS')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

### Teste 2: Estado Vazio

```typescript
test('deve exibir "Tudo em conformidade" quando não há alertas', async () => {
  // Sem violações
  render(<ComplianceAlertsWidget companyId="..." />)

  await waitFor(() => {
    expect(screen.getByText('Tudo em conformidade!')).toBeInTheDocument()
    expect(screen.getByText('CheckCircle2')).toBeInTheDocument()
  })
})
```

### Teste 3: Link de Ação

```typescript
test('deve navegar para /ponto ao clicar em corrigir', async () => {
  render(<ComplianceAlertsWidget companyId="..." />)

  const link = await screen.findByText('Corrigir problema')
  expect(link).toHaveAttribute('href', '/ponto')
})
```

## Integrações Futuras

### 1. Notificações por Email

```typescript
// Enviar email diário com resumo de alertas
async function sendDailyComplianceReport(companyId: string) {
  const alerts = await getComplianceAlerts(companyId)

  if (alerts.length === 0) return

  const html = generateEmailTemplate(alerts)

  await sendEmail({
    to: 'gerente@empresa.com',
    subject: `⚠️ ${alerts.length} alertas de compliance`,
    html
  })
}
```

### 2. Webhook para Slack

```typescript
// Notificar no Slack quando alerta crítico aparecer
async function notifySlackOnCriticalAlert(alert: ComplianceAlert) {
  if (alert.severity !== 'error') return

  await fetch('https://hooks.slack.com/services/...', {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Alerta Crítico: ${alert.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.description}\n\nFuncionários: ${alert.count}`
          }
        }
      ]
    })
  })
}
```

### 3. Dashboard Analytics

```typescript
// Rastrear métricas de compliance ao longo do tempo
interface ComplianceMetrics {
  date: string
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  resolvedAlerts: number
}

async function trackComplianceMetrics(companyId: string) {
  const alerts = await getComplianceAlerts(companyId)

  const metrics: ComplianceMetrics = {
    date: new Date().toISOString(),
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'error').length,
    warningAlerts: alerts.filter(a => a.severity === 'warning').length,
    resolvedAlerts: 0 // Buscar do histórico
  }

  await saveMetrics(metrics)
}
```

## Performance e Otimizações

### Caching

```typescript
// Cache de 5 minutos para alertas
const CACHE_TTL = 5 * 60 * 1000

let alertsCache: {
  data: ComplianceAlert[]
  timestamp: number
} | null = null

export async function getComplianceAlertsWithCache(
  companyId: string
): Promise<ComplianceAlert[]> {
  const now = Date.now()

  if (alertsCache && now - alertsCache.timestamp < CACHE_TTL) {
    return alertsCache.data
  }

  const alerts = await getComplianceAlerts(companyId)

  alertsCache = {
    data: alerts,
    timestamp: now
  }

  return alerts
}
```

### Paginação para Grandes Volumes

```typescript
// Limitar alertas exibidos no widget
const MAX_ALERTS_DISPLAYED = 5

export function ComplianceAlertsWidget({ companyId }: Props) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [showAll, setShowAll] = useState(false)

  const displayedAlerts = showAll
    ? alerts
    : alerts.slice(0, MAX_ALERTS_DISPLAYED)

  return (
    <div>
      {displayedAlerts.map(alert => <AlertItem {...} />)}

      {alerts.length > MAX_ALERTS_DISPLAYED && !showAll && (
        <Button onClick={() => setShowAll(true)}>
          Ver mais {alerts.length - MAX_ALERTS_DISPLAYED} alertas
        </Button>
      )}
    </div>
  )
}
```

## Checklist de Deploy

Antes de colocar em produção:

- [ ] Testar com empresa sem funcionários
- [ ] Testar com empresa com 1000+ funcionários
- [ ] Verificar permissões RLS no Supabase
- [ ] Testar todos os links de ação
- [ ] Validar tooltips com nomes longos
- [ ] Testar em mobile (responsividade)
- [ ] Verificar performance das queries
- [ ] Adicionar índices no banco se necessário
- [ ] Configurar monitoramento de erros
- [ ] Documentar para equipe de suporte

## Troubleshooting

### Alerta não aparece mesmo com violação

1. Verificar se `company_id` está correto
2. Checar RLS policies no Supabase
3. Validar status do funcionário (deve ser 'active')
4. Conferir timezone dos registros

### Performance lenta

1. Adicionar índices:
```sql
CREATE INDEX idx_time_tracking_daily_worked_minutes
ON time_tracking_daily(company_id, worked_minutes);

CREATE INDEX idx_employees_pis
ON employees(company_id, pis) WHERE status = 'active';
```

2. Limitar período de busca (máximo 30 dias)

3. Implementar cache conforme exemplo acima

### Alertas duplicados

Verificar unicidade em `checkDuplicateRecords`:
- Intervalo de 5 minutos está adequado?
- Considerar mesma localização GPS?

## Recursos Adicionais

- [Documentação CLT - Jornada de Trabalho](https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
- [Portaria 671/2021 - Registro de Ponto](https://www.in.gov.br/en/web/dou/-/portaria-n-671-de-8-de-novembro-de-2021-358060881)
- [e-Social - Layout AFD](http://www.esocial.gov.br/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização**: 29/01/2026
**Versão**: 1.0.0
**Status**: Produção Ready ✅
