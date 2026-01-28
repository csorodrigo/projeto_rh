/**
 * Unit Tests - Hours Calculation
 * Tests for CLT calculations including work hours, overtime, and night shift
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDailyJourney,
  calculateMonthlyJourney,
  calculateHourlyRate,
  calculateDSR,
  calculateMonetaryValues,
  getMinutesDiff,
  minutesToDecimalHours,
  formatMinutesAsTime,
  applyTolerance,
  isNightTime,
  calculateNightMinutes,
  applyNightReduction,
  CLT_CONSTANTS,
  type DailyTimeRecord,
} from '@/lib/compliance/clt-calculations'

describe('Time Utility Functions', () => {
  describe('getMinutesDiff', () => {
    it('should calculate difference in minutes', () => {
      const start = new Date('2024-01-15T08:00:00Z')
      const end = new Date('2024-01-15T09:30:00Z')
      expect(getMinutesDiff(start, end)).toBe(90)
    })

    it('should handle cross-day differences', () => {
      const start = new Date('2024-01-15T23:00:00Z')
      const end = new Date('2024-01-16T01:00:00Z')
      expect(getMinutesDiff(start, end)).toBe(120)
    })
  })

  describe('minutesToDecimalHours', () => {
    it('should convert 60 minutes to 1 hour', () => {
      expect(minutesToDecimalHours(60)).toBe(1)
    })

    it('should convert 90 minutes to 1.5 hours', () => {
      expect(minutesToDecimalHours(90)).toBe(1.5)
    })

    it('should round to 2 decimal places', () => {
      expect(minutesToDecimalHours(100)).toBe(1.67)
    })
  })

  describe('formatMinutesAsTime', () => {
    it('should format positive minutes', () => {
      expect(formatMinutesAsTime(90)).toBe('01:30')
      expect(formatMinutesAsTime(480)).toBe('08:00')
    })

    it('should format negative minutes', () => {
      expect(formatMinutesAsTime(-30)).toBe('-00:30')
      expect(formatMinutesAsTime(-90)).toBe('-01:30')
    })

    it('should pad single digits', () => {
      expect(formatMinutesAsTime(5)).toBe('00:05')
    })
  })

  describe('applyTolerance', () => {
    it('should adjust within tolerance to expected', () => {
      const result = applyTolerance(485, 480) // 5 minutes over
      expect(result.adjusted).toBe(480)
      expect(result.exceedsTolerance).toBe(false)
    })

    it('should not adjust beyond tolerance', () => {
      const result = applyTolerance(495, 480) // 15 minutes over
      expect(result.adjusted).toBe(495)
      expect(result.exceedsTolerance).toBe(true)
    })

    it('should work with negative differences', () => {
      const result = applyTolerance(475, 480) // 5 minutes under
      expect(result.adjusted).toBe(480)
      expect(result.exceedsTolerance).toBe(false)
    })
  })
})

describe('Night Shift Calculations', () => {
  describe('isNightTime', () => {
    it('should identify night hours (22h-5h)', () => {
      expect(isNightTime(new Date('2024-01-15T22:00:00Z'))).toBe(true)
      expect(isNightTime(new Date('2024-01-15T23:30:00Z'))).toBe(true)
      expect(isNightTime(new Date('2024-01-16T00:30:00Z'))).toBe(true)
      expect(isNightTime(new Date('2024-01-16T04:59:00Z'))).toBe(true)
    })

    it('should identify day hours', () => {
      expect(isNightTime(new Date('2024-01-15T05:00:00Z'))).toBe(false)
      expect(isNightTime(new Date('2024-01-15T12:00:00Z'))).toBe(false)
      expect(isNightTime(new Date('2024-01-15T21:59:00Z'))).toBe(false)
    })
  })

  describe('calculateNightMinutes', () => {
    it('should calculate night minutes in shift', () => {
      const start = new Date('2024-01-15T22:00:00Z')
      const end = new Date('2024-01-16T05:00:00Z')
      const nightMins = calculateNightMinutes(start, end)
      expect(nightMins).toBeGreaterThan(0)
      expect(nightMins).toBeLessThanOrEqual(420) // 7 hours max
    })

    it('should return 0 for day shift', () => {
      const start = new Date('2024-01-15T08:00:00Z')
      const end = new Date('2024-01-15T17:00:00Z')
      expect(calculateNightMinutes(start, end)).toBe(0)
    })
  })

  describe('applyNightReduction', () => {
    it('should apply night reduction formula', () => {
      // 52.5 night minutes = 60 equivalent minutes
      const reduced = applyNightReduction(52.5)
      expect(reduced).toBe(60)
    })

    it('should calculate proportionally', () => {
      const reduced = applyNightReduction(105) // 2 * 52.5
      expect(reduced).toBe(120) // 2 * 60
    })
  })
})

describe('Daily Journey Calculation', () => {
  it('should calculate normal 8-hour workday', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15'),
      clockIn: new Date('2024-01-15T08:00:00Z'),
      clockOut: new Date('2024-01-15T17:00:00Z'),
      breakStart: new Date('2024-01-15T12:00:00Z'),
      breakEnd: new Date('2024-01-15T13:00:00Z'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.workedMinutes).toBe(540) // 9 hours
    expect(result.breakMinutes).toBe(60) // 1 hour
    expect(result.netWorkedMinutes).toBe(480) // 8 hours
    expect(result.overtime50Minutes).toBe(0)
    expect(result.overtime100Minutes).toBe(0)
    expect(result.missingMinutes).toBe(0)
  })

  it('should calculate overtime (50%)', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15'),
      clockIn: new Date('2024-01-15T08:00:00Z'),
      clockOut: new Date('2024-01-15T19:00:00Z'), // 10 hours worked
      breakStart: new Date('2024-01-15T12:00:00Z'),
      breakEnd: new Date('2024-01-15T13:00:00Z'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.netWorkedMinutes).toBe(600) // 10 hours
    expect(result.overtime50Minutes).toBeGreaterThan(0)
    expect(result.timeBankMinutes).toBeGreaterThan(0)
  })

  it('should calculate Sunday overtime (100%)', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-14'), // Sunday
      clockIn: new Date('2024-01-14T08:00:00Z'),
      clockOut: new Date('2024-01-14T17:00:00Z'),
      breakStart: new Date('2024-01-14T12:00:00Z'),
      breakEnd: new Date('2024-01-14T13:00:00Z'),
      isWorkday: false,
      isHoliday: false,
      isSunday: true,
    }

    const result = calculateDailyJourney(record)

    expect(result.netWorkedMinutes).toBe(480)
    expect(result.overtime100Minutes).toBeGreaterThan(0)
    expect(result.overtime50Minutes).toBe(0)
  })

  it('should calculate missing hours', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15'),
      clockIn: new Date('2024-01-15T08:00:00Z'),
      clockOut: new Date('2024-01-15T15:00:00Z'), // 6 hours worked
      breakStart: new Date('2024-01-15T12:00:00Z'),
      breakEnd: new Date('2024-01-15T13:00:00Z'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.netWorkedMinutes).toBe(360) // 6 hours
    expect(result.missingMinutes).toBeGreaterThan(0)
    expect(result.timeBankMinutes).toBeLessThan(0)
  })

  it('should handle missing clock-in/out', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15'),
      clockIn: null,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.workedMinutes).toBe(0)
    expect(result.missingMinutes).toBe(480) // Expected 8 hours
    expect(result.warnings).toContain('Sem registro de ponto')
  })

  it('should warn about insufficient break time', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15'),
      clockIn: new Date('2024-01-15T08:00:00Z'),
      clockOut: new Date('2024-01-15T17:00:00Z'),
      breakStart: new Date('2024-01-15T12:00:00Z'),
      breakEnd: new Date('2024-01-15T12:30:00Z'), // Only 30 min break
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.warnings).toContain('Intervalo inferior ao minimo legal (60 min)')
  })
})

describe('Monthly Journey Calculation', () => {
  it('should consolidate multiple days', () => {
    const records: DailyTimeRecord[] = [
      {
        date: new Date('2024-01-15'),
        clockIn: new Date('2024-01-15T08:00:00Z'),
        clockOut: new Date('2024-01-15T17:00:00Z'),
        breakStart: new Date('2024-01-15T12:00:00Z'),
        breakEnd: new Date('2024-01-15T13:00:00Z'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
      {
        date: new Date('2024-01-16'),
        clockIn: new Date('2024-01-16T08:00:00Z'),
        clockOut: new Date('2024-01-16T17:00:00Z'),
        breakStart: new Date('2024-01-16T12:00:00Z'),
        breakEnd: new Date('2024-01-16T13:00:00Z'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
    ]

    const result = calculateMonthlyJourney(records)

    expect(result.totalWorkedDays).toBe(2)
    expect(result.totalWorkedMinutes).toBe(960) // 16 hours
    expect(result.totalWorkedHours).toBe(16)
    expect(result.dailyDetails).toHaveLength(2)
  })

  it('should track time bank balance', () => {
    const records: DailyTimeRecord[] = [
      // Overtime day
      {
        date: new Date('2024-01-15'),
        clockIn: new Date('2024-01-15T08:00:00Z'),
        clockOut: new Date('2024-01-15T19:00:00Z'), // 10 hours
        breakStart: new Date('2024-01-15T12:00:00Z'),
        breakEnd: new Date('2024-01-15T13:00:00Z'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
      // Missing hours day
      {
        date: new Date('2024-01-16'),
        clockIn: new Date('2024-01-16T08:00:00Z'),
        clockOut: new Date('2024-01-16T15:00:00Z'), // 6 hours
        breakStart: new Date('2024-01-16T12:00:00Z'),
        breakEnd: new Date('2024-01-16T13:00:00Z'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
    ]

    const result = calculateMonthlyJourney(records)

    // Should have positive balance from overtime minus negative from missing
    expect(result.timeBankBalance).toBeDefined()
  })
})

describe('Monetary Calculations', () => {
  describe('calculateHourlyRate', () => {
    it('should calculate hourly rate from base salary', () => {
      const hourlyRate = calculateHourlyRate(5000, 44)
      expect(hourlyRate).toBeGreaterThan(0)
      expect(hourlyRate).toBeCloseTo(22.73, 1) // 5000 / 220
    })
  })

  describe('calculateDSR', () => {
    it('should calculate DSR proportionally', () => {
      const dsr = calculateDSR(1000, 20, 5) // R$1000 OT, 20 workdays, 5 sundays
      expect(dsr).toBe(250) // 1000 / 20 * 5
    })

    it('should return 0 for zero workdays', () => {
      const dsr = calculateDSR(1000, 0, 5)
      expect(dsr).toBe(0)
    })
  })

  describe('calculateMonetaryValues', () => {
    it('should calculate all monetary values', () => {
      const monthlyResult = {
        referenceMonth: '2024-01',
        totalWorkdays: 20,
        totalWorkedDays: 20,
        totalWorkedMinutes: 9600, // 160 hours
        totalWorkedHours: 160,
        totalOvertime50Minutes: 120, // 2 hours at 50%
        totalOvertime100Minutes: 0,
        totalNightMinutes: 0,
        totalMissingMinutes: 0,
        timeBankBalance: 120,
        absenceDays: 0,
        dailyDetails: [],
      }

      const values = calculateMonetaryValues(5000, monthlyResult, 5, 44)

      expect(values.baseSalary).toBe(5000)
      expect(values.hourlyRate).toBeGreaterThan(0)
      expect(values.overtime50Value).toBeGreaterThan(0)
      expect(values.overtime100Value).toBe(0)
      expect(values.nightShiftValue).toBe(0)
      expect(values.dsrValue).toBeGreaterThan(0)
      expect(values.totalEarnings).toBeGreaterThan(0)
      expect(values.absenceDeduction).toBe(0)
    })

    it('should calculate absence deductions', () => {
      const monthlyResult = {
        referenceMonth: '2024-01',
        totalWorkdays: 20,
        totalWorkedDays: 18,
        totalWorkedMinutes: 8640, // 144 hours (2 days missing)
        totalWorkedHours: 144,
        totalOvertime50Minutes: 0,
        totalOvertime100Minutes: 0,
        totalNightMinutes: 0,
        totalMissingMinutes: 960, // 16 hours missing
        timeBankBalance: -960,
        absenceDays: 2,
        dailyDetails: [],
      }

      const values = calculateMonetaryValues(5000, monthlyResult, 5, 44)

      expect(values.absenceDeduction).toBeGreaterThan(0)
    })
  })
})
