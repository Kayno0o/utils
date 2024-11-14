import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('isBetweenDays rule', () => {
  const rules = getRules()

  const minDate = new Date('2023-07-28')
  const maxDate = new Date('2023-07-30')

  it('should return true for date within the range (inclusive)', () => {
    const date = new Date('2023-07-29')
    const isValid = rules.isBetweenDays(minDate, maxDate)(date)
    expect(isValid).toBe(true)
  })

  it('should return true for date within the range (exclusive)', () => {
    const date = new Date('2023-07-29')
    const isValid = rules.isBetweenDays(minDate, maxDate, false)(date)
    expect(isValid).toBe(true)
  })

  it('should return error message for date outside the range (inclusive)', () => {
    const date = new Date('2023-07-27')
    const isValid = rules.isBetweenDays(minDate, maxDate)(date)
    expect(isValid).toBeString()
  })

  it('should return error message for date outside the range (exclusive)', () => {
    const date = new Date('2023-07-27')
    const isValid = rules.isBetweenDays(minDate, maxDate, false)(date)
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.isBetweenDays(minDate, maxDate)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isBetweenDays(minDate, maxDate)(undefined)
    expect(isValid).toBe(true)
  })
})
