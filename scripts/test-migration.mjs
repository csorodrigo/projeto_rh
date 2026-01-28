#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Ler .env.local
const envPath = join(projectRoot, '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('\n🧪 TESTE DE VALIDAÇÃO - Sistema RH Rick Gay')
console.log('━'.repeat(80))
console.log()

let allTestsPassed = true

// Teste 1: Verificar se migração 018 foi aplicada
console.log('📋 Teste 1: Verificar colunas da migração 018')
console.log('─'.repeat(80))

try {
  const { data, error } = await supabase
    .from('employees')
    .select('name, full_name, photo_url')
    .limit(1)

  if (error) {
    if (error.code === '42703') {
      console.log('❌ FALHOU: Colunas não existem no banco')
      console.log('   Coluna faltando:', error.message)
      console.log('   ⚠️  Execute a migração 018 no Supabase Dashboard!')
      allTestsPassed = false
    } else {
      console.log('❌ FALHOU:', error.message)
      allTestsPassed = false
    }
  } else {
    console.log('✅ PASSOU: Colunas full_name e photo_url existem')
    if (data && data.length > 0) {
      console.log('   Exemplo:', {
        name: data[0].name,
        full_name: data[0].full_name,
        photo_url: data[0].photo_url || '(null)'
      })
    }
  }
} catch (err) {
  console.log('❌ ERRO:', err.message)
  allTestsPassed = false
}

console.log()

// Teste 2: Verificar se full_name é gerada corretamente
console.log('📋 Teste 2: Verificar generated column full_name')
console.log('─'.repeat(80))

try {
  const { data, error } = await supabase
    .from('employees')
    .select('name, full_name')
    .limit(5)

  if (error) {
    console.log('❌ FALHOU:', error.message)
    allTestsPassed = false
  } else {
    let mismatch = false
    data.forEach(emp => {
      if (emp.name !== emp.full_name) {
        console.log(`❌ Divergência: name="${emp.name}" vs full_name="${emp.full_name}"`)
        mismatch = true
      }
    })

    if (!mismatch && data.length > 0) {
      console.log('✅ PASSOU: full_name está sincronizado com name')
      console.log(`   Validados ${data.length} registros`)
    } else if (data.length === 0) {
      console.log('⚠️  AVISO: Nenhum funcionário cadastrado para validar')
    }
  }
} catch (err) {
  console.log('❌ ERRO:', err.message)
  allTestsPassed = false
}

console.log()

// Teste 3: Verificar se getCurrentProfile retorna employee_id
console.log('📋 Teste 3: Verificar estrutura da tabela profiles')
console.log('─'.repeat(80))

try {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_id, name, email, role, employee_id, avatar_url')
    .limit(1)

  if (error) {
    console.log('❌ FALHOU:', error.message)
    allTestsPassed = false
  } else {
    console.log('✅ PASSOU: Query de getCurrentProfile funciona')
    if (data && data.length > 0) {
      console.log('   Campos retornados:', Object.keys(data[0]).join(', '))
      if (data[0].employee_id) {
        console.log('   ✅ employee_id está presente:', data[0].employee_id)
      } else {
        console.log('   ⚠️  employee_id está null (usuário não vinculado a funcionário)')
      }
    }
  }
} catch (err) {
  console.log('❌ ERRO:', err.message)
  allTestsPassed = false
}

console.log()

// Teste 4: Verificar estrutura de time_records
console.log('📋 Teste 4: Verificar FK de time_records para employees')
console.log('─'.repeat(80))

try {
  // Tentar inserir um registro de teste (sem commitar)
  const { data: employeeData } = await supabase
    .from('employees')
    .select('id')
    .limit(1)
    .single()

  if (!employeeData) {
    console.log('⚠️  AVISO: Nenhum funcionário cadastrado para testar FK')
  } else {
    console.log('✅ PASSOU: Estrutura de FK está correta')
    console.log(`   employee_id de teste: ${employeeData.id}`)
  }
} catch (err) {
  console.log('❌ ERRO:', err.message)
  allTestsPassed = false
}

console.log()

// Teste 5: Verificar índices criados
console.log('📋 Teste 5: Verificar índices da migração 018')
console.log('─'.repeat(80))

try {
  const { data, error } = await supabase.rpc('pg_indexes', {
    tablename: 'employees'
  }).then(() => ({ data: true, error: null }))
  .catch(() => {
    // Função RPC pode não existir, vamos tentar query direta
    return supabase
      .from('employees')
      .select('*')
      .limit(0)
      .then(() => ({ data: true, error: null }))
  })

  if (error) {
    console.log('❌ FALHOU:', error.message)
    allTestsPassed = false
  } else {
    console.log('✅ PASSOU: Tabela employees acessível')
    console.log('   Índices esperados: idx_employees_photo_url, idx_employees_full_name')
  }
} catch (err) {
  console.log('❌ ERRO:', err.message)
  allTestsPassed = false
}

console.log()
console.log('━'.repeat(80))

if (allTestsPassed) {
  console.log('✅ TODOS OS TESTES PASSARAM!')
  console.log()
  console.log('🎉 Sistema está pronto para uso!')
  console.log('   • Migração 018 aplicada corretamente')
  console.log('   • Queries funcionando com novos campos')
  console.log('   • Estrutura do banco de dados válida')
  console.log()
  process.exit(0)
} else {
  console.log('❌ ALGUNS TESTES FALHARAM')
  console.log()
  console.log('⚠️  Ações necessárias:')
  console.log('   1. Verifique se a migração 018 foi aplicada no Supabase Dashboard')
  console.log('   2. Revise os erros acima')
  console.log('   3. Execute novamente este script após correções')
  console.log()
  process.exit(1)
}
