# Documentação Completa - Página de Relatórios de Compliance

## Visão Geral

A página de Relatórios de Compliance (`/relatorios/compliance`) é uma interface completa para geração e download de relatórios AFD e AEJ conforme a legislação brasileira (Portaria 671/2021 do MTE).

## Arquivos Criados

### Página Principal
```
src/app/(dashboard)/relatorios/compliance/
├── page.tsx           # Página principal com lógica de negócio
├── layout.tsx         # Layout com metadata
└── README.md          # Documentação específica da página
```

### Componentes
```
src/components/relatorios/compliance/
├── ComplianceReportForm.tsx      # Formulário de geração de relatórios
├── ComplianceHistory.tsx         # Histórico de relatórios gerados
├── ComplianceValidation.tsx      # Validação e checklist de conformidade
├── ComplianceReportForm.test.tsx # Testes (template)
└── index.ts                      # Barrel export
```

## Estrutura da Página

### 1. Header
```tsx
<div className="flex items-start gap-4">
  <Shield icon />
  <div>
    <h1>Relatórios de Compliance</h1>
    <p>Gere relatórios AFD e AEJ conforme legislação brasileira</p>
  </div>
</div>
```

**Visual:**
- Ícone de escudo (Shield) em background primary
- Título grande e descritivo
- Subtítulo explicativo

### 2. Formulário de Seleção (ComplianceReportForm)

#### Tabs de Seleção
```tsx
<Tabs value="afd" | "aej">
  <TabsList>
    <TabsTrigger value="afd">AFD - Arquivo Fonte de Dados</TabsTrigger>
    <TabsTrigger value="aej">AEJ - Arquivo Eletrônico de Jornada</TabsTrigger>
  </TabsList>
</Tabs>
```

**Características:**
- 2 tabs: AFD e AEJ
- Ícone FileText em cada tab
- Descrição detalhada de cada tipo

#### Date Range Picker
```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  placeholder="Selecione o período"
/>
```

**Funcionalidades:**
- Seleção de período (data início e fim)
- Calendário em português (pt-BR)
- Validação de intervalo

#### Preview dos Dados
```tsx
{preview && (
  <Card className="bg-muted/50">
    <CardHeader>
      <CardTitle>Preview dos dados</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>Funcionários: {totalEmployees}</div>
        <div>Registros: {totalRecords}</div>
        {employeesWithoutPis > 0 && <div className="text-destructive">...</div>}
      </div>
    </CardContent>
  </Card>
)}
```

**Exibe:**
- Total de funcionários
- Total de registros
- Avisos de funcionários sem PIS (vermelho)
- Avisos de registros incompletos (amarelo)

#### Botões de Ação
```tsx
<div className="flex gap-3">
  <Button onClick={handlePreview} variant="outline" className="flex-1">
    Visualizar Dados
  </Button>
  <Button onClick={handleGenerate} className="flex-1">
    Gerar Relatório
  </Button>
</div>

{preview && (
  <Button onClick={handleDownload} className="w-full">
    <Download icon /> Baixar {type} (.txt)
  </Button>
)}
```

**Estados:**
- Disabled quando período não selecionado
- Loading state com spinner
- Download só aparece após gerar

### 3. Validação de Conformidade (ComplianceValidation)

#### Checklist
```tsx
<div className="space-y-3">
  {/* Item 1: PIS cadastrado */}
  <div className="flex items-center justify-between p-3 rounded-lg border">
    <div className="flex items-center gap-3">
      <CheckCircle | XCircle className="h-5 w-5" />
      <div>
        <p className="font-medium">Todos funcionários com PIS cadastrado</p>
        <p className="text-sm text-muted-foreground">
          {employeesWithPis} de {totalEmployees} funcionários
        </p>
      </div>
    </div>
    <Badge variant={ok ? "success" : "destructive"}>Conforme/Não conforme</Badge>
  </div>

  {/* Item 2: Registros completos */}
  <div>...</div>

  {/* Item 3: Sem violações */}
  <div>...</div>
</div>
```

**Estados Visuais:**
- ✅ CheckCircle verde quando conforme
- ❌ XCircle vermelho quando não conforme
- Badge com status
- Contadores de progresso

#### Lista de Issues
```tsx
{issues.map(issue => (
  <Alert variant={issue.type === 'error' ? 'destructive' : 'default'}>
    <div className="flex items-start gap-2">
      <Icon />
      <div>
        <AlertTitle>{issue.message}</AlertTitle>
        {issue.details && <AlertDescription>{issue.details}</AlertDescription>}
      </div>
    </div>
  </Alert>
))}
```

**Tipos de Issue:**
- **Error** (vermelho): Problemas críticos que impedem geração
- **Warning** (amarelo): Avisos que não impedem mas precisam atenção
- **Info** (azul): Informações adicionais

#### Status Geral
```tsx
{allOk && (
  <Alert className="border-green-500 bg-green-50">
    <CheckCircle className="h-4 w-4" />
    <AlertTitle>Sistema em conformidade</AlertTitle>
    <AlertDescription>
      Todos os requisitos estão atendidos.
    </AlertDescription>
  </Alert>
)}
```

### 4. Histórico (ComplianceHistory)

#### Tabela de Histórico
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Tipo</TableHead>
      <TableHead>Período</TableHead>
      <TableHead>Gerado em</TableHead>
      <TableHead>Dados</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {history.map(item => (
      <TableRow>
        <TableCell><Badge>AFD/AEJ</Badge></TableCell>
        <TableCell>01/12/2024 - 31/12/2024</TableCell>
        <TableCell>29/01/2026 às 13:45</TableCell>
        <TableCell>45 func. 1234 reg.</TableCell>
        <TableCell><Badge>Sucesso/Erro</Badge></TableCell>
        <TableCell>
          <Button size="sm" variant="ghost">
            <Download />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Badges de Status:**
- 🟢 **Sucesso**: Verde com CheckCircle
- 🔴 **Erro**: Vermelho com XCircle
- 🟡 **Processando**: Amarelo com Clock

**Funcionalidades:**
- Clique em Download para baixar novamente
- Últimos 10 relatórios
- Ordenado por mais recente

#### Estado Vazio
```tsx
{history.length === 0 && (
  <div className="flex flex-col items-center justify-center py-8">
    <FileText className="h-12 w-12 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">
      Nenhum relatório gerado ainda
    </p>
  </div>
)}
```

## Fluxo de Uso Completo

### Cenário 1: Gerar Relatório AFD

1. **Acessar página** → `/relatorios/compliance`
2. **Selecionar tab AFD** (já selecionado por padrão)
3. **Escolher período** → Date Picker (ex: 01/12/2024 a 31/12/2024)
4. **Visualizar dados** → Botão "Visualizar Dados"
   - Sistema busca funcionários e registros do período
   - Exibe preview: "45 funcionários, 1234 registros"
5. **Verificar validações** → Card de Validação
   - ✅ Todos funcionários com PIS
   - ✅ Registros completos
   - ✅ Sem violações
6. **Gerar relatório** → Botão "Gerar Relatório"
   - Sistema processa dados
   - Gera arquivo AFD
   - Adiciona ao histórico
7. **Baixar** → Botão "Baixar AFD (.txt)"
   - Download automático do arquivo
   - Nome: `AFD_12345678000190_01122024_31122024.txt`

### Cenário 2: Gerar Relatório AEJ

Similar ao AFD, mas:
- Selecionar tab AEJ
- Arquivo inclui cálculos de jornada
- Pode baixar em .txt ou .csv
- Nome: `AEJ_12345678000190_01122024_31122024.txt`

### Cenário 3: Dados com Problemas

1. Selecionar período
2. Visualizar dados → Preview mostra:
   - ⚠️ 2 funcionários sem PIS (vermelho)
   - ⚠️ 5 registros incompletos (amarelo)
3. Validações mostram:
   - ❌ Funcionários com PIS: 43 de 45
   - ❌ Registros completos: 1229 de 1234
4. Issues listadas:
   - 🔴 **Error**: "Funcionários sem PIS cadastrado (2 ocorrências)"
     - Detalhes: "É obrigatório cadastrar o PIS..."
   - 🟡 **Warning**: "Registros pendentes de aprovação (5 ocorrências)"
     - Detalhes: "Existem registros que ainda não foram aprovados..."
5. Usuário pode:
   - Corrigir os dados antes de gerar
   - Ou gerar mesmo assim (com avisos)

### Cenário 4: Re-download do Histórico

1. Ir para seção "Histórico de relatórios"
2. Ver lista de relatórios gerados
3. Clicar no ícone Download do relatório desejado
4. Arquivo é gerado novamente e baixado

## Integrações e Dependências

### Geradores (Backend)
```typescript
// AFD Generator
import { generateAFD, AFDGenerator, type AFDData } from '@/lib/compliance/afd-generator'

const afdData: AFDData = {
  company,      // Dados da empresa (CNPJ, razão social, etc)
  employees,    // Lista de funcionários ativos
  timeRecords,  // Registros de ponto do período
  dailyRecords, // Consolidação diária
  startDate,    // Data início
  endDate,      // Data fim
}

const result = generateAFD(afdData)
// result.content: string (conteúdo do arquivo)
// result.filename: string (nome sugerido)
// result.totalRecords: number
// result.encoding: 'UTF-8' | 'ISO-8859-1'
```

```typescript
// AEJ Generator
import { generateAEJ, AEJGenerator, type AEJData } from '@/lib/compliance/aej-generator'

const aejData: AEJData = {
  company,        // Dados da empresa
  employees,      // Lista de funcionários
  dailyRecords,   // Registros consolidados diários
  workSchedules,  // Escalas de trabalho
  holidays,       // Feriados do período
  startDate,
  endDate,
}

const result = generateAEJ(aejData, {
  includeDaily: false,    // Incluir detalhamento diário
  includeMonetary: true,  // Incluir valores monetários
  format: 'txt',          // 'txt' ou 'csv'
})
// result.content: string
// result.filename: string
// result.totalEmployees: number
// result.records: EmployeeJourneyRecord[]
```

### Supabase (TODO - Produção)

```typescript
// Buscar funcionários
const { data: employees } = await supabase
  .from('employees')
  .select('*')
  .eq('company_id', companyId)
  .eq('status', 'active')

// Buscar registros de ponto
const { data: timeRecords } = await supabase
  .from('time_records')
  .select('*')
  .gte('recorded_at', startDate.toISOString())
  .lte('recorded_at', endDate.toISOString())
  .eq('company_id', companyId)

// Buscar registros diários consolidados
const { data: dailyRecords } = await supabase
  .from('time_tracking_daily')
  .select('*')
  .gte('date', startDate.toISOString().split('T')[0])
  .lte('date', endDate.toISOString().split('T')[0])
  .eq('company_id', companyId)

// Salvar histórico
const { data: saved } = await supabase
  .from('compliance_reports')
  .insert({
    company_id: companyId,
    type: 'afd',
    start_date: startDate,
    end_date: endDate,
    filename: result.filename,
    status: 'success',
    metadata: {
      total_employees: employees.length,
      total_records: timeRecords.length,
    }
  })

// Upload do arquivo para Storage
const { data: uploaded } = await supabase.storage
  .from('compliance-reports')
  .upload(`${companyId}/${result.filename}`, new Blob([result.content]))
```

### Toast (Feedback)
```typescript
import { toast } from 'sonner'

// Sucesso
toast.success('Relatório AFD gerado com sucesso')

// Erro
toast.error('Erro ao gerar relatório')

// Informação
toast.info('Preview carregado')

// Loading
toast.loading('Gerando relatório...')
```

## Estilos e Classes Tailwind

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

### Badges
```tsx
<Badge variant="default">Sucesso</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">AFD</Badge>
<Badge className="bg-green-500">Conforme</Badge>
```

### Alerts
```tsx
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Erro crítico</AlertTitle>
  <AlertDescription>Descrição do erro</AlertDescription>
</Alert>
```

### Loading States
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando...
    </>
  ) : (
    'Gerar'
  )}
</Button>
```

## Validações Implementadas

### 1. Validação de PIS
```typescript
function validatePIS(pis: string): boolean {
  const cleanPis = pis.replace(/\D/g, '')
  if (cleanPis.length !== 11) return false

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanPis[i]) * weights[i]
  }
  const remainder = sum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder
  return checkDigit === parseInt(cleanPis[10])
}
```

### 2. Validação de Registros Completos
```typescript
function hasCompleteRecords(records: TimeRecord[]): boolean {
  // Verifica se há entrada e saída no mesmo dia
  const dailyRecords = groupByDate(records)
  return dailyRecords.every(day =>
    day.some(r => r.type === 'clock_in') &&
    day.some(r => r.type === 'clock_out')
  )
}
```

### 3. Detecção de Violações
```typescript
interface Violation {
  type: 'missing_pis' | 'incomplete_record' | 'invalid_sequence'
  employeeId: string
  date?: string
  message: string
}

function detectViolations(data: ValidationData): Violation[] {
  const violations: Violation[] = []

  // Funcionários sem PIS
  data.employees
    .filter(e => !e.pis)
    .forEach(e => violations.push({
      type: 'missing_pis',
      employeeId: e.id,
      message: `Funcionário ${e.name} não possui PIS cadastrado`
    }))

  // Registros incompletos
  // ...

  return violations
}
```

## Testes (TODO)

### Testes Unitários
```typescript
describe('ComplianceReportForm', () => {
  it('should render tabs correctly', () => {
    render(<ComplianceReportForm {...props} />)
    expect(screen.getByText('AFD')).toBeInTheDocument()
    expect(screen.getByText('AEJ')).toBeInTheDocument()
  })

  it('should disable generate button without date range', () => {
    render(<ComplianceReportForm {...props} />)
    const button = screen.getByText('Gerar Relatório')
    expect(button).toBeDisabled()
  })

  it('should call onGenerate when button is clicked', async () => {
    const onGenerate = vi.fn()
    render(<ComplianceReportForm onGenerate={onGenerate} {...props} />)
    // Selecionar data
    // Clicar botão
    await waitFor(() => expect(onGenerate).toHaveBeenCalled())
  })
})
```

### Testes E2E (Playwright)
```typescript
test('should generate AFD report', async ({ page }) => {
  await page.goto('/relatorios/compliance')

  // Selecionar período
  await page.click('[data-testid="date-range-picker"]')
  await page.click('button:has-text("01")')
  await page.click('button:has-text("31")')

  // Gerar relatório
  await page.click('button:has-text("Gerar Relatório")')

  // Verificar preview
  await expect(page.locator('text=45 funcionários')).toBeVisible()

  // Baixar
  const downloadPromise = page.waitForEvent('download')
  await page.click('button:has-text("Baixar AFD")')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('AFD_')
})
```

## Melhorias Futuras

### 1. Autenticação e Multi-tenancy
- [ ] Integrar com auth para pegar company_id automaticamente
- [ ] Permissões por role (apenas HR Manager pode gerar)
- [ ] Audit log de quem gerou cada relatório

### 2. Persistência Avançada
- [ ] Salvar relatórios no Supabase Storage
- [ ] Histórico completo com paginação
- [ ] Filtros: por tipo, período, status
- [ ] Busca por nome de arquivo

### 3. Agendamento
- [ ] Criar relatórios automaticamente (mensal)
- [ ] Notificação por email quando pronto
- [ ] Envio automático para contabilidade

### 4. Validações Avançadas
- [ ] Integrar com validador oficial do MTE
- [ ] Verificar CNPJ em base da Receita Federal
- [ ] Validar PIS em base do CNIS
- [ ] Alertas de jornadas excessivas (> 10h/dia)

### 5. Assinatura Digital
- [ ] Gerar hash SHA-256 do arquivo
- [ ] Assinar digitalmente (certificado A1/A3)
- [ ] Timestamp com carimbo de tempo

### 6. Dashboard Widget
- [ ] Widget no dashboard principal
- [ ] Status de conformidade em tempo real
- [ ] Alertas de vencimento de relatórios
- [ ] Ações rápidas

### 7. Comparação e Analytics
- [ ] Comparar relatórios de períodos diferentes
- [ ] Gráficos de evolução de horas extras
- [ ] Análise de tendências de faltas
- [ ] Exportar para Excel/PDF

### 8. Integrações Externas
- [ ] eSocial (envio automático)
- [ ] Sistemas de contabilidade (TOTVS, SAP, etc)
- [ ] API REST para terceiros
- [ ] Webhooks para notificações

## Troubleshooting

### Problema: "Funcionários sem PIS"
**Solução**: Ir em Funcionários → Editar → Cadastrar PIS

### Problema: "Registros incompletos"
**Solução**: Ir em Ponto → Aprovar registros pendentes

### Problema: Download não funciona
**Solução**: Verificar se navegador permite downloads automáticos

### Problema: Período muito grande (> 1 ano)
**Solução**: Dividir em períodos menores (mensais)

### Problema: Performance lenta
**Solução**:
- Adicionar índices no Supabase
- Implementar cache
- Processar em background (queue)

## Suporte e Contato

Para dúvidas sobre:
- **Legislação**: Consultar Portaria 671/2021 MTE
- **Técnico**: Ver código fonte e comentários
- **Bugs**: Abrir issue no repositório

## Changelog

### v1.0.0 (2026-01-29)
- ✅ Criação inicial da página
- ✅ Formulário de seleção AFD/AEJ
- ✅ Date range picker
- ✅ Preview de dados
- ✅ Validação de conformidade
- ✅ Histórico no localStorage
- ✅ Download de relatórios
- ✅ Integração com geradores AFD/AEJ

### Próximas versões
- [ ] v1.1.0: Persistência no Supabase
- [ ] v1.2.0: Agendamento automático
- [ ] v1.3.0: Assinatura digital
- [ ] v2.0.0: eSocial integration
