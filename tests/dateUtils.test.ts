import { describe, expect, test as it } from 'bun:test'
import dayjs from 'dayjs'
import { calculateEaster, configureDayjs, formatDate, getFrenchHolidays, isDateBetween, isHoliday, stringToMsDuration } from '../src/dateUtils'

describe('isDateBetween function', async () => {
  await configureDayjs(dayjs)

  it('should return true if the date is between start and end', () => {
    const result = isDateBetween(dayjs, '2023-05-15', '2023-05-01', '2023-05-30')
    expect(result).toBe(true)
  })

  it('should return false if the date is before the start date', () => {
    const result = isDateBetween(dayjs, '2023-04-15', '2023-05-01', '2023-05-30')
    expect(result).toBe(false)
  })

  it('should return false if the date is after the end date', () => {
    const result = isDateBetween(dayjs, '2023-06-01', '2023-05-01', '2023-05-30')
    expect(result).toBe(false)
  })

  it('should handle open-ended ranges', () => {
    expect(isDateBetween(dayjs, '2023-05-15', null, '2023-05-30')).toBe(true) // only end date
    expect(isDateBetween(dayjs, '2023-05-15', '2023-05-01', null)).toBe(true) // only start date
    expect(isDateBetween(dayjs, '2023-05-15', null, null)).toBe(true) // no start or end date
  })

  it('should handle UTC dates if utc flag is true', () => {
    const result = isDateBetween(dayjs, '2023-05-15T00:00:00Z', '2023-05-01', '2023-05-30', true)
    expect(result).toBe(true)
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
    const result = isHoliday(dayjs, '2023-07-14') // Bastille Day
    expect(result).toBe(true)
  })

  it('should return false for a non-holiday', () => {
    const result = isHoliday(dayjs, '2023-07-15')
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

  it('should return 0 for invalid duration formats', () => {
    expect(stringToMsDuration('invalid')).toBe(0)
    expect(stringToMsDuration('10')).toBe(0) // missing unit
  })

  it('should return the input directly if it is a number', () => {
    const result = stringToMsDuration(1000)
    expect(result).toBe(1000) // should return the input as it is already a number
  })
})

describe('formatDate function', () => {
  const sampleDate = new Date(2023, 4, 15, 13, 45, 30) // May 15, 2023, 13:45:30

  it('should format a single date with the default format', () => {
    const result = formatDate(dayjs, sampleDate)
    expect(result).toBe('15/05/2023') // Default format: DD/MM/YYYY
  })

  it('should format a single date with a specified format', () => {
    const result = formatDate(dayjs, sampleDate, 'datetime-input')
    expect(result).toBe('2023-05-15 13:45:30') // Format: YYYY-MM-DD H:mm:ss
  })

  it('should format a single date in UTC', () => {
    const result = formatDate(dayjs, sampleDate, 'datetime-input', { utc: true })
    expect(result).toBe(dayjs.utc(sampleDate).format('YYYY-MM-DD H:mm:ss'))
  })

  it('should format an array of dates with the default separator', () => {
    const dates = [sampleDate, new Date(2023, 4, 16)]
    const result = formatDate(dayjs, dates)
    expect(result).toBe('15/05/2023, 16/05/2023')
  })

  it('should format an array of dates with a custom separator', () => {
    const dates = [sampleDate, new Date(2023, 4, 16)]
    const result = formatDate(dayjs, dates, 'default', { separator: ' | ' })
    expect(result).toBe('15/05/2023 | 16/05/2023')
  })

  it('should format an array of dates with unique filtering enabled', () => {
    const dates = [sampleDate, sampleDate, new Date(2023, 4, 16)]
    const result = formatDate(dayjs, dates, 'default', { unique: true })
    expect(result).toBe('15/05/2023, 16/05/2023') // Duplicates removed
  })

  it('should format an empty date array as an empty string', () => {
    const result = formatDate(dayjs, [], 'default')
    expect(result).toBe('')
  })

  it('should return an empty string if date is null or undefined', () => {
    expect(formatDate(dayjs, null)).toBe('')
    expect(formatDate(dayjs, undefined)).toBe('')
  })

  it('should format a single date with a custom format string', () => {
    const result = formatDate(dayjs, sampleDate, 'YYYY/MM/DD')
    expect(result).toBe('2023/05/15')
  })

  it('should handle an unknown format string as a custom format', () => {
    const result = formatDate(dayjs, sampleDate, 'MMMM D, YYYY')
    expect(result).toBe(dayjs(sampleDate).format('MMMM D, YYYY'))
  })
})
