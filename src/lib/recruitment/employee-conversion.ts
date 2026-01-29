/**
 * Employee Conversion Utilities
 * Funções para validação e conversão de candidatos em funcionários
 */

import type {
  Candidate,
  Job,
  JobApplication,
  EmployeeConversionData,
  ConversionValidation
} from '@/types/recruitment';
import type { Employee } from '@/types/database';

// =====================================================
// VALIDATION
// =====================================================

/**
 * Valida se um candidato pode ser convertido em funcionário
 */
export function validateCandidateForConversion(
  application: JobApplication,
  candidate: Candidate
): ConversionValidation {
  // Verificar se já foi convertido
  if (application.employee_id) {
    return {
      can_convert: false,
      error_message: 'Candidato já foi convertido em funcionário'
    };
  }

  // Verificar se foi contratado
  if (application.status !== 'hired' || !application.hired_at) {
    return {
      can_convert: false,
      error_message: 'Candidato não foi marcado como contratado'
    };
  }

  // Verificar blacklist
  if (candidate.is_blacklisted) {
    return {
      can_convert: false,
      error_message: `Candidato está na lista negra: ${candidate.blacklist_reason || 'Sem motivo especificado'}`
    };
  }

  return {
    can_convert: true,
    error_message: null
  };
}

/**
 * Valida dados de conversão de funcionário
 */
export function validateEmployeeData(data: EmployeeConversionData): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Validar CPF
  if (!data.cpf) {
    errors.cpf = 'CPF é obrigatório';
  } else if (!isValidCPF(data.cpf)) {
    errors.cpf = 'CPF inválido';
  }

  // Validar RG
  if (!data.rg) {
    errors.rg = 'RG é obrigatório';
  }

  // Validar PIS
  if (!data.pis) {
    errors.pis = 'PIS/PASEP é obrigatório';
  } else if (!isValidPIS(data.pis)) {
    errors.pis = 'PIS/PASEP inválido';
  }

  // Validar data de nascimento
  if (!data.birth_date) {
    errors.birth_date = 'Data de nascimento é obrigatória';
  } else if (!isValidBirthDate(data.birth_date)) {
    errors.birth_date = 'Data de nascimento inválida (deve ser maior de 16 anos)';
  }

  // Validar endereço
  if (!data.address.street) {
    errors['address.street'] = 'Rua é obrigatória';
  }
  if (!data.address.number) {
    errors['address.number'] = 'Número é obrigatório';
  }
  if (!data.address.neighborhood) {
    errors['address.neighborhood'] = 'Bairro é obrigatório';
  }
  if (!data.address.city) {
    errors['address.city'] = 'Cidade é obrigatória';
  }
  if (!data.address.state) {
    errors['address.state'] = 'Estado é obrigatório';
  }
  if (!data.address.zip_code) {
    errors['address.zip_code'] = 'CEP é obrigatório';
  } else if (!isValidCEP(data.address.zip_code)) {
    errors['address.zip_code'] = 'CEP inválido';
  }

  // Validar contato de emergência
  if (!data.emergency_contact) {
    errors.emergency_contact = 'Contato de emergência é obrigatório';
  }
  if (!data.emergency_phone) {
    errors.emergency_phone = 'Telefone de emergência é obrigatório';
  }

  // Validar dados trabalhistas
  if (!data.hire_date) {
    errors.hire_date = 'Data de admissão é obrigatória';
  }
  if (!data.salary || data.salary <= 0) {
    errors.salary = 'Salário deve ser maior que zero';
  }
  if (!data.work_schedule_id) {
    errors.work_schedule_id = 'Jornada de trabalho é obrigatória';
  }
  if (!data.department) {
    errors.department = 'Departamento é obrigatório';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// =====================================================
// PRE-POPULATION
// =====================================================

/**
 * Pré-preenche dados de funcionário a partir do candidato e vaga
 */
export function prepopulateEmployeeData(
  candidate: Candidate,
  job: Job,
  offerSalary?: number
): Partial<EmployeeConversionData> {
  return {
    // Usar salário da oferta ou média da faixa da vaga
    salary: offerSalary || calculateAverageSalary(job.salary_min, job.salary_max),

    // Pré-preencher departamento da vaga
    department: job.department || '',

    // Data de admissão sugerida (pode ser editada)
    hire_date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Calcula salário médio da faixa
 */
function calculateAverageSalary(min: number | null, max: number | null): number {
  if (!min && !max) return 0;
  if (!min) return max || 0;
  if (!max) return min || 0;
  return (min + max) / 2;
}

// =====================================================
// DUPLICATE CHECK
// =====================================================

/**
 * Verifica se já existe funcionário com o mesmo CPF ou email
 */
export async function checkDuplicateEmployee(
  cpf: string,
  email: string,
  companyId: string,
  supabase: any
): Promise<{
  exists: boolean;
  field: 'cpf' | 'email' | null;
  employeeId: string | null;
}> {
  // Verificar CPF
  const { data: cpfMatch } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', companyId)
    .eq('cpf', cpf)
    .single();

  if (cpfMatch) {
    return {
      exists: true,
      field: 'cpf',
      employeeId: cpfMatch.id
    };
  }

  // Verificar email
  const { data: emailMatch } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', companyId)
    .eq('email', email)
    .single();

  if (emailMatch) {
    return {
      exists: true,
      field: 'email',
      employeeId: emailMatch.id
    };
  }

  return {
    exists: false,
    field: null,
    employeeId: null
  };
}

// =====================================================
// FORMATTERS
// =====================================================

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata PIS para o padrão XXX.XXXXX.XX-X
 */
export function formatPIS(pis: string): string {
  const cleaned = pis.replace(/\D/g, '');
  if (cleaned.length !== 11) return pis;
  return cleaned.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
}

/**
 * Formata CEP para o padrão XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

// =====================================================
// VALIDATORS
// =====================================================

/**
 * Valida CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos dígitos iguais

  // Validar dígitos verificadores
  let sum = 0;
  let remainder: number;

  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
}

/**
 * Valida PIS/PASEP brasileiro
 */
export function isValidPIS(pis: string): boolean {
  const cleaned = pis.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }

  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;

  return digit === parseInt(cleaned[10]);
}

/**
 * Valida CEP brasileiro
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}

/**
 * Valida data de nascimento (deve ter pelo menos 16 anos)
 */
export function isValidBirthDate(birthDate: string): boolean {
  const birth = new Date(birthDate);
  const today = new Date();

  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 16;
  }

  return age >= 16;
}

// =====================================================
// EMPLOYMENT DATA BUILDER
// =====================================================

/**
 * Constrói objeto Employee a partir dos dados de conversão
 */
export function buildEmployeeFromConversion(
  candidate: Candidate,
  conversionData: EmployeeConversionData,
  companyId: string,
  userId: string
): Partial<Employee> {
  return {
    company_id: companyId,

    // Dados pessoais
    name: candidate.full_name,
    full_name: candidate.full_name,
    cpf: formatCPF(conversionData.cpf),
    rg: conversionData.rg,
    pis: formatPIS(conversionData.pis),
    birth_date: conversionData.birth_date,

    // Contato
    email: candidate.email,
    personal_email: candidate.email,
    phone: candidate.phone || undefined,
    personal_phone: candidate.phone || undefined,
    emergency_contact: conversionData.emergency_contact,
    emergency_phone: formatPhone(conversionData.emergency_phone),

    // Endereço
    address: conversionData.address,

    // Escolaridade
    education_level: candidate.education_level || undefined,

    // Dados trabalhistas
    position: '', // Será preenchido com o título da vaga
    department: conversionData.department,
    cost_center: conversionData.cost_center || undefined,
    manager_id: conversionData.manager_id || undefined,
    hire_date: conversionData.hire_date,
    contract_type: 'clt',
    work_schedule_id: conversionData.work_schedule_id,

    // Salário
    salary: conversionData.salary,
    base_salary: conversionData.salary,

    // Dados bancários
    bank_code: conversionData.bank_code || undefined,
    bank_name: conversionData.bank_name || undefined,
    agency: conversionData.agency || undefined,
    account: conversionData.account || undefined,
    account_digit: conversionData.account_digit || undefined,
    pix_key: conversionData.pix_key || undefined,

    // Status
    status: 'active',

    // Auditoria
    created_by: userId,
    updated_by: userId
  };
}

// =====================================================
// STAGE VALIDATION
// =====================================================

/**
 * Verifica se a candidatura está em estágio final (pronta para conversão)
 */
export function isInFinalStage(application: JobApplication, job: Job): boolean {
  // Verificar se está no último estágio do pipeline
  const stages = job.pipeline_stages || [];
  if (stages.length === 0) return false;

  const lastStage = stages.reduce((prev, current) =>
    current.order > prev.order ? current : prev
  );

  return application.current_stage === lastStage.id;
}

/**
 * Obtém o nome amigável do estágio atual
 */
export function getStageName(stageId: string, job: Job): string {
  const stage = job.pipeline_stages?.find(s => s.id === stageId);
  return stage?.name || stageId;
}
