/**
 * Validators for employee import
 */

import { isValidCPF } from '@/lib/utils';
import type { ParsedEmployee, ValidationResult, ValidationError, DuplicateInfo } from './types';
import type { Employee } from '@/lib/supabase/queries/employees';

/**
 * Validate a single employee record
 */
export function validateEmployee(data: Partial<ParsedEmployee>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Nome deve ter pelo menos 2 caracteres',
    });
  }

  if (!data.cpf) {
    errors.push({
      field: 'cpf',
      message: 'CPF é obrigatório',
    });
  } else if (!isValidCPF(data.cpf)) {
    errors.push({
      field: 'cpf',
      message: 'CPF inválido',
    });
  }

  if (!data.birth_date) {
    errors.push({
      field: 'birth_date',
      message: 'Data de nascimento é obrigatória',
    });
  } else if (!isValidDate(data.birth_date)) {
    errors.push({
      field: 'birth_date',
      message: 'Data de nascimento inválida',
    });
  } else if (!isReasonableAge(data.birth_date)) {
    warnings.push({
      field: 'birth_date',
      message: 'Data de nascimento pode estar incorreta (idade fora do comum)',
    });
  }

  if (!data.hire_date) {
    errors.push({
      field: 'hire_date',
      message: 'Data de admissão é obrigatória',
    });
  } else if (!isValidDate(data.hire_date)) {
    errors.push({
      field: 'hire_date',
      message: 'Data de admissão inválida',
    });
  } else if (isFutureDate(data.hire_date)) {
    warnings.push({
      field: 'hire_date',
      message: 'Data de admissão está no futuro',
    });
  }

  if (!data.position || data.position.trim().length === 0) {
    errors.push({
      field: 'position',
      message: 'Cargo é obrigatório',
    });
  }

  // Optional but validated fields
  if (data.personal_email && !isValidEmail(data.personal_email)) {
    errors.push({
      field: 'personal_email',
      message: 'Email inválido',
    });
  }

  if (data.base_salary !== undefined) {
    if (data.base_salary < 0) {
      errors.push({
        field: 'base_salary',
        message: 'Salário não pode ser negativo',
      });
    } else if (data.base_salary < 1320) {
      // Salário mínimo 2024
      warnings.push({
        field: 'base_salary',
        message: 'Salário abaixo do mínimo nacional',
      });
    }
  }

  // Warnings for missing optional fields
  if (!data.department) {
    warnings.push({
      field: 'department',
      message: 'Departamento não informado',
    });
  }

  if (!data.personal_email) {
    warnings.push({
      field: 'personal_email',
      message: 'Email não informado',
    });
  }

  if (!data.personal_phone) {
    warnings.push({
      field: 'personal_phone',
      message: 'Telefone não informado',
    });
  }

  // Date logic validation
  if (data.birth_date && data.hire_date && isValidDate(data.birth_date) && isValidDate(data.hire_date)) {
    const birthDate = new Date(data.birth_date);
    const hireDate = new Date(data.hire_date);

    if (hireDate < birthDate) {
      errors.push({
        field: 'hire_date',
        message: 'Data de admissão não pode ser anterior à data de nascimento',
      });
    }

    const ageAtHire = (hireDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageAtHire < 14) {
      errors.push({
        field: 'hire_date',
        message: 'Idade no momento da admissão não pode ser inferior a 14 anos',
      });
    } else if (ageAtHire < 16) {
      warnings.push({
        field: 'hire_date',
        message: 'Contratação entre 14-16 anos requer documentação especial (Menor Aprendiz)',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if CPF is unique in the existing employees list
 */
export function validateCPFUnique(cpf: string, existingEmployees: Employee[]): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  return !existingEmployees.some(emp => emp.cpf === cleanCPF);
}

/**
 * Detect duplicates within the import file
 */
export function detectDuplicates(employees: ParsedEmployee[]): DuplicateInfo[] {
  const cpfMap = new Map<string, number[]>();

  employees.forEach((emp, index) => {
    const cpf = emp.cpf.replace(/\D/g, '');
    if (cpf) {
      const rows = cpfMap.get(cpf) || [];
      rows.push(emp.row || index + 1);
      cpfMap.set(cpf, rows);
    }
  });

  const duplicates: DuplicateInfo[] = [];

  cpfMap.forEach((rows, cpf) => {
    if (rows.length > 1) {
      const employee = employees.find(emp => emp.cpf.replace(/\D/g, '') === cpf);
      duplicates.push({
        rows,
        cpf,
        name: employee?.name || 'Desconhecido',
      });
    }
  });

  return duplicates;
}

/**
 * Detect duplicates against existing employees in database
 */
export function detectExistingDuplicates(
  employees: ParsedEmployee[],
  existingEmployees: Employee[]
): Array<{ employee: ParsedEmployee; existing: Employee }> {
  const duplicates: Array<{ employee: ParsedEmployee; existing: Employee }> = [];

  employees.forEach(emp => {
    const cpf = emp.cpf.replace(/\D/g, '');
    const existing = existingEmployees.find(e => e.cpf === cpf);
    if (existing) {
      duplicates.push({ employee: emp, existing });
    }
  });

  return duplicates;
}

/**
 * Check if date is valid
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date is in the future
 */
function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date > new Date();
}

/**
 * Check if age is reasonable (between 14 and 100 years)
 */
function isReasonableAge(birthDateStr: string): boolean {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const age = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  return age >= 14 && age <= 100;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(employees: ParsedEmployee[]): {
  total: number;
  valid: number;
  withWarnings: number;
  withErrors: number;
} {
  let valid = 0;
  let withWarnings = 0;
  let withErrors = 0;

  employees.forEach(emp => {
    const validation = validateEmployee(emp);

    if (validation.valid) {
      if (validation.warnings.length > 0) {
        withWarnings++;
      } else {
        valid++;
      }
    } else {
      withErrors++;
    }
  });

  return {
    total: employees.length,
    valid,
    withWarnings,
    withErrors,
  };
}
