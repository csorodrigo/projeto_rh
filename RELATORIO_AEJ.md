# Relatório AEJ - Arquivo Eletrônico de Jornada (e-Social)

## Visão Geral

O **Arquivo Eletrônico de Jornada (AEJ)** é um relatório em formato XML que consolida as informações de jornada de trabalho dos funcionários conforme exigido pelo **e-Social** (Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas).

Este documento descreve a implementação do gerador de AEJ em XML para o sistema RH-RICKGAY.

---

## Arquivos Implementados

### 1. `src/lib/compliance/aej-xml-generator.ts`

**Gerador principal do arquivo AEJ em formato XML**

#### Classes e Funções Principais

##### `AEJXMLGenerator`

Classe responsável pela geração do arquivo XML conforme layout e-Social.

```typescript
const generator = new AEJXMLGenerator({
  environment: '2', // '1' = Produção, '2' = Homologação
  processVersion: '1.0.0',
  includeOvertimeDetails: true,
  includeMonetaryValues: true,
})

const result = generator.generate(data)
```

##### Método `generate(data: AEJXMLData): AEJXMLResult`

Gera o arquivo XML completo com:
- Identificação do evento (S-1200)
- Identificação do empregador (CNPJ)
- Informações de remuneração dos trabalhadores
- Jornadas de trabalho contratuais
- Itens de remuneração (salário, horas extras, adicionais, descontos)

#### Estrutura do XML Gerado

```xml
<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00">
  <evtRemun Id="ID...">
    <ideEvento>
      <indRetif>1</indRetif>
      <nrRecibo></nrRecibo>
      <indApuracao>1</indApuracao>
      <perApur>2024-01</perApur>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>1.0.0</verProc>
    </ideEvento>

    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>12345678901234</nrInsc>
    </ideEmpregador>

    <ideTrabalhador>
      <cpfTrab>12345678901</cpfTrab>

      <infoComplem>
        <nmTrab>Nome do Funcionário</nmTrab>
        <dtNascto>1990-01-01</dtNascto>
      </infoComplem>

      <remunPerApur>
        <matricula>001</matricula>
        <codCateg>101</codCateg>

        <!-- Itens de remuneração -->
        <itensRemun>
          <codRubr>1000</codRubr>
          <ideTabRubr>01</ideTabRubr>
          <qtdRubr>1.00</qtdRubr>
          <fatorRubr>1.00</fatorRubr>
          <vrRubr>5000.00</vrRubr>
        </itensRemun>

        <!-- Informações de jornada -->
        <infoHorContratual>
          <ideHorContratual>
            <codHorContrat>001</codHorContrat>
          </ideHorContratual>

          <dadosHorContratual>
            <hrEntr>08:00</hrEntr>
            <hrSaida>17:00</hrSaida>
            <durJornada>480</durJornada>
            <perHorFlexivel>N</perHorFlexivel>
          </dadosHorContratual>
        </infoHorContratual>

      </remunPerApur>
    </ideTrabalhador>
  </evtRemun>
</eSocial>
```

---

### 2. `src/lib/supabase/queries/compliance.ts`

**Queries para buscar dados do Supabase**

#### Funções Adicionadas

##### `getTimeRecordsForAEJ(companyId, startDate, endDate)`

Busca todos os dados necessários para gerar o AEJ:
- Dados da empresa
- Funcionários ativos
- Registros diários de ponto consolidados
- Escalas de trabalho
- Feriados do período

```typescript
const data = await getTimeRecordsForAEJ(
  'company-uuid',
  '2024-01-01',
  '2024-01-31'
)

// Retorna:
// {
//   company: Company,
//   employees: Employee[],
//   dailyRecords: TimeTrackingDaily[],
//   workSchedules: WorkSchedule[],
//   holidays: Date[]
// }
```

##### `validateCompanyForAEJ(companyId)`

Valida se a empresa está pronta para gerar AEJ:
- CNPJ cadastrado e válido
- Funcionários ativos cadastrados
- CPF dos funcionários cadastrados

```typescript
const validation = await validateCompanyForAEJ('company-uuid')

// Retorna:
// {
//   valid: boolean,
//   errors: string[]
// }
```

##### `getCompanyHolidays(companyId, startDate, endDate)`

Busca feriados da empresa no período:

```typescript
const holidays = await getCompanyHolidays(
  'company-uuid',
  '2024-01-01',
  '2024-12-31'
)

// Retorna: Date[]
```

---

## Tipos de Dados

### `AEJXMLConfig`

Configuração para geração do XML:

```typescript
interface AEJXMLConfig {
  /** Ambiente do e-Social */
  environment: '1' | '2' // 1=Produção, 2=Homologação

  /** Versão do processo/sistema */
  processVersion: string

  /** Incluir detalhamento de horas extras */
  includeOvertimeDetails?: boolean

  /** Incluir valores monetários */
  includeMonetaryValues?: boolean
}
```

### `AEJXMLData`

Dados de entrada para o gerador:

```typescript
interface AEJXMLData {
  company: Company
  employees: Employee[]
  dailyRecords: TimeTrackingDaily[]
  workSchedules: WorkSchedule[]
  holidays: Date[]
  startDate: Date
  endDate: Date
  referenceMonth: string // Formato: YYYY-MM
}
```

### `AEJXMLResult`

Resultado da geração:

```typescript
interface AEJXMLResult {
  xml: string
  filename: string
  eventId: string
  totalEmployees: number
  period: string
  receiptNumber: string
}
```

---

## Códigos de Rubricas (e-Social)

O sistema utiliza os seguintes códigos de rubricas:

| Código | Descrição | Fator |
|--------|-----------|-------|
| 1000 | Salário Base | 1.00 |
| 2001 | Horas Extras 50% | 1.50 |
| 2002 | Horas Extras 100% | 2.00 |
| 3001 | Adicional Noturno | 1.20 |
| 9001 | Desconto por Falta | 1.00 |

---

## Eventos do e-Social

### S-1200 - Remuneração de trabalhador vinculado ao RGPS

Este é o evento principal utilizado pelo gerador AEJ. Ele contém:

- **Identificação do evento**: período de apuração, tipo de ambiente, etc.
- **Identificação do empregador**: CNPJ
- **Identificação do trabalhador**: CPF, matrícula, categoria
- **Remuneração do período**: itens de remuneração
- **Jornada contratual**: horários, duração, flexibilidade

### Categorias de Trabalhadores

O sistema usa categoria `101` = Empregado CLT.

---

## Uso Prático

### Exemplo Completo

```typescript
import {
  AEJXMLGenerator,
  type AEJXMLData,
  type AEJXMLConfig,
} from '@/lib/compliance'

import {
  getTimeRecordsForAEJ,
  validateCompanyForAEJ,
} from '@/lib/supabase/queries/compliance'

async function gerarAEJ(companyId: string, mes: string) {
  // 1. Validar empresa
  const validation = await validateCompanyForAEJ(companyId)

  if (!validation.valid) {
    console.error('Empresa não está pronta:', validation.errors)
    return
  }

  // 2. Definir período
  const referenceMonth = mes // Ex: '2024-01'
  const [year, month] = mes.split('-')
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
  const endDate = new Date(parseInt(year), parseInt(month), 0)

  // 3. Buscar dados
  const data = await getTimeRecordsForAEJ(
    companyId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )

  if (!data.company) {
    console.error('Empresa não encontrada')
    return
  }

  // 4. Configurar gerador
  const config: AEJXMLConfig = {
    environment: '2', // Homologação
    processVersion: '1.0.0',
    includeOvertimeDetails: true,
    includeMonetaryValues: true,
  }

  // 5. Gerar XML
  const generator = new AEJXMLGenerator(config)

  const aejData: AEJXMLData = {
    company: data.company,
    employees: data.employees,
    dailyRecords: data.dailyRecords,
    workSchedules: data.workSchedules,
    holidays: data.holidays,
    startDate,
    endDate,
    referenceMonth,
  }

  const result = generator.generate(aejData)

  // 6. Validar XML
  const validation = generator.validateXML(result.xml)

  if (!validation.valid) {
    console.error('XML inválido:', validation.errors)
    return
  }

  // 7. Salvar ou baixar
  console.log('AEJ gerado com sucesso!')
  console.log('Arquivo:', result.filename)
  console.log('Funcionários:', result.totalEmployees)
  console.log('Período:', result.period)

  // Baixar arquivo
  const blob = new Blob([result.xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  a.click()
  URL.revokeObjectURL(url)
}

// Usar:
gerarAEJ('company-uuid', '2024-01')
```

---

## Validações Implementadas

O gerador realiza as seguintes validações:

### 1. Validação de Estrutura XML

- XML declaration presente
- Root element `<eSocial>` presente
- Evento `<evtRemun>` presente
- Balanceamento de tags

### 2. Validação de Dados

- CNPJ da empresa válido (14 dígitos)
- CPF dos funcionários válidos
- Datas no formato correto (YYYY-MM-DD)
- Horários no formato correto (HH:MM)
- Valores numéricos com 2 casas decimais

### 3. Validação de Negócio

- Funcionários ativos
- Registros de ponto no período
- Horas trabalhadas dentro do limite legal
- Horas extras calculadas corretamente

---

## Conformidade com e-Social

### Layout e-Social S-1.2

O gerador segue o layout oficial do e-Social versão S-1.2 (Simplificado).

**Referências:**
- Manual de Orientação do eSocial
- Leiaute do eSocial - versão S-1.2
- Evento S-1200 - Remuneração de trabalhador vinculado ao RGPS

### Namespace XML

```xml
xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_02_00"
```

### Versão do Schema

O sistema utiliza a versão `v_S_01_02_00` do schema do e-Social.

---

## Cálculos Realizados

O gerador utiliza a biblioteca `clt-calculations.ts` para calcular:

1. **Horas Trabalhadas**: Total de minutos trabalhados no mês
2. **Horas Extras 50%**: Horas extras em dias úteis
3. **Horas Extras 100%**: Horas extras em domingos e feriados
4. **Adicional Noturno**: Horas trabalhadas entre 22h e 5h com adicional de 20%
5. **Faltas**: Dias de ausência não justificada
6. **Valores Monetários**: Cálculo dos valores de cada rubrica

### Fórmulas Utilizadas

```typescript
// Valor hora normal
const valorHora = salario / 220 // 220 horas mensais

// Horas extras 50%
const valorHE50 = valorHora * 1.5 * horasExtras50

// Horas extras 100%
const valorHE100 = valorHora * 2.0 * horasExtras100

// Adicional noturno
const valorNoturno = valorHora * 0.2 * horasNoturnas

// Desconto falta
const descontoFalta = (salario / 30) * diasFalta
```

---

## Integração com Sistema

### Como Integrar no Frontend

1. **Criar página de geração de AEJ**:
   - Seletor de mês/ano
   - Botão "Gerar AEJ"
   - Preview dos dados antes de gerar
   - Download do XML gerado

2. **Exemplo de componente**:

```typescript
// app/compliance/aej/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateAEJXML } from '@/lib/compliance'

export default function AEJPage() {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      // Buscar dados e gerar AEJ
      // ... implementação
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Gerar AEJ - e-Social</h1>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Gerando...' : 'Gerar AEJ'}
      </Button>
    </div>
  )
}
```

---

## Limitações Conhecidas

1. **Schema XSD**: O sistema não valida contra o XSD oficial do e-Social (seria necessário adicionar biblioteca XML)

2. **Eventos Complementares**: Atualmente implementa apenas S-1200 (Remuneração). Outros eventos como S-1210 (Pagamentos) não estão implementados.

3. **Múltiplos Vínculos**: Não trata funcionários com múltiplos vínculos na mesma empresa.

4. **Afastamentos**: Não considera afastamentos legais (licenças, férias) na geração do XML.

---

## Melhorias Futuras

1. **Validação XSD**: Adicionar validação contra schema oficial
2. **Mais Eventos**: Implementar S-1210, S-1299, etc.
3. **Assinatura Digital**: Adicionar assinatura digital ao XML
4. **Lote de Eventos**: Gerar múltiplos eventos em um único arquivo
5. **Histórico**: Salvar arquivos gerados no banco de dados
6. **Retificação**: Suportar retificação de eventos já enviados

---

## Suporte e Manutenção

### Logs

O sistema registra logs de erros no console:
- Erros ao buscar dados do Supabase
- Erros de validação
- Avisos sobre dados incompletos

### Debugging

Para debug, ative logs detalhados:

```typescript
const generator = new AEJXMLGenerator(config)
const result = generator.generate(data)

// Log do XML gerado
console.log(result.xml)

// Validar
const validation = generator.validateXML(result.xml)
console.log('Validação:', validation)
```

---

## Contato

Para dúvidas ou sugestões sobre o gerador AEJ, entre em contato com a equipe de desenvolvimento.

**Desenvolvido por**: RH-RICKGAY Team
**Data**: 2024
**Versão**: 1.0.0

---

## Apêndice: Estrutura do Banco de Dados

### Tabelas Utilizadas

1. **companies**: Dados da empresa (CNPJ, razão social)
2. **employees**: Dados dos funcionários (CPF, nome, matrícula, salário)
3. **time_tracking_daily**: Registros diários consolidados
4. **work_schedules**: Escalas de trabalho
5. **holidays**: Feriados da empresa

### Campos Importantes

```sql
-- companies
id, name, cnpj, address

-- employees
id, company_id, name, cpf, pis, employee_number,
position, salary, weekly_hours, birth_date, hire_date, status

-- time_tracking_daily
id, company_id, employee_id, date,
clock_in, clock_out, break_start, break_end,
total_worked_minutes, overtime_50_minutes, overtime_100_minutes

-- work_schedules
id, company_id, employee_id, is_default, is_active

-- holidays
id, company_id, date, name, is_national
```

---

## Referências Técnicas

- [Manual de Orientação do eSocial](https://www.gov.br/esocial/pt-br)
- [Leiaute do eSocial versão S-1.2](https://www.gov.br/esocial/pt-br/documentacao-tecnica)
- [Portaria 671/2021 MTE](http://www.normaslegais.com.br/legislacao/portaria-mte-671-2021.htm)
- [CLT - Consolidação das Leis do Trabalho](http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)
