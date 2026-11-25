import { describe, expect, test as it } from 'bun:test'
import { buildDate, createDateFormatter, formatDate, loadDateLocale } from '../src/builders/date'
import { en } from '../src/i18n/date/en'
import { fr } from '../src/i18n/date/fr'

describe('createDateFormatter', () => {
  it('binds a locale per formatter without touching the global locale', () => {
    loadDateLocale(en)

    const french = createDateFormatter(fr)
    const english = createDateFormatter(en)
    const date = new Date(2026, 10, 1)

    expect(french.formatDate(date, d => `${d.weekDay4} ${d.month4}`)).toBe('Dimanche Novembre')
    expect(english.formatDate(date, d => `${d.weekDay4} ${d.month4}`)).toBe('Sunday November')
    expect(formatDate(date, d => d.weekDay4)).toBe('Sunday')
  })
})

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
