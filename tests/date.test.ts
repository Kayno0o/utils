import { describe, expect, test as it } from 'bun:test'
import { addDays, addMonths, addYears, age, businessDaysBetween, calculateEaster, dateDifference, DAY_MS, diffInDays, diffInHours, endOfDay, endOfMonth, formatDayMonth, formatMonthShort, formatMonthYear, formatRelativeTime, getFrenchHolidays, getQuarter, getWeekNumber, HOUR_MS, isBetween, isHoliday, isLeapYear, isSameDay, isToday, isWeekend, MINUTE_MS, msDurationToString, parseDateLabel, SECOND_MS, SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS_IN_MINUTE, SECONDS_IN_WEEK, startOfDay, startOfMonth, stringToMsDuration, WEEK_MS } from '../src'

describe('msDurationToString function', () => {
  it('decomposes a duration into the largest units first', () => {
    expect(msDurationToString(stringToMsDuration('1d 7h 30m'))).toBe('1d 7h 30m')
    expect(msDurationToString(90061000)).toBe('1d 1h 1m 1s')
  })

  it('skips zero units', () => {
    expect(msDurationToString(stringToMsDuration('2h'))).toBe('2h')
  })

  it('returns 0 of the smallest unit for empty durations', () => {
    expect(msDurationToString(0)).toBe('0s')
    expect(msDurationToString(500)).toBe('0s') // sub-second rounds down
  })

  it('round-trips with custom units', () => {
    const units = ['y', 'w', 'd', 'h', 'm', 's']
    const ms = stringToMsDuration('1y 2w 3d')

    expect(stringToMsDuration(msDurationToString(ms, units))).toBe(ms)
  })

  it('keeps the sign for negative durations', () => {
    expect(msDurationToString(-stringToMsDuration('1h 30m'))).toBe('-1h 30m')
  })

  it('writes the units it is given labels for, and leaves the rest', () => {
    const labels = { d: 'j', m: 'min' }

    expect(msDurationToString(stringToMsDuration('1d 7h 30m'), undefined, { labels })).toBe('1j 7h 30min')
  })

  it('labels the zero unit it falls back to', () => {
    expect(msDurationToString(0, ['m'], { labels: { m: 'min' } })).toBe('0min')
  })
})

describe('formatRelativeTime function', () => {
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
})

describe('stringToMsDuration function', () => {
  it('should handle durations specified in seconds', () => {
    const result = stringToMsDuration('10s')

    expect(result).toBe(10000) // 10 seconds in milliseconds
  })

  it('should handle durations specified in minutes', () => {
    const result = stringToMsDuration('5m')

    expect(result).toBe(300000) // 5 minutes in milliseconds
  })

  it('should handle durations specified in hours', () => {
    const result = stringToMsDuration('2h')

    expect(result).toBe(7200000) // 2 hours in milliseconds
  })

  it('should handle durations specified in days', () => {
    const result = stringToMsDuration('1d')

    expect(result).toBe(86400000) // 1 day in milliseconds
  })

  it('should handle durations specified in weeks', () => {
    const result = stringToMsDuration('1w')

    expect(result).toBe(604800000) // 1 week in milliseconds
  })

  it('should handle durations specified in months', () => {
    const result = stringToMsDuration('1M')

    expect(result).toBe(2592000000) // 1 month in milliseconds
  })

  it('should handle durations specified in years', () => {
    const result = stringToMsDuration('1y')

    expect(result).toBe(31536000000) // 1 year in milliseconds
  })

  it('should handle compound durations', () => {
    expect(stringToMsDuration('1d 7h')).toBe(86400000 + 7 * 3600000)
    expect(stringToMsDuration('1d7h30m')).toBe(86400000 + 7 * 3600000 + 30 * 60000)
    expect(stringToMsDuration('2w 3d 4h 5m 6s')).toBe(
      2 * 604800000 + 3 * 86400000 + 4 * 3600000 + 5 * 60000 + 6 * 1000,
    )
  })

  it('should distinguish minutes from months by case', () => {
    expect(stringToMsDuration('1m')).toBe(60000) // minute
    expect(stringToMsDuration('1M')).toBe(2592000000) // month
  })

  it('should return 0 for invalid duration formats', () => {
    expect(stringToMsDuration('invalid')).toBe(0)
    expect(stringToMsDuration('10')).toBe(0) // missing unit
  })

  it('should return the input directly if it is a number', () => {
    const result = stringToMsDuration(1000)

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
})

describe('formatMonthYear function', () => {
  it('formats short month and full year', () => {
    expect(formatMonthYear(new Date(2026, 0, 15))).toBe('Jan 2026')
    expect(formatMonthYear(new Date(2024, 6, 1))).toBe('Jul 2024')
  })
})

describe('formatMonthShort function', () => {
  it('formats short month', () => {
    expect(formatMonthShort(new Date(2026, 0, 15))).toBe('Jan')
    expect(formatMonthShort(new Date(2026, 5, 1))).toBe('Jun')
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

  it('ignores a trailing time on the ISO form', () => {
    expect(parseDateLabel('2026-01-15T12:30:00')).toEqual(new Date(2026, 0, 15))
  })

  it('returns null for unrecognized labels', () => {
    expect(parseDateLabel('not a date')).toBeNull()
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
  it('diffInDays counts whole calendar days', () => {
    expect(diffInDays(new Date(2024, 0, 1), new Date(2024, 0, 4))).toBe(3)
    expect(diffInDays(new Date(2024, 0, 4), new Date(2024, 0, 1))).toBe(-3)
  })

  it('diffInHours truncates toward zero', () => {
    const a = new Date(2024, 0, 1, 0, 0)
    const b = new Date(2024, 0, 1, 5, 30)

    expect(diffInHours(a, b)).toBe(5)
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
    expect(isBetween(start, start, end, false)).toBe(false)
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

    expect(age(birth, new Date(2024, 5, 15))).toBe(24)
    expect(age(birth, new Date(2024, 5, 14))).toBe(23)
    expect(age(birth, new Date(2024, 6, 1))).toBe(24)
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
