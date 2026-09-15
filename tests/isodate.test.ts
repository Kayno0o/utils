import { describe, expect, it } from 'bun:test'
import { fromISODate, gridDays, startOfWeekISO, toISODate } from '../src'

describe('toISODate', () => {
  it('formats local date without UTC shift', () => {
    expect(toISODate(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(toISODate(new Date(2024, 11, 31))).toBe('2024-12-31')
  })

  it('pads month and day', () => {
    expect(toISODate(new Date(2024, 1, 3))).toBe('2024-02-03')
  })
})

describe('fromISODate', () => {
  it('round-trips with toISODate', () => {
    const dates = ['2024-01-01', '2024-06-15', '2024-12-31']

    for (const iso of dates)
      expect(toISODate(fromISODate(iso))).toBe(iso)
  })

  it('returns local midnight', () => {
    const d = fromISODate('2024-03-10')

    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('startOfWeekISO', () => {
  it('returns Monday for any day of the week', () => {
    // 2024-06-10 is Monday
    expect(startOfWeekISO(new Date(2024, 5, 10))).toBe('2024-06-10')
    expect(startOfWeekISO(new Date(2024, 5, 12))).toBe('2024-06-10') // Wednesday
    expect(startOfWeekISO(new Date(2024, 5, 16))).toBe('2024-06-10') // Sunday
  })

  it('does not mutate the input', () => {
    const d = new Date(2024, 5, 14)
    const before = d.getTime()

    startOfWeekISO(d)
    expect(d.getTime()).toBe(before)
  })
})

describe('gridDays', () => {
  it('returns 7×weeks days', () => {
    const days = gridDays(4, new Date(2024, 5, 16)) // Sunday

    expect(days).toHaveLength(28)
  })

  it('starts on a Monday', () => {
    const days = gridDays(2, new Date(2024, 5, 16))
    const start = fromISODate(days[0]!)

    expect(start.getDay()).toBe(1) // Monday
  })

  it('ends on today', () => {
    const today = new Date(2024, 5, 16)
    const days = gridDays(3, today)

    expect(days.at(-1)).toBe(toISODate(today))
  })

  it('ascending order', () => {
    const days = gridDays(2, new Date(2024, 5, 16))

    for (let i = 1; i < days.length; i++)
      expect(days[i]! > days[i - 1]!).toBe(true)
  })

  it('steps one calendar day at a time across DST changes', () => {
    const timezone = process.env.TZ

    // Paris leaves summer time on 2025-10-26 and enters it again on 2026-03-29.
    process.env.TZ = 'Europe/Paris'

    try {
      const days = gridDays(53, new Date(2026, 8, 15))

      expect(new Set(days).size).toBe(days.length)
      expect(days).toContain('2026-03-29')
    }
    finally {
      process.env.TZ = timezone
    }
  })
})
