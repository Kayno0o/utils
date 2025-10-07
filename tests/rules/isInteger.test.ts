import { describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

describe('isInteger rule', () => {
  it('should return true for valid integer (strict mode)', () => {
    const isValid = Rules.isInteger(true)(42)

    expect(isValid).toBe(true)
  })

  it('should return error message for invalid integer (strict mode)', () => {
    const isValid = Rules.isInteger(true)('42.5')

    expect(isValid).toBeString()
  })

  it('should return true for valid integer string (non-strict mode)', () => {
    const isValid = Rules.isInteger(false)('42')

    expect(isValid).toBe(true)
  })

  it('should return true for float that is effectively an integer (non-strict mode)', () => {
    const isValid = Rules.isInteger(false)('42.0')

    expect(isValid).toBe(true)
  })

  it('should return error message for non-integer string (non-strict mode)', () => {
    const isValid = Rules.isInteger(false)('42.5')

    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.isInteger()(null)

    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.isInteger()(undefined)

    expect(isValid).toBe(true)
  })
})
