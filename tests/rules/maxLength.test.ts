import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('maxLength rule', () => {
  it('should return true for string with length less than or equal to maxLength', () => {
    const isValid = Rules.maxLength(5)('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for string with length greater than maxLength', () => {
    const isValid = Rules.maxLength(3)('test')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.maxLength(5)(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.maxLength(5)(undefined)
    expect(isValid).toBe(true)
  })
})
