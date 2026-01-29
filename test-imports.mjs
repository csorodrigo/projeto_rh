// Test script to validate imports
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const filesToCheck = [
  'src/components/relatorios/report-category-card.tsx',
  'src/components/relatorios/empty-state.tsx',
  'src/components/config/automation-card.tsx',
  'src/components/config/automations-settings.tsx',
  'src/components/support/chat-widget.tsx',
  'src/components/empty-states/generic-empty-state.tsx',
  'src/app/(dashboard)/layout.tsx',
  'src/app/(dashboard)/config/page.tsx',
  'src/app/(dashboard)/relatorios/page.tsx',
];

let errors = 0;
let warnings = 0;

console.log('🔍 Validating files...\n');

for (const file of filesToCheck) {
  const fullPath = join(process.cwd(), file);

  if (!existsSync(fullPath)) {
    console.log(`❌ File not found: ${file}`);
    errors++;
    continue;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    // Check for common issues
    const issues = [];

    // Check for missing "use client"
    if (file.includes('components/') && content.includes('useState') && !content.includes('"use client"')) {
      issues.push('Missing "use client" directive but uses React hooks');
    }

    // Check for unclosed braces (basic check)
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check for common import issues
    if (content.includes("from '@/") && !content.includes('import')) {
      issues.push('Possible import syntax error');
    }

    if (issues.length > 0) {
      console.log(`⚠️  ${file}:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      warnings++;
    } else {
      console.log(`✅ ${file}`);
    }
  } catch (error) {
    console.log(`❌ Error reading ${file}: ${error.message}`);
    errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Valid files: ${filesToCheck.length - errors - warnings}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log(`   ❌ Errors: ${errors}`);

if (errors > 0) {
  process.exit(1);
}
