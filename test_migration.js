/**
 * Script de Validação da Migração 018
 * Verifica se as colunas full_name e photo_url existem na tabela employees
 */

const { createClient } = require('@supabase/supabase-js');

// Lendo as variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateMigration() {
  console.log('🔍 Validando Migração 018...\n');

  // 1. Verificar estrutura da tabela employees
  console.log('1️⃣ Verificando colunas da tabela employees:');
  const { data: columns, error: columnsError } = await supabase
    .from('employees')
    .select('*')
    .limit(1);

  if (columnsError) {
    console.error('❌ Erro ao consultar employees:', columnsError);
    return;
  }

  if (columns && columns.length > 0) {
    const employee = columns[0];
    const hasFullName = 'full_name' in employee;
    const hasPhotoUrl = 'photo_url' in employee;

    console.log(`   - full_name: ${hasFullName ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   - photo_url: ${hasPhotoUrl ? '✅ Existe' : '❌ Não existe'}`);

    if (hasFullName && hasPhotoUrl) {
      console.log('\n✅ Migração aplicada com sucesso!\n');
    } else {
      console.log('\n❌ Migração NÃO foi aplicada corretamente!\n');
      console.log('Colunas disponíveis:', Object.keys(employee).join(', '));
    }
  }

  // 2. Testar query que estava gerando erro 400
  console.log('\n2️⃣ Testando query que gerava erro 400:');
  const { data: employees, error: queryError } = await supabase
    .from('employees')
    .select('id, name, full_name, department, photo_url')
    .eq('status', 'active')
    .limit(5);

  if (queryError) {
    console.error('❌ Erro na query:', queryError);
    console.error('   Código:', queryError.code);
    console.error('   Mensagem:', queryError.message);
    console.error('   Detalhes:', queryError.details);
  } else {
    console.log(`✅ Query executada com sucesso! Retornou ${employees?.length || 0} funcionários.`);

    if (employees && employees.length > 0) {
      console.log('\nExemplo de funcionário:');
      console.log(JSON.stringify(employees[0], null, 2));
    }
  }
}

validateMigration()
  .then(() => {
    console.log('\n✅ Validação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante validação:', error);
    process.exit(1);
  });
