# Guia Rápido - Sistema de Importação

## Início Rápido (5 minutos)

### 1. Instalação
```bash
# As dependências já foram instaladas
npm install  # Caso precise reinstalar
```

### 2. Iniciar Aplicação
```bash
npm run dev
```

### 3. Acessar
```
http://localhost:3000/funcionarios/importar
```

### 4. Usar

1. **Baixar Template**
   - Clique em "Baixar Template"
   - Ou use: `/public/templates/funcionarios_template.csv`

2. **Preencher Template**
   ```csv
   name,cpf,personal_email,birth_date,hire_date,position,department,base_salary,status,personal_phone
   João Silva,12345678901,joao@email.com,1990-01-15,2024-01-01,Desenvolvedor,TI,5000.00,active,11999999999
   ```

3. **Upload**
   - Arraste o arquivo para a área de upload
   - Ou clique para selecionar

4. **Validar**
   - Revise os dados na tabela
   - Verifique indicadores: ✅ (válido), ⚠️ (aviso), ❌ (erro)
   - Selecione os funcionários a importar

5. **Importar**
   - Clique em "Importar X Funcionários"
   - Aguarde o progress bar
   - Veja o resultado

## Campos do Template

### Obrigatórios
- `name`: Nome completo
- `cpf`: CPF (11 dígitos, sem pontos/traços)
- `birth_date`: Data de nascimento (YYYY-MM-DD ou DD/MM/YYYY)
- `hire_date`: Data de admissão (YYYY-MM-DD ou DD/MM/YYYY)
- `position`: Cargo

### Opcionais
- `personal_email`: Email pessoal
- `department`: Departamento
- `base_salary`: Salário base (número decimal)
- `status`: Status (active, inactive, terminated, on_leave)
- `personal_phone`: Telefone (11 dígitos, sem parênteses/traços)

## Formatos Aceitos

### Arquivos
- CSV (.csv)
- Excel (.xlsx, .xls)

### Datas
- `2024-01-15` (ISO)
- `15/01/2024` (Brasileiro)
- `15-01-2024` (Com traço)

### Status
- `active` ou `ativo`
- `inactive` ou `inativo`
- `terminated` ou `desligado`
- `on_leave` ou `afastado`

## Exemplo Completo

```csv
name,cpf,personal_email,birth_date,hire_date,position,department,base_salary,status,personal_phone
João Silva,12345678901,joao@email.com,1990-01-15,2024-01-01,Desenvolvedor,TI,5000.00,active,11999999999
Maria Santos,98765432100,maria@email.com,1985-05-20,2024-02-01,Analista RH,RH,4500.00,active,11988888888
Pedro Oliveira,11122233344,pedro@email.com,1992-03-10,2024-03-01,Designer,Marketing,4000.00,active,11977777777
Ana Costa,55566677788,ana@email.com,1988-07-25,2024-04-01,Gerente,TI,8000.00,active,11966666666
```

## Validações Importantes

### Erros (bloqueiam importação)
- CPF inválido
- CPF já cadastrado
- Email inválido
- Campos obrigatórios vazios
- Datas inválidas
- Idade < 14 anos na admissão

### Avisos (não bloqueiam)
- Campos opcionais vazios
- Salário abaixo do mínimo
- Data futura

## Troubleshooting Rápido

### Arquivo não carrega
- Verifique o formato (.csv, .xlsx, .xls)
- Verifique o tamanho (máx 10MB)
- Tente converter para CSV

### Muitos erros
- Use o template oficial
- Verifique formato das datas
- Verifique CPFs (11 dígitos)

### Importação falha
- Verifique sua internet
- Tente com menos registros
- Veja o log de erros

## Recursos

- **Template**: `/public/templates/funcionarios_template.csv`
- **Documentação Completa**: `README_IMPORT.md`
- **Testes**: `TESTE_IMPORT.md`
- **Implementação**: `IMPLEMENTACAO_IMPORT.md`

## Dicas

1. Sempre baixe e use o template oficial
2. Teste primeiro com poucos registros
3. Verifique os CPFs antes de importar
4. Use formato ISO para datas (YYYY-MM-DD)
5. Baixe o log de erros se algo falhar

## Suporte

Para mais detalhes, consulte:
- `README_IMPORT.md` - Documentação completa
- `TESTE_IMPORT.md` - Testes e checklist
- `IMPLEMENTACAO_IMPORT.md` - Detalhes técnicos
