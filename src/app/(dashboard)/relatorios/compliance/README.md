# Página de Relatórios de Compliance

Página completa para geração de relatórios AFD e AEJ conforme legislação brasileira (Portaria 671/2021 MTE).

## Estrutura

### Página Principal
- **Arquivo**: `page.tsx`
- **Rota**: `/relatorios/compliance`
- **Descrição**: Interface completa para gerar e baixar relatórios de compliance

### Componentes

#### 1. ComplianceReportForm
- **Arquivo**: `@/components/relatorios/compliance/ComplianceReportForm.tsx`
- **Funcionalidades**:
  - Tabs para selecionar tipo de relatório (AFD ou AEJ)
  - Date range picker para selecionar período
  - Preview dos dados antes de gerar
  - Botões para gerar e baixar relatórios
  - Loading states durante processamento

#### 2. ComplianceHistory
- **Arquivo**: `@/components/relatorios/compliance/ComplianceHistory.tsx`
- **Funcionalidades**:
  - Lista dos últimos 10 relatórios gerados
  - Exibe tipo, período, data de geração e status
  - Permite baixar relatórios anteriores
  - Armazenamento no localStorage

#### 3. ComplianceValidation
- **Arquivo**: `@/components/relatorios/compliance/ComplianceValidation.tsx`
- **Funcionalidades**:
  - Checklist de conformidade
  - Validação de PIS cadastrados
  - Validação de registros completos
  - Lista de violações encontradas
  - Alertas visuais por tipo (erro, aviso, info)

## Funcionalidades Implementadas

### Geração de Relatórios

#### AFD (Arquivo Fonte de Dados)
- Gera arquivo texto (.txt) com 99 posições fixas por linha
- Inclui:
  - Cabeçalho com dados do empregador
  - Identificação do REP
  - Marcações de ponto de todos os funcionários
  - Ajustes e inclusões (se houver)
  - Trailer com totalizadores

#### AEJ (Arquivo Eletrônico de Jornada)
- Gera arquivo texto (.txt) ou CSV
- Inclui:
  - Consolidação de jornadas por funcionário
  - Horas trabalhadas, extras 50% e 100%
  - Horas noturnas e banco de horas
  - Faltas e descontos
  - Valores monetários calculados

### Validações

1. **Funcionários com PIS**: Verifica se todos os funcionários ativos possuem PIS cadastrado
2. **Registros completos**: Verifica se há registros de ponto com entrada/saída
3. **Violações**: Detecta inconsistências nos dados

### Download

- Download direto em formato texto
- Nome do arquivo automático com CNPJ e período
- Suporte para re-download de relatórios do histórico

## Integrações

### Geradores de Relatório
```typescript
import { generateAFD, type AFDData } from '@/lib/compliance/afd-generator'
import { generateAEJ, type AEJData } from '@/lib/compliance/aej-generator'
```

### Componentes UI (shadcn/ui)
- `Button` - Botões de ação
- `Card` - Containers de conteúdo
- `Tabs` - Seleção entre AFD/AEJ
- `DateRangePicker` - Seleção de período
- `Table` - Lista de histórico
- `Badge` - Status e labels
- `Alert` - Avisos e validações

### Biblioteca de Toast
```typescript
import { toast } from 'sonner'
```

## Fluxo de Uso

1. Usuário acessa `/relatorios/compliance`
2. Seleciona o tipo de relatório (AFD ou AEJ)
3. Escolhe o período desejado
4. Clica em "Visualizar Dados" para ver preview
5. Sistema exibe:
   - Quantidade de funcionários e registros
   - Validações de conformidade
   - Problemas encontrados (se houver)
6. Clica em "Gerar Relatório"
7. Clica em "Baixar" para fazer download do arquivo
8. Relatório é salvo no histórico para futuras consultas

## Persistência

### LocalStorage
O histórico de relatórios é salvo no localStorage do navegador:
- Chave: `compliance-history`
- Formato: Array de objetos `ComplianceHistoryItem`
- Limite: Últimos 10 relatórios

### Migração para Supabase (TODO)
Para produção, implementar:
```typescript
// Salvar histórico no Supabase
const { data, error } = await supabase
  .from('compliance_reports')
  .insert({
    company_id,
    type,
    start_date,
    end_date,
    filename,
    file_url, // S3 ou Storage
    status,
    metadata: {
      total_employees,
      total_records,
    }
  })
```

## Melhorias Futuras

1. **Autenticação**: Integrar com sistema de auth para pegar company_id do usuário logado
2. **Persistência**: Mover histórico do localStorage para Supabase
3. **Storage**: Salvar arquivos gerados no Supabase Storage ou S3
4. **Assinatura Digital**: Adicionar hash SHA-256 e assinatura digital nos arquivos
5. **Agendamento**: Permitir gerar relatórios automaticamente (mensal)
6. **Notificações**: Enviar email quando relatório estiver pronto
7. **Validações Avançadas**: Integrar com validadores oficiais do MTE
8. **Histórico Completo**: Paginação e filtros no histórico
9. **Comparação**: Comparar relatórios de períodos diferentes
10. **Dashboard**: Widget no dashboard principal com alertas de compliance

## Conformidade Legal

Esta implementação segue:
- **Portaria 671/2021** do Ministério do Trabalho e Emprego (MTE)
- **CLT** - Consolidação das Leis do Trabalho
- **Artigo 74 da CLT** - Registro de ponto eletrônico

## Testes

Para testar localmente:
```bash
# Acesse a página
http://localhost:3000/relatorios/compliance

# Selecione um período
# Gere um relatório
# Verifique o arquivo baixado
```

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação da Portaria 671/2021
- `/lib/compliance/README.md`
- Código dos geradores AFD e AEJ
