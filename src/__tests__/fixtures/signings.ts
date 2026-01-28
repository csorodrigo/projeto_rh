/**
 * Test Fixtures - Time Signing Data
 */

import { testEmployee, testCompany } from './users'
import type { ClockTypeInput } from '@/lib/validations/signing'

export const validSigningSequence = [
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'clock_in' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T08:00:00Z'),
    source: 'web' as const,
  },
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'break_start' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T12:00:00Z'),
    source: 'web' as const,
  },
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'break_end' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T13:00:00Z'),
    source: 'web' as const,
  },
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'clock_out' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T17:00:00Z'),
    source: 'web' as const,
  },
]

export const invalidSequence_DoubleClockIn = [
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'clock_in' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T08:00:00Z'),
    source: 'web' as const,
  },
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'clock_in' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T08:05:00Z'),
    source: 'web' as const,
  },
]

export const invalidSequence_BreakWithoutClockIn = [
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'break_start' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T12:00:00Z'),
    source: 'web' as const,
  },
]

export const invalidSequence_ClockOutWithoutClockIn = [
  {
    employee_id: testEmployee.id,
    company_id: testCompany.id,
    record_type: 'clock_out' as ClockTypeInput,
    recorded_at: new Date('2024-01-15T17:00:00Z'),
    source: 'web' as const,
  },
]

export const normalWorkday = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00Z'),
  clockOut: new Date('2024-01-15T17:00:00Z'),
  breakStart: new Date('2024-01-15T12:00:00Z'),
  breakEnd: new Date('2024-01-15T13:00:00Z'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

export const overtimeWorkday = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00Z'),
  clockOut: new Date('2024-01-15T19:00:00Z'), // 10 hours worked
  breakStart: new Date('2024-01-15T12:00:00Z'),
  breakEnd: new Date('2024-01-15T13:00:00Z'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

export const nightShiftWorkday = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T22:00:00Z'), // 10 PM
  clockOut: new Date('2024-01-16T06:00:00Z'), // 6 AM next day
  breakStart: new Date('2024-01-16T02:00:00Z'),
  breakEnd: new Date('2024-01-16T03:00:00Z'),
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

export const sundayWorkday = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-14'), // Sunday
  clockIn: new Date('2024-01-14T08:00:00Z'),
  clockOut: new Date('2024-01-14T17:00:00Z'),
  breakStart: new Date('2024-01-14T12:00:00Z'),
  breakEnd: new Date('2024-01-14T13:00:00Z'),
  isWorkday: false,
  isHoliday: false,
  isSunday: true,
}

export const missingClockOut = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-15'),
  clockIn: new Date('2024-01-15T08:00:00Z'),
  clockOut: null,
  breakStart: null,
  breakEnd: null,
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}

export const absence = {
  employee_id: testEmployee.id,
  company_id: testCompany.id,
  date: new Date('2024-01-15'),
  clockIn: null,
  clockOut: null,
  breakStart: null,
  breakEnd: null,
  isWorkday: true,
  isHoliday: false,
  isSunday: false,
}
