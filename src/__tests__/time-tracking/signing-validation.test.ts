/**
 * Unit Tests - Signing Validation
 * Tests for time entry validation logic and sequence validation
 */

import { describe, it, expect } from 'vitest'
import {
  validateActionSequence,
  checkDuplicateWindow,
  createSigningSchema,
  clockTypeSchema,
} from '@/lib/validations/signing'

describe('validateActionSequence', () => {
  describe('from not_started status', () => {
    it('should allow clock_in', () => {
      const result = validateActionSequence('not_started', 'clock_in')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('OK')
    })

    it('should reject clock_out', () => {
      const result = validateActionSequence('not_started', 'clock_out')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('nao permitida')
    })

    it('should reject break_start', () => {
      const result = validateActionSequence('not_started', 'break_start')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('nao permitida')
    })

    it('should reject break_end', () => {
      const result = validateActionSequence('not_started', 'break_end')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('nao permitida')
    })
  })

  describe('from working status', () => {
    it('should allow break_start', () => {
      const result = validateActionSequence('working', 'break_start')
      expect(result.valid).toBe(true)
    })

    it('should allow clock_out', () => {
      const result = validateActionSequence('working', 'clock_out')
      expect(result.valid).toBe(true)
    })

    it('should reject clock_in', () => {
      const result = validateActionSequence('working', 'clock_in')
      expect(result.valid).toBe(false)
    })

    it('should reject break_end', () => {
      const result = validateActionSequence('working', 'break_end')
      expect(result.valid).toBe(false)
    })
  })

  describe('from break status', () => {
    it('should allow break_end', () => {
      const result = validateActionSequence('break', 'break_end')
      expect(result.valid).toBe(true)
    })

    it('should reject clock_in', () => {
      const result = validateActionSequence('break', 'clock_in')
      expect(result.valid).toBe(false)
    })

    it('should reject clock_out', () => {
      const result = validateActionSequence('break', 'clock_out')
      expect(result.valid).toBe(false)
    })

    it('should reject break_start', () => {
      const result = validateActionSequence('break', 'break_start')
      expect(result.valid).toBe(false)
    })
  })

  describe('from finished status', () => {
    it('should allow clock_in for next day', () => {
      const result = validateActionSequence('finished', 'clock_in')
      expect(result.valid).toBe(true)
    })

    it('should reject clock_out', () => {
      const result = validateActionSequence('finished', 'clock_out')
      expect(result.valid).toBe(false)
    })

    it('should reject break operations', () => {
      expect(validateActionSequence('finished', 'break_start').valid).toBe(false)
      expect(validateActionSequence('finished', 'break_end').valid).toBe(false)
    })
  })
})

describe('checkDuplicateWindow', () => {
  it('should allow first record (no last record)', () => {
    const result = checkDuplicateWindow(null)
    expect(result.isDuplicate).toBe(false)
    expect(result.message).toBe('OK')
  })

  it('should reject duplicate within 1 minute window', () => {
    const now = new Date()
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)

    const result = checkDuplicateWindow(thirtySecondsAgo, 1)
    expect(result.isDuplicate).toBe(true)
    expect(result.message).toContain('duplicado')
  })

  it('should allow record after 1 minute window', () => {
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)

    const result = checkDuplicateWindow(twoMinutesAgo, 1)
    expect(result.isDuplicate).toBe(false)
    expect(result.message).toBe('OK')
  })

  it('should respect custom window duration', () => {
    const now = new Date()
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000)

    // With 5 minute window, should be duplicate
    const result5min = checkDuplicateWindow(threeMinutesAgo, 5)
    expect(result5min.isDuplicate).toBe(true)

    // With 2 minute window, should be allowed
    const result2min = checkDuplicateWindow(threeMinutesAgo, 2)
    expect(result2min.isDuplicate).toBe(false)
  })
})

describe('createSigningSchema validation', () => {
  it('should validate valid signing data', () => {
    const validData = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
      source: 'web' as const,
    }

    const result = createSigningSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid UUIDs', () => {
    const invalidData = {
      employee_id: 'invalid-uuid',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
      source: 'web' as const,
    }

    const result = createSigningSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject invalid record_type', () => {
    const invalidData = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'invalid_type',
      source: 'web' as const,
    }

    const result = createSigningSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept valid location data', () => {
    const validData = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
      source: 'mobile_app' as const,
      location: {
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        address: 'São Paulo, SP',
      },
    }

    const result = createSigningSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid latitude/longitude', () => {
    const invalidData = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
      source: 'mobile_app' as const,
      location: {
        latitude: 100, // Invalid: > 90
        longitude: -46.6333,
      },
    }

    const result = createSigningSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should limit notes to 500 characters', () => {
    const longNotes = 'a'.repeat(501)
    const invalidData = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
      source: 'web' as const,
      notes: longNotes,
    }

    const result = createSigningSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should default source to web', () => {
    const dataWithoutSource = {
      employee_id: '550e8400-e29b-41d4-a716-446655440001',
      company_id: '550e8400-e29b-41d4-a716-446655440010',
      record_type: 'clock_in' as const,
    }

    const result = createSigningSchema.safeParse(dataWithoutSource)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.source).toBe('web')
    }
  })
})

describe('clockTypeSchema validation', () => {
  it('should accept valid clock types', () => {
    expect(clockTypeSchema.safeParse('clock_in').success).toBe(true)
    expect(clockTypeSchema.safeParse('clock_out').success).toBe(true)
    expect(clockTypeSchema.safeParse('break_start').success).toBe(true)
    expect(clockTypeSchema.safeParse('break_end').success).toBe(true)
  })

  it('should reject invalid clock types', () => {
    expect(clockTypeSchema.safeParse('lunch').success).toBe(false)
    expect(clockTypeSchema.safeParse('pause').success).toBe(false)
    expect(clockTypeSchema.safeParse('').success).toBe(false)
  })
})
