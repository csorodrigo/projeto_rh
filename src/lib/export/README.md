# Biblioteca de Exportação

Esta biblioteca fornece funções para exportar dados do sistema em formatos CSV e PDF.

## Instalação

As seguintes dependências são necessárias:

```bash
npm install papaparse @types/papaparse jspdf jspdf-autotable
```

## Uso Básico

### Exportar para CSV

```typescript
import { exportEmployeesToCSV, exportTimeRecordsToCSV, exportAbsencesToCSV } from '@/lib/export'

// Exportar lista de funcionários
exportEmployeesToCSV(employees)

// Exportar registros de ponto
exportTimeRecordsToCSV(timeRecords, "Nome do Funcionário")

// Exportar ausências
exportAbsencesToCSV(absences)
```

### Exportar para PDF

```typescript
import { exportEmployeesPDF, exportTimeRecordsPDF, exportAbsencesPDF } from '@/lib/export'

// Exportar lista de funcionários
exportEmployeesPDF(employees, "Nome da Empresa")

// Exportar registros de ponto
exportTimeRecordsPDF(
  {
    name: "João Silva",
    department: "TI",
    position: "Desenvolvedor"
  },
  timeRecords,
  {
    start: "2024-01-01",
    end: "2024-01-31"
  },
  "Nome da Empresa"
)

// Exportar ausências
exportAbsencesPDF(
  absences,
  {
    start: "2024-01-01",
    end: "2024-01-31"
  },
  "Nome da Empresa",
  {
    type: "vacation",
    status: "approved"
  }
)
```

## Componente de Botão

Use o componente `ExportButton` para adicionar facilmente botões de exportação:

```typescript
import { ExportButton } from '@/components/export'

<ExportButton
  onExportCSV={() => exportEmployeesToCSV(employees)}
  onExportPDF={() => exportEmployeesPDF(employees)}
  disabled={employees.length === 0}
  label="Exportar"
/>
```

### Props do ExportButton

- `onExportCSV?: () => void | Promise<void>` - Função para exportar CSV
- `onExportPDF?: () => void | Promise<void>` - Função para exportar PDF
- `disabled?: boolean` - Desabilitar o botão
- `variant?: "default" | "outline" | "ghost"` - Variante do botão
- `size?: "default" | "sm" | "lg" | "icon"` - Tamanho do botão
- `label?: string` - Texto do botão (padrão: "Exportar")
- `showIcon?: boolean` - Mostrar ícone (padrão: true)

## Formatadores

A biblioteca inclui vários formatadores úteis:

```typescript
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  formatMinutes,
  formatCPF,
  formatPhone,
  formatBoolean,
  translateEmployeeStatus,
  translateAbsenceType,
  translateAbsenceStatus,
  translateTimeEntryType,
} from '@/lib/export'

// Formatar data
formatDate("2024-01-15") // "15/01/2024"

// Formatar moeda
formatCurrency(1500.50) // "R$ 1.500,50"

// Formatar minutos
formatMinutes(125) // "2h 5min"

// Traduzir status
translateEmployeeStatus("active") // "Ativo"
```

## Características

### CSV
- Encoding UTF-8 com BOM para compatibilidade com Excel
- Delimitador ponto e vírgula (;) para Excel brasileiro
- Headers em português
- Dados formatados (datas, moedas, etc)
- Nome de arquivo gerado automaticamente com timestamp

### PDF
- Header com logo e informações da empresa
- Footer com numeração de páginas
- Tabelas estilizadas com cores
- Sumários e estatísticas
- Layout responsivo

## Tratamento de Erros

As funções lançam erros quando não há dados para exportar:

```typescript
try {
  exportEmployeesToCSV(employees)
} catch (error) {
  console.error("Erro ao exportar:", error.message)
  // "Nenhum funcionário para exportar"
}
```

Ao usar o `ExportButton`, os erros são tratados automaticamente com toasts.

## Exemplos de Integração

### Página de Funcionários

```typescript
import { exportEmployeesToCSV, exportEmployeesPDF } from '@/lib/export'
import { ExportButton } from '@/components/export'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])

  return (
    <div>
      <ExportButton
        onExportCSV={() => exportEmployeesToCSV(employees)}
        onExportPDF={() => exportEmployeesPDF(employees, "Minha Empresa")}
        disabled={employees.length === 0}
      />
      {/* ... */}
    </div>
  )
}
```

### Página de Ponto

```typescript
import { exportTimeRecordsToCSV, exportTimeRecordsPDF } from '@/lib/export'
import { ExportButton } from '@/components/export'

export default function TimeRecordsPage() {
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [employee, setEmployee] = useState({ name: "João Silva" })
  const [period, setPeriod] = useState({ start: "2024-01-01", end: "2024-01-31" })

  return (
    <div>
      <ExportButton
        onExportCSV={() => exportTimeRecordsToCSV(records, employee.name)}
        onExportPDF={() =>
          exportTimeRecordsPDF(employee, records, period, "Minha Empresa")
        }
        disabled={records.length === 0}
      />
      {/* ... */}
    </div>
  )
}
```

## Personalização

Para exportações personalizadas, use `exportGenericCSV`:

```typescript
import { exportGenericCSV } from '@/lib/export'

const data = [
  { id: 1, nome: "João", idade: 30 },
  { id: 2, nome: "Maria", idade: 25 },
]

const columnMapping = {
  id: "ID",
  nome: "Nome Completo",
  idade: "Idade",
}

exportGenericCSV(data, "meus-dados.csv", columnMapping)
```

## Notas

- Todas as exportações funcionam offline (geradas no cliente)
- Os nomes de arquivo incluem timestamp para evitar sobrescrita
- Listas vazias geram erro ao invés de arquivos vazios
- Dados sensíveis devem ser filtrados antes da exportação
- PDFs são limitados ao formato A4 em orientação retrato
