# Organograma Visual Interativo - Documentação

## Visão Geral

Sistema completo de visualização hierárquica organizacional com recursos avançados de navegação, busca, filtragem e exportação.

## Arquitetura

### Estrutura de Arquivos

```
src/
├── types/
│   └── organogram.ts                    # Tipos TypeScript para organograma
├── lib/organogram/
│   ├── hierarchy.ts                     # Funções de manipulação de hierarquia
│   ├── layouts.ts                       # Algoritmos de layout (top-down, radial, etc)
│   └── export.ts                        # Funções de exportação (PNG, PDF, JSON, CSV)
├── components/organogram/
│   ├── OrgChart.tsx                     # Componente principal com React Flow
│   ├── OrgNode.tsx                      # Card de funcionário no organograma
│   ├── OrgDetailPanel.tsx               # Painel de detalhes lateral
│   ├── SearchPanel.tsx                  # Painel de busca e filtros
│   └── ZoomControls.tsx                 # Controles de zoom
├── app/
│   ├── api/organogram/
│   │   ├── hierarchy/route.ts           # API: GET hierarquia
│   │   └── update/route.ts              # API: POST atualizar hierarquia
│   └── (dashboard)/funcionarios/organograma/
│       └── page.tsx                     # Página principal
```

## Funcionalidades Implementadas

### 1. Visualização Interativa
- ✅ Renderização com React Flow (@xyflow/react)
- ✅ Zoom in/out com mouse wheel
- ✅ Pan com drag
- ✅ Mini-map para navegação
- ✅ Controles de zoom customizados
- ✅ Múltiplos layouts:
  - Top-down (padrão)
  - Left-right
  - Compact
  - Radial

### 2. Nodes Customizados
- ✅ Avatar do funcionário
- ✅ Nome, cargo e departamento
- ✅ Badge de ausência
- ✅ Contador de subordinados
- ✅ Badge especial para CEO
- ✅ Tamanhos diferentes por nível hierárquico
- ✅ Highlight ao selecionar

### 3. Busca e Filtros
- ✅ Busca por nome, cargo, email
- ✅ Filtro por departamento
- ✅ Filtro por nível hierárquico
- ✅ Resultados em tempo real
- ✅ Clique para centralizar no funcionário

### 4. Painel de Detalhes
- ✅ Informações completas do funcionário
- ✅ Contatos (email, telefone)
- ✅ Data de admissão e matrícula
- ✅ Gestor direto (clicável)
- ✅ Lista de subordinados diretos (clicáveis)
- ✅ Caminho hierárquico (breadcrumb)
- ✅ Botões de ação:
  - Ver perfil completo
  - Editar hierarquia
  - Enviar email

### 5. Estatísticas
- ✅ Total de funcionários
- ✅ Número de departamentos
- ✅ Média de subordinados por gestor (span of control)
- ✅ Profundidade máxima da hierarquia
- ✅ Funcionários sem gestor

### 6. Exportação
- ✅ Exportar como PNG (alta qualidade)
- ✅ Exportar como PDF (múltiplos tamanhos de papel)
- ✅ Exportar como JSON (estrutura hierárquica)
- ✅ Exportar como CSV (lista plana)
- ✅ Compartilhar link

### 7. Validações
- ✅ Detecção de ciclos na hierarquia
- ✅ Validação de mudanças de gestor
- ✅ Avisos de mudança de departamento
- ✅ Permissões por role

### 8. Performance
- ✅ Memoização de cálculos pesados
- ✅ React Flow otimizado para grandes árvores
- ✅ Lazy loading de componentes
- ✅ Debounce em buscas

## API Endpoints

### GET /api/organogram/hierarchy
Retorna todos os funcionários ativos com campos otimizados para o organograma.

**Response:**
```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "João Silva",
      "position": "CEO",
      "department": "Diretoria",
      "photo_url": "https://...",
      "manager_id": null,
      "email": "joao@empresa.com",
      "phone": "(11) 99999-9999",
      "hire_date": "2020-01-15",
      "employee_number": "001",
      "isAbsent": false
    }
  ],
  "count": 150
}
```

### POST /api/organogram/update
Atualiza a hierarquia de um funcionário (muda gestor).

**Request:**
```json
{
  "employeeId": "uuid",
  "newManagerId": "uuid" // ou null para root
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hierarquia atualizada com sucesso",
  "data": {
    "employeeId": "uuid",
    "oldManagerId": "uuid",
    "newManagerId": "uuid"
  }
}
```

**Validações:**
- ✅ Funcionário não pode ser seu próprio gestor
- ✅ Detecta e previne ciclos
- ✅ Verifica permissões (admin, hr_manager)

## Algoritmos de Layout

### Top-Down (Padrão)
Hierarquia tradicional de cima para baixo, CEO no topo.

```typescript
const layout = topDownLayout(hierarchy)
```

### Left-Right
Hierarquia da esquerda para direita, útil para árvores largas.

```typescript
const layout = leftRightLayout(hierarchy)
```

### Compact
Minimiza espaço vertical, mais compacto.

```typescript
const layout = compactLayout(hierarchy)
```

### Radial
Layout circular com CEO no centro, subordinados em anéis.

```typescript
const layout = radialLayout(hierarchy)
```

## Funções Utilitárias

### Construir Hierarquia
```typescript
import { buildHierarchyTree } from '@/lib/organogram/hierarchy'

const hierarchy = buildHierarchyTree(employees)
// Retorna: OrgNode[]
```

### Buscar Funcionário
```typescript
import { findEmployeeInTree } from '@/lib/organogram/hierarchy'

const node = findEmployeeInTree(hierarchy, employeeId)
// Retorna: OrgNode | null
```

### Obter Subordinados
```typescript
import { getSubordinates } from '@/lib/organogram/hierarchy'

const subs = getSubordinates(employeeId, employees)
// Retorna: Employee[]
```

### Cadeia de Gestores
```typescript
import { getManagerChain } from '@/lib/organogram/hierarchy'

const chain = getManagerChain(employeeId, employees)
// Retorna: Employee[] (do gestor direto ao CEO)
```

### Validar Mudança
```typescript
import { validateHierarchyChange } from '@/lib/organogram/hierarchy'

const result = validateHierarchyChange(employeeId, newManagerId, employees)
// Retorna: { valid: boolean, errors: string[], warnings: string[] }
```

### Calcular Estatísticas
```typescript
import { calculateStatistics } from '@/lib/organogram/hierarchy'

const stats = calculateStatistics(hierarchy, employees)
// Retorna: OrgStatistics
```

### Exportações
```typescript
import {
  exportToPNG,
  exportToPDF,
  exportToJSON,
  exportToCSV,
  shareOrgChart
} from '@/lib/organogram/export'

// PNG
await exportToPNG(svgElement, 'organograma.png', 2) // quality: 2x

// PDF
await exportToPDF(svgElement, 'organograma.pdf', 'a4')

// JSON
exportToJSON(hierarchy, 'organograma.json')

// CSV
exportToCSV(hierarchy, 'organograma.csv')

// Compartilhar
const url = await shareOrgChart({ department: 'TI' })
```

## Tipos TypeScript

### OrgNode
```typescript
interface OrgNode {
  id: string
  name: string
  jobTitle: string
  department: string | null
  avatarUrl?: string | null
  managerId?: string | null
  level: number
  subordinates: OrgNode[]
  isAbsent?: boolean
  email?: string
  phone?: string
  hireDate?: string
  employeeNumber?: string
}
```

### OrgStatistics
```typescript
interface OrgStatistics {
  totalEmployees: number
  departments: number
  averageSpanOfControl: number
  maxTreeDepth: number
  employeesWithoutManager: number
}
```

### ValidationResult
```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

## Uso na Aplicação

### Acessar Organograma
Navegue para: `/funcionarios/organograma`

### Interações Disponíveis

1. **Visualizar Hierarquia**
   - Zoom com mouse wheel
   - Pan com drag
   - Clique em node para ver detalhes

2. **Buscar Funcionário**
   - Clique em "Buscar"
   - Digite nome, cargo ou email
   - Filtre por departamento ou nível
   - Clique no resultado para centralizar

3. **Ver Detalhes**
   - Clique em qualquer node
   - Painel lateral abre com informações
   - Clique em gestor/subordinados para navegar
   - Caminho hierárquico é destacado

4. **Mudar Layout**
   - Selecione layout no dropdown
   - Organograma reorganiza automaticamente

5. **Exportar**
   - Clique em "Exportar"
   - Escolha formato (PNG, PDF, JSON, CSV)
   - Arquivo é baixado

6. **Compartilhar**
   - Clique em "Compartilhar"
   - Link é copiado para clipboard
   - Cole para compartilhar visão atual

## Personalizações Futuras

### Modo de Edição (TODO)
- Drag & drop para reorganizar hierarquia
- Validação em tempo real
- Confirmação de mudanças

### Features Avançadas (TODO)
- Comparar estrutura ao longo do tempo
- Análise de span of control excessivo
- Sugestões de reorganização
- Custo por departamento/hierarquia
- Timeline de mudanças

### Integrações (TODO)
- Sincronização com ausências em tempo real
- Notificações de mudanças na hierarquia
- Histórico de mudanças (audit log)
- Exportação para sistemas externos (ERP)

## Dependências

- **@xyflow/react**: ^12.0.0 - Biblioteca para grafos interativos
- **jspdf**: ^4.0.0 - Geração de PDF (dynamic import)
- **lucide-react**: ^0.563.0 - Ícones
- **next**: 16.1.4
- **react**: 19.2.3

## Performance

### Otimizações Implementadas
- ✅ Memoização com `useMemo` para cálculos pesados
- ✅ Callbacks com `useCallback` para evitar re-renders
- ✅ React Flow com virtualização embutida
- ✅ API retorna apenas campos necessários
- ✅ Dynamic import do jsPDF (reduz bundle)

### Benchmarks Esperados
- **100 funcionários**: Renderização instantânea (<100ms)
- **500 funcionários**: Renderização rápida (<500ms)
- **1000+ funcionários**: Renderização aceitável (<2s)

Para árvores muito grandes (2000+), considerar:
- Virtualização adicional
- Lazy loading de níveis profundos
- Simplificação visual em zoom baixo

## Troubleshooting

### Organograma não carrega
- Verificar se há funcionários cadastrados
- Verificar console para erros de API
- Verificar autenticação

### Ciclo detectado ao mudar gestor
- Isso é esperado! Validação está funcionando
- Não é possível criar ciclos na hierarquia
- Escolha outro gestor

### Export PDF não funciona
- Verificar se jsPDF está instalado
- Verificar console para erros de dynamic import
- Testar com export PNG primeiro

### Performance lenta
- Verificar número de funcionários
- Considerar layout "compact"
- Limpar filtros de busca

## Suporte

Para dúvidas ou problemas, consulte a documentação do React Flow:
https://reactflow.dev/

---

**Implementado por:** Claude Code Agent
**Data:** 2026-01-29
**Versão:** 1.0.0
