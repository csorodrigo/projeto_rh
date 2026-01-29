/**
 * Script de teste simples para Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local manualmente
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais não encontradas!');
  process.exit(1);
}

console.log('✅ Credenciais encontradas');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Testar conexão
console.log('🔌 Testando tabelas...\n');

const tables = [
  'companies',
  'profiles',
  'employees',
  'signings',
  'absences',
];

for (const table of tables) {
  try {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${table.padEnd(20)} - Erro: ${error.message}`);
    } else {
      console.log(`   ✅ ${table.padEnd(20)} - ${count} registros`);
    }
  } catch (err) {
    console.log(`   ❌ ${table.padEnd(20)} - Erro: ${err.message}`);
  }
}

console.log('\n✅ Teste concluído!');
