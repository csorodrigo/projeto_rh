import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://lmpyxqvxzigsusjniarz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

async function getMigrationFiles() {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.split('_')[0]) || 0;
      const numB = parseInt(b.split('_')[0]) || 0;
      return numA - numB;
    });
  return files;
}

async function applyMigration(filename) {
  const filepath = join(migrationsDir, filename);
  const sql = readFileSync(filepath, 'utf8');

  console.log(`\n📦 Applying: ${filename}`);

  try {
    // Use rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative: split and execute statements
      throw error;
    }

    console.log(`   ✅ Success`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');

  const { data, error } = await supabase
    .from('_migrations_test_')
    .select('*')
    .limit(1);

  if (error && error.code === '42P01') {
    // Table doesn't exist - that's expected, connection works
    console.log('✅ Connection successful (database is clean)');
    return true;
  } else if (error) {
    console.log(`❌ Connection error: ${error.message}`);
    return false;
  }

  console.log('✅ Connection successful');
  return true;
}

async function main() {
  console.log('🚀 Supabase Migration Script');
  console.log(`📍 Project: ${SUPABASE_URL}`);
  console.log('');

  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️  Cannot connect to Supabase. Please check credentials.');
    process.exit(1);
  }

  const files = await getMigrationFiles();
  console.log(`\n📋 Found ${files.length} migration files:`);
  files.forEach(f => console.log(`   - ${f}`));

  console.log('\n⚠️  Note: Supabase JS client cannot execute raw DDL SQL.');
  console.log('   You need to apply migrations via Supabase Dashboard SQL Editor');
  console.log('   or use the Supabase CLI with proper authentication.');
  console.log('\n📍 Dashboard URL: https://supabase.com/dashboard/project/lmpyxqvxzigsusjniarz/sql');
}

main().catch(console.error);
