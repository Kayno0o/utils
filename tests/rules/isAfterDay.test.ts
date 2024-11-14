import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('isAfterDay rule', () => {
  const rules = getRules()

  const referenceDate = new Date('2023-07-28')

  it('should return true for date after the reference date (inclusive)', () => {
    const date = new Date('2023-07-29')
    const isValid = rules.isAfterDay(referenceDate)(date)
    expect(isValid).toBe(true)
  })

  it('should return true for date after the reference date (exclusive)', () => {
    const date = new Date('2023-07-29')
    const isValid = rules.isAfterDay(referenceDate, false)(date)
    expect(isValid).toBe(true)
  })

  it('should return error message for date before the reference date (inclusive)', () => {
    const date = new Date('2023-07-27')
    const isValid = rules.isAfterDay(referenceDate)(date)
    expect(isValid).toBeString()
  })

  it('should return error message for date before the reference date (exclusive)', () => {
    const date = new Date('2023-07-27')
    const isValid = rules.isAfterDay(referenceDate, false)(date)
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.isAfterDay(referenceDate)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isAfterDay(referenceDate)(undefined)
    expect(isValid).toBe(true)
  })
})
