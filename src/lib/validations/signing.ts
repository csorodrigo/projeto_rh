/**
 * Signing (Time Entry) Validation Schemas
 * Zod schemas for time tracking operations
 */

import { z } from 'zod';

/**
 * Valid clock action types
 */
export const clockTypeSchema = z.enum(['clock_in', 'clock_out', 'break_start', 'break_end']);

/**
 * Valid record sources
 */
export const recordSourceSchema = z.enum(['mobile_app', 'web', 'biometric', 'manual', 'import']);

/**
 * Device information schema
 */
export const deviceInfoSchema = z.object({
  user_agent: z.string().optional(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  app_version: z.string().optional(),
  os: z.string().optional(),
  browser: z.string().optional(),
}).passthrough();

/**
 * Location data schema
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().positive().optional(),
  address: z.string().max(500).optional(),
});

/**
 * Create signing (record time entry) schema
 */
export const createSigningSchema = z.object({
  employee_id: z.string().uuid('ID do funcionario invalido'),
  company_id: z.string().uuid('ID da empresa invalido'),
  record_type: clockTypeSchema,
  source: recordSourceSchema.default('web'),
  notes: z.string().max(500, 'Notas devem ter no maximo 500 caracteres').optional(),
  location: locationSchema.optional(),
  device_info: deviceInfoSchema.optional(),
  photo_url: z.string().url('URL da foto invalida').optional(),
});

/**
 * List signings query parameters schema
 */
export const listSigningsQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Update signing schema (for manual adjustments)
 */
export const updateSigningSchema = z.object({
  recorded_at: z.string().datetime('Data/hora invalida').optional(),
  notes: z.string().max(500).optional(),
  adjustment_reason: z.string().min(10, 'Motivo do ajuste deve ter pelo menos 10 caracteres').max(500),
});

/**
 * Batch create signings schema (for imports)
 */
export const batchCreateSigningsSchema = z.object({
  entries: z.array(createSigningSchema).min(1).max(500),
  skip_validation: z.boolean().default(false),
});

/**
 * Time tracking report query schema
 */
export const timeTrackingReportQuerySchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid().optional(),
  department: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['pending', 'approved', 'rejected', 'adjusted']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

// Type exports
export type ClockTypeInput = z.infer<typeof clockTypeSchema>;
export type RecordSourceInput = z.infer<typeof recordSourceSchema>;
export type CreateSigningInput = z.infer<typeof createSigningSchema>;
export type ListSigningsQuery = z.infer<typeof listSigningsQuerySchema>;
export type UpdateSigningInput = z.infer<typeof updateSigningSchema>;
export type BatchCreateSigningsInput = z.infer<typeof batchCreateSigningsSchema>;
export type TimeTrackingReportQuery = z.infer<typeof timeTrackingReportQuerySchema>;

/**
 * Validation helper: check if action is valid based on current status
 */
export function validateActionSequence(
  currentStatus: 'not_started' | 'working' | 'break' | 'finished',
  requestedAction: ClockTypeInput
): { valid: boolean; message: string } {
  const validTransitions: Record<typeof currentStatus, ClockTypeInput[]> = {
    not_started: ['clock_in'],
    working: ['break_start', 'clock_out'],
    break: ['break_end'],
    finished: ['clock_in'], // Allow restart next day or corrections
  };

  const allowedActions = validTransitions[currentStatus];

  if (!allowedActions.includes(requestedAction)) {
    const actionNames: Record<ClockTypeInput, string> = {
      clock_in: 'Entrada',
      clock_out: 'Saida',
      break_start: 'Inicio de intervalo',
      break_end: 'Fim de intervalo',
    };

    const statusNames: Record<typeof currentStatus, string> = {
      not_started: 'sem registro hoje',
      working: 'trabalhando',
      break: 'em intervalo',
      finished: 'expediente encerrado',
    };

    return {
      valid: false,
      message: `Acao "${actionNames[requestedAction]}" nao permitida quando status e "${statusNames[currentStatus]}". Acoes permitidas: ${allowedActions.map(a => actionNames[a]).join(', ')}`,
    };
  }

  return { valid: true, message: 'OK' };
}

/**
 * Validation helper: check for duplicate records within time window
 */
export function checkDuplicateWindow(
  lastRecordTime: Date | null,
  windowMinutes: number = 1
): { isDuplicate: boolean; message: string } {
  if (!lastRecordTime) {
    return { isDuplicate: false, message: 'OK' };
  }

  const now = new Date();
  const diffMs = now.getTime() - lastRecordTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  if (diffMinutes < windowMinutes) {
    return {
      isDuplicate: true,
      message: `Registro duplicado. Aguarde pelo menos ${windowMinutes} minuto(s) entre registros.`,
    };
  }

  return { isDuplicate: false, message: 'OK' };
}
