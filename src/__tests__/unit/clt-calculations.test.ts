/**
 * Unit Tests - CLT Calculations
 * Tests for Brazilian labor law calculations:
 * - Working hours calculation
 * - Overtime 50% and 100%
 * - Night shift bonus
 * - DSR (Weekly Rest Pay)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDailyJourney,
  calculateMonthlyJourney,
  calculateHourlyRate,
  calculateDSR,
  calculateMonetaryValues,
  calculateNightMinutes,
  applyNightReduction,
  getMinutesDiff,
  getExpectedMinutes,
  applyTolerance,
  isNightTime,
  minutesToDecimalHours,
  CLT_CONSTANTS,
  type DailyTimeRecord,
} from '@/lib/compliance/clt-calculations'

describe('CLT Calculations - Working Hours', () => {
  it('should calculate worked hours correctly', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'), // Monday
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T17:00:00'),
      breakStart: new Date('2024-01-15T12:00:00'),
      breakEnd: new Date('2024-01-15T13:00:00'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.workedMinutes).toBe(540) // 9 hours total
    expect(result.breakMinutes).toBe(60) // 1 hour break
    expect(result.netWorkedMinutes).toBe(480) // 8 hours net
    expect(result.overtime50Minutes).toBe(0) // No overtime
    expect(result.missingMinutes).toBe(0) // No missing time
  })

  it('should handle no break correctly', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T12:00:00'),
      breakStart: null,
      breakEnd: null,
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.workedMinutes).toBe(240) // 4 hours
    expect(result.breakMinutes).toBe(0)
    expect(result.netWorkedMinutes).toBe(240)
  })

  it('should detect missing clock records', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
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
    expect(result.missingMinutes).toBe(480) // 8 hours missing
    expect(result.warnings).toContain('Sem registro de ponto')
  })

  it('should validate minimum break for 6+ hour shifts', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T17:00:00'),
      breakStart: new Date('2024-01-15T12:00:00'),
      breakEnd: new Date('2024-01-15T12:30:00'), // Only 30 min break
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.warnings).toContain('Intervalo inferior ao minimo legal (60 min)')
  })
})

describe('CLT Calculations - Overtime 50% (Weekdays)', () => {
  it('should calculate 50% overtime for weekdays', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'), // Monday
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T19:00:00'), // 11 hours total
      breakStart: new Date('2024-01-15T12:00:00'),
      breakEnd: new Date('2024-01-15T13:00:00'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.netWorkedMinutes).toBe(600) // 10 hours net
    expect(result.overtime50Minutes).toBe(120) // 2 hours overtime
    expect(result.overtime100Minutes).toBe(0)
  })

  it('should apply 10-minute tolerance', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T17:05:00'), // 5 min overtime
      breakStart: new Date('2024-01-15T12:00:00'),
      breakEnd: new Date('2024-01-15T13:00:00'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.exceedsTolerance).toBe(false)
    expect(result.overtime50Minutes).toBe(0) // Within tolerance
  })

  it('should calculate overtime beyond tolerance', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
      clockIn: new Date('2024-01-15T08:00:00'),
      clockOut: new Date('2024-01-15T17:15:00'), // 15 min overtime
      breakStart: new Date('2024-01-15T12:00:00'),
      breakEnd: new Date('2024-01-15T13:00:00'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.exceedsTolerance).toBe(true)
    expect(result.overtime50Minutes).toBe(15)
  })
})

describe('CLT Calculations - Overtime 100% (Sundays/Holidays)', () => {
  it('should calculate 100% overtime for Sundays', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-14T00:00:00'), // Sunday
      clockIn: new Date('2024-01-14T08:00:00'),
      clockOut: new Date('2024-01-14T16:00:00'),
      breakStart: new Date('2024-01-14T12:00:00'),
      breakEnd: new Date('2024-01-14T13:00:00'),
      isWorkday: false,
      isHoliday: false,
      isSunday: true,
    }

    const result = calculateDailyJourney(record, 0) // Sunday expected = 0

    expect(result.overtime100Minutes).toBe(420) // 7 hours at 100%
    expect(result.overtime50Minutes).toBe(0)
  })

  it('should calculate 100% overtime for holidays', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-01T00:00:00'), // New Year
      clockIn: new Date('2024-01-01T08:00:00'),
      clockOut: new Date('2024-01-01T16:00:00'),
      breakStart: new Date('2024-01-01T12:00:00'),
      breakEnd: new Date('2024-01-01T13:00:00'),
      isWorkday: false,
      isHoliday: true,
      isSunday: false,
    }

    const result = calculateDailyJourney(record, 0)

    expect(result.overtime100Minutes).toBe(420)
    expect(result.overtime50Minutes).toBe(0)
  })
})

describe('CLT Calculations - Night Shift Bonus', () => {
  it('should identify night time correctly (22h-5h)', () => {
    expect(isNightTime(new Date('2024-01-15T22:00:00'))).toBe(true)
    expect(isNightTime(new Date('2024-01-15T23:30:00'))).toBe(true)
    expect(isNightTime(new Date('2024-01-15T00:00:00'))).toBe(true)
    expect(isNightTime(new Date('2024-01-15T04:59:00'))).toBe(true)
    expect(isNightTime(new Date('2024-01-15T05:00:00'))).toBe(false)
    expect(isNightTime(new Date('2024-01-15T21:59:00'))).toBe(false)
  })

  it('should calculate night minutes correctly', () => {
    const start = new Date('2024-01-15T22:00:00')
    const end = new Date('2024-01-16T05:00:00')

    const nightMinutes = calculateNightMinutes(start, end)

    expect(nightMinutes).toBe(420) // 7 hours (22h-5h)
  })

  it('should calculate night minutes for partial night shift', () => {
    const start = new Date('2024-01-15T20:00:00')
    const end = new Date('2024-01-16T02:00:00')

    const nightMinutes = calculateNightMinutes(start, end)

    expect(nightMinutes).toBe(240) // 4 hours (22h-2h)
  })

  it('should apply night hour reduction (52.5min = 1h)', () => {
    const nightMinutes = 210 // 3.5 hours worked

    const adjusted = applyNightReduction(nightMinutes)

    // 210 / 52.5 * 60 = 240 (4 hours paid)
    expect(adjusted).toBe(240)
  })

  it('should calculate night shift with reduction in daily journey', () => {
    const record: DailyTimeRecord = {
      date: new Date('2024-01-15T00:00:00'),
      clockIn: new Date('2024-01-15T22:00:00'),
      clockOut: new Date('2024-01-16T06:00:00'), // 8 hours total
      breakStart: new Date('2024-01-16T02:00:00'),
      breakEnd: new Date('2024-01-16T03:00:00'),
      isWorkday: true,
      isHoliday: false,
      isSunday: false,
    }

    const result = calculateDailyJourney(record)

    expect(result.nightMinutes).toBeGreaterThan(0)
    // Night reduction should add bonus to net worked minutes
    expect(result.netWorkedMinutes).toBeGreaterThan(result.workedMinutes - result.breakMinutes)
  })
})

describe('CLT Calculations - DSR (Weekly Rest Pay)', () => {
  it('should calculate DSR correctly', () => {
    const overtimeValue = 500 // R$ 500 in overtime
    const workdays = 22
    const sundaysAndHolidays = 5

    const dsr = calculateDSR(overtimeValue, workdays, sundaysAndHolidays)

    // DSR = (500 / 22) * 5 = 113.64
    expect(dsr).toBeCloseTo(113.64, 2)
  })

  it('should return 0 DSR when no workdays', () => {
    const dsr = calculateDSR(500, 0, 5)
    expect(dsr).toBe(0)
  })

  it('should return 0 DSR when no overtime', () => {
    const dsr = calculateDSR(0, 22, 5)
    expect(dsr).toBe(0)
  })
})

describe('CLT Calculations - Monthly Consolidation', () => {
  it('should consolidate monthly journey correctly', () => {
    const records: DailyTimeRecord[] = [
      // Day 1 - Normal workday
      {
        date: new Date('2024-01-15T00:00:00'),
        clockIn: new Date('2024-01-15T08:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        breakStart: new Date('2024-01-15T12:00:00'),
        breakEnd: new Date('2024-01-15T13:00:00'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
      // Day 2 - With overtime
      {
        date: new Date('2024-01-16T00:00:00'),
        clockIn: new Date('2024-01-16T08:00:00'),
        clockOut: new Date('2024-01-16T19:00:00'),
        breakStart: new Date('2024-01-16T12:00:00'),
        breakEnd: new Date('2024-01-16T13:00:00'),
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
      // Day 3 - Absence
      {
        date: new Date('2024-01-17T00:00:00'),
        clockIn: null,
        clockOut: null,
        breakStart: null,
        breakEnd: null,
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
    ]

    const result = calculateMonthlyJourney(records)

    expect(result.totalWorkdays).toBe(3)
    expect(result.totalWorkedDays).toBe(2)
    expect(result.totalWorkedMinutes).toBeGreaterThan(0)
    expect(result.totalOvertime50Minutes).toBeGreaterThan(0)
    expect(result.totalMissingMinutes).toBe(480) // 8 hours missing
    expect(result.absenceDays).toBe(1)
  })

  it('should calculate reference month correctly', () => {
    const records: DailyTimeRecord[] = [
      {
        date: new Date('2024-01-15T00:00:00'),
        clockIn: new Date('2024-01-15T08:00:00'),
        clockOut: new Date('2024-01-15T17:00:00'),
        breakStart: null,
        breakEnd: null,
        isWorkday: true,
        isHoliday: false,
        isSunday: false,
      },
    ]

    const result = calculateMonthlyJourney(records)

    expect(result.referenceMonth).toBe('2024-01')
  })
})

describe('CLT Calculations - Monetary Values', () => {
  it('should calculate hourly rate correctly', () => {
    const baseSalary = 2200 // R$ 2.200
    const hourlyRate = calculateHourlyRate(baseSalary, 44)

    // For 44h/week: 220 monthly hours
    // 2200 / 220 = 10.00
    expect(hourlyRate).toBe(10.00)
  })

  it('should calculate all monetary values correctly', () => {
    const monthlyResult = {
      referenceMonth: '2024-01',
      totalWorkdays: 22,
      totalWorkedDays: 22,
      totalWorkedMinutes: 10560, // 176 hours
      totalWorkedHours: 176,
      totalOvertime50Minutes: 120, // 2 hours at 50%
      totalOvertime100Minutes: 0,
      totalNightMinutes: 0,
      totalMissingMinutes: 0,
      timeBankBalance: 120,
      absenceDays: 0,
      dailyDetails: [],
    }

    const values = calculateMonetaryValues(2200, monthlyResult, 5, 44)

    expect(values.baseSalary).toBe(2200)
    expect(values.hourlyRate).toBe(10.00)
    // 2 hours * 10.00 * 1.5 = 30.00
    expect(values.overtime50Value).toBe(30.00)
    expect(values.overtime100Value).toBe(0)
    expect(values.nightShiftValue).toBe(0)
    // DSR = (30 / 22) * 5
    expect(values.dsrValue).toBeCloseTo(6.82, 2)
    expect(values.totalEarnings).toBeCloseTo(36.82, 2)
  })

  it('should calculate overtime 100% monetary value', () => {
    const monthlyResult = {
      referenceMonth: '2024-01',
      totalWorkdays: 22,
      totalWorkedDays: 22,
      totalWorkedMinutes: 10560,
      totalWorkedHours: 176,
      totalOvertime50Minutes: 0,
      totalOvertime100Minutes: 240, // 4 hours at 100%
      totalNightMinutes: 0,
      totalMissingMinutes: 0,
      timeBankBalance: 240,
      absenceDays: 0,
      dailyDetails: [],
    }

    const values = calculateMonetaryValues(2200, monthlyResult, 5, 44)

    // 4 hours * 10.00 * 2.0 = 80.00
    expect(values.overtime100Value).toBe(80.00)
  })

  it('should calculate night shift monetary value', () => {
    const monthlyResult = {
      referenceMonth: '2024-01',
      totalWorkdays: 22,
      totalWorkedDays: 22,
      totalWorkedMinutes: 10560,
      totalWorkedHours: 176,
      totalOvertime50Minutes: 0,
      totalOvertime100Minutes: 0,
      totalNightMinutes: 600, // 10 hours night
      totalMissingMinutes: 0,
      timeBankBalance: 0,
      absenceDays: 0,
      dailyDetails: [],
    }

    const values = calculateMonetaryValues(2200, monthlyResult, 5, 44)

    // 10 hours * 10.00 * 0.20 = 20.00
    expect(values.nightShiftValue).toBe(20.00)
  })

  it('should calculate absence deduction', () => {
    const monthlyResult = {
      referenceMonth: '2024-01',
      totalWorkdays: 22,
      totalWorkedDays: 21,
      totalWorkedMinutes: 10080,
      totalWorkedHours: 168,
      totalOvertime50Minutes: 0,
      totalOvertime100Minutes: 0,
      totalNightMinutes: 0,
      totalMissingMinutes: 480, // 8 hours missing
      timeBankBalance: -480,
      absenceDays: 1,
      dailyDetails: [],
    }

    const values = calculateMonetaryValues(2200, monthlyResult, 5, 44)

    // 8 hours * 10.00 = 80.00
    expect(values.absenceDeduction).toBe(80.00)
  })
})

describe('CLT Calculations - Utility Functions', () => {
  it('should calculate minutes difference correctly', () => {
    const start = new Date('2024-01-15T08:00:00')
    const end = new Date('2024-01-15T17:00:00')

    const diff = getMinutesDiff(start, end)

    expect(diff).toBe(540) // 9 hours
  })

  it('should get expected minutes for weekdays', () => {
    expect(getExpectedMinutes(1)).toBe(480) // Monday: 8h
    expect(getExpectedMinutes(5)).toBe(480) // Friday: 8h
    expect(getExpectedMinutes(6)).toBe(240) // Saturday: 4h
    expect(getExpectedMinutes(0)).toBe(0) // Sunday: 0h
  })

  it('should convert minutes to decimal hours', () => {
    expect(minutesToDecimalHours(60)).toBe(1.00)
    expect(minutesToDecimalHours(90)).toBe(1.50)
    expect(minutesToDecimalHours(135)).toBe(2.25)
  })

  it('should apply tolerance correctly', () => {
    const result1 = applyTolerance(485, 480)
    expect(result1.exceedsTolerance).toBe(false)
    expect(result1.adjusted).toBe(480)

    const result2 = applyTolerance(495, 480)
    expect(result2.exceedsTolerance).toBe(true)
    expect(result2.adjusted).toBe(495)
  })
})
