# Sistema de Templates de Relatórios Customizáveis

Sistema completo para criação, personalização, agendamento e geração de relatórios customizáveis.

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Agendamento](#agendamento)
- [Personalização](#personalização)

## Visão Geral

O sistema de templates de relatórios permite que usuários criem relatórios personalizados sem necessidade de programação. Com uma interface intuitiva de drag & drop, filtros avançados e agendamento automático.

### Principais Características

- **Interface Visual**: Criação de relatórios através de wizard com 4 etapas
- **Drag & Drop**: Organização visual de colunas
- **Filtros Avançados**: Sistema flexível de filtros com múltiplos operadores
- **Múltiplos Formatos**: Exportação em CSV, Excel e PDF
- **Agendamento**: Geração automática em intervalos configuráveis
- **Compartilhamento**: Templates podem ser compartilhados entre usuários
- **Histórico**: Rastreamento completo de relatórios gerados

## Funcionalidades

### 1. Criação de Templates

Templates são criados através de um wizard de 4 etapas:

#### Etapa 1: Configuração Básica
- Nome do template
- Descrição (opcional)
- Tipo de relatório (funcionários, ponto, ausências, etc)
- Formato de saída (CSV, Excel, PDF)

#### Etapa 2: Seleção de Colunas
- Lista de campos disponíveis baseada no tipo
- Drag & drop para reordenar
- Toggle de visibilidade
- Preview em tempo real

#### Etapa 3: Filtros Avançados
- Múltiplos filtros com operadores lógicos (AND/OR)
- Operadores disponíveis:
  - `equals`, `not_equals`
  - `contains`, `not_contains`
  - `starts_with`, `ends_with`
  - `in`, `not_in`
  - `greater_than`, `less_than`
  - `between`
  - `is_null`, `is_not_null`

#### Etapa 4: Preview e Salvamento
- Resumo da configuração
- Contagem de campos e filtros
- Salvamento do template

### 2. Gestão de Templates

- **Listagem**: Visualização em cards com categorias
  - Todos
  - Favoritos
  - Meus templates
  - Compartilhados comigo
  - Agendados

- **Ações**:
  - Gerar relatório manualmente
  - Editar template
  - Duplicar template
  - Compartilhar com outros usuários
  - Favoritar/Desfavoritar
  - Agendar geração automática
  - Excluir template

### 3. Geração de Relatórios

#### Manual
```typescript
// Via interface
- Clicar em "Gerar" no card do template
- Download automático do arquivo

// Via API
POST /api/reports/generate
{
  "templateId": "uuid",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "format": "xlsx" // Opcional, usa o formato do template se não especificado
}
```

#### Automática (Agendada)
- Configuração de frequência (diário, semanal, mensal, custom)
- Horário de execução
- Período dos dados
- Lista de destinatários por email
- Armazenamento automático no storage
- Envio por email (TODO: implementar serviço de email)

### 4. Formatos de Exportação

#### CSV
- Formato universal
- Compatível com Excel e outras planilhas
- Leve e rápido
- Encoding UTF-8

#### Excel (XLSX)
- Formatação preservada
- Ajuste automático de largura de colunas
- Headers destacados
- Compatível com Microsoft Excel e LibreOffice

#### PDF
- Formatação profissional
- Headers e footers automáticos
- Numeração de páginas
- Orientação configurável (retrato/paisagem)
- Tamanho de página configurável (A4/Letter)
- Tabelas com cores alternadas

## Arquitetura

### Database Schema

```sql
-- Templates de Relatórios
report_templates (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- employees, time_records, etc
  config JSONB NOT NULL, -- {columns, filters, sort}
  format VARCHAR(10) DEFAULT 'csv',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Agendamentos
report_schedules (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES report_templates(id),
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, custom
  cron_expression VARCHAR(100),
  time TIME,
  day_of_week INT,
  day_of_month INT,
  date_period VARCHAR(50),
  recipients TEXT[],
  next_run TIMESTAMP,
  last_run TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
)

-- Histórico
report_history (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES report_templates(id),
  schedule_id UUID REFERENCES report_schedules(id),
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP,
  format VARCHAR(10),
  file_url VARCHAR(500),
  file_size INT,
  record_count INT,
  date_range_start DATE,
  date_range_end DATE,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  processing_time_ms INT
)

-- Favoritos
report_favorites (
  user_id UUID REFERENCES auth.users(id),
  template_id UUID REFERENCES report_templates(id),
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, template_id)
)

-- Compartilhamento
report_template_shares (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES report_templates(id),
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id),
  permission VARCHAR(10) DEFAULT 'view', -- view, edit, execute
  created_at TIMESTAMP
)

-- Categorias
report_categories (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP
)
```

### Componentes

```
src/
├── lib/
│   └── reports/
│       ├── template-engine.ts      # Motor de geração de relatórios
│       ├── exporter.ts             # Exportação para diferentes formatos
│       └── scheduler.ts            # Processamento de agendamentos
│
├── components/
│   └── reports/
│       ├── FilterBuilder.tsx       # Construtor de filtros
│       ├── FieldSelector.tsx       # Seletor de campos com drag & drop
│       └── ScheduleConfig.tsx      # Configuração de agendamento
│
├── app/
│   ├── api/
│   │   ├── reports/
│   │   │   └── generate/
│   │   │       └── route.ts        # API de geração manual
│   │   └── cron/
│   │       └── reports/
│   │           └── route.ts        # Cron job para agendamentos
│   │
│   └── (dashboard)/
│       └── relatorios/
│           └── templates/
│               ├── page.tsx                    # Listagem
│               ├── TemplatesList.tsx           # Lista de templates
│               ├── TemplateCard.tsx            # Card individual
│               └── novo/
│                   ├── page.tsx                # Wizard de criação
│                   ├── BasicConfigStep.tsx     # Step 1
│                   ├── ColumnsStep.tsx         # Step 2
│                   ├── FiltersStep.tsx         # Step 3
│                   └── PreviewStep.tsx         # Step 4
│
└── types/
    └── reports.ts                  # Tipos TypeScript
```

## Configuração

### 1. Migrations

Execute a migration no Supabase:

```bash
# Via Supabase CLI
supabase db push

# Ou aplique manualmente
psql -h <host> -U <user> -d <database> -f supabase/migrations/020_report_templates.sql
```

### 2. Storage Bucket

O sistema cria automaticamente um bucket 'reports' no Supabase Storage, mas você pode criar manualmente:

```sql
-- No SQL Editor do Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false);
```

### 3. Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Cron Secret (opcional mas recomendado)
CRON_SECRET=your_secret_key_here

# Email Service (para envio de relatórios agendados - TODO)
# SENDGRID_API_KEY=your_sendgrid_key
# EMAIL_FROM=noreply@yourcompany.com
```

### 4. Cron Configuration

#### Opção A: Vercel Cron

Crie `vercel.json` na raiz:

```json
{
  "crons": [
    {
      "path": "/api/cron/reports",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Opção B: GitHub Actions

Crie `.github/workflows/report-cron.yml`:

```yaml
name: Report Cron
on:
  schedule:
    - cron: '* * * * *' # A cada minuto
  workflow_dispatch:

jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron
        run: |
          curl -X POST https://your-domain.com/api/cron/reports \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Opção C: Serviço Externo

Use serviços como:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- AWS EventBridge
- Google Cloud Scheduler

Configure para chamar:
```
POST https://your-domain.com/api/cron/reports
Header: Authorization: Bearer YOUR_CRON_SECRET
```

## Uso

### Criar um Template

1. Acesse **Relatórios > Templates**
2. Clique em **Novo Template**
3. Siga o wizard de 4 etapas
4. Clique em **Salvar Template**

### Gerar Relatório Manualmente

1. Na listagem de templates, clique em **Gerar** no card desejado
2. O relatório será baixado automaticamente

### Agendar Relatório

1. No card do template, clique no ícone de calendário OU em **Editar > Agendar**
2. Configure:
   - Frequência (diário, semanal, mensal, custom)
   - Horário de execução
   - Período dos dados
   - Destinatários (emails)
3. Clique em **Salvar Agendamento**

### Compartilhar Template

1. No menu (⋮) do template, clique em **Compartilhar**
2. Adicione o email do usuário
3. Escolha a permissão:
   - **Visualizar**: Pode ver o template
   - **Executar**: Pode gerar relatórios
   - **Editar**: Pode modificar o template

## API Reference

### POST /api/reports/generate

Gera um relatório manualmente.

**Request:**
```json
{
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "format": "xlsx"
}
```

**Response:**
- `200`: Arquivo binário (download)
- `401`: Não autorizado
- `404`: Template não encontrado
- `500`: Erro ao gerar

### GET /api/cron/reports

Processa todos os relatórios agendados que estão na hora de execução.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-29T10:00:00Z",
  "results": {
    "processed": 5,
    "succeeded": 4,
    "failed": 1,
    "errors": [
      {
        "scheduleId": "uuid",
        "error": "Error message"
      }
    ]
  }
}
```

## Agendamento

### Frequencies

#### Daily (Diário)
- Executa todos os dias no horário especificado
- Campos: `time`

#### Weekly (Semanal)
- Executa uma vez por semana no dia especificado
- Campos: `day_of_week` (1-7, Segunda-Domingo), `time`

#### Monthly (Mensal)
- Executa uma vez por mês no dia especificado
- Campos: `day_of_month` (1-31), `time`
- Para meses com menos dias, executa no último dia

#### Custom (Personalizado)
- Usa expressão cron para controle total
- Campo: `cron_expression`
- Exemplo: `0 9 * * 1-5` (Segunda a Sexta às 9h)
- Referência: [crontab.guru](https://crontab.guru)

### Date Periods

Define qual período de dados será incluído:

- `today`: Hoje
- `yesterday`: Ontem
- `last_week`: Última semana (Segunda a Domingo)
- `current_week`: Semana atual
- `last_month`: Último mês completo
- `current_month`: Mês atual até hoje
- `last_quarter`: Último trimestre
- `current_quarter`: Trimestre atual
- `last_year`: Último ano
- `current_year`: Ano atual

### Email Notifications

Os relatórios agendados são enviados automaticamente para os emails configurados.

**TODO**: Implementar integração com serviço de email (SendGrid, AWS SES, etc)

```typescript
// Exemplo de configuração SendGrid (a implementar)
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: recipients,
  from: 'noreply@yourcompany.com',
  subject: `Relatório: ${templateName}`,
  html: `<p>Seu relatório está pronto. <a href="${fileUrl}">Clique aqui para baixar</a></p>`,
});
```

## Personalização

### Adicionar Novo Tipo de Relatório

1. Adicione o tipo em `src/types/reports.ts`:

```typescript
export type ReportType =
  | 'employees'
  | 'time_records'
  // ... tipos existentes
  | 'my_new_type'; // Novo tipo

// Adicione os campos disponíveis
export const REPORT_TYPE_FIELDS: Record<ReportType, FieldDefinition[]> = {
  // ... tipos existentes
  my_new_type: [
    { field: 'id', label: 'ID', type: 'string', filterable: true, sortable: true, groupable: false },
    { field: 'name', label: 'Nome', type: 'string', filterable: true, sortable: true, groupable: true },
    // ... outros campos
  ],
};

// Adicione a configuração padrão
export const DEFAULT_CONFIGS: Record<ReportType, Partial<ReportConfig>> = {
  // ... configurações existentes
  my_new_type: {
    columns: REPORT_TYPE_FIELDS.my_new_type.slice(0, 5).map(field => ({
      id: field.field,
      field: field.field,
      label: field.label,
      type: field.type as any,
      visible: true,
    })),
    filters: [],
  },
};
```

2. Adicione o case no template engine (`src/lib/reports/template-engine.ts`):

```typescript
private async fetchDataByType(type: ReportType, companyId: string, dateRange?: { start: Date; end: Date }) {
  // ... casos existentes

  case 'my_new_type':
    query = this.supabase
      .from('my_table')
      .select('*')
      .eq('company_id', companyId);

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }
    break;
}
```

3. Adicione o label em `BasicConfigStep.tsx`:

```typescript
const REPORT_TYPES = [
  // ... tipos existentes
  {
    value: 'my_new_type',
    label: 'Meu Novo Tipo',
    description: 'Descrição do novo tipo de relatório',
  },
];
```

### Customizar Exportação

Para customizar a exportação de um formato específico, edite `src/lib/reports/exporter.ts`:

```typescript
// Exemplo: Adicionar logo no PDF
private exportToPDF(result: ReportResult, config: ExportConfig): Buffer {
  const doc = new jsPDF({
    orientation: config.pageOrientation || 'landscape',
    unit: 'mm',
    format: config.pageSize || 'a4',
  });

  // Adicionar logo
  if (config.logo) {
    doc.addImage(config.logo, 'PNG', 14, 10, 30, 10);
  }

  // ... resto do código
}
```

## Troubleshooting

### Relatórios não estão sendo gerados no agendamento

1. Verifique se o cron está sendo executado:
   - Veja os logs da sua plataforma (Vercel, Railway, etc)
   - Teste manualmente: `curl -X POST https://your-domain.com/api/cron/reports`

2. Verifique os schedules na database:
   ```sql
   SELECT * FROM report_schedules WHERE active = TRUE;
   ```

3. Verifique o histórico de erros:
   ```sql
   SELECT * FROM report_history WHERE status = 'error' ORDER BY generated_at DESC LIMIT 10;
   ```

### Upload de arquivo falha

1. Verifique se o bucket 'reports' existe no Supabase Storage
2. Verifique as permissões RLS do bucket
3. Verifique o tamanho do arquivo (limite padrão: 50MB)

### Filtros não funcionam corretamente

1. Verifique se o campo existe nos dados retornados
2. Verifique o tipo do campo (string, number, date)
3. Use o console do browser para debug: os dados são logados antes dos filtros

## Performance

### Otimizações Implementadas

- Índices no database para queries rápidas
- Limit de registros configurável
- Streaming de arquivos grandes (TODO)
- Cache de templates (TODO)
- Processamento em background para relatórios grandes (TODO)

### Limites Recomendados

- **Registros por relatório**: até 100.000
- **Agendamentos ativos**: até 1.000 por empresa
- **Tamanho de arquivo**: até 50MB
- **Colunas por template**: até 50

Para relatórios maiores, considere:
- Adicionar paginação
- Implementar processamento assíncrono com fila (Bull, BullMQ)
- Comprimir arquivos grandes

## Roadmap

### Features Futuras

- [ ] Gráficos e visualizações no PDF
- [ ] Templates pré-configurados por indústria
- [ ] Exportação para Google Sheets
- [ ] Relatórios com múltiplas tabelas (joins)
- [ ] Agrupamento e agregações (SUM, AVG, COUNT)
- [ ] Fórmulas customizadas
- [ ] API pública para integração
- [ ] Webhooks para relatórios gerados
- [ ] Versionamento de templates
- [ ] Comparação entre períodos

## Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os logs no console do browser
3. Consulte os logs do servidor
4. Abra uma issue no repositório

## Licença

Proprietário - Todos os direitos reservados
