# Sistema de Importação em Massa de Funcionários

Sistema completo para importação de funcionários em lote através de arquivos CSV ou Excel.

## Características

- Suporte para CSV (.csv) e Excel (.xlsx, .xls)
- Validação completa dos dados antes da importação
- Detecção de duplicados (dentro do arquivo e contra o banco de dados)
- Preview dos dados com indicadores visuais de erros/avisos
- Importação em lotes (50 registros por vez)
- Progress bar em tempo real
- Log de erros detalhado
- Download de template CSV

## Estrutura de Arquivos

### Bibliotecas (src/lib/import/)

```
src/lib/import/
├── types.ts              # Tipos TypeScript
├── csv-parser.ts         # Parser para arquivos CSV
├── excel-parser.ts       # Parser para arquivos Excel
├── validators.ts         # Validadores de dados
├── import-service.ts     # Serviço de importação
└── index.ts             # Exportações
```

### Componentes (src/components/import/)

```
src/components/import/
├── ImportWizard.tsx      # Componente principal (wizard)
├── FileUploader.tsx      # Upload com drag & drop
├── PreviewTable.tsx      # Tabela de preview com validação
├── ImportProgress.tsx    # Barra de progresso
├── ImportResult.tsx      # Tela de resultado
└── index.tsx            # Exportações
```

### Página

```
src/app/(dashboard)/funcionarios/importar/page.tsx
```

### Template

```
public/templates/funcionarios_template.csv
```

## Formato do Arquivo

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| name | string | Nome completo | João Silva |
| cpf | string | CPF (11 dígitos) | 12345678901 |
| birth_date | date | Data de nascimento | 1990-01-15 ou 15/01/1990 |
| hire_date | date | Data de admissão | 2024-01-01 ou 01/01/2024 |
| position | string | Cargo | Desenvolvedor |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| personal_email | email | Email pessoal | joao@email.com |
| department | string | Departamento | TI |
| base_salary | number | Salário base | 5000.00 |
| status | enum | Status | active, inactive, terminated, on_leave |
| personal_phone | string | Telefone | 11999999999 |

### Formatos de Data Aceitos

- ISO: `YYYY-MM-DD` (ex: 2024-01-15)
- Brasileiro: `DD/MM/YYYY` (ex: 15/01/2024)
- Com traço: `DD-MM-YYYY` (ex: 15-01-2024)

### Status Aceitos

- `active` / `ativo` / `ativa`
- `inactive` / `inativo` / `inativa`
- `terminated` / `desligado` / `demitido`
- `on_leave` / `afastado` / `licença`

## Validações

### Validações de Campos

- **Nome**: Mínimo 2 caracteres
- **CPF**: Algoritmo de validação de CPF brasileiro
- **Email**: Formato de email válido
- **Datas**: Formato válido e lógica consistente
- **Salário**: Valor não negativo, aviso se abaixo do mínimo
- **Idade**: Entre 14 e 100 anos, aviso se contratação de menor

### Validações de Lógica

- Data de admissão não pode ser anterior à data de nascimento
- Idade mínima de 14 anos no momento da contratação
- Aviso se contratação entre 14-16 anos (Menor Aprendiz)
- CPF único no sistema
- CPF único dentro do arquivo

### Avisos (Warnings)

Não impedem a importação, mas são destacados:

- Campos opcionais não preenchidos
- Salário abaixo do mínimo nacional
- Data de admissão no futuro
- Idade fora do comum
- Contratação de menor de 16 anos

## Fluxo de Importação

### 1. Upload do Arquivo

- Drag & drop ou seleção de arquivo
- Validação de tipo (.csv, .xlsx, .xls)
- Validação de tamanho (máx 10MB)
- Parsing automático com detecção de encoding

### 2. Preview e Validação

- Tabela com até 10 registros por página
- Indicadores visuais:
  - ✅ Verde: Válido
  - ⚠️ Amarelo: Válido com avisos
  - ❌ Vermelho: Inválido
- Tooltip com detalhes de erros/avisos
- Checkboxes para seleção
- Botão "Selecionar Válidas"
- Summary com contadores

### 3. Importação

- Progress bar em tempo real
- Importação em lotes de 50
- Tratamento individual de erros
- Possibilidade de cancelamento

### 4. Resultado

- Resumo com cards (Total, Sucesso, Falhas)
- Tabela com erros (se houver)
- Download do log de erros em CSV
- Botão para nova importação
- Botão para voltar à listagem

## Uso

### Download do Template

```typescript
// Através do botão na interface
handleDownloadTemplate()
// Ou diretamente do arquivo
/public/templates/funcionarios_template.csv
```

### Importação Programática

```typescript
import { parseCSV, validateEmployee, importEmployees } from '@/lib/import';

// Parse CSV
const result = await parseCSV(file);

// Validate
const validated = result.data.map(emp => ({
  ...emp,
  validation: validateEmployee(emp),
}));

// Import
const importResult = await importEmployees(
  validated.filter(e => e.validation.valid),
  (current, total) => {
    console.log(`${current}/${total}`);
  }
);
```

## Normalização Automática

### Headers

O sistema reconhece variações de nomes de colunas:

- `nome` / `nome completo` → `name`
- `email` / `email pessoal` / `e-mail` → `personal_email`
- `data de nascimento` / `nascimento` → `birth_date`
- `cargo` / `função` → `position`
- `departamento` / `depto` / `setor` → `department`
- `salário` / `salario` / `remuneração` → `base_salary`
- `telefone` / `tel` / `celular` → `personal_phone`

### Formatação

- CPF: Remove caracteres não numéricos
- Telefone: Remove caracteres não numéricos
- Salário: Remove símbolos e converte para número
- Datas: Converte formatos brasileiros para ISO

## Tratamento de Erros

### Parse Errors

- Arquivo corrompido
- Encoding incompatível
- Formato inválido

### Validation Errors

- Campos obrigatórios vazios
- CPF inválido
- Email inválido
- Datas inválidas
- Lógica inconsistente

### Import Errors

- Violação de constraint (CPF duplicado)
- Erro de rede
- Timeout
- Falta de permissão

### Log de Erros

CSV gerado com colunas:

- Linha
- Nome
- CPF
- Erro (descrição)

## Performance

- Parsing assíncrono
- Validação em batch
- Importação em lotes de 50
- Progress tracking
- Lazy loading na tabela

## Dependências

```json
{
  "papaparse": "^5.5.3",          // CSV parsing
  "@types/papaparse": "^5.5.2",
  "xlsx": "^0.18.5"                // Excel parsing
}
```

## Exemplos

### Template CSV

```csv
name,cpf,personal_email,birth_date,hire_date,position,department,base_salary,status,personal_phone
João Silva,12345678901,joao@email.com,1990-01-15,2024-01-01,Desenvolvedor,TI,5000.00,active,11999999999
Maria Santos,98765432100,maria@email.com,1985-05-20,2024-02-01,Analista RH,RH,4500.00,active,11988888888
```

### Uso na Interface

1. Acesse `/funcionarios/importar`
2. Clique em "Download Template" para baixar o modelo
3. Preencha o template com os dados
4. Faça upload do arquivo (drag & drop ou clique)
5. Revise os dados na tela de preview
6. Selecione os funcionários válidos
7. Clique em "Importar X Funcionários"
8. Aguarde a importação
9. Revise o resultado

### Campos com Avisos

Mesmo com avisos, o registro pode ser importado:

```csv
João Silva,12345678901,,1990-01-15,2024-01-01,Desenvolvedor,,1200.00,active,
```

Avisos:
- Email não informado
- Departamento não informado
- Salário abaixo do mínimo
- Telefone não informado

### Campos com Erros

Registros com erros NÃO são importados:

```csv
Maria,123,email-invalido,32/13/2020,2024-01-01,,TI,5000,active,11999999999
```

Erros:
- Nome muito curto
- CPF inválido
- Email inválido
- Data de nascimento inválida
- Cargo obrigatório

## Segurança

- Validação de tipo de arquivo
- Limite de tamanho (10MB)
- Sanitização de dados
- Validação de CPF (algoritmo)
- Autenticação necessária
- Company ID automático do usuário logado

## Melhorias Futuras

- [ ] Cancelamento de importação em andamento
- [ ] Agendamento de importações
- [ ] Importação incremental (update de registros existentes)
- [ ] Suporte para mais formatos (ODS, TXT)
- [ ] Mapeamento customizado de colunas
- [ ] Validação contra APIs externas (Receita Federal)
- [ ] Histórico de importações
- [ ] Rollback de importações
- [ ] Importação de fotos
- [ ] Templates customizados por empresa

## Troubleshooting

### Arquivo não carrega

- Verifique o tamanho (máx 10MB)
- Verifique o formato (.csv, .xlsx, .xls)
- Tente converter para CSV

### Dados não aparecem corretamente

- Verifique o encoding (UTF-8)
- Verifique se há header na primeira linha
- Verifique os nomes das colunas

### Muitos erros de validação

- Baixe e use o template oficial
- Verifique o formato das datas
- Verifique os CPFs (11 dígitos)
- Verifique campos obrigatórios

### Importação falha

- Verifique sua conexão
- Verifique permissões
- Reduza o número de registros
- Tente novamente

## Suporte

Para dúvidas ou problemas:

1. Consulte este README
2. Baixe e use o template oficial
3. Verifique os logs de erro
4. Entre em contato com o suporte
