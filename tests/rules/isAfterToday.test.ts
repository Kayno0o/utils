import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('isAfterToday rule', () => {
  const rules = getRules()

  it('should return true for date after today (inclusive)', () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    const isValid = rules.isAfterToday()(date)
    expect(isValid).toBe(true)
  })

  it('should return true for date after today (exclusive)', () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    const isValid = rules.isAfterToday(false)(date)
    expect(isValid).toBe(true)
  })

  it('should return error message for date before today (inclusive)', () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const isValid = rules.isAfterToday()(date)
    expect(isValid).toBeString()
  })

  it('should return error message for date before today (exclusive)', () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const isValid = rules.isAfterToday(false)(date)
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.isAfterToday()(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isAfterToday()(undefined)
    expect(isValid).toBe(true)
  })
})
