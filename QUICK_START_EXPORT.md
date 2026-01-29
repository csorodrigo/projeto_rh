# Quick Start - Exportação de Relatórios

## 🚀 Uso Rápido

### 1. Importar o Componente

```typescript
import { ExportButton } from '@/components/export'
import { exportEmployeesToCSV, exportEmployeesPDF } from '@/lib/export'
```

### 2. Adicionar o Botão

```typescript
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
  onExportPDF={() => exportEmployeesPDF(data)}
  disabled={data.length === 0}
/>
```

## 📁 Funções Disponíveis

### Funcionários
```typescript
import { exportEmployeesToCSV, exportEmployeesPDF } from '@/lib/export'

// CSV
exportEmployeesToCSV(employees)

// PDF
exportEmployeesPDF(employees, "Nome da Empresa", { status: "active" })
```

### Registros de Ponto
```typescript
import { exportTimeRecordsToCSV, exportTimeRecordsPDF } from '@/lib/export'

// CSV
exportTimeRecordsToCSV(records, "Nome do Funcionário")

// PDF
exportTimeRecordsPDF(
  { name: "João Silva", department: "TI" },
  records,
  { start: "2024-01-01", end: "2024-01-31" },
  "Nome da Empresa"
)
```

### Ausências
```typescript
import { exportAbsencesToCSV, exportAbsencesPDF } from '@/lib/export'

// CSV
exportAbsencesToCSV(absences)

// PDF
exportAbsencesPDF(
  absences,
  { start: "2024-01-01", end: "2024-01-31" },
  "Nome da Empresa",
  { type: "vacation", status: "approved" }
)
```

## 🎨 Customizações do Botão

### Apenas CSV
```typescript
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
  label="Baixar CSV"
/>
```

### Apenas PDF
```typescript
<ExportButton
  onExportPDF={() => exportEmployeesPDF(data)}
  label="Baixar PDF"
/>
```

### Botão Pequeno
```typescript
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
  onExportPDF={() => exportEmployeesPDF(data)}
  size="sm"
  variant="outline"
/>
```

### Sem Ícone
```typescript
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
  onExportPDF={() => exportEmployeesPDF(data)}
  showIcon={false}
  label="Download"
/>
```

## 🔧 Formatadores

Use os formatadores diretamente se precisar:

```typescript
import {
  formatDate,
  formatCurrency,
  formatCPF,
  translateEmployeeStatus
} from '@/lib/export'

formatDate("2024-01-15")              // "15/01/2024"
formatCurrency(1500.50)               // "R$ 1.500,50"
formatCPF("12345678901")              // "123.456.789-01"
translateEmployeeStatus("active")     // "Ativo"
```

## ✅ Validações

### Verificar Dados Vazios
```typescript
// O botão já faz isso automaticamente
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
  disabled={data.length === 0}  // ✅
/>

// Ou você pode verificar manualmente
if (data.length === 0) {
  toast.error("Nenhum dado para exportar")
  return
}
exportEmployeesToCSV(data)
```

### Tratamento de Erros
```typescript
// Com ExportButton - automático ✅
<ExportButton
  onExportCSV={() => exportEmployeesToCSV(data)}
/>

// Manual
try {
  exportEmployeesToCSV(data)
  toast.success("Exportado com sucesso!")
} catch (error) {
  toast.error(error.message)
}
```

## 📱 Páginas com Exportação

### ✅ Funcionários
`/funcionarios` - Exporta lista completa ou selecionados

### ✅ Ausências
`/ausencias` - Exporta com filtros aplicados

### ✅ Histórico de Ponto
`/ponto/historico` - Exporta período selecionado

## 🎯 Exemplo Completo

```typescript
"use client"

import * as React from "react"
import { ExportButton } from "@/components/export"
import { exportEmployeesToCSV, exportEmployeesPDF } from "@/lib/export"
import type { Employee } from "@/lib/supabase/queries/employees"

export default function MyPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // ... carregar dados

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Funcionários</h1>

        <ExportButton
          onExportCSV={() => exportEmployeesToCSV(employees)}
          onExportPDF={() => exportEmployeesPDF(employees, "Minha Empresa")}
          disabled={isLoading || employees.length === 0}
          label="Exportar"
        />
      </div>

      {/* Sua tabela/lista aqui */}
    </div>
  )
}
```

## 💡 Dicas

1. **Performance**: Exportações funcionam client-side, são rápidas mesmo com milhares de registros

2. **Nomes de Arquivo**: São gerados automaticamente com timestamp
   - `relatorio_funcionarios_2024-01-29_143022.csv`
   - `relatorio_ponto_2024-01-29_143022.pdf`

3. **Excel**: CSVs abrem corretamente no Excel com acentos

4. **Mobile**: Funciona em dispositivos móveis

5. **Offline**: Não precisa de conexão com internet

## 🐛 Troubleshooting

### Botão não aparece?
Verifique se importou corretamente:
```typescript
import { ExportButton } from '@/components/export'
```

### Erro "Nenhum dado para exportar"?
Verifique se o array não está vazio:
```typescript
console.log(data.length) // Deve ser > 0
```

### PDF não está bonito?
Certifique-se de passar todas as informações:
```typescript
exportEmployeesPDF(
  employees,
  "Nome da Empresa",  // ✅ Nome da empresa
  { status: "active" } // ✅ Filtros aplicados
)
```

### CSV não abre no Excel?
Já está configurado com UTF-8 BOM automaticamente ✅

## 📚 Mais Informações

- **Documentação Completa**: `src/lib/export/README.md`
- **Plano de Testes**: `TESTE_EXPORTACAO.md`
- **Detalhes Técnicos**: `IMPLEMENTACAO_EXPORTACAO.md`

## 🎉 Pronto!

Você está pronto para usar a exportação em qualquer página do sistema!
