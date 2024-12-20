import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('lowercase rule', () => {
  const rules = getRules()

  it('should return true for lowercase string', () => {
    const isValid = rules.lowercase('lowercase')
    expect(isValid).toBe(true)
  })

  it('should return error message for string with uppercase letters', () => {
    const isValid = rules.lowercase('LowerCase')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.lowercase(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.lowercase(undefined)
    expect(isValid).toBe(true)
  })
})
