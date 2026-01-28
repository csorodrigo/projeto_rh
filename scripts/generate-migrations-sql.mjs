import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
const outputFile = join(__dirname, '..', 'supabase', 'all_migrations.sql');

function getMigrationFiles() {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.split('_')[0]) || 0;
      const numB = parseInt(b.split('_')[0]) || 0;
      return numA - numB;
    });
  return files;
}

function main() {
  console.log('🔧 Generating consolidated migrations SQL...\n');

  const files = getMigrationFiles();
  console.log(`📋 Found ${files.length} migration files:`);

  let consolidatedSQL = `-- =====================================================
-- CONSOLIDATED MIGRATIONS
-- Generated: ${new Date().toISOString()}
-- Project: rh-rick (lmpyxqvxzigsusjniarz)
-- =====================================================

`;

  for (const filename of files) {
    console.log(`   ✅ ${filename}`);
    const filepath = join(migrationsDir, filename);
    const sql = readFileSync(filepath, 'utf8');

    consolidatedSQL += `
-- =====================================================
-- FILE: ${filename}
-- =====================================================

${sql}

`;
  }

  writeFileSync(outputFile, consolidatedSQL);

  console.log(`\n✅ Consolidated SQL written to: ${outputFile}`);
  console.log(`\n📍 Next steps:`);
  console.log(`   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/lmpyxqvxzigsusjniarz/sql`);
  console.log(`   2. Copy the contents of ${outputFile}`);
  console.log(`   3. Paste and execute in the SQL Editor`);
  console.log(`\n   Or use the Supabase CLI:`);
  console.log(`   supabase db push --db-url postgresql://postgres.[ref]:[password]@...\n`);
}

main();
