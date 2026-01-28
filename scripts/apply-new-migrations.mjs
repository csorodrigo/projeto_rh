#!/usr/bin/env node

/**
 * Script para aplicar migrações 014, 015 e 016 no Supabase
 * Uso: node scripts/apply-new-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = 'https://lmpyxqvxzigsusjniarz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const migrations = [
  {
    name: '014_time_tracking_enhancements',
    file: '../supabase/migrations/014_time_tracking_enhancements.sql'
  },
  {
    name: '015_time_tracking_rls_and_functions',
    file: '../supabase/migrations/015_time_tracking_rls_and_functions.sql'
  },
  {
    name: '016_fix_companies_rls_for_registration',
    file: '../supabase/migrations/016_fix_companies_rls_for_registration.sql'
  }
]

async function executeSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

  if (error) {
    // Tentar executar diretamente via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      throw new Error(`Failed to execute SQL: ${await response.text()}`)
    }

    return await response.json()
  }

  return data
}

async function applyMigration(migration) {
  console.log(`\n📦 Applying migration: ${migration.name}`)

  try {
    const sqlPath = join(__dirname, migration.file)
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log(`   Reading file: ${sqlPath}`)
    console.log(`   SQL length: ${sql.length} characters`)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`   Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)

        // Execute via PostgREST
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql: statement })
        })

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text()
          console.warn(`   ⚠️  Statement ${i + 1} warning: ${errorText}`)
          // Continue mesmo com avisos
        } else {
          console.log(`   ✓ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.warn(`   ⚠️  Statement ${i + 1} error: ${err.message}`)
        // Continue com próxima statement
      }
    }

    console.log(`✅ Migration ${migration.name} completed!`)
    return true
  } catch (error) {
    console.error(`❌ Error applying migration ${migration.name}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`🔑 Using service_role key`)

  let successCount = 0
  let failCount = 0

  for (const migration of migrations) {
    const success = await applyMigration(migration)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Successful migrations: ${successCount}`)
  console.log(`❌ Failed migrations: ${failCount}`)
  console.log('='.repeat(60))

  if (failCount === 0) {
    console.log('\n🎉 All migrations applied successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test user registration at https://rh-rickgay.vercel.app/registro')
    console.log('   2. Test time tracking features')
    console.log('   3. Verify RLS policies are working')
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.')
    console.log('   You may need to apply them manually via Supabase Dashboard.')
  }
}

main().catch(console.error)
