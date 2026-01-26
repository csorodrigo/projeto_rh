/**
 * Supabase Configuration Validator
 * Validates that Supabase is properly configured
 */

import { createClient } from '@/lib/supabase/client';

async function validateSupabase() {
  console.log('🔍 Validating Supabase configuration...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    process.exit(1);
  }
  console.log('✅ Environment variables are set\n');

  // Test connection
  console.log('2. Testing Supabase connection...');
  const supabase = createClient();

  try {
    const { data, error } = await supabase.from('companies').select('count');
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase\n');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    process.exit(1);
  }

  // Check tables
  console.log('3. Checking database tables...');
  const tables = [
    'companies',
    'profiles',
    'employees',
    'employee_documents',
    'time_entries',
    'work_schedules',
    'absences',
    'asos',
    'medical_certificates',
    'evaluation_cycles',
    'evaluations',
    'pdis',
    'pdi_checkins',
    'payrolls',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      console.log(`  ✅ ${table}`);
    } catch (error) {
      console.error(`  ❌ ${table}: Table not found or no access`);
    }
  }

  console.log('\n4. Checking authentication...');
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      console.log(`✅ User authenticated: ${user.email}`);
    } else {
      console.log('ℹ️  No user currently authenticated (this is OK)');
    }
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }

  console.log('\n✨ Validation complete!');
}

validateSupabase().catch(console.error);
