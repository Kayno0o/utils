import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('maxLength rule', () => {
  const rules = getRules()

  it('should return true for string with length less than or equal to maxLength', () => {
    const isValid = rules.maxLength(5)('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for string with length greater than maxLength', () => {
    const isValid = rules.maxLength(3)('test')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.maxLength(5)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.maxLength(5)(undefined)
    expect(isValid).toBe(true)
  })
})
