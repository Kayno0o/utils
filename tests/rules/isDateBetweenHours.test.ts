import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('isDateBetweenHours rule', () => {
  const rules = getRules()

  it('should return true for date within hours range (inclusive)', () => {
    const date = new Date('2023-07-29T10:00:00')
    const isValid = rules.isDateBetweenHours(9, 17)(date)
    expect(isValid).toBe(true)
  })

  it('should return true for date within hours range (exclusive)', () => {
    const date = new Date('2023-07-29T10:00:00')
    const isValid = rules.isDateBetweenHours(9, 17, false)(date)
    expect(isValid).toBe(true)
  })

  it('should return error message for date outside hours range (inclusive)', () => {
    const date = new Date('2023-07-29T08:00:00')
    const isValid = rules.isDateBetweenHours(9, 17)(date)
    expect(isValid).toBeString()
  })

  it('should return error message for date outside hours range (exclusive)', () => {
    const date = new Date('2023-07-29T18:00:00')
    const isValid = rules.isDateBetweenHours(9, 17, false)(date)
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.isDateBetweenHours(9, 17)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isDateBetweenHours(9, 17)(undefined)
    expect(isValid).toBe(true)
  })
})
