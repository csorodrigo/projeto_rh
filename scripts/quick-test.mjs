import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lmpyxqvxzigsusjniarz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU'
)

console.log('🧪 Teste Rápido - Migração 018\n')

// Teste 1: Verificar colunas
console.log('1. Testando colunas full_name e photo_url...')
const { data, error } = await supabase
  .from('employees')
  .select('name, full_name, photo_url')
  .limit(1)

if (error) {
  console.log('❌ ERRO:', error.message)
  if (error.code === '42703') {
    console.log('\n⚠️  Migração 018 NÃO foi aplicada!')
    console.log('Execute o SQL no Supabase Dashboard.')
  }
} else {
  console.log('✅ Colunas existem!')
  if (data && data.length > 0) {
    console.log('   name:', data[0].name)
    console.log('   full_name:', data[0].full_name)
    console.log('   photo_url:', data[0].photo_url || '(null)')

    if (data[0].name === data[0].full_name) {
      console.log('\n✅ Generated column funcionando corretamente!')
    }
  }
}

// Teste 2: Verificar profiles
console.log('\n2. Testando query getCurrentProfile...')
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, company_id, name, email, role, employee_id, avatar_url')
  .limit(1)
  .single()

if (profileError && profileError.code !== 'PGRST116') {
  console.log('❌ ERRO:', profileError.message)
} else if (profile) {
  console.log('✅ Query funciona!')
  console.log('   employee_id:', profile.employee_id || '(null - não vinculado)')
} else {
  console.log('⚠️  Nenhum perfil cadastrado')
}

console.log('\n✅ Testes concluídos!')
