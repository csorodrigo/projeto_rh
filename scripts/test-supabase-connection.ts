/**
 * Script para testar conexão com Supabase
 * Verifica se as credenciais estão corretas e se o banco está acessível
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  // 1. Verificar credenciais
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais não encontradas!');
    console.error('Certifique-se de que .env.local está configurado.');
    process.exit(1);
  }

  console.log('✅ Credenciais encontradas');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  // 2. Criar cliente
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Testar conexão básica
    console.log('🔌 Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Erro ao conectar:', healthError.message);
      process.exit(1);
    }

    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 4. Listar tabelas disponíveis
    console.log('📋 Verificando tabelas...');

    const tables = [
      'companies',
      'profiles',
      'employees',
      'employee_documents',
      'signings',
      'work_schedules',
      'absences',
      'health_records',
      'evaluations',
      'pdi_plans',
      'pdi_goals',
      'payroll',
      'payroll_items',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    }

    console.log('\n📊 Contando registros...');

    // 5. Contar registros em cada tabela
    const counts = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('absences').select('*', { count: 'exact', head: true }),
    ]);

    console.log(`   Empresas: ${counts[0].count || 0}`);
    console.log(`   Perfis: ${counts[1].count || 0}`);
    console.log(`   Funcionários: ${counts[2].count || 0}`);
    console.log(`   Ausências: ${counts[3].count || 0}`);

    // 6. Verificar storage buckets
    console.log('\n📦 Verificando Storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('   ❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      if (buckets && buckets.length > 0) {
        console.log(`   ✅ ${buckets.length} bucket(s) encontrado(s):`);
        buckets.forEach(bucket => {
          console.log(`      - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
      } else {
        console.log('   ⚠️  Nenhum bucket configurado');
      }
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Se não há dados, execute o seed script');
    console.log('   2. Configure os buckets de storage (photos, documents, logos)');
    console.log('   3. Verifique as políticas RLS no dashboard do Supabase\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar teste
testConnection();
