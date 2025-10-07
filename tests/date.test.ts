import { describe, expect, test as it } from 'bun:test'
import { calculateEaster, getFrenchHolidays, isHoliday, stringToMsDuration } from '../src'

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

  it('should return 0 for invalid duration formats', () => {
    expect(stringToMsDuration('invalid')).toBe(0)
    expect(stringToMsDuration('10')).toBe(0) // missing unit
  })

  it('should return the input directly if it is a number', () => {
    const result = stringToMsDuration(1000)

    expect(result).toBe(1000) // should return the input as it is already a number
  })
})
