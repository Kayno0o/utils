import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('minLength rule', () => {
  const rules = getRules()

  it('should return true for string with length greater than or equal to minLength', () => {
    const isValid = rules.minLength(3)('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for string with length less than minLength', () => {
    const isValid = rules.minLength(5)('test')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.minLength(3)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.minLength(3)(undefined)
    expect(isValid).toBe(true)
  })
})
