# Relatório AFD - Arquivo Fonte de Dados

## Documentação Completa da Implementação

O **AFD (Arquivo Fonte de Dados)** é um arquivo exigido pelo Ministério do Trabalho e Emprego (MTE) conforme a **Portaria 671/2021** para fiscalização e auditoria de registros de ponto eletrônico.

---

## 📋 O que é o AFD?

O AFD é um arquivo de texto (TXT) que contém:
- Dados do empregador (CNPJ, razão social, endereço)
- Identificação do REP (Registrador Eletrônico de Ponto)
- Todas as marcações de ponto dos funcionários
- Eventuais ajustes e inclusões manuais
- Trailer com total de registros

### Legislação Base
- **Portaria MTE 671/2021** - Regulamenta os registradores eletrônicos de ponto
- **Portaria MTE 1510/2009** - Versão anterior (ainda referenciada)
- **CLT Art. 74** - Obrigatoriedade do controle de jornada

---

## 🏗️ Estrutura do Arquivo AFD

O arquivo AFD possui **99 caracteres por linha** (posições fixas) e é dividido em tipos de registro:

### Tipo 1 - Cabeçalho (Header)
Dados do empregador e período do arquivo.

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (1) | N | 1 |
| 2-10 | 9 | NSR (Número Sequencial) | N | 000000001 |
| 11 | 1 | Tipo identificador (1=CNPJ) | N | 1 |
| 12-25 | 14 | CNPJ do empregador | N | 12345678000190 |
| 26-37 | 12 | CEI (se houver) | N | (vazio) |
| 38-187 | 150 | Razão social | A | EMPRESA EXEMPLO LTDA |
| 188-204 | 17 | Número de fabricação REP | A | 12345678901234567 |
| 205-212 | 8 | Data início (DDMMAAAA) | N | 01012024 |
| 213-220 | 8 | Data fim (DDMMAAAA) | N | 31012024 |
| 221-234 | 14 | Data/hora geração | N | 31012024235959 |

### Tipo 2 - Identificação do REP
Dados do equipamento ou software de ponto.

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (2) | N | 2 |
| 2-10 | 9 | NSR | N | 000000002 |
| 11-27 | 17 | Número de fabricação REP | A | 12345678901234567 |
| 28 | 1 | Tipo REP (3=REP-P) | N | 3 |
| 29-178 | 150 | Marca/Modelo | A | RH-RICKGAY WEB |
| 179-203 | 25 | Versão firmware | A | 1.0.0 |

**Tipos de REP:**
- 1 = REP-C (Cartográfico)
- 2 = REP-A (Alternativo)
- 3 = REP-P (Programa - Software)

### Tipo 3 - Marcação de Ponto
Cada registro de entrada/saída do funcionário.

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (3) | N | 3 |
| 2-10 | 9 | NSR | N | 000000003 |
| 11-22 | 12 | PIS do empregado | N | 12345678901 |
| 23-30 | 8 | Data marcação (DDMMAAAA) | N | 15012024 |
| 31-34 | 4 | Hora marcação (HHMM) | N | 0830 |

### Tipo 4 - Ajuste de Marcação
Registros de correção/ajuste de marcações.

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (4) | N | 4 |
| 2-10 | 9 | NSR | N | 000000004 |
| 11-18 | 8 | Data original (DDMMAAAA) | N | 15012024 |
| 19-22 | 4 | Hora original (HHMM) | N | 0830 |
| 23-30 | 8 | Data ajustada (DDMMAAAA) | N | 15012024 |
| 31-34 | 4 | Hora ajustada (HHMM) | N | 0800 |
| 35-46 | 12 | PIS | N | 12345678901 |

### Tipo 5 - Inclusão de Marcação
Marcações incluídas manualmente (não capturadas pelo REP).

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (5) | N | 5 |
| 2-10 | 9 | NSR | N | 000000005 |
| 11-18 | 8 | Data inclusão (DDMMAAAA) | N | 15012024 |
| 19-22 | 4 | Hora inclusão (HHMM) | N | 0800 |
| 23-34 | 12 | PIS | N | 12345678901 |

### Tipo 9 - Trailer (Rodapé)
Registro final com total de linhas.

| Posição | Tamanho | Descrição | Formato | Exemplo |
|---------|---------|-----------|---------|---------|
| 1 | 1 | Tipo de registro (9) | N | 9 |
| 2-10 | 9 | Total de registros | N | 000000010 |

---

## 💻 Como Usar

### 1. Via API REST

#### GET - Geração Simples

```bash
curl -X GET "https://seu-dominio.com/api/reports/afd?company_id=123&start_date=2024-01-01&end_date=2024-01-31&encoding=UTF-8" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -o afd_janeiro_2024.txt
```

**Parâmetros:**
- `company_id` (obrigatório) - ID da empresa
- `start_date` (obrigatório) - Data inicial (formato: YYYY-MM-DD)
- `end_date` (obrigatório) - Data final (formato: YYYY-MM-DD)
- `encoding` (opcional) - UTF-8 ou ISO-8859-1 (padrão: UTF-8)

**Resposta:**
- Status 200: Arquivo TXT para download
- Headers importantes:
  - `Content-Disposition`: Nome do arquivo
  - `X-Total-Records`: Total de registros no AFD

#### POST - Geração com Ajustes e Inclusões

```bash
curl -X POST "https://seu-dominio.com/api/reports/afd" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "123",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "encoding": "UTF-8",
    "adjustments": [
      {
        "nsr": 1,
        "originalDateTime": "2024-01-15T08:30:00",
        "adjustedDateTime": "2024-01-15T08:00:00",
        "employeePis": "12345678901",
        "reason": "Erro de digitação",
        "adjustedBy": "João Silva",
        "adjustedAt": "2024-01-16T10:00:00"
      }
    ],
    "inclusions": [
      {
        "nsr": 1,
        "dateTime": "2024-01-16T09:00:00",
        "employeePis": "12345678901",
        "reason": "Esqueceu de bater ponto",
        "includedBy": "Maria Santos",
        "includedAt": "2024-01-16T15:00:00"
      }
    ]
  }' \
  -o afd_janeiro_2024.txt
```

### 2. Via Código TypeScript/JavaScript

```typescript
import { AFDGenerator, generateAFD, type AFDData, type AFDConfig } from '@/lib/compliance'
import { getTimeRecordsForAFD } from '@/lib/supabase/queries/compliance'

// Buscar dados do banco
const data = await getTimeRecordsForAFD('company-id', '2024-01-01', '2024-01-31')

if (!data) {
  throw new Error('Erro ao buscar dados para AFD')
}

// Configuração (opcional)
const config: AFDConfig = {
  encoding: 'UTF-8',
  layoutVersion: 2,
  repType: 3, // REP-P (programa)
  repNumber: '12345678901234567',
}

// Gerar AFD
const result = generateAFD({
  company: data.company,
  employees: data.employees,
  timeRecords: data.timeRecords,
  dailyRecords: data.dailyRecords,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
}, config)

// Resultado
console.log('Arquivo:', result.filename)
console.log('Total de registros:', result.totalRecords)
console.log('Encoding:', result.encoding)

// Salvar arquivo ou enviar para download
const blob = new Blob([result.content], { type: 'text/plain' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = result.filename
a.click()
```

### 3. Usando a Classe Diretamente

```typescript
import { AFDGenerator } from '@/lib/compliance/afd-generator'

// Criar instância
const generator = new AFDGenerator({
  encoding: 'UTF-8',
  repType: 3,
})

// Gerar AFD
const result = generator.generate(afdData)

// Converter para encoding específico
const buffer = generator.encodeContent(result.content)

// Salvar arquivo
import fs from 'fs'
fs.writeFileSync(result.filename, buffer)
```

---

## 📊 Exemplo de Arquivo AFD Gerado

```
1000000001112345678000190            EMPRESA EXEMPLO LTDA                                                                                                                                  12345678901234567010120240101202431012024235959
2000000002123456789012345673RH-RICKGAY WEB                                                                                                                                          1.0.0
3000000003123456789010101202408 30
3000000004123456789010101202412 00
3000000005123456789010101202413 00
3000000006123456789010101202418 00
3000000007987654321090101202409 00
3000000008987654321090101202412 30
3000000009987654321090101202413 30
3000000010987654321090101202417 30
9000000011
```

**Interpretação:**
- Linha 1 (Tipo 1): Cabeçalho com dados da empresa
- Linha 2 (Tipo 2): Identificação do REP
- Linhas 3-10 (Tipo 3): Marcações de ponto de 2 funcionários
- Linha 11 (Tipo 9): Trailer com total de 11 registros

---

## ✅ Validações Implementadas

### 1. Validação de PIS

O sistema valida automaticamente o PIS usando o algoritmo do MTE:

```typescript
import { validatePIS } from '@/lib/compliance/afd-generator'

const isValid = validatePIS('170.78136.39-7') // true
const isValid2 = validatePIS('123.45678.90-1') // false
```

**Algoritmo de Validação:**
1. Remove caracteres não numéricos
2. Verifica se tem 11 dígitos
3. Multiplica cada dígito pelos pesos [3,2,9,8,7,6,5,4,3,2]
4. Calcula dígito verificador
5. Compara com o último dígito informado

### 2. Validação de CNPJ

```typescript
import { validateCNPJ } from '@/lib/supabase/queries/compliance'

const isValid = validateCNPJ('12.345.678/0001-90') // true/false
```

### 3. Validação Pré-Geração

Antes de gerar o AFD, valide se a empresa está pronta:

```typescript
import { validateCompanyForAFD } from '@/lib/supabase/queries/compliance'

const validation = await validateCompanyForAFD('company-id')

if (!validation.valid) {
  console.error('Erros encontrados:')
  validation.errors.forEach(error => console.error('- ' + error))
}
```

**Validações realizadas:**
- Empresa possui CNPJ válido
- Existem funcionários ativos
- Funcionários possuem PIS cadastrado
- Existem registros de ponto no período

### 4. Estatísticas do Período

Obtenha estatísticas antes de gerar o AFD:

```typescript
import { getAFDStatistics } from '@/lib/supabase/queries/compliance'

const stats = await getAFDStatistics('company-id', '2024-01-01', '2024-01-31')

console.log('Total de funcionários:', stats.totalEmployees)
console.log('Total de registros:', stats.totalRecords)
console.log('Funcionários com registros:', stats.employeesWithRecords)
```

---

## 🚨 Campos Obrigatórios

### Empresa
- ✅ **CNPJ**: 14 dígitos numéricos (obrigatório)
- ✅ **Razão Social**: Nome completo da empresa
- 🔸 **CEI**: Apenas se aplicável (obras de construção civil)
- 🔸 **Endereço**: Opcional mas recomendado

### Funcionários
- ✅ **PIS**: 11 dígitos válidos (obrigatório para aparecer no AFD)
- ✅ **Nome completo**
- ✅ **Status**: Apenas funcionários ativos são incluídos

### Registros de Ponto
- ✅ **Data/hora da marcação**: Timestamp preciso
- ✅ **ID do funcionário**: Relacionamento com employee
- 🔸 **Tipo de marcação**: clock_in, clock_out, break_start, break_end
- 🔸 **Localização**: Endereço da marcação (opcional)
- 🔸 **Origem**: mobile_app, web, biometric, manual

---

## ⚠️ Observações Importantes

### Encoding
- **UTF-8** (padrão): Suporta caracteres especiais e acentos
- **ISO-8859-1**: Padrão legado, alguns sistemas antigos exigem

### NSR (Número Sequencial de Registro)
- Sempre sequencial começando em 1
- Incrementa a cada linha do arquivo
- Tipo 9 (trailer) conta o total incluindo ele mesmo

### Ordenação
- Marcações devem estar ordenadas cronologicamente
- Agrupamento por funcionário não é obrigatório
- Sistema ordena automaticamente ao gerar

### Caracteres Especiais
- Acentos e cedilhas são removidos automaticamente
- Texto é normalizado para ASCII
- Campos alfanuméricos são preenchidos com espaços à direita
- Campos numéricos são preenchidos com zeros à esquerda

### Limitações
- Máximo de 999.999.999 registros por arquivo
- Período máximo recomendado: 1 mês
- Para períodos maiores, gere múltiplos arquivos

---

## 🔧 Queries Disponíveis

### `getTimeRecordsForAFD(companyId, startDate, endDate)`
Busca todos os dados necessários para gerar o AFD.

**Retorna:**
```typescript
{
  company: Company,
  employees: Employee[],
  timeRecords: TimeRecord[],
  dailyRecords: TimeTrackingDaily[]
}
```

### `getEmployeeTimeRecordsForPeriod(employeeId, startDate, endDate)`
Busca registros de um funcionário específico.

### `validateCompanyForAFD(companyId)`
Valida se a empresa pode gerar AFD.

**Retorna:**
```typescript
{
  valid: boolean,
  errors: string[]
}
```

### `getAFDStatistics(companyId, startDate, endDate)`
Retorna estatísticas do período.

**Retorna:**
```typescript
{
  totalEmployees: number,
  totalRecords: number,
  employeesWithRecords: number,
  dateRange: { start: string, end: string }
}
```

---

## 🎯 Casos de Uso

### 1. Fiscalização do MTE
Quando o auditor fiscal solicitar o AFD:
```bash
# Gerar AFD do último mês
curl -X GET "https://seu-dominio.com/api/reports/afd?company_id=123&start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer TOKEN" \
  -o AFD_DEZ_2024.txt
```

### 2. Auditoria Interna
Para análise interna mensal:
```typescript
const result = await getTimeRecordsForAFD(
  companyId,
  '2024-01-01',
  '2024-01-31'
)

const afd = generateAFD(result, { encoding: 'UTF-8' })
// Salvar em storage ou enviar por email
```

### 3. Backup de Registros
Gerar AFD mensal automaticamente:
```typescript
// Executar todo dia 1º do mês
const lastMonth = new Date()
lastMonth.setMonth(lastMonth.getMonth() - 1)
const year = lastMonth.getFullYear()
const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0')

const afd = await fetch(`/api/reports/afd?company_id=${companyId}&start_date=${year}-${month}-01&end_date=${year}-${month}-31`)
// Salvar em cloud storage
```

### 4. Exportação para Sistemas Terceiros
Integração com softwares de folha de pagamento:
```typescript
const afd = await generateAFD(data, { encoding: 'ISO-8859-1' })
await uploadToPayrollSystem(afd.content)
```

---

## 📚 Referências

### Legislação
- [Portaria MTE 671/2021](http://www.portaldaindustria.com.br/cni/legislacao/portaria-mte-n-671-de-8-de-novembro-de-2021/)
- [Portaria MTE 1510/2009](https://www.gov.br/trabalho-e-emprego/pt-br)
- [CLT - Artigo 74](http://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm)

### Documentação Técnica
- Layout AFD - Manual Técnico MTE
- [Registro Eletrônico de Ponto - MTE](https://www.gov.br/trabalho-e-emprego/pt-br)

### Validadores
- Algoritmo de validação PIS
- Algoritmo de validação CNPJ

---

## 🛠️ Troubleshooting

### Erro: "Nenhum funcionário ativo com PIS cadastrado"
**Solução:** Cadastre o PIS de pelo menos um funcionário ativo.

```sql
UPDATE employees
SET pis = '17078136397'
WHERE id = 'employee-id';
```

### Erro: "Empresa sem CNPJ cadastrado"
**Solução:** Cadastre o CNPJ da empresa.

```sql
UPDATE companies
SET cnpj = '12345678000190'
WHERE id = 'company-id';
```

### Erro: "Formato de data inválido"
**Solução:** Use o formato ISO 8601 (YYYY-MM-DD).

❌ Errado: `01/01/2024` ou `2024-1-1`
✅ Correto: `2024-01-01`

### Arquivo vazio ou sem registros
**Verifique:**
1. Existem registros de ponto no período?
2. Funcionários têm PIS cadastrado?
3. Período está correto?

```typescript
const stats = await getAFDStatistics(companyId, startDate, endDate)
console.log(stats) // Verifica se há dados
```

### Caracteres estranhos no arquivo
**Solução:** Verifique o encoding. Windows geralmente usa ISO-8859-1:

```typescript
const afd = generateAFD(data, { encoding: 'ISO-8859-1' })
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Consulte os logs do sistema
3. Valide os dados usando as funções de validação
4. Entre em contato com o suporte técnico

---

**Última atualização:** 2024-01-29
**Versão:** 1.0.0
**Compatibilidade:** Portaria MTE 671/2021
