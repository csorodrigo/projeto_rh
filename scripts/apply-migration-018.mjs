import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Ler .env.local manualmente
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

function displayMigrationInstructions() {
  console.log('🚀 Migração 018: Schema Compatibility\n')

  try {
    // Ler arquivo de migração
    const migrationPath = join(projectRoot, 'supabase/migrations/018_schema_compatibility.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQL preparado:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))
    console.log()

    console.log('⚠️  O Supabase client JavaScript não suporta execução direta de DDL.')
    console.log('📋 Execute a migração de uma das seguintes formas:\n')

    console.log('🔹 OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)')
    console.log('   1. Acesse: https://lmpyxqvxzigsusjniarz.supabase.co/project/_/sql/new')
    console.log('   2. Cole o SQL acima')
    console.log('   3. Clique em "Run"\n')

    console.log('🔹 OPÇÃO 2: Via Supabase CLI')
    console.log('   Execute: npx supabase db push\n')

    console.log('✅ Após executar, as colunas `full_name` e `photo_url` estarão disponíveis')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

displayMigrationInstructions()
