# Teste do Sistema de Importação

## Checklist de Teste

### 1. Instalação
- [x] xlsx instalado
- [x] papaparse já instalado
- [x] @radix-ui/react-checkbox instalando

### 2. Arquivos Criados

#### Bibliotecas
- [x] src/lib/import/types.ts
- [x] src/lib/import/csv-parser.ts
- [x] src/lib/import/excel-parser.ts
- [x] src/lib/import/validators.ts
- [x] src/lib/import/import-service.ts
- [x] src/lib/import/index.ts

#### Componentes
- [x] src/components/import/FileUploader.tsx
- [x] src/components/import/PreviewTable.tsx
- [x] src/components/import/ImportProgress.tsx
- [x] src/components/import/ImportResult.tsx
- [x] src/components/import/ImportWizard.tsx
- [x] src/components/import/index.tsx

#### UI
- [x] src/components/ui/checkbox.tsx

#### Página
- [x] src/app/(dashboard)/funcionarios/importar/page.tsx (atualizada)

#### Template
- [x] public/templates/funcionarios_template.csv

#### Documentação
- [x] README_IMPORT.md

### 3. Funcionalidades

#### Upload
- [ ] Drag & drop de arquivo
- [ ] Seleção de arquivo por clique
- [ ] Validação de tipo (.csv, .xlsx, .xls)
- [ ] Validação de tamanho (10MB)
- [ ] Preview do arquivo selecionado
- [ ] Botão para remover arquivo

#### Parsing
- [ ] Parse de CSV
- [ ] Parse de Excel (.xlsx)
- [ ] Parse de Excel (.xls)
- [ ] Normalização de headers
- [ ] Conversão de datas brasileiras
- [ ] Normalização de status
- [ ] Tratamento de erros

#### Validação
- [ ] Validação de campos obrigatórios
- [ ] Validação de CPF (algoritmo)
- [ ] Validação de email
- [ ] Validação de datas
- [ ] Validação de idade
- [ ] Validação de salário
- [ ] Detecção de duplicados no arquivo
- [ ] Detecção de duplicados no banco
- [ ] Avisos não bloqueantes

#### Preview
- [ ] Tabela com dados
- [ ] Paginação (10 por página)
- [ ] Indicadores de status (✅⚠️❌)
- [ ] Tooltips com erros/avisos
- [ ] Checkboxes de seleção
- [ ] Botão "Selecionar Válidas"
- [ ] Summary com contadores
- [ ] Desabilitar linhas inválidas

#### Importação
- [ ] Progress bar
- [ ] Importação em lotes de 50
- [ ] Atualização em tempo real
- [ ] Tratamento de erros individuais
- [ ] Mensagens de feedback

#### Resultado
- [ ] Cards com estatísticas
- [ ] Tabela de erros
- [ ] Download de log de erros
- [ ] Botão para nova importação
- [ ] Botão para listagem

#### Template
- [ ] Download de template CSV
- [ ] Template com exemplos válidos

### 4. Testes Manuais

#### Teste 1: Upload Básico
1. Acesse /funcionarios/importar
2. Baixe o template
3. Faça upload do template
4. Verifique se os dados aparecem corretamente
5. Importe os dados
6. Verifique se foram salvos no banco

#### Teste 2: Validação
1. Crie um CSV com erros:
   - CPF inválido
   - Email inválido
   - Data inválida
   - Nome muito curto
2. Faça upload
3. Verifique se os erros são detectados
4. Verifique se as linhas inválidas estão marcadas
5. Tente importar (deve falhar)

#### Teste 3: Avisos
1. Crie um CSV com avisos:
   - Campos opcionais vazios
   - Salário baixo
   - Data de admissão futura
2. Faça upload
3. Verifique se os avisos aparecem
4. Importe (deve ter sucesso com avisos)

#### Teste 4: Duplicados
1. Crie um CSV com CPFs duplicados
2. Faça upload
3. Verifique se duplicados são detectados
4. Tente importar funcionário já cadastrado
5. Verifique se é bloqueado

#### Teste 5: Excel
1. Crie arquivo .xlsx com dados válidos
2. Faça upload
3. Verifique parsing
4. Importe

#### Teste 6: Grande Volume
1. Crie CSV com 100+ funcionários
2. Faça upload
3. Verifique paginação
4. Selecione todos válidos
5. Importe
6. Verifique progress bar

#### Teste 7: Formato Brasileiro
1. Use datas em formato DD/MM/YYYY
2. Use status em português
3. Use headers em português
4. Verifique se é normalizado corretamente

### 5. Próximos Passos

1. Aguardar instalação do @radix-ui/react-checkbox
2. Executar `npm run build` para verificar erros de build
3. Executar `npm run dev` para testar localmente
4. Realizar testes manuais
5. Corrigir bugs encontrados
6. Adicionar testes unitários
7. Adicionar testes E2E

### 6. Comandos para Build

```bash
# Verificar se há erros de TypeScript
npm run build

# Rodar em desenvolvimento
npm run dev

# Acessar
http://localhost:3000/funcionarios/importar
```

### 7. Possíveis Problemas

1. **Checkbox não renderiza**: Aguardar instalação do @radix-ui/react-checkbox
2. **Erro de import**: Verificar se todos os imports estão corretos
3. **Erro de tipo**: Verificar tipos do Employee vs ParsedEmployee
4. **Erro no Supabase**: Verificar permissões e RLS
5. **Timeout**: Reduzir tamanho do lote ou aumentar timeout

### 8. Melhorias Identificadas Durante Desenvolvimento

- Adicionar cancelamento de importação
- Adicionar retry automático em caso de erro
- Melhorar mensagens de erro
- Adicionar suporte para update de registros existentes
- Adicionar histórico de importações
- Adicionar rollback
