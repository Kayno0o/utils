import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('isInteger rule', () => {
  const rules = getRules()

  it('should return true for valid integer (strict mode)', () => {
    const isValid = rules.isInteger(true)(42)
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid integer (strict mode)', () => {
    const isValid = rules.isInteger(true)('42.5')
    const errorMessage = translateRules('rules.isInteger')
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for valid integer string (non-strict mode)', () => {
    const isValid = rules.isInteger(false)('42')
    expect(isValid).toBe(true)
  })

  it('should return true for float that is effectively an integer (non-strict mode)', () => {
    const isValid = rules.isInteger(false)('42.0')
    expect(isValid).toBe(true)
  })

  it('should return error message for non-integer string (non-strict mode)', () => {
    const isValid = rules.isInteger(false)('42.5')
    const errorMessage = translateRules('rules.isInteger')
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for null value', () => {
    const isValid = rules.isInteger()(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isInteger()(undefined)
    expect(isValid).toBe(true)
  })
})
