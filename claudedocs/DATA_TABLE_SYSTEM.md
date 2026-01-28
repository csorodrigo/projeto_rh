# Sistema de Tabelas Profissionais

Sistema completo de tabelas avançadas usando `@tanstack/react-table` com componentes reutilizáveis e funcionalidades profissionais.

## Componentes Criados

### 1. DataTable (`/src/components/ui/data-table.tsx`)

Componente principal de tabela com todas as funcionalidades:

- ✅ **Paginação Real**: 10, 25, 50, 100 items por página
- ✅ **Ordenação**: Clicável em qualquer coluna
- ✅ **Busca Global**: Filtro de texto em tempo real
- ✅ **Seleção Múltipla**: Checkboxes com estado gerenciado
- ✅ **Ações em Lote**: Toolbar customizado para seleções
- ✅ **Loading Skeleton**: Estado de carregamento profissional
- ✅ **Empty State**: Mensagens personalizáveis com ícones
- ✅ **Responsivo**: Scroll horizontal em mobile
- ✅ **Visibilidade de Colunas**: Controle de quais colunas mostrar

### 2. StatusBadge (`/src/components/ui/status-badge.tsx`)

Sistema de badges de status com ícones e tooltips:

**Status Pré-configurados:**

#### Funcionários
- `active`: Ativo (verde, ícone CheckCircle2)
- `inactive`: Inativo (cinza, ícone Pause)
- `on_leave`: Afastado (amarelo, ícone Clock)
- `terminated`: Desligado (vermelho, ícone XCircle)

#### Ausências
- `pending`: Pendente (amarelo pulse, ícone Clock)
- `approved`: Aprovado (verde, ícone Check)
- `rejected`: Rejeitado (vermelho, ícone X)
- `cancelled`: Cancelado (cinza, ícone Ban)

#### Folha de Pagamento
- `draft`: Rascunho (cinza, ícone Circle)
- `calculating`: Calculando (azul pulse, ícone Clock)
- `calculated`: Calculado (azul, ícone CheckCircle2)
- `review`: Revisão (amarelo, ícone AlertCircle)
- `processing`: Processando (azul pulse, ícone Clock)
- `paid`: Pago (verde, ícone Check)
- `exported`: Exportado (roxo, ícone CheckCircle2)

#### Ponto Eletrônico
- `in_progress`: Em andamento (azul pulse, ícone Clock)
- `completed`: Completo (verde, ícone Check)
- `incomplete`: Incompleto (amarelo, ícone AlertTriangle)

#### Genéricos
- `urgent`: Urgente (vermelho pulse, ícone AlertCircle)

### 3. DataTableColumnHeader

Componente helper para headers com ordenação:
- Ícone de ordenação automático
- Estados visuais para ordenação ativa
- Acessível via teclado

## Uso Básico

### 1. Importar Dependências

```tsx
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { QuickStatusBadge, type StatusKey } from "@/components/ui/status-badge"
```

### 2. Definir Tipo de Dados

```tsx
interface Employee {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "on_leave" | "terminated"
  department: string
}
```

### 3. Criar Mapeamento de Status

```tsx
const statusMap: Record<string, StatusKey> = {
  active: "active",
  inactive: "inactive",
  on_leave: "on_leave",
  terminated: "terminated",
}
```

### 4. Definir Colunas

```tsx
const columns: ColumnDef<Employee>[] = [
  // Coluna com ordenação
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },

  // Coluna simples
  {
    accessorKey: "email",
    header: "Email",
  },

  // Coluna com status badge
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <QuickStatusBadge status={statusMap[status]} />
    },
  },

  // Coluna de ações
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 size-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(item)}>
              <Edit className="mr-2 size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(item)}
            >
              <Trash2 className="mr-2 size-4" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
```

### 5. Usar o DataTable

```tsx
export function EmployeesPage() {
  const [data, setData] = React.useState<Employee[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<Employee[]>([])

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Buscar funcionário..."
          isLoading={isLoading}
          enableRowSelection
          onSelectionChange={setSelected}
          emptyMessage="Nenhum funcionário encontrado"
          emptyDescription="Comece adicionando seu primeiro funcionário"
          toolbar={
            selected.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Exportar selecionados ({selected.length})
              </Button>
            )
          }
        />
      </CardContent>
    </Card>
  )
}
```

## Props do DataTable

```tsx
interface DataTableProps<TData> {
  // Obrigatórios
  columns: ColumnDef<TData>[]
  data: TData[]

  // Busca
  searchKey?: string                    // Chave para busca global
  searchPlaceholder?: string            // Placeholder do input

  // Estado
  isLoading?: boolean                   // Mostra skeleton

  // Interação
  onRowClick?: (row: Row<TData>) => void  // Clique na linha

  // Seleção múltipla
  enableRowSelection?: boolean          // Habilita checkboxes
  onSelectionChange?: (rows: TData[]) => void  // Callback de seleção

  // Empty state
  emptyMessage?: string                 // Mensagem principal
  emptyDescription?: string             // Descrição
  emptyIcon?: React.ReactNode          // Ícone customizado

  // Paginação
  pageSize?: number                     // Tamanho inicial (padrão: 10)
  pageSizeOptions?: number[]           // Opções de tamanho (padrão: [10, 25, 50, 100])

  // Customização
  toolbar?: React.ReactNode            // Toolbar customizado
  footer?: React.ReactNode             // Footer customizado
}
```

## Props do StatusBadge

```tsx
interface StatusBadgeProps {
  icon?: LucideIcon    // Ícone customizado
  label: string        // Texto do badge
  tooltip?: string     // Tooltip ao hover
  variant?: "success" | "error" | "warning" | "info" | "neutral" | "purple"
  pulse?: boolean      // Animação de pulso
}

// Uso com badge pré-configurado
<QuickStatusBadge status="active" />

// Uso com badge customizado
<StatusBadge
  variant="success"
  icon={CheckCircle2}
  label="Aprovado"
  tooltip="Solicitação aprovada"
/>
```

## Funcionalidades Avançadas

### 1. Ações em Lote

```tsx
const [selected, setSelected] = React.useState<Employee[]>([])

<DataTable
  enableRowSelection
  onSelectionChange={setSelected}
  toolbar={
    selected.length > 0 && (
      <div className="flex gap-2">
        <Button onClick={() => handleExport(selected)}>
          Exportar ({selected.length})
        </Button>
        <Button variant="destructive" onClick={() => handleDeleteBatch(selected)}>
          Deletar selecionados
        </Button>
      </div>
    )
  }
/>
```

### 2. Células Customizadas Complexas

```tsx
{
  accessorKey: "user",
  header: "Usuário",
  cell: ({ row }) => {
    const user = row.original
    return (
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.photo} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    )
  },
}
```

### 3. Valores Formatados

```tsx
{
  accessorKey: "salary",
  header: ({ column }) => <DataTableColumnHeader column={column} title="Salário" />,
  cell: ({ row }) => {
    const amount = row.getValue("salary") as number
    return (
      <span className="font-medium">
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount)}
      </span>
    )
  },
}
```

### 4. Colunas com Ícones

```tsx
{
  id: "overtime",
  header: "Horas Extras",
  cell: ({ row }) => {
    const hours = calculateOvertime(row.original)
    return (
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <span className="text-green-600">{hours}h</span>
      </div>
    )
  },
}
```

## Status Badge Customizados

### Criar Novo Status

```tsx
// Em status-badge.tsx, adicione ao statusConfigs:
export const statusConfigs = {
  // ... outros status

  my_custom_status: {
    variant: "info" as const,
    icon: Sparkles,
    label: "Meu Status",
    tooltip: "Descrição do status",
    pulse: false,
  },
}

// Uso:
<QuickStatusBadge status="my_custom_status" />
```

### Badge Dinâmico

```tsx
const getBadgeConfig = (value: number) => {
  if (value > 100) return { variant: "success", label: "Alto", icon: TrendingUp }
  if (value > 50) return { variant: "warning", label: "Médio", icon: Minus }
  return { variant: "error", label: "Baixo", icon: TrendingDown }
}

// Na célula:
{
  const config = getBadgeConfig(row.getValue("score"))
  return <StatusBadge {...config} />
}
```

## Páginas Refatoradas

As seguintes páginas foram atualizadas com o novo sistema:

1. ✅ `/src/app/(dashboard)/funcionarios/page.tsx`
   - Tabela de funcionários com seleção múltipla
   - Status badges com ícones
   - Ações por linha (visualizar, editar, email, desligar)
   - Exportar selecionados

2. ✅ `/src/app/(dashboard)/folha/page.tsx`
   - Tabela de folha de pagamento
   - Valores monetários formatados
   - Status de processamento
   - Ordenação por valores

3. 🔄 `/src/app/(dashboard)/ausencias/page.tsx` (pendente)
4. 🔄 `/src/app/(dashboard)/ponto/historico/page.tsx` (pendente)

## Melhorias Implementadas

### Antes vs Depois

**Antes:**
- Tabelas básicas sem paginação
- Status com badges simples
- Sem ordenação
- Sem seleção múltipla
- Empty states genéricos

**Depois:**
- ✅ Paginação real com opções (10, 25, 50, 100)
- ✅ Ordenação clicável em qualquer coluna
- ✅ Busca global em tempo real
- ✅ Seleção múltipla com checkboxes
- ✅ Ações em lote (toolbar)
- ✅ Status badges com ícones vibrantes e tooltips
- ✅ Loading skeleton profissional
- ✅ Empty states com ilustrações
- ✅ Responsivo com scroll horizontal
- ✅ Controle de visibilidade de colunas
- ✅ Row actions consistentes

## Próximos Passos

1. Refatorar página de Ausências
2. Refatorar página de Histórico de Ponto
3. Adicionar filtros avançados por coluna
4. Implementar exportação de dados (CSV, Excel, PDF)
5. Adicionar drag & drop para reordenar colunas
6. Implementar virtual scrolling para grandes datasets
7. Adicionar modo de edição inline

## Performance

- Renderização otimizada com `@tanstack/react-table`
- Memoização automática de células
- Virtual scrolling ready
- Skeleton loading para UX suave
- Paginação do lado do cliente (server-side ready)

## Acessibilidade

- ✅ Navegação por teclado
- ✅ Screen reader friendly
- ✅ ARIA labels adequados
- ✅ Foco visível
- ✅ Tooltips descritivos
- ✅ Contraste de cores adequado

## Recursos Adicionais

- **Exemplo Completo**: `/src/components/ui/data-table-example.tsx`
- **Documentação**: Este arquivo
- **Testes**: Pendente (adicionar testes E2E com Playwright)
