/**
 * Integration Tests - Signings API
 * Tests for time entry API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/signings/route'
import { GET as GET_TODAY } from '@/app/api/signings/today/route'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

describe('POST /api/signings - Create Time Entry', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockEmployee = {
    id: 'emp-123',
    name: 'John Doe',
    status: 'active',
    company_id: 'company-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('should create clock_in entry successfully', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null, // No previous record today
      error: null,
    })

    const newRecord = {
      id: 'record-123',
      employee_id: 'emp-123',
      company_id: 'company-123',
      record_type: 'clock_in',
      recorded_at: new Date().toISOString(),
      source: 'web',
    }

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: newRecord,
      error: null,
    })

    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_in',
        source: 'web',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.record_type).toBe('clock_in')
    expect(data.message).toContain('Entrada registrada')
  })

  it('should reject unauthenticated requests', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_in',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.code).toBe('UNAUTHORIZED')
  })

  it('should reject invalid employee_id', async () => {
    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'invalid-uuid',
        company_id: 'company-123',
        record_type: 'clock_in',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should reject inactive employee', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: { ...mockEmployee, status: 'inactive' },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_in',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('EMPLOYEE_INACTIVE')
  })

  it('should validate action sequence (cannot clock_out before clock_in)', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null, // No previous record
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_out', // Invalid: trying to clock out first
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_ACTION_SEQUENCE')
  })

  it('should validate action sequence (clock_out after clock_in)', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: {
        record_type: 'clock_in',
        recorded_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      error: null,
    })

    const newRecord = {
      id: 'record-124',
      employee_id: 'emp-123',
      company_id: 'company-123',
      record_type: 'clock_out',
      recorded_at: new Date().toISOString(),
      source: 'web',
    }

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: newRecord,
      error: null,
    })

    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_out',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.record_type).toBe('clock_out')
  })

  it('should reject duplicate records within 1 minute window', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: {
        record_type: 'clock_in',
        recorded_at: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'clock_out',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.code).toBe('DUPLICATE_RECORD')
  })

  it('should accept break_start when working', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: {
        record_type: 'clock_in',
        recorded_at: new Date(Date.now() - 3600000).toISOString(),
      },
      error: null,
    })

    const newRecord = {
      id: 'record-125',
      employee_id: 'emp-123',
      company_id: 'company-123',
      record_type: 'break_start',
      recorded_at: new Date().toISOString(),
      source: 'web',
    }

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: newRecord,
      error: null,
    })

    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'break_start',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.record_type).toBe('break_start')
  })

  it('should accept break_end when on break', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockEmployee,
      error: null,
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: {
        record_type: 'break_start',
        recorded_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      },
      error: null,
    })

    const newRecord = {
      id: 'record-126',
      employee_id: 'emp-123',
      company_id: 'company-123',
      record_type: 'break_end',
      recorded_at: new Date().toISOString(),
      source: 'web',
    }

    mockSupabaseClient.single.mockResolvedValueOnce({
      data: newRecord,
      error: null,
    })

    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null })

    const request = new NextRequest('http://localhost:3000/api/signings', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: 'emp-123',
        company_id: 'company-123',
        record_type: 'break_end',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.record_type).toBe('break_end')
  })
})

describe('GET /api/signings/today - Get Today\'s Records', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'user-123',
    company_id: 'company-123',
    role: 'employee',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('should return today\'s records for current user', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    const todayRecords = [
      {
        id: 'record-1',
        employee_id: 'user-123',
        record_type: 'clock_in',
        recorded_at: new Date().toISOString(),
      },
    ]

    mockSupabaseClient.select.mockReturnValueOnce({
      ...mockSupabaseClient,
      eq: vi.fn().mockReturnValueOnce({
        ...mockSupabaseClient,
        gte: vi.fn().mockReturnValueOnce({
          ...mockSupabaseClient,
          lte: vi.fn().mockReturnValueOnce({
            ...mockSupabaseClient,
            order: vi.fn().mockResolvedValueOnce({
              data: todayRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings/today')

    const response = await GET_TODAY(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.records).toHaveLength(1)
    expect(data.data.status.current).toBe('working')
  })

  it('should reject access to other employee records (non-admin)', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/signings/today?employee_id=other-user-456'
    )

    const response = await GET_TODAY(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('FORBIDDEN')
  })

  it('should allow admin to view other employee records', async () => {
    const adminProfile = {
      ...mockProfile,
      role: 'hr_manager',
    }

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: adminProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'other-user-456', company_id: 'company-123' },
        error: null,
      })

    const todayRecords = [
      {
        id: 'record-2',
        employee_id: 'other-user-456',
        record_type: 'clock_in',
        recorded_at: new Date().toISOString(),
      },
    ]

    mockSupabaseClient.select.mockReturnValueOnce({
      ...mockSupabaseClient,
      eq: vi.fn().mockReturnValueOnce({
        ...mockSupabaseClient,
        gte: vi.fn().mockReturnValueOnce({
          ...mockSupabaseClient,
          lte: vi.fn().mockReturnValueOnce({
            ...mockSupabaseClient,
            order: vi.fn().mockResolvedValueOnce({
              data: todayRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/signings/today?employee_id=other-user-456'
    )

    const response = await GET_TODAY(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should calculate worked minutes correctly', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    const clockInTime = new Date(Date.now() - 4 * 3600000) // 4 hours ago
    const todayRecords = [
      {
        id: 'record-1',
        employee_id: 'user-123',
        record_type: 'clock_in',
        recorded_at: clockInTime.toISOString(),
      },
    ]

    mockSupabaseClient.select.mockReturnValueOnce({
      ...mockSupabaseClient,
      eq: vi.fn().mockReturnValueOnce({
        ...mockSupabaseClient,
        gte: vi.fn().mockReturnValueOnce({
          ...mockSupabaseClient,
          lte: vi.fn().mockReturnValueOnce({
            ...mockSupabaseClient,
            order: vi.fn().mockResolvedValueOnce({
              data: todayRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings/today')

    const response = await GET_TODAY(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.summary.worked_minutes).toBeGreaterThan(0)
  })

  it('should return correct next allowed actions', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    const todayRecords = [
      {
        id: 'record-1',
        employee_id: 'user-123',
        record_type: 'clock_in',
        recorded_at: new Date().toISOString(),
      },
    ]

    mockSupabaseClient.select.mockReturnValueOnce({
      ...mockSupabaseClient,
      eq: vi.fn().mockReturnValueOnce({
        ...mockSupabaseClient,
        gte: vi.fn().mockReturnValueOnce({
          ...mockSupabaseClient,
          lte: vi.fn().mockReturnValueOnce({
            ...mockSupabaseClient,
            order: vi.fn().mockResolvedValueOnce({
              data: todayRecords,
              error: null,
            }),
          }),
        }),
      }),
    })

    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/signings/today')

    const response = await GET_TODAY(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.next_allowed_actions).toContain('break_start')
    expect(data.data.next_allowed_actions).toContain('clock_out')
  })
})

describe('GET /api/signings - List Time Entries', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'user-123',
    company_id: 'company-123',
    role: 'employee',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  it('should list records with pagination', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    const mockRecords = Array.from({ length: 10 }, (_, i) => ({
      id: `record-${i}`,
      employee_id: 'user-123',
      record_type: i % 2 === 0 ? 'clock_in' : 'clock_out',
      recorded_at: new Date(Date.now() - i * 3600000).toISOString(),
    }))

    mockSupabaseClient.range.mockResolvedValueOnce({
      data: mockRecords,
      error: null,
      count: 50,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/signings?limit=10&offset=0'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(10)
    expect(data.pagination.total).toBe(50)
    expect(data.pagination.has_more).toBe(true)
  })

  it('should filter by date range', async () => {
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    })

    mockSupabaseClient.range.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/signings?start_date=2024-01-01&end_date=2024-01-31'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
