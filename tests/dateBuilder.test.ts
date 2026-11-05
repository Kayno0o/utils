import { describe, expect, test as it } from 'bun:test'
import { buildDate, formatDate, loadDateLocale } from '../src/builders/date'
import { en } from '../src/i18n/date/en'

describe('formatDate', () => {
  it('names every weekday, Sunday included', () => {
    loadDateLocale(en)

    expect(formatDate(new Date(2026, 10, 1), d => d.weekDay4)).toBe('Sunday')
    expect(formatDate(new Date(2026, 10, 2), d => d.weekDay4)).toBe('Monday')
    expect(formatDate(new Date(2026, 10, 7), d => d.weekDay4)).toBe('Saturday')
  })
})

describe('buildDate', () => {
  it('reads iso and day-first inputs as local calendar dates', () => {
    const tz = process.env.TZ

    process.env.TZ = 'America/New_York'

    try {
      expect(buildDate('2026-03-05')).toBe('2026-03-05')
      expect(buildDate('260305')).toBe('2026-03-05')
      expect(buildDate('05/03/2026')).toBe('2026-03-05')
      expect(buildDate('05/03/26')).toBe('2026-03-05')
    }
    finally {
      if (tz === undefined)
        delete process.env.TZ
      else
        process.env.TZ = tz
    }
  })
})
