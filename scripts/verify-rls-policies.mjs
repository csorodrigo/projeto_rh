#!/usr/bin/env node

/**
 * Script para verificar e corrigir RLS policies das tabelas de ponto
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lmpyxqvxzigsusjniarz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkRLS() {
  console.log('🔍 Verificando RLS policies...\n')

  const tables = ['time_records', 'time_tracking_daily', 'time_bank', 'employees']

  for (const table of tables) {
    console.log(`📋 Tabela: ${table}`)

    try {
      // Tentar ler dados (vai falhar se RLS estiver bloqueando)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST204') {
          console.log(`  ❌ Erro: Tabela não encontrada ou schema cache desatualizado`)
        } else if (error.code === '42501') {
          console.log(`  ❌ Erro RLS: ${error.message}`)
        } else {
          console.log(`  ⚠️  Erro: ${error.code} - ${error.message}`)
        }
      } else {
        console.log(`  ✅ Acesso OK (${data?.length || 0} registros)`)
      }
    } catch (err) {
      console.log(`  ❌ Exceção: ${err.message}`)
    }

    console.log()
  }

  console.log('\n💡 Sugestão: Verificar se as migrações 014 e 015 foram aplicadas corretamente.')
  console.log('💡 Se o erro for PGRST204, pode ser necessário recarregar o schema cache do PostgREST.')
}

checkRLS().catch(console.error)
