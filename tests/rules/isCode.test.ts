import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('isCode rule', () => {
  it('should return true for valid code', () => {
    const isValid = Rules.isCode('valid_code')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid code with numbers', () => {
    const isValid = Rules.isCode('invalid1_code')
    expect(isValid).toBeString()
  })

  it('should return error message for invalid code with special characters', () => {
    const isValid = Rules.isCode('invalid-code!')
    expect(isValid).toBeString()
  })

  it('should return true for empty string', () => {
    const isValid = Rules.isCode('')
    expect(isValid).toBe(true)
  })

  it('should return true for null value', () => {
    const isValid = Rules.isCode(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.isCode(undefined)
    expect(isValid).toBe(true)
  })
})
