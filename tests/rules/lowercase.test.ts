import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('lowercase rule', () => {
  it('should return true for lowercase string', () => {
    const isValid = Rules.lowercase('lowercase')
    expect(isValid).toBe(true)
  })

  it('should return error message for string with uppercase letters', () => {
    const isValid = Rules.lowercase('LowerCase')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.lowercase(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.lowercase(undefined)
    expect(isValid).toBe(true)
  })
})
