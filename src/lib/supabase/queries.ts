/**
 * Supabase Query Functions
 * Type-safe database query operations with error handling
 */

import { createClient } from './client';
import type {
  Company,
  Profile,
  Employee,
  EmployeeDocument,
  TimeEntry,
  Absence,
  AbsenceWithEmployee,
  AbsenceStatus,
  AbsenceType,
  VacationBalance,
  VacationPolicy,
  AbsenceHistory,
  ASO,
  MedicalCertificate,
  Evaluation,
  PDI,
  Payroll,
  PayrollPeriod,
  EmployeePayroll,
  PayrollStatus,
  PayrollPeriodType,
  Database,
  TimeRecord,
  TimeTrackingDaily,
  TimeBank,
  TimeBankBalance,
  PresenceStatus,
  ClockType,
  RecordSource,
} from '@/types/database';

type Tables = Database['public']['Tables'];

/**
 * Generic error type for query operations
 */
export interface QueryError {
  message: string;
  code?: string;
  details?: string;
}

export interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

export interface QueryResultArray<T> {
  data: T[] | null;
  error: QueryError | null;
}

/**
 * Get current user profile
 */
export async function getCurrentProfile(): Promise<QueryResult<Profile>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: { message: 'Not authenticated' },
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get company by ID
 */
export async function getCompany(
  companyId: string
): Promise<QueryResult<Company>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get current user's company
 */
export async function getCurrentCompany(): Promise<QueryResult<Company>> {
  const profile = await getCurrentProfile();

  if (!profile.data?.company_id) {
    return {
      data: null,
      error: { message: 'No company associated with user' },
    };
  }

  return getCompany(profile.data.company_id);
}

/**
 * List all employees for a company
 */
export async function listEmployees(
  companyId: string,
  filters?: {
    status?: string;
    department?: string;
  }
): Promise<QueryResultArray<Employee>> {
  const supabase = createClient();

  let query = supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('full_name', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.department) {
    query = query.eq('department', filters.department);
  }

  const { data, error } = await query;

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee by ID
 */
export async function getEmployee(
  employeeId: string
): Promise<QueryResult<Employee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Create new employee
 */
export async function createEmployee(
  employee: Tables['employees']['Insert']
): Promise<QueryResult<Employee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Update employee
 */
export async function updateEmployee(
  employeeId: string,
  updates: Tables['employees']['Update']
): Promise<QueryResult<Employee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employeeId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Delete employee (soft delete by updating status)
 */
export async function deleteEmployee(
  employeeId: string
): Promise<QueryResult<Employee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .update({ status: 'terminated' })
    .eq('id', employeeId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee documents
 */
export async function getEmployeeDocuments(
  employeeId: string
): Promise<QueryResultArray<EmployeeDocument>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_current', true)
    .order('uploaded_at', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Upload document to storage
 */
export async function uploadDocumentToStorage(
  file: File,
  companyId: string,
  employeeId: string
): Promise<QueryResult<{ path: string; url: string }>> {
  const supabase = createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${companyId}/${employeeId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('employee-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return {
      data: null,
      error: { message: error.message },
    };
  }

  const { data: urlData } = supabase.storage
    .from('employee-documents')
    .getPublicUrl(data.path);

  return {
    data: { path: data.path, url: urlData.publicUrl },
    error: null,
  };
}

/**
 * Create employee document record
 */
export async function createEmployeeDocument(
  document: {
    company_id: string;
    employee_id: string;
    type: string;
    description?: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    file_type?: string;
    document_number?: string;
    issue_date?: string;
    expires_at?: string;
    issuing_authority?: string;
    uploaded_by?: string;
  }
): Promise<QueryResult<EmployeeDocument>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employee_documents')
    .insert(document)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Delete employee document
 */
export async function deleteEmployeeDocument(
  documentId: string
): Promise<QueryResult<null>> {
  const supabase = createClient();

  // First get the document to get the file path
  const { data: doc, error: fetchError } = await supabase
    .from('employee_documents')
    .select('file_url')
    .eq('id', documentId)
    .single();

  if (fetchError) {
    return {
      data: null,
      error: { message: fetchError.message, code: fetchError.code },
    };
  }

  // Extract path from URL and delete from storage
  if (doc?.file_url) {
    const path = doc.file_url.split('/employee-documents/')[1];
    if (path) {
      await supabase.storage.from('employee-documents').remove([path]);
    }
  }

  // Delete the record
  const { error } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', documentId);

  return {
    data: null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Update document status (approve/reject)
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<QueryResult<EmployeeDocument>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('employee_documents')
    .update({
      status,
      rejection_reason: rejectionReason,
      validated_by: user?.id,
      validated_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee time entries for a date range
 */
export async function getEmployeeTimeEntries(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<QueryResultArray<TimeEntry>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee absences
 */
export async function getEmployeeAbsences(
  employeeId: string
): Promise<QueryResultArray<Absence>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee ASOs
 */
export async function getEmployeeASOs(
  employeeId: string
): Promise<QueryResultArray<ASO>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('asos')
    .select('*')
    .eq('employee_id', employeeId)
    .order('exam_date', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee medical certificates
 */
export async function getEmployeeMedicalCertificates(
  employeeId: string
): Promise<QueryResultArray<MedicalCertificate>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('medical_certificates')
    .select('*')
    .eq('employee_id', employeeId)
    .order('certificate_date', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

// ============================================================
// HEALTH MODULE - Company-wide queries
// ============================================================

export interface ASOWithEmployee extends ASO {
  employee_name: string;
  employee_department: string | null;
  employee_photo_url: string | null;
}

export interface MedicalCertificateWithEmployee extends MedicalCertificate {
  employee_name: string;
  employee_department: string | null;
}

/**
 * List all ASOs for a company with employee info
 */
export async function listCompanyASOs(
  companyId: string,
  filters?: {
    status?: 'active' | 'expiring' | 'expired';
    examType?: string;
    employeeId?: string;
  }
): Promise<QueryResultArray<ASOWithEmployee>> {
  const supabase = createClient();

  let query = supabase
    .from('asos')
    .select(`
      *,
      employees!inner (
        name,
        department,
        photo_url
      )
    `)
    .eq('company_id', companyId)
    .order('expiration_date', { ascending: true });

  if (filters?.examType) {
    query = query.eq('exam_type', filters.examType);
  }

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  const { data, error } = await query;

  // Transform data to flatten employee info
  const transformedData = data?.map((aso: Record<string, unknown>) => ({
    ...aso,
    employee_name: (aso.employees as Record<string, unknown>)?.name as string || '',
    employee_department: (aso.employees as Record<string, unknown>)?.department as string | null,
    employee_photo_url: (aso.employees as Record<string, unknown>)?.photo_url as string | null,
    employees: undefined,
  })) as ASOWithEmployee[] | null;

  // Filter by status after fetching (calculated field)
  let filteredData = transformedData;
  if (filters?.status && filteredData) {
    const today = new Date();
    filteredData = filteredData.filter((aso) => {
      const expirationDate = new Date(aso.expiration_date);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (filters.status) {
        case 'expired':
          return daysUntilExpiration < 0;
        case 'expiring':
          return daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
        case 'active':
          return daysUntilExpiration > 30;
        default:
          return true;
      }
    });
  }

  return {
    data: filteredData,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * List all medical certificates for a company with employee info
 */
export async function listCompanyMedicalCertificates(
  companyId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
  }
): Promise<QueryResultArray<MedicalCertificateWithEmployee>> {
  const supabase = createClient();

  let query = supabase
    .from('medical_certificates')
    .select(`
      *,
      employees!inner (
        name,
        department
      )
    `)
    .eq('company_id', companyId)
    .order('certificate_date', { ascending: false });

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  if (filters?.startDate) {
    query = query.gte('certificate_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('certificate_date', filters.endDate);
  }

  const { data, error } = await query;

  // Transform data to flatten employee info
  const transformedData = data?.map((cert: Record<string, unknown>) => ({
    ...cert,
    employee_name: (cert.employees as Record<string, unknown>)?.name as string || '',
    employee_department: (cert.employees as Record<string, unknown>)?.department as string | null,
    employees: undefined,
  })) as MedicalCertificateWithEmployee[] | null;

  return {
    data: transformedData,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Create a new ASO
 */
export async function createASO(
  data: Omit<ASO, 'id' | 'created_at' | 'updated_at'>
): Promise<QueryResult<ASO>> {
  const supabase = createClient();

  const { data: aso, error } = await supabase
    .from('asos')
    .insert(data)
    .select()
    .single();

  return {
    data: aso,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Create a new medical certificate
 */
export async function createMedicalCertificate(
  data: Omit<MedicalCertificate, 'id' | 'created_at' | 'updated_at'>
): Promise<QueryResult<MedicalCertificate>> {
  const supabase = createClient();

  const { data: certificate, error } = await supabase
    .from('medical_certificates')
    .insert(data)
    .select()
    .single();

  return {
    data: certificate,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get health statistics for a company
 */
export async function getHealthStats(companyId: string): Promise<{
  totalASOs: number;
  expiringASOs: number;
  expiredASOs: number;
  certificatesThisMonth: number;
  totalDaysOff: number;
}> {
  const supabase = createClient();
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Get all ASOs
  const { data: asos } = await supabase
    .from('asos')
    .select('expiration_date')
    .eq('company_id', companyId);

  // Get certificates this month
  const { data: certificates } = await supabase
    .from('medical_certificates')
    .select('days_off')
    .eq('company_id', companyId)
    .gte('certificate_date', firstDayOfMonth.toISOString().split('T')[0]);

  const totalASOs = asos?.length || 0;
  const expiringASOs = asos?.filter((aso) => {
    const expDate = new Date(aso.expiration_date);
    return expDate >= today && expDate <= thirtyDaysFromNow;
  }).length || 0;
  const expiredASOs = asos?.filter((aso) => {
    const expDate = new Date(aso.expiration_date);
    return expDate < today;
  }).length || 0;

  const certificatesThisMonth = certificates?.length || 0;
  const totalDaysOff = certificates?.reduce((sum, cert) => sum + (cert.days_off || 0), 0) || 0;

  return {
    totalASOs,
    expiringASOs,
    expiredASOs,
    certificatesThisMonth,
    totalDaysOff,
  };
}

/**
 * Get employee evaluations
 */
export async function getEmployeeEvaluations(
  employeeId: string
): Promise<QueryResultArray<Evaluation>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee PDIs
 */
export async function getEmployeePDIs(
  employeeId: string
): Promise<QueryResultArray<PDI>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('pdis')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee payrolls
 */
export async function getEmployeePayrolls(
  employeeId: string
): Promise<QueryResultArray<Payroll>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('payrolls')
    .select('*')
    .eq('employee_id', employeeId)
    .order('reference_month', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Search employees by name or employee number
 */
export async function searchEmployees(
  companyId: string,
  searchTerm: string
): Promise<QueryResultArray<Employee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .or(`full_name.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%`)
    .order('full_name', { ascending: true })
    .limit(20);

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get company statistics
 */
export async function getCompanyStats(companyId: string) {
  const supabase = createClient();

  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: onLeaveEmployees },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'on_leave'),
  ]);

  return {
    totalEmployees: totalEmployees ?? 0,
    activeEmployees: activeEmployees ?? 0,
    onLeaveEmployees: onLeaveEmployees ?? 0,
    inactiveEmployees: (totalEmployees ?? 0) - (activeEmployees ?? 0) - (onLeaveEmployees ?? 0),
  };
}

// ============================================
// TIME TRACKING QUERIES
// ============================================

/**
 * Record a time entry (clock in/out, break start/end)
 */
export async function recordTimeEntry(
  employeeId: string,
  companyId: string,
  recordType: ClockType,
  options?: {
    source?: RecordSource;
    notes?: string;
    locationAddress?: string;
    locationAccuracy?: number;
    deviceInfo?: Record<string, unknown>;
  }
): Promise<QueryResult<TimeRecord>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('time_records')
    .insert({
      employee_id: employeeId,
      company_id: companyId,
      record_type: recordType,
      recorded_at: new Date().toISOString(),
      source: options?.source ?? 'web',
      notes: options?.notes,
      location_address: options?.locationAddress,
      location_accuracy: options?.locationAccuracy,
      device_info: options?.deviceInfo ?? {},
      created_by: user?.id,
    })
    .select()
    .single();

  // After recording, consolidate daily records
  if (data) {
    const today = new Date().toISOString().split('T')[0];
    await consolidateDailyRecords(employeeId, today);
  }

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get today's time records for an employee
 */
export async function getTodayTimeRecords(
  employeeId: string
): Promise<QueryResultArray<TimeRecord>> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lte('recorded_at', `${today}T23:59:59`)
    .order('recorded_at', { ascending: true });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get daily time tracking summary for an employee on a specific date
 */
export async function getDailyTimeTracking(
  employeeId: string,
  date: string
): Promise<QueryResult<TimeTrackingDaily>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_tracking_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get time tracking summaries for a period
 */
export async function getTimeTrackingPeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<QueryResultArray<TimeTrackingDaily>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_tracking_daily')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get time bank balance for an employee
 */
export async function getTimeBankBalance(
  employeeId: string
): Promise<QueryResult<TimeBankBalance>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_bank')
    .select('balance_after, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    // No records found, return zero balance
    return {
      data: {
        employee_id: employeeId,
        balance_minutes: 0,
        last_updated: null,
      },
      error: null,
    };
  }

  return {
    data: data
      ? {
          employee_id: employeeId,
          balance_minutes: data.balance_after,
          last_updated: data.created_at,
        }
      : null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get time bank history for an employee
 */
export async function getTimeBankHistory(
  employeeId: string,
  limit = 30
): Promise<QueryResultArray<TimeBank>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('time_bank')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get presence status for all active employees in a company
 */
export async function getPresenceStatus(
  companyId: string
): Promise<QueryResultArray<PresenceStatus>> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Get all active employees with their latest time record for today
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, full_name, department, photo_url')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (empError) {
    return {
      data: null,
      error: { message: empError.message, code: empError.code },
    };
  }

  if (!employees || employees.length === 0) {
    return { data: [], error: null };
  }

  // Get today's records for all employees
  const { data: records, error: recError } = await supabase
    .from('time_records')
    .select('employee_id, record_type, recorded_at')
    .eq('company_id', companyId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lte('recorded_at', `${today}T23:59:59`)
    .order('recorded_at', { ascending: false });

  if (recError) {
    return {
      data: null,
      error: { message: recError.message, code: recError.code },
    };
  }

  // Map records by employee
  const recordsByEmployee = new Map<string, { type: ClockType; time: string }>();
  const clockInByEmployee = new Map<string, string>();

  records?.forEach((record) => {
    if (!recordsByEmployee.has(record.employee_id)) {
      recordsByEmployee.set(record.employee_id, {
        type: record.record_type as ClockType,
        time: record.recorded_at,
      });
    }
    if (record.record_type === 'clock_in' && !clockInByEmployee.has(record.employee_id)) {
      clockInByEmployee.set(record.employee_id, record.recorded_at);
    }
  });

  // Build presence status array
  const presenceData: PresenceStatus[] = employees.map((emp) => {
    const lastRecord = recordsByEmployee.get(emp.id);
    const clockIn = clockInByEmployee.get(emp.id);

    let status: PresenceStatus['status'] = 'absent';
    if (lastRecord) {
      switch (lastRecord.type) {
        case 'clock_in':
          status = 'working';
          break;
        case 'break_start':
          status = 'break';
          break;
        case 'break_end':
          status = 'working';
          break;
        case 'clock_out':
          status = 'absent';
          break;
      }
    }

    return {
      employee_id: emp.id,
      employee_name: emp.full_name || emp.name,
      department: emp.department,
      photo_url: emp.photo_url,
      status,
      clock_in: clockIn || null,
      last_action: lastRecord?.type || null,
      last_action_time: lastRecord?.time || null,
    };
  });

  // Sort: working first, then break, then absent
  const statusOrder = { working: 0, break: 1, remote: 2, absent: 3 };
  presenceData.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return { data: presenceData, error: null };
}

/**
 * Consolidate daily records (call the database function)
 */
async function consolidateDailyRecords(
  employeeId: string,
  date: string
): Promise<QueryResult<string>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('consolidate_daily_records', {
    p_employee_id: employeeId,
    p_date: date,
  });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get employee's current clock status for today
 */
export async function getCurrentClockStatus(
  employeeId: string
): Promise<QueryResult<{
  status: 'not_started' | 'working' | 'break' | 'finished';
  lastAction: ClockType | null;
  lastActionTime: string | null;
}>> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_records')
    .select('record_type, recorded_at')
    .eq('employee_id', employeeId)
    .gte('recorded_at', `${today}T00:00:00`)
    .lte('recorded_at', `${today}T23:59:59`)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    // No records for today
    return {
      data: {
        status: 'not_started',
        lastAction: null,
        lastActionTime: null,
      },
      error: null,
    };
  }

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  let status: 'not_started' | 'working' | 'break' | 'finished' = 'not_started';
  if (data) {
    switch (data.record_type) {
      case 'clock_in':
        status = 'working';
        break;
      case 'break_start':
        status = 'break';
        break;
      case 'break_end':
        status = 'working';
        break;
      case 'clock_out':
        status = 'finished';
        break;
    }
  }

  return {
    data: {
      status,
      lastAction: data?.record_type as ClockType,
      lastActionTime: data?.recorded_at,
    },
    error: null,
  };
}

/**
 * Get time tracking report for company (admin view)
 */
export async function getTimeTrackingReport(
  companyId: string,
  filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
  }
): Promise<
  QueryResultArray<
    TimeTrackingDaily & { employee_name: string; department: string | null }
  >
> {
  const supabase = createClient();

  let query = supabase
    .from('time_tracking_daily')
    .select(
      `
      *,
      employees!inner(full_name, department)
    `
    )
    .eq('company_id', companyId);

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters?.department) {
    query = query.eq('employees.department', filters.department);
  }

  const { data, error } = await query.order('date', { ascending: false });

  const formattedData = data?.map((item) => ({
    ...item,
    employee_name: (item.employees as { full_name: string }).full_name,
    department: (item.employees as { department: string | null }).department,
  }));

  return {
    data: formattedData || null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

// ============================================
// ABSENCE QUERIES (Ausências/Férias/Licenças)
// ============================================

/**
 * Interface de filtros para listagem de ausências
 */
export interface AbsenceFilters {
  status?: AbsenceStatus | AbsenceStatus[];
  type?: AbsenceType | AbsenceType[];
  employeeId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * List all absences for a company with optional filters
 */
export async function listAbsences(
  companyId: string,
  filters?: AbsenceFilters,
  pagination?: { page: number; perPage: number }
): Promise<QueryResultArray<AbsenceWithEmployee> & { count?: number }> {
  const supabase = createClient();
  const page = pagination?.page ?? 1;
  const perPage = pagination?.perPage ?? 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('absences')
    .select(
      `
      *,
      employees!inner(full_name, department, photo_url)
    `,
      { count: 'exact' }
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.type) {
    if (Array.isArray(filters.type)) {
      query = query.in('type', filters.type);
    } else {
      query = query.eq('type', filters.type);
    }
  }

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }

  if (filters?.department) {
    query = query.eq('employees.department', filters.department);
  }

  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate);
  }

  const { data, error, count } = await query;

  const formattedData = data?.map((item) => ({
    ...item,
    employee_name: (item.employees as { full_name: string }).full_name,
    employee_department: (item.employees as { department: string | null }).department,
    employee_photo_url: (item.employees as { photo_url: string | null }).photo_url,
  })) as AbsenceWithEmployee[] | null;

  return {
    data: formattedData,
    error: error ? { message: error.message, code: error.code } : null,
    count: count ?? undefined,
  };
}

/**
 * Get a single absence by ID
 */
export async function getAbsenceById(
  absenceId: string
): Promise<QueryResult<AbsenceWithEmployee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('absences')
    .select(
      `
      *,
      employees!inner(full_name, department, photo_url)
    `
    )
    .eq('id', absenceId)
    .single();

  const formattedData = data
    ? {
        ...data,
        employee_name: (data.employees as { full_name: string }).full_name,
        employee_department: (data.employees as { department: string | null }).department,
        employee_photo_url: (data.employees as { photo_url: string | null }).photo_url,
      }
    : null;

  return {
    data: formattedData as AbsenceWithEmployee | null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get pending absences for a company (for approval queue)
 */
export async function getPendingAbsences(
  companyId: string
): Promise<QueryResultArray<AbsenceWithEmployee>> {
  return listAbsences(companyId, { status: 'pending' });
}

/**
 * Get absences by employee
 */
export async function getAbsencesByEmployee(
  employeeId: string,
  period?: { startDate: string; endDate: string }
): Promise<QueryResultArray<Absence>> {
  const supabase = createClient();

  let query = supabase
    .from('absences')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false });

  if (period?.startDate) {
    query = query.gte('start_date', period.startDate);
  }

  if (period?.endDate) {
    query = query.lte('end_date', period.endDate);
  }

  const { data, error } = await query;

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Create a new absence
 */
export async function createAbsence(
  absence: {
    company_id: string;
    employee_id: string;
    type: AbsenceType;
    start_date: string;
    end_date: string;
    reason?: string;
    notes?: string;
    document_url?: string;
    document_type?: string;
    cid_code?: string;
    issuing_doctor?: string;
    crm?: string;
    vacation_balance_id?: string;
    is_vacation_split?: boolean;
    split_number?: number;
    is_vacation_sold?: boolean;
    sold_days?: number;
    status?: AbsenceStatus;
  }
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('absences')
    .insert({
      ...absence,
      status: absence.status ?? 'draft',
      requested_by: user?.id,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Update an existing absence
 */
export async function updateAbsence(
  absenceId: string,
  updates: Partial<{
    type: AbsenceType;
    start_date: string;
    end_date: string;
    reason: string;
    notes: string;
    document_url: string;
    document_type: string;
    cid_code: string;
    issuing_doctor: string;
    crm: string;
    vacation_balance_id: string;
    is_vacation_split: boolean;
    split_number: number;
    is_vacation_sold: boolean;
    sold_days: number;
  }>
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('absences')
    .update(updates)
    .eq('id', absenceId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Delete/Cancel an absence
 */
export async function deleteAbsence(
  absenceId: string,
  cancellationReason?: string
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('absences')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id,
      cancellation_reason: cancellationReason,
    })
    .eq('id', absenceId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Submit absence for approval (draft → pending)
 */
export async function submitAbsence(
  absenceId: string
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('absences')
    .update({
      status: 'pending',
      requested_at: new Date().toISOString(),
    })
    .eq('id', absenceId)
    .eq('status', 'draft') // Only submit drafts
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Approve an absence
 */
export async function approveAbsence(
  absenceId: string
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('absences')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
    })
    .eq('id', absenceId)
    .eq('status', 'pending') // Only approve pending
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Reject an absence
 */
export async function rejectAbsence(
  absenceId: string,
  rejectionReason: string
): Promise<QueryResult<Absence>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('absences')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: user?.id,
      rejection_reason: rejectionReason,
    })
    .eq('id', absenceId)
    .eq('status', 'pending') // Only reject pending
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

// ============================================
// VACATION BALANCE QUERIES (Saldo de Férias)
// ============================================

/**
 * Get vacation balance for an employee
 */
export async function getVacationBalance(
  employeeId: string
): Promise<QueryResultArray<VacationBalance>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('vacation_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_expired', false)
    .gt('available_days', 0)
    .order('period_start', { ascending: true });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get all vacation balances for an employee (including expired)
 */
export async function getAllVacationBalances(
  employeeId: string
): Promise<QueryResultArray<VacationBalance>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('vacation_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .order('period_start', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get expiring vacation balances (for alerts)
 */
export async function getExpiringVacations(
  companyId: string,
  daysUntilExpiry: number = 90
): Promise<QueryResultArray<VacationBalance & { employee_name: string; department: string | null }>> {
  const supabase = createClient();

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  const { data, error } = await supabase
    .from('vacation_balances')
    .select(
      `
      *,
      employees!inner(full_name, department)
    `
    )
    .eq('company_id', companyId)
    .eq('is_expired', false)
    .gt('available_days', 0)
    .lte('expires_at', expiryDate.toISOString().split('T')[0])
    .order('expires_at', { ascending: true });

  const formattedData = data?.map((item) => ({
    ...item,
    employee_name: (item.employees as { full_name: string }).full_name,
    department: (item.employees as { department: string | null }).department,
  }));

  return {
    data: formattedData || null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get vacation policy for a company
 */
export async function getVacationPolicy(
  companyId: string
): Promise<QueryResult<VacationPolicy>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('vacation_policies')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('is_default', true)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get absence history for audit
 */
export async function getAbsenceHistory(
  absenceId: string
): Promise<QueryResultArray<AbsenceHistory>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('absence_history')
    .select('*')
    .eq('absence_id', absenceId)
    .order('performed_at', { ascending: false });

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get absence statistics for a company
 */
export async function getAbsenceStats(companyId: string): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  thisMonth: number;
  vacationsThisMonth: number;
}> {
  const supabase = createClient();

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: inProgress },
    { count: thisMonth },
    { count: vacationsThisMonth },
  ] = await Promise.all([
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending'),
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'approved'),
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'rejected'),
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'in_progress'),
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('start_date', firstDayOfMonth)
      .lte('start_date', lastDayOfMonth),
    supabase
      .from('absences')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('type', ['vacation', 'vacation_advance', 'vacation_sold'])
      .gte('start_date', firstDayOfMonth)
      .lte('start_date', lastDayOfMonth),
  ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0,
    inProgress: inProgress ?? 0,
    thisMonth: thisMonth ?? 0,
    vacationsThisMonth: vacationsThisMonth ?? 0,
  };
}

/**
 * Check if dates overlap with existing absences
 */
export async function checkAbsenceOverlap(
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeAbsenceId?: string
): Promise<QueryResult<boolean>> {
  const supabase = createClient();

  let query = supabase
    .from('absences')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .not('status', 'in', '("cancelled","rejected")')
    .or(
      `and(start_date.lte.${endDate},end_date.gte.${startDate})`
    );

  if (excludeAbsenceId) {
    query = query.neq('id', excludeAbsenceId);
  }

  const { count, error } = await query;

  return {
    data: (count ?? 0) > 0,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

// ============================================
// PAYROLL QUERIES (Folha de Pagamento)
// ============================================

/**
 * Interface for employee payroll with employee info
 */
export interface EmployeePayrollWithEmployee extends EmployeePayroll {
  employee_name: string;
  employee_department: string | null;
  employee_photo_url: string | null;
}

/**
 * List payroll periods for a company
 */
export async function listPayrollPeriods(
  companyId: string,
  filters?: {
    year?: number;
    status?: PayrollStatus;
    periodType?: PayrollPeriodType;
  }
): Promise<QueryResultArray<PayrollPeriod>> {
  const supabase = createClient();

  let query = supabase
    .from('payroll_periods')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (filters?.year) {
    query = query.eq('year', filters.year);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.periodType) {
    query = query.eq('period_type', filters.periodType);
  }

  const { data, error } = await query;

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get a single payroll period by ID
 */
export async function getPayrollPeriod(
  periodId: string
): Promise<QueryResult<PayrollPeriod>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get or create payroll period for a given month/year
 */
export async function getOrCreatePayrollPeriod(
  companyId: string,
  year: number,
  month: number,
  periodType: PayrollPeriodType = 'monthly'
): Promise<QueryResult<PayrollPeriod>> {
  const supabase = createClient();

  // Check if period exists
  const { data: existing, error: findError } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', year)
    .eq('month', month)
    .eq('period_type', periodType)
    .single();

  if (existing) {
    return { data: existing, error: null };
  }

  // Create new period if not exists (and not a "not found" error)
  if (findError && findError.code !== 'PGRST116') {
    return {
      data: null,
      error: { message: findError.message, code: findError.code },
    };
  }

  const referenceDate = new Date(year, month - 1, 1).toISOString().split('T')[0];

  const { data: created, error: createError } = await supabase
    .from('payroll_periods')
    .insert({
      company_id: companyId,
      year,
      month,
      reference_date: referenceDate,
      period_type: periodType,
      status: 'draft',
    })
    .select()
    .single();

  return {
    data: created,
    error: createError ? { message: createError.message, code: createError.code } : null,
  };
}

/**
 * List employee payrolls for a period
 */
export async function listEmployeePayrolls(
  periodId: string
): Promise<QueryResultArray<EmployeePayrollWithEmployee>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('employee_payrolls')
    .select(
      `
      *,
      employees!inner(full_name, department, photo_url)
    `
    )
    .eq('period_id', periodId)
    .order('employee_data->name', { ascending: true });

  const formattedData = data?.map((item) => ({
    ...item,
    employee_name:
      (item.employees as { full_name: string }).full_name ||
      item.employee_data?.name ||
      'Desconhecido',
    employee_department: (item.employees as { department: string | null }).department,
    employee_photo_url: (item.employees as { photo_url: string | null }).photo_url,
  })) as EmployeePayrollWithEmployee[] | null;

  return {
    data: formattedData,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Get payroll statistics for dashboard
 */
export async function getPayrollStats(
  companyId: string,
  year?: number,
  month?: number
): Promise<{
  totalNetSalary: number;
  totalEmployees: number;
  totalOvertime: number;
  totalBonuses: number;
  totalDeductions: number;
  periodStatus: PayrollStatus | null;
}> {
  const supabase = createClient();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  // Get the current period
  const { data: period } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', targetYear)
    .eq('month', targetMonth)
    .eq('period_type', 'monthly')
    .single();

  if (!period) {
    return {
      totalNetSalary: 0,
      totalEmployees: 0,
      totalOvertime: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      periodStatus: null,
    };
  }

  // Get employee payrolls for this period
  const { data: payrolls } = await supabase
    .from('employee_payrolls')
    .select('net_salary, total_earnings, total_deductions, overtime_50_value, overtime_100_value, earnings')
    .eq('period_id', period.id);

  if (!payrolls || payrolls.length === 0) {
    return {
      totalNetSalary: period.total_net || 0,
      totalEmployees: period.total_employees || 0,
      totalOvertime: 0,
      totalBonuses: 0,
      totalDeductions: period.total_deductions || 0,
      periodStatus: period.status as PayrollStatus,
    };
  }

  let totalOvertime = 0;
  let totalBonuses = 0;

  payrolls.forEach((p) => {
    totalOvertime += (p.overtime_50_value || 0) + (p.overtime_100_value || 0);
    // Calculate bonuses from earnings array (excluding base salary)
    if (p.earnings && Array.isArray(p.earnings)) {
      p.earnings.forEach((earning: { code?: string; value?: number }) => {
        if (earning.code !== '001') {
          // Not base salary
          totalBonuses += earning.value || 0;
        }
      });
    }
  });

  return {
    totalNetSalary: period.total_net || payrolls.reduce((acc, p) => acc + (p.net_salary || 0), 0),
    totalEmployees: payrolls.length,
    totalOvertime,
    totalBonuses,
    totalDeductions: period.total_deductions || payrolls.reduce((acc, p) => acc + (p.total_deductions || 0), 0),
    periodStatus: period.status as PayrollStatus,
  };
}

/**
 * Update payroll period status
 */
export async function updatePayrollPeriodStatus(
  periodId: string,
  status: PayrollStatus,
  approvedBy?: string
): Promise<QueryResult<PayrollPeriod>> {
  const supabase = createClient();

  const updateData: Partial<PayrollPeriod> = { status };

  if (status === 'approved' && approvedBy) {
    updateData.approved_by = approvedBy;
    updateData.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payroll_periods')
    .update(updateData)
    .eq('id', periodId)
    .select()
    .single();

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Generate payroll for all active employees in a period
 * Calls the database function calculate_employee_payroll for each employee
 */
export async function generatePayrollForPeriod(
  companyId: string,
  periodId: string
): Promise<QueryResult<{ processed: number; errors: string[] }>> {
  const supabase = createClient();

  // Get all active employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (empError) {
    return {
      data: null,
      error: { message: empError.message, code: empError.code },
    };
  }

  if (!employees || employees.length === 0) {
    return {
      data: { processed: 0, errors: [] },
      error: null,
    };
  }

  // Update period status to calculating
  await supabase
    .from('payroll_periods')
    .update({ status: 'calculating', total_employees: employees.length })
    .eq('id', periodId);

  const errors: string[] = [];
  let processed = 0;

  // Calculate payroll for each employee
  for (const employee of employees) {
    try {
      const { error } = await supabase.rpc('calculate_employee_payroll', {
        p_employee_id: employee.id,
        p_period_id: periodId,
      });

      if (error) {
        errors.push(`${employee.id}: ${error.message}`);
      } else {
        processed++;
      }
    } catch (err) {
      errors.push(`${employee.id}: ${String(err)}`);
    }
  }

  // Update period status to calculated
  await supabase
    .from('payroll_periods')
    .update({
      status: errors.length > 0 ? 'review' : 'calculated',
      calculation_date: new Date().toISOString().split('T')[0],
      total_processed: processed,
      total_errors: errors.length,
    })
    .eq('id', periodId);

  return {
    data: { processed, errors },
    error: null,
  };
}
