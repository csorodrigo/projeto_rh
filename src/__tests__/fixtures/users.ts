/**
 * Test Fixtures - User Data
 */

export const testEmployee = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'employee@test.com',
  name: 'Test Employee',
  role: 'employee',
  company_id: '550e8400-e29b-41d4-a716-446655440010',
  department: 'Engineering',
  position: 'Developer',
  created_at: new Date('2024-01-01T00:00:00Z'),
}

export const testManager = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'manager@test.com',
  name: 'Test Manager',
  role: 'manager',
  company_id: '550e8400-e29b-41d4-a716-446655440010',
  department: 'Engineering',
  position: 'Engineering Manager',
  created_at: new Date('2024-01-01T00:00:00Z'),
}

export const testHR = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  email: 'hr@test.com',
  name: 'Test HR',
  role: 'hr',
  company_id: '550e8400-e29b-41d4-a716-446655440010',
  department: 'Human Resources',
  position: 'HR Specialist',
  created_at: new Date('2024-01-01T00:00:00Z'),
}

export const testCompany = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  name: 'Test Company Inc',
  cnpj: '12.345.678/0001-90',
  cei: '123.456.78-9',
  weekly_hours: 44,
  created_at: new Date('2024-01-01T00:00:00Z'),
}
