/**
 * Unit Tests - Compliance
 * Tests for AFD/AEJ generation and CLT compliance validation
 */

import { describe, it, expect } from 'vitest'
import {
  AFDGenerator,
  generateAFD,
  validatePIS,
  formatPIS,
  type AFDData,
} from '@/lib/compliance/afd-generator'
import { testCompany, testEmployee } from '../fixtures/users'

describe('PIS Validation', () => {
  it('should validate valid PIS', () => {
    expect(validatePIS('120.45678.90-1')).toBe(true)
    expect(validatePIS('12045678901')).toBe(true)
  })

  it('should reject invalid PIS', () => {
    expect(validatePIS('123.45678.90-0')).toBe(false)
    expect(validatePIS('00000000000')).toBe(false)
    expect(validatePIS('11111111111')).toBe(false)
  })

  it('should reject PIS with wrong length', () => {
    expect(validatePIS('123')).toBe(false)
    expect(validatePIS('12345678901234')).toBe(false)
    expect(validatePIS('')).toBe(false)
  })
})

describe('PIS Formatting', () => {
  it('should format PIS with mask', () => {
    expect(formatPIS('12045678901')).toBe('120.45678.90-1')
  })

  it('should handle already formatted PIS', () => {
    expect(formatPIS('120.45678.90-1')).toBe('120.45678.90-1')
  })

  it('should pad short PIS', () => {
    expect(formatPIS('123')).toBe('000.00000.12-3')
  })
})

describe('AFD Generator', () => {
  const employee = {
    ...testEmployee,
    pis: '12045678901',
  }

  const timeRecords = [
    {
      id: '1',
      employee_id: employee.id,
      company_id: testCompany.id,
      record_type: 'clock_in' as const,
      recorded_at: new Date('2024-01-15T08:00:00Z'),
      source: 'web' as const,
      created_at: new Date(),
    },
    {
      id: '2',
      employee_id: employee.id,
      company_id: testCompany.id,
      record_type: 'clock_out' as const,
      recorded_at: new Date('2024-01-15T17:00:00Z'),
      source: 'web' as const,
      created_at: new Date(),
    },
  ]

  const afdData: AFDData = {
    company: testCompany,
    employees: [employee],
    timeRecords: timeRecords as any,
    dailyRecords: [],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  }

  describe('File Generation', () => {
    it('should generate AFD with correct structure', () => {
      const result = generateAFD(afdData)

      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
      expect(result.filename).toBeDefined()
      expect(result.totalRecords).toBeGreaterThan(0)
      expect(result.encoding).toBe('UTF-8')
    })

    it('should generate filename with CNPJ and dates', () => {
      const result = generateAFD(afdData)

      expect(result.filename).toContain('AFD_')
      expect(result.filename).toContain('12345678000190')
      expect(result.filename).toContain('.txt')
    })

    it('should include header record (Type 1)', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      expect(lines[0]).toMatch(/^1/)
      expect(lines[0]).toHaveLength(99)
    })

    it('should include REP identification record (Type 2)', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      expect(lines[1]).toMatch(/^2/)
      expect(lines[1]).toHaveLength(99)
    })

    it('should include time records (Type 3)', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const type3Records = lines.filter(line => line.startsWith('3'))
      expect(type3Records).toHaveLength(2)
      type3Records.forEach(record => {
        expect(record).toHaveLength(99)
      })
    })

    it('should include trailer record (Type 9)', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const lastLine = lines[lines.length - 1]
      expect(lastLine).toMatch(/^9/)
      expect(lastLine).toHaveLength(99)
    })

    it('should sort records by date', () => {
      const unsortedRecords = [
        {
          id: '1',
          employee_id: employee.id,
          company_id: testCompany.id,
          record_type: 'clock_out' as const,
          recorded_at: new Date('2024-01-15T17:00:00Z'),
          source: 'web' as const,
          created_at: new Date(),
        },
        {
          id: '2',
          employee_id: employee.id,
          company_id: testCompany.id,
          record_type: 'clock_in' as const,
          recorded_at: new Date('2024-01-15T08:00:00Z'),
          source: 'web' as const,
          created_at: new Date(),
        },
      ]

      const data = { ...afdData, timeRecords: unsortedRecords as any }
      const result = generateAFD(data)
      const lines = result.content.split('\r\n')

      const type3Records = lines.filter(line => line.startsWith('3'))

      // First record should be clock_in (08:00)
      expect(type3Records[0]).toContain('0800')
      // Second record should be clock_out (17:00)
      expect(type3Records[1]).toContain('1700')
    })

    it('should handle multiple employees', () => {
      const employee2 = {
        ...testEmployee,
        id: '550e8400-e29b-41d4-a716-446655440002',
        pis: '98765432109',
      }

      const multiEmployeeData = {
        ...afdData,
        employees: [employee, employee2],
        timeRecords: [
          ...timeRecords,
          {
            id: '3',
            employee_id: employee2.id,
            company_id: testCompany.id,
            record_type: 'clock_in' as const,
            recorded_at: new Date('2024-01-15T09:00:00Z'),
            source: 'web' as const,
            created_at: new Date(),
          },
        ] as any,
      }

      const result = generateAFD(multiEmployeeData)
      const lines = result.content.split('\r\n')

      const type3Records = lines.filter(line => line.startsWith('3'))
      expect(type3Records).toHaveLength(3)
    })
  })

  describe('NSR Sequencing', () => {
    it('should assign sequential NSR to all records', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const nsrNumbers = lines.map(line => {
        const nsr = line.substring(1, 10)
        return parseInt(nsr, 10)
      })

      // Should be sequential: 1, 2, 3, 4, 5
      for (let i = 1; i < nsrNumbers.length; i++) {
        expect(nsrNumbers[i]).toBe(nsrNumbers[i - 1] + 1)
      }
    })
  })

  describe('Date/Time Formatting', () => {
    it('should format date as DDMMAAAA', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const headerLine = lines[0]

      // Positions 205-212: start date (15012024)
      const startDate = headerLine.substring(204, 212)
      expect(startDate).toMatch(/^\d{8}$/)
      expect(startDate).toBe('01012024')
    })

    it('should format time as HHMM', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const type3Records = lines.filter(line => line.startsWith('3'))

      // Check time format in first record
      const timePart = type3Records[0].substring(30, 34)
      expect(timePart).toMatch(/^\d{4}$/)
    })
  })

  describe('Configuration Options', () => {
    it('should accept custom REP number', () => {
      const result = generateAFD(afdData, {
        repNumber: 'CUSTOM12345678901',
      })

      const lines = result.content.split('\r\n')
      const type2Record = lines[1]

      expect(type2Record).toContain('CUSTOM12345678901')
    })

    it('should accept custom encoding', () => {
      const result = generateAFD(afdData, {
        encoding: 'ISO-8859-1',
      })

      expect(result.encoding).toBe('ISO-8859-1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty time records', () => {
      const emptyData = {
        ...afdData,
        timeRecords: [],
      }

      const result = generateAFD(emptyData)

      expect(result).toBeDefined()
      expect(result.totalRecords).toBeGreaterThan(0) // Header, REP, Trailer
    })

    it('should handle employee without PIS', () => {
      const noPisEmployee = { ...employee, pis: undefined }
      const noPisData = {
        ...afdData,
        employees: [noPisEmployee],
      }

      const result = generateAFD(noPisData)
      const lines = result.content.split('\r\n')

      // Should not include Type 3 records for employees without PIS
      const type3Records = lines.filter(line => line.startsWith('3'))
      expect(type3Records).toHaveLength(0)
    })

    it('should normalize special characters', () => {
      const specialCompany = {
        ...testCompany,
        name: 'Açúcar & Café Ltda',
      }

      const specialData = {
        ...afdData,
        company: specialCompany,
      }

      const result = generateAFD(specialData)
      const lines = result.content.split('\r\n')

      // Header should not contain special characters
      expect(lines[0]).not.toContain('ú')
      expect(lines[0]).not.toContain('ç')
      expect(lines[0]).not.toContain('&')
    })

    it('should truncate long company names', () => {
      const longNameCompany = {
        ...testCompany,
        name: 'A'.repeat(200), // Exceeds 150 char limit
      }

      const longNameData = {
        ...afdData,
        company: longNameCompany,
      }

      const result = generateAFD(longNameData)
      const lines = result.content.split('\r\n')

      expect(lines[0]).toHaveLength(99)
    })
  })

  describe('Adjustments and Inclusions', () => {
    it('should include adjustment records (Type 4)', () => {
      const dataWithAdjustments = {
        ...afdData,
        adjustments: [
          {
            nsr: 100,
            originalDateTime: new Date('2024-01-15T08:00:00Z'),
            adjustedDateTime: new Date('2024-01-15T08:05:00Z'),
            employeePis: employee.pis,
            reason: 'Ajuste de horario',
            adjustedBy: 'admin',
            adjustedAt: new Date(),
          },
        ],
      }

      const result = generateAFD(dataWithAdjustments)
      const lines = result.content.split('\r\n')

      const type4Records = lines.filter(line => line.startsWith('4'))
      expect(type4Records).toHaveLength(1)
      expect(type4Records[0]).toHaveLength(99)
    })

    it('should include inclusion records (Type 5)', () => {
      const dataWithInclusions = {
        ...afdData,
        inclusions: [
          {
            nsr: 200,
            dateTime: new Date('2024-01-15T12:00:00Z'),
            employeePis: employee.pis,
            reason: 'Inclusao manual',
            includedBy: 'admin',
            includedAt: new Date(),
          },
        ],
      }

      const result = generateAFD(dataWithInclusions)
      const lines = result.content.split('\r\n')

      const type5Records = lines.filter(line => line.startsWith('5'))
      expect(type5Records).toHaveLength(1)
      expect(type5Records[0]).toHaveLength(99)
    })
  })

  describe('Trailer Validation', () => {
    it('should have correct total count in trailer', () => {
      const result = generateAFD(afdData)
      const lines = result.content.split('\r\n')

      const trailerLine = lines[lines.length - 1]
      const totalCount = parseInt(trailerLine.substring(1, 10), 10)

      expect(totalCount).toBe(lines.length)
    })
  })
})

describe('AFDGenerator Class', () => {
  it('should initialize with default config', () => {
    const generator = new AFDGenerator()
    expect(generator).toBeDefined()
  })

  it('should accept custom configuration', () => {
    const generator = new AFDGenerator({
      encoding: 'ISO-8859-1',
      repNumber: 'TEST123456789',
      repType: 1,
    })
    expect(generator).toBeDefined()
  })

  it('should encode content correctly', () => {
    const generator = new AFDGenerator({ encoding: 'UTF-8' })
    const buffer = generator.encodeContent('Test content')

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.toString('utf-8')).toBe('Test content')
  })

  it('should encode ISO-8859-1 content', () => {
    const generator = new AFDGenerator({ encoding: 'ISO-8859-1' })
    const buffer = generator.encodeContent('Test')

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBe(4)
  })
})
