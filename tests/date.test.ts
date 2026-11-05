import { describe, expect, test as it } from 'bun:test'
import { addDays, addMonths, addYears, businessDaysBetween, calculateEaster, dateDifference, DAY_MS, endOfDay, endOfMonth, formatDayMonth, formatHour, formatMonthShort, formatMonthYear, formatRelativeTime, formatSessionTime, formatTime, fromISODate, getAge, getDaysBetween, getDaysInMonth, getFrenchHolidays, getHoursBetween, getQuarter, getWeekNumber, gridDays, HOUR_MS, isBetween, isHoliday, isLeapYear, isSameDay, isToday, isWeekend, MINUTE_MS, parseDateLabel, parseDuration, SECOND_MS, SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS_IN_MINUTE, SECONDS_IN_WEEK, startOfDay, startOfMonth, startOfWeekISO, WEEK_MS } from '../src'

describe('formatRelativeTime function', () => {
  it('takes a bare locale', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * HOUR_MS), 'fr')).toBe('il y a 3 heures')
  })

  it('passes Intl options through', () => {
    const from = new Date(2026, 5, 8, 12, 0, 0)

    expect(formatRelativeTime(new Date(2026, 5, 8, 9, 0, 0), { from, locale: 'en', style: 'narrow' })).toBe('3h ago')
  })

  const from = new Date(2026, 5, 8, 12, 0, 0)

  it('formats past dates', () => {
    expect(formatRelativeTime(new Date(2026, 5, 8, 9, 0, 0), { from, locale: 'en' })).toBe('3 hours ago')
  })

  it('formats future dates', () => {
    expect(formatRelativeTime(new Date(2026, 5, 10, 12, 0, 0), { from, locale: 'en' })).toBe('in 2 days')
  })

  it('uses natural phrasing with numeric auto', () => {
    expect(formatRelativeTime(new Date(2026, 5, 7, 12, 0, 0), { from, locale: 'en' })).toBe('yesterday')
  })

  it('can force numeric output', () => {
    expect(formatRelativeTime(new Date(2026, 5, 7, 12, 0, 0), { from, locale: 'en', numeric: 'always' })).toBe('1 day ago')
  })
})

describe('isLeapYear function', () => {
  it('returns true for years divisible by 4 but not 100', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2028)).toBe(true)
  })

  it('returns false for common years', () => {
    expect(isLeapYear(2025)).toBe(false)
    expect(isLeapYear(2100)).toBe(false)
  })

  it('handles century rule (divisible by 400)', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
  })
})

describe('calculateEaster function', () => {
  it('should return the correct date for Easter in 2023', () => {
    const result = calculateEaster(2023)

    expect(result).toEqual(new Date(2023, 3, 9)) // April 9, 2023
  })

  it('should return the correct date for Easter in 2024', () => {
    const result = calculateEaster(2024)

    expect(result).toEqual(new Date(2024, 2, 31)) // March 31, 2024
  })
})

describe('getFrenchHolidays function', () => {
  it('should include fixed holidays for the given year', () => {
    const result = getFrenchHolidays(2023)

    expect(result).toContain('2023-11-01') // All Saints' Day
    expect(result).toContain('2023-07-14') // Bastille Day
    expect(result).toContain('2023-12-25') // Christmas Day
  })

  it('should include Easter-related holidays for the given year', () => {
    const result = getFrenchHolidays(2023)

    expect(result).toContain('2023-04-10') // Easter Monday
    expect(result).toContain('2023-05-18') // Ascension Day
    expect(result).toContain('2023-05-29') // Whit Monday
  })
})

describe('isHoliday function', () => {
  it('should return true for a known holiday', () => {
    const result = isHoliday('2023-07-14') // Bastille Day

    expect(result).toBe(true)
  })

  it('should return false for a non-holiday', () => {
    const result = isHoliday('2023-07-15')

    expect(result).toBe(false)
  })

  it('reads a Date on its local day', () => {
    const timezone = process.env.TZ

    for (const tz of ['Europe/Paris', 'America/New_York']) {
      process.env.TZ = tz

      try {
        expect(isHoliday(new Date(2026, 11, 25, 0, 30))).toBe(true)
        expect(isHoliday(new Date(2026, 11, 24, 23, 30))).toBe(false)
        expect(isHoliday('2026-12-25')).toBe(true)
        expect(isHoliday('2026-12-24')).toBe(false)
      }
      finally {
        // Assigning undefined would set the string "undefined", which reads as UTC for every later test.
        if (timezone === undefined)
          delete process.env.TZ
        else
          process.env.TZ = timezone
      }
    }
  })

  it('returns false for an invalid date', () => {
    expect(isHoliday('not a date')).toBe(false)
    expect(isHoliday(new Date(Number.NaN))).toBe(false)
  })
})

describe('parseDuration function', () => {
  it('should handle durations specified in seconds', () => {
    const result = parseDuration('10s')

    expect(result).toBe(10000) // 10 seconds in milliseconds
  })

  it('should handle durations specified in minutes', () => {
    const result = parseDuration('5m')

    expect(result).toBe(300000) // 5 minutes in milliseconds
  })

  it('should handle durations specified in hours', () => {
    const result = parseDuration('2h')

    expect(result).toBe(7200000) // 2 hours in milliseconds
  })

  it('should handle durations specified in days', () => {
    const result = parseDuration('1d')

    expect(result).toBe(86400000) // 1 day in milliseconds
  })

  it('should handle durations specified in weeks', () => {
    const result = parseDuration('1w')

    expect(result).toBe(604800000) // 1 week in milliseconds
  })

  it('should handle durations specified in months', () => {
    const result = parseDuration('1M')

    expect(result).toBe(2592000000) // 1 month in milliseconds
  })

  it('should handle durations specified in years', () => {
    const result = parseDuration('1y')

    expect(result).toBe(31536000000) // 1 year in milliseconds
  })

  it('should handle compound durations', () => {
    expect(parseDuration('1d 7h')).toBe(86400000 + 7 * 3600000)
    expect(parseDuration('1d7h30m')).toBe(86400000 + 7 * 3600000 + 30 * 60000)
    expect(parseDuration('2w 3d 4h 5m 6s')).toBe(
      2 * 604800000 + 3 * 86400000 + 4 * 3600000 + 5 * 60000 + 6 * 1000,
    )
  })

  it('should distinguish minutes from months by case', () => {
    expect(parseDuration('1m')).toBe(60000) // minute
    expect(parseDuration('1M')).toBe(2592000000) // month
  })

  it('should return 0 for invalid duration formats', () => {
    expect(parseDuration('invalid')).toBe(0)
    expect(parseDuration('10')).toBe(0) // missing unit
  })

  it('should return the input directly if it is a number', () => {
    const result = parseDuration(1000)

    expect(result).toBe(1000) // should return the input as it is already a number
  })
})

describe('time constants', () => {
  it('exposes millisecond constants', () => {
    expect(SECOND_MS).toBe(1000)
    expect(MINUTE_MS).toBe(60_000)
    expect(HOUR_MS).toBe(3_600_000)
    expect(DAY_MS).toBe(86_400_000)
    expect(WEEK_MS).toBe(604_800_000)
  })

  it('exposes second constants', () => {
    expect(SECONDS_IN_MINUTE).toBe(60)
    expect(SECONDS_IN_HOUR).toBe(3600)
    expect(SECONDS_IN_DAY).toBe(86_400)
    expect(SECONDS_IN_WEEK).toBe(604_800)
  })
})

describe('formatDayMonth function', () => {
  it('formats in day-before-month order', () => {
    expect(formatDayMonth(new Date(2026, 0, 15))).toBe('15 Jan')
    expect(formatDayMonth(new Date(2026, 11, 3))).toBe('3 Dec')
  })

  it('follows the given locale', () => {
    expect(formatDayMonth(new Date(2026, 0, 15), 'fr-FR')).toBe('15 janv.')
    expect(formatDayMonth(new Date(2026, 0, 15), 'en-US')).toBe('Jan 15')
  })

  it('takes a locale in an options object with Intl options', () => {
    expect(formatDayMonth(new Date(2026, 0, 15), { locale: 'fr-FR' })).toBe('15 janv.')
    expect(formatDayMonth(new Date(2026, 0, 15), { month: 'long' })).toBe('15 January')
    expect(formatDayMonth(new Date(2026, 0, 15), { locale: 'fr-FR', month: 'long' })).toBe('15 janvier')
  })
})

describe('formatMonthYear function', () => {
  it('formats short month and full year', () => {
    expect(formatMonthYear(new Date(2026, 0, 15))).toBe('Jan 2026')
    expect(formatMonthYear(new Date(2024, 6, 1))).toBe('Jul 2024')
    expect(formatMonthYear(new Date(2026, 0, 15), 'fr-FR')).toBe('janv. 2026')
    expect(formatMonthYear(new Date(2026, 0, 15), { locale: 'fr-FR', month: 'long' })).toBe('janvier 2026')
  })
})

describe('formatMonthShort function', () => {
  it('formats short month', () => {
    expect(formatMonthShort(new Date(2026, 0, 15))).toBe('Jan')
    expect(formatMonthShort(new Date(2026, 5, 1))).toBe('Jun')
    expect(formatMonthShort(new Date(2026, 0, 15), 'fr-FR')).toBe('janv.')
    expect(formatMonthShort(new Date(2026, 0, 15), { month: 'long' })).toBe('January')
  })
})

describe('parseDateLabel function', () => {
  it('parses YYYY-MM-DD into a local-midnight date', () => {
    expect(parseDateLabel('2026-01-15')).toEqual(new Date(2026, 0, 15))
  })

  it('parses YYYYMMDD', () => {
    expect(parseDateLabel('20260115')).toEqual(new Date(2026, 0, 15))
  })

  it('parses D/M/Y with a four-digit year', () => {
    expect(parseDateLabel('5/3/2026')).toEqual(new Date(2026, 2, 5))
  })

  it('parses D/M/Y with a two-digit year as 2000+', () => {
    expect(parseDateLabel('5/3/26')).toEqual(new Date(2026, 2, 5))
  })

  it('refuses a three-digit year', () => {
    expect(parseDateLabel('5/3/202')).toBeNull()
  })

  it('ignores a trailing time on the ISO form', () => {
    expect(parseDateLabel('2026-01-15T12:30:00')).toEqual(new Date(2026, 0, 15))
  })

  it('returns null for unrecognized labels', () => {
    expect(parseDateLabel('not a date')).toBeNull()
    expect(parseDateLabel('2026-01-15xyz')).toBeNull()
    expect(parseDateLabel('20260115x')).toBeNull()
    expect(parseDateLabel('2026-01-15 garbage')).toBeNull()
    expect(parseDateLabel('2026-01-15Tzzz')).toBeNull()
    expect(parseDateLabel('2026-01-15 08:00')).toEqual(new Date(2026, 0, 15))
  })

  it('returns null for a day that does not exist', () => {
    expect(parseDateLabel('2026-02-31')).toBeNull()
    expect(parseDateLabel('20261301')).toBeNull()
    expect(parseDateLabel('31/4/2026')).toBeNull()
    expect(parseDateLabel('29/2/2027')).toBeNull()
    expect(parseDateLabel('29/2/28')).toEqual(new Date(2028, 1, 29))
    expect(parseDateLabel('')).toBeNull()
  })
})

describe('date arithmetic', () => {
  it('addDays does not mutate and shifts correctly', () => {
    const base = new Date(2024, 0, 31)
    const next = addDays(base, 1)

    expect(next).toEqual(new Date(2024, 1, 1))
    expect(base).toEqual(new Date(2024, 0, 31))
  })

  it('addMonths clamps the day to the target month', () => {
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29))
    expect(addMonths(new Date(2023, 0, 31), 1)).toEqual(new Date(2023, 1, 28))
  })

  it('addYears clamps Feb 29 on non-leap years', () => {
    expect(addYears(new Date(2024, 1, 29), 1)).toEqual(new Date(2025, 1, 28))
  })
})

describe('date diffs', () => {
  it('getDaysBetween counts whole calendar days', () => {
    expect(getDaysBetween(new Date(2024, 0, 1), new Date(2024, 0, 4))).toBe(3)
    expect(getDaysBetween(new Date(2024, 0, 4), new Date(2024, 0, 1))).toBe(-3)
  })

  it('getHoursBetween truncates toward zero', () => {
    const a = new Date(2024, 0, 1, 0, 0)
    const b = new Date(2024, 0, 1, 5, 30)

    expect(getHoursBetween(a, b)).toBe(5)
  })
})

describe('date boundaries', () => {
  it('startOfDay / endOfDay', () => {
    const d = new Date(2024, 5, 15, 13, 45, 30)

    expect(startOfDay(d)).toEqual(new Date(2024, 5, 15, 0, 0, 0, 0))
    expect(endOfDay(d)).toEqual(new Date(2024, 5, 15, 23, 59, 59, 999))
  })

  it('startOfMonth / endOfMonth', () => {
    const d = new Date(2024, 1, 15)

    expect(startOfMonth(d)).toEqual(new Date(2024, 1, 1))
    expect(endOfMonth(d)).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999))
  })
})

describe('date predicates', () => {
  it('isSameDay ignores time', () => {
    expect(isSameDay(new Date(2024, 0, 1, 8), new Date(2024, 0, 1, 20))).toBe(true)
    expect(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(false)
  })

  it('isWeekend', () => {
    expect(isWeekend(new Date(2024, 0, 6))).toBe(true)
    expect(isWeekend(new Date(2024, 0, 8))).toBe(false)
  })

  it('isToday', () => {
    expect(isToday(new Date())).toBe(true)
    expect(isToday(new Date(2000, 0, 1))).toBe(false)
  })

  it('isBetween respects inclusivity', () => {
    const start = new Date(2024, 0, 1)
    const end = new Date(2024, 0, 31)

    expect(isBetween(new Date(2024, 0, 15), start, end)).toBe(true)
    expect(isBetween(start, start, end)).toBe(true)
    expect(isBetween(start, start, end, { inclusive: false })).toBe(false)
    expect(isBetween(new Date(2024, 1, 1), start, end)).toBe(false)
  })
})

describe('week / quarter / age', () => {
  it('getWeekNumber returns ISO week', () => {
    expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1)
    expect(getWeekNumber(new Date(2024, 11, 30))).toBe(1)
  })

  it('getQuarter', () => {
    expect(getQuarter(new Date(2024, 0, 1))).toBe(1)
    expect(getQuarter(new Date(2024, 3, 1))).toBe(2)
    expect(getQuarter(new Date(2024, 11, 1))).toBe(4)
  })

  it('age computes full years', () => {
    const birth = new Date(2000, 5, 15)

    expect(getAge(birth, new Date(2024, 5, 15))).toBe(24)
    expect(getAge(birth, new Date(2024, 5, 14))).toBe(23)
    expect(getAge(birth, new Date(2024, 6, 1))).toBe(24)
  })
})

describe('businessDaysBetween function', () => {
  it('counts weekdays inclusively', () => {
    expect(businessDaysBetween(new Date(2024, 0, 1), new Date(2024, 0, 5))).toBe(5)
    expect(businessDaysBetween(new Date(2024, 0, 6), new Date(2024, 0, 7))).toBe(0)
    expect(businessDaysBetween(new Date(2024, 0, 1), new Date(2024, 0, 7))).toBe(5)
  })

  it('is order-insensitive', () => {
    expect(businessDaysBetween(new Date(2024, 0, 5), new Date(2024, 0, 1))).toBe(5)
  })
})

describe('dateDifference', () => {
  it('counts days, working days and the calendar span in either order', () => {
    expect(dateDifference('2024-03-01', '2024-01-01')).toMatchObject({ days: 60, weeks: 8, hours: 1440, workingDays: 44, calendar: { years: 0, months: 2, days: 0 } })
  })

  it('anchors a start past the end of a shorter month to its last day', () => {
    expect(dateDifference('2023-01-31', '2023-03-01')?.calendar).toEqual({ years: 0, months: 1, days: 1 })
    expect(dateDifference('2020-02-29', '2023-03-01')?.calendar).toEqual({ years: 3, months: 0, days: 1 })
  })

  it('returns null for a date that does not parse', () => {
    expect(dateDifference('nope', '2024-01-01')).toBeNull()
  })
})

describe('working-day options', () => {
  // 2024-05-06 is a Monday; 2024-05-08 (Victoire 1945) is a French holiday.
  const monday = new Date(2024, 4, 6)
  const nextMonday = new Date(2024, 4, 13)

  it('takes other weekend days', () => {
    expect(isWeekend(new Date(2024, 4, 10))).toBe(false)
    expect(isWeekend(new Date(2024, 4, 10), { weekendDays: [5, 6] })).toBe(true)
    expect(businessDaysBetween(monday, nextMonday, { weekendDays: [5, 6] })).toBe(6)
  })

  it('skips holidays with isHoliday or a predicate', () => {
    expect(businessDaysBetween(monday, nextMonday)).toBe(6)
    expect(businessDaysBetween(monday, nextMonday, { holidays: true })).toBe(4)
    expect(businessDaysBetween(monday, nextMonday, { holidays: d => d.getDate() === 7 })).toBe(5)
  })

  it('applies to dateDifference working days', () => {
    expect(dateDifference('2024-05-06', '2024-05-13')!.workingDays).toBe(5)
    expect(dateDifference('2024-05-06', '2024-05-13', { holidays: true })!.workingDays).toBe(3)
    expect(dateDifference('2024-05-06', '2024-05-13', { weekendDays: [0] })!.workingDays).toBe(6)
  })
})

describe('week start', () => {
  const wednesday = new Date(2024, 4, 8)

  it('defaults to Monday and takes Sunday', () => {
    expect(startOfWeekISO(wednesday)).toBe('2024-05-06')
    expect(startOfWeekISO(wednesday, 0)).toBe('2024-05-05')
    expect(startOfWeekISO(new Date(2024, 4, 5), 0)).toBe('2024-05-05')
  })

  it('pads grids back to the week start', () => {
    expect(gridDays(1, wednesday)[0]).toBe('2024-05-06')
    expect(gridDays(1, wednesday, 0)).toEqual(['2024-05-05', '2024-05-06', '2024-05-07', '2024-05-08'])
  })
})

describe('parseDateLabel order', () => {
  it('reads slash dates day-first by default and month-first on request', () => {
    expect(parseDateLabel('03/04/2024')!.getMonth()).toBe(3)
    expect(parseDateLabel('03/04/2024', { order: 'month-first' })!.getMonth()).toBe(2)
    expect(parseDateLabel('13/04/2024', { order: 'month-first' })).toBeNull()
  })
})

describe('formatSessionTime options', () => {
  const now = new Date(2024, 4, 8, 9, 0)

  it('counts calendar days from now, so last night reads as yesterday', () => {
    expect(formatSessionTime(new Date(2024, 4, 7, 23, 0), { now })).toBe('Yesterday')
    expect(formatSessionTime(new Date(2024, 4, 7, 23, 0), { now, labels: { yesterday: 'Hier' } })).toBe('Hier')
  })

  it('formats in the given locale', () => {
    expect(formatSessionTime(new Date(2024, 4, 6, 12, 0), { now, locale: 'fr-FR' })).toBe('lun.')
    expect(formatSessionTime(new Date(2024, 3, 1, 12, 0), 'en-US')).toBe('Apr 1')
    expect(formatSessionTime(new Date(), { locale: 'en-US', hour12: false }).length).toBe(5)
    expect(formatSessionTime(new Date(2024, 3, 1, 12, 0), { now, locale: 'en-US' })).toBe('Apr 1')
  })
})

describe('formatTime', () => {
  const at = new Date('2026-01-15T15:04:00Z')

  it('takes a Date as well as a timestamp', () => {
    expect(formatTime(at, 'en-US')).toBe(formatTime(at.getTime(), 'en-US'))
    expect(formatTime(at, { locale: 'en-US', timeZone: 'UTC' })).toBe('Jan 15, 03:04 PM')
  })

  it('takes a locale or options', () => {
    expect(formatTime(at, { locale: 'en-GB', timeZone: 'UTC' })).toBe('15 Jan, 15:04')
    expect(formatTime(at, { locale: 'en-US', hour12: false, timeZone: 'UTC' })).toBe('Jan 15, 15:04')
  })
})

describe('fromISODate', () => {
  it('returns null for what names no real day', () => {
    for (const bad of ['2024-02-30', '2024-13-01', '2024-00-10', 'nope', '2024-3-1', '2024-03', ''])
      expect(fromISODate(bad)).toBeNull()
  })

  it('keeps a real leap day', () => {
    expect(fromISODate('2024-02-29')).toEqual(new Date(2024, 1, 29))
  })
})

describe('parseDuration sign', () => {
  it('reads a leading minus', () => {
    expect(parseDuration('-1h 30m')).toBe(-5_400_000)
    expect(parseDuration('-nothing')).toBe(0)
  })
})

describe('getDaysInMonth function', () => {
  it('counts the days of a 1-based month', () => {
    expect(getDaysInMonth(1, 2025)).toBe(31)
    expect(getDaysInMonth(4, 2025)).toBe(30)
    expect(getDaysInMonth(12, 2025)).toBe(31)
  })

  it('knows leap years', () => {
    expect(getDaysInMonth(2, 2024)).toBe(29)
    expect(getDaysInMonth(2, 2025)).toBe(28)
    expect(getDaysInMonth(2, 1900)).toBe(28)
    expect(getDaysInMonth(2, 2000)).toBe(29)
  })
})

describe('formatHour function', () => {
  it('pads an hour into a clock label', () => {
    expect(formatHour(7)).toBe('07:00')
    expect(formatHour(0)).toBe('00:00')
    expect(formatHour(23)).toBe('23:00')
  })
})
