/**
 * Types for import system
 */

export interface ParsedEmployee {
  name: string;
  cpf: string;
  personal_email?: string;
  birth_date: string;
  hire_date: string;
  position: string;
  department?: string;
  base_salary?: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  personal_phone?: string;
  // Additional fields
  row?: number; // Original row number in file
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidatedEmployee extends ParsedEmployee {
  validation: ValidationResult;
  isSelected: boolean;
}

export interface DuplicateInfo {
  rows: number[];
  cpf: string;
  name: string;
}

export interface ImportResult {
  success: ParsedEmployee[];
  failed: Array<{
    employee: ParsedEmployee;
    error: string;
    row?: number;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'parsing' | 'validating' | 'importing' | 'completed' | 'error';
  message?: string;
}
