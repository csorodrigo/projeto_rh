/**
 * Script de Seed para popular o banco com dados de teste
 * Fase 3 - Integração Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais não encontradas!');
  process.exit(1);
}

// Usar service role key para ignorar RLS durante seed
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🌱 Iniciando seed do banco de dados...\n');

// Helper para gerar data aleatória
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper para gerar CPF fake
function generateCPF() {
  const randomDigits = () => Math.floor(Math.random() * 999999999);
  return `${randomDigits()}`.padStart(11, '0');
}

async function seed() {
  try {
    // 1. Criar empresa de teste
    console.log('📊 Criando empresa de teste...');

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Empresa Demo RH',
        cnpj: '12345678000190',
        email: 'contato@demo.com',
        plan: 'professional',
        max_employees: 100,
        settings: {
          timezone: 'America/Sao_Paulo',
          work_hours_start: '08:00',
          work_hours_end: '18:00',
          lunch_break_minutes: 60,
        }
      })
      .select()
      .single();

    if (companyError) {
      // Se já existe, buscar
      const { data: existing } = await supabase
        .from('companies')
        .select('*')
        .eq('cnpj', '12345678000190')
        .single();

      if (existing) {
        console.log('   ℹ️  Empresa já existe, usando existente');
        var companyId = existing.id;
      } else {
        throw companyError;
      }
    } else {
      var companyId = company.id;
      console.log(`   ✅ Empresa criada: ${company.name}`);
    }

    // 2. Criar usuário admin (se não existir)
    console.log('\n👤 Criando usuário admin...');

    const adminEmail = 'admin@demo.com';
    const adminPassword = 'demo123456';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Admin Demo'
      }
    });

    if (authError && !authError.message.includes('already exists')) {
      console.error('   ❌ Erro ao criar usuário:', authError.message);
    } else if (authError && authError.message.includes('already exists')) {
      console.log('   ℹ️  Usuário admin já existe');
      // Buscar usuário existente
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === adminEmail);
      var adminUserId = existingUser?.id;
    } else {
      var adminUserId = authData.user.id;
      console.log(`   ✅ Usuário criado: ${adminEmail} / ${adminPassword}`);
    }

    // 3. Criar profile do admin
    if (adminUserId) {
      console.log('\n👔 Criando profile admin...');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: adminUserId,
          company_id: companyId,
          name: 'Admin Demo',
          email: adminEmail,
          role: 'admin',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('   ❌ Erro ao criar profile:', profileError.message);
      } else {
        console.log('   ✅ Profile admin criado');
      }
    }

    // 4. Criar departamentos
    console.log('\n🏢 Criando departamentos...');

    const departments = [
      'Tecnologia',
      'Recursos Humanos',
      'Financeiro',
      'Comercial',
      'Marketing',
      'Operações'
    ];

    // 5. Criar funcionários
    console.log('\n👥 Criando funcionários...');

    const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Lucas', 'Fernanda', 'Rafael', 'Camila', 'Bruno', 'Mariana', 'Felipe', 'Beatriz', 'Rodrigo', 'Patricia', 'Gustavo', 'Amanda', 'Thiago', 'Larissa'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida', 'Nascimento', 'Araújo', 'Melo', 'Barbosa'];

    const positions = [
      'Desenvolvedor Full Stack',
      'Analista de RH',
      'Designer UI/UX',
      'Gerente de Projetos',
      'Analista Financeiro',
      'Vendedor',
      'Marketing Digital',
      'Auxiliar Administrativo',
      'Coordenador',
      'Assistente'
    ];

    const employees = [];
    const today = new Date();

    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.com`;

      // Data de nascimento (entre 25 e 55 anos atrás)
      const birthDate = randomDate(
        new Date(today.getFullYear() - 55, 0, 1),
        new Date(today.getFullYear() - 25, 0, 1)
      );

      // Data de admissão (entre 6 meses e 5 anos atrás)
      const hireDate = randomDate(
        new Date(today.getFullYear() - 5, 0, 1),
        new Date(today.getFullYear(), today.getMonth() - 6, 1)
      );

      employees.push({
        company_id: companyId,
        name: fullName,
        personal_email: email,
        cpf: generateCPF(),
        birth_date: birthDate.toISOString().split('T')[0],
        hire_date: hireDate.toISOString().split('T')[0],
        department: departments[Math.floor(Math.random() * departments.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        base_salary: Math.floor(Math.random() * (15000 - 3000) + 3000),
        status: Math.random() > 0.1 ? 'active' : 'on_leave',
        personal_phone: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`
      });
    }

    const { data: createdEmployees, error: empError } = await supabase
      .from('employees')
      .insert(employees)
      .select();

    if (empError) {
      console.error('   ❌ Erro ao criar funcionários:', empError.message);
    } else {
      console.log(`   ✅ ${createdEmployees.length} funcionários criados`);
    }

    // 6. Criar ausências (incluindo para aniversariantes desta semana)
    console.log('\n📅 Criando ausências...');

    if (createdEmployees && createdEmployees.length > 0) {
      const absences = [];
      const absenceTypes = ['vacation', 'sick_leave', 'medical_appointment', 'unjustified'];

      // Criar algumas ausências para hoje
      for (let i = 0; i < 3; i++) {
        const randomEmployee = createdEmployees[Math.floor(Math.random() * createdEmployees.length)];

        absences.push({
          company_id: companyId,
          employee_id: randomEmployee.id,
          type: absenceTypes[Math.floor(Math.random() * absenceTypes.length)],
          start_date: today.toISOString().split('T')[0],
          end_date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], // +1 dia
          status: 'approved',
          reason: 'Ausência de teste para demonstração'
        });
      }

      // Criar algumas ausências futuras (férias)
      for (let i = 0; i < 5; i++) {
        const randomEmployee = createdEmployees[Math.floor(Math.random() * createdEmployees.length)];
        const startDate = randomDate(
          new Date(today.getTime() + 7 * 86400000), // +7 dias
          new Date(today.getTime() + 60 * 86400000) // +60 dias
        );

        absences.push({
          company_id: companyId,
          employee_id: randomEmployee.id,
          type: 'vacation',
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date(startDate.getTime() + 14 * 86400000).toISOString().split('T')[0], // +14 dias
          status: Math.random() > 0.5 ? 'approved' : 'pending',
          reason: 'Férias agendadas'
        });
      }

      const { error: absError } = await supabase
        .from('absences')
        .insert(absences);

      if (absError) {
        console.error('   ❌ Erro ao criar ausências:', absError.message);
      } else {
        console.log(`   ✅ ${absences.length} ausências criadas`);
      }
    }

    // 7. Ajustar datas de aniversário para ter alguns esta semana
    console.log('\n🎂 Ajustando aniversariantes da semana...');

    if (createdEmployees && createdEmployees.length >= 3) {
      const birthdayEmployees = createdEmployees.slice(0, 3);
      const nextWeekDates = [];

      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        nextWeekDates.push(date);
      }

      for (let i = 0; i < birthdayEmployees.length; i++) {
        const employee = birthdayEmployees[i];
        const birthdayThisYear = nextWeekDates[i];
        const birthYear = new Date(employee.birth_date).getFullYear();
        const newBirthDate = new Date(birthYear, birthdayThisYear.getMonth(), birthdayThisYear.getDate());

        await supabase
          .from('employees')
          .update({ birth_date: newBirthDate.toISOString().split('T')[0] })
          .eq('id', employee.id);
      }

      console.log(`   ✅ ${birthdayEmployees.length} aniversariantes ajustados para esta semana`);
    }

    // 8. Criar registros de ponto para alguns funcionários
    console.log('\n🕐 Criando registros de ponto...');

    if (createdEmployees && createdEmployees.length > 0) {
      const signings = [];

      // Criar pontos para os últimos 5 dias úteis
      for (let dayOffset = -5; dayOffset <= 0; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);

        // Pular finais de semana
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Para 80% dos funcionários
        const workingEmployees = createdEmployees.filter(() => Math.random() > 0.2);

        for (const employee of workingEmployees) {
          // Entrada (08:00 +/- 30 min)
          const checkInHour = 8 + (Math.random() - 0.5);
          const checkIn = new Date(date);
          checkIn.setHours(Math.floor(checkInHour), Math.floor((checkInHour % 1) * 60));

          // Saída (18:00 +/- 30 min)
          const checkOutHour = 18 + (Math.random() - 0.5);
          const checkOut = new Date(date);
          checkOut.setHours(Math.floor(checkOutHour), Math.floor((checkOutHour % 1) * 60));

          signings.push({
            company_id: companyId,
            employee_id: employee.id,
            record_type: 'clock_in',
            recorded_at: checkIn.toISOString(),
            location_address: 'Escritório Principal',
            source: 'web'
          });

          signings.push({
            company_id: companyId,
            employee_id: employee.id,
            record_type: 'clock_out',
            recorded_at: checkOut.toISOString(),
            location_address: 'Escritório Principal',
            source: 'web'
          });
        }
      }

      const { error: signingsError } = await supabase
        .from('time_records')
        .insert(signings);

      if (signingsError) {
        console.error('   ❌ Erro ao criar registros de ponto:', signingsError.message);
      } else {
        console.log(`   ✅ ${signings.length} registros de ponto criados`);
      }
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log('\n🚀 Você pode fazer login agora no sistema!\n');

  } catch (error) {
    console.error('\n❌ Erro durante seed:', error);
    process.exit(1);
  }
}

// Executar seed
seed();
