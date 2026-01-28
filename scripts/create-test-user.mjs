#!/usr/bin/env node

/**
 * Script para criar usuário de teste diretamente no Supabase
 * Uso: node scripts/create-test-user.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lmpyxqvxzigsusjniarz.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('🚀 Criando usuário de teste...\n')

  const testEmail = 'teste@rhrickgay.com'
  const testPassword = 'Teste123!@#'
  const testName = 'Usuário Teste'
  const companyName = 'RH Rick Gay LTDA'
  const companyCnpj = '11444777000161'

  try {
    // 1. Criar usuário
    console.log('1️⃣ Criando usuário de autenticação...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName
      }
    })

    if (authError) {
      if (authError.message.includes('already')) {
        console.log('⚠️  Usuário já existe, pulando criação...')

        // Buscar usuário existente
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users.find(u => u.email === testEmail)

        if (!existingUser) {
          console.error('❌ Não foi possível encontrar o usuário existente')
          return
        }

        console.log(`✅ Usuário encontrado: ${existingUser.id}`)

        // Continuar com o fluxo usando o usuário existente
        authData.user = existingUser
      } else {
        throw authError
      }
    } else {
      console.log(`✅ Usuário criado: ${authData.user.id}`)
    }

    const userId = authData.user.id

    // 2. Criar empresa
    console.log('\n2️⃣ Criando empresa...')

    // Verificar se já existe
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .limit(1)

    let company
    if (existingCompanies && existingCompanies.length > 0) {
      console.log('⚠️  Empresa já existe, usando existente...')
      company = existingCompanies[0]
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          email: testEmail,
          cnpj: companyCnpj,
          owner_id: userId,
          status: 'active'
        })
        .select()
        .single()

      if (companyError) {
        console.error('❌ Erro ao criar empresa:', companyError)
        return
      }

      company = newCompany
    }

    console.log(`✅ Empresa: ${company.id}`)

    // 3. Criar perfil
    console.log('\n3️⃣ Criando perfil...')

    // Verificar se já existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('⚠️  Perfil já existe, atualizando...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_id: company.id,
          name: testName,
          email: testEmail,
          role: 'admin'
        })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError)
        return
      }
    } else {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          company_id: company.id,
          name: testName,
          email: testEmail,
          role: 'admin'
        })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        return
      }
    }

    console.log('✅ Perfil criado/atualizado')

    // 4. Criar funcionário vinculado
    console.log('\n4️⃣ Criando registro de funcionário...')

    // Verificar se já existe
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('*')
      .eq('cpf', '12345678901')
      .limit(1)

    let employee
    if (existingEmployees && existingEmployees.length > 0) {
      console.log('⚠️  Funcionário já existe, usando existente...')
      employee = existingEmployees[0]
    } else {
      const { data: newEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          company_id: company.id,
          name: testName,
          cpf: '12345678901',
          birth_date: '1990-01-01',
          status: 'active',
          hire_date: new Date().toISOString().split('T')[0],
          position: 'Gerente de RH',
          department: 'Recursos Humanos'
        })
        .select()
        .single()

      if (employeeError) {
        console.error('❌ Erro ao criar funcionário:', employeeError)
        return
      }

      employee = newEmployee
    }

    console.log(`✅ Funcionário: ${employee.id}`)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Usuário de teste criado com sucesso!')
    console.log('='.repeat(60))
    console.log(`\n📧 Email: ${testEmail}`)
    console.log(`🔑 Senha: ${testPassword}`)
    console.log(`👤 User ID: ${userId}`)
    console.log(`🏢 Company ID: ${company.id}`)
    console.log(`👨‍💼 Employee ID: ${employee.id}`)
    console.log(`\n🌐 Login em: https://rh-rickgay.vercel.app/login`)
    console.log('\n✨ Pronto para testar:')
    console.log('   ✓ Login')
    console.log('   ✓ Dashboard')
    console.log('   ✓ Registro de ponto')
    console.log('   ✓ Timeline visual')
    console.log('   ✓ Calendário mensal')
    console.log('   ✓ Widget "Quem está"')
    console.log('   ✓ Histórico de ponto')
    console.log('   ✓ Relatórios AEJ/AFD')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    console.error(error)
  }
}

createTestUser().catch(console.error)
