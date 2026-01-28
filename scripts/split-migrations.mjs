import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
const outputDir = join(__dirname, '..', 'supabase', 'migrations_split');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

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

// Group migrations into batches for easier execution
const batches = [
  { name: 'batch_01_setup', files: ['000_setup.sql', '001_companies.sql', '002_profiles.sql'] },
  { name: 'batch_02_employees', files: ['003_employees.sql', '004_employee_documents.sql'] },
  { name: 'batch_03_time', files: ['005_time_tracking.sql', '006_work_schedules.sql'] },
  { name: 'batch_04_absences', files: ['007_absences.sql', '008_health.sql'] },
  { name: 'batch_05_evaluations', files: ['009_evaluations.sql', '010_pdi.sql'] },
  { name: 'batch_06_payroll', files: ['011_payroll.sql'] },
  { name: 'batch_07_finalize', files: ['012_finalize.sql', '013_storage_buckets.sql'] },
  { name: 'batch_08_enhancements', files: ['014_time_tracking_enhancements.sql', '015_time_tracking_rls_and_functions.sql'] },
];

function main() {
  console.log('🔧 Splitting migrations into batches...\n');

  for (const batch of batches) {
    let batchSQL = `-- =====================================================
-- ${batch.name.toUpperCase()}
-- Files: ${batch.files.join(', ')}
-- =====================================================

`;

    for (const filename of batch.files) {
      const filepath = join(migrationsDir, filename);
      try {
        const sql = readFileSync(filepath, 'utf8');
        batchSQL += `
-- FILE: ${filename}
-- =====================================================

${sql}

`;
        console.log(`   ✅ Added ${filename} to ${batch.name}`);
      } catch (err) {
        console.log(`   ⚠️  File not found: ${filename}`);
      }
    }

    const outputFile = join(outputDir, `${batch.name}.sql`);
    writeFileSync(outputFile, batchSQL);

    const lines = batchSQL.split('\n').length;
    console.log(`\n📦 ${batch.name}.sql created (${lines} lines)\n`);
  }

  console.log('\n✅ All batches created in:', outputDir);
  console.log('\n📍 Execute in order:');
  batches.forEach((b, i) => {
    console.log(`   ${i + 1}. ${b.name}.sql`);
  });
}

main();
