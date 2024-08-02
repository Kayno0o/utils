import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('isCode rule', () => {
  const rules = getRules()

  it('should return true for valid code', () => {
    const isValid = rules.isCode('valid_code')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid code with numbers', () => {
    const isValid = rules.isCode('invalid1_code')
    const errorMessage = translateRules('rules.isCode')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for invalid code with special characters', () => {
    const isValid = rules.isCode('invalid-code!')
    const errorMessage = translateRules('rules.isCode')
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for empty string', () => {
    const isValid = rules.isCode('')
    expect(isValid).toBe(true)
  })

  it('should return true for null value', () => {
    const isValid = rules.isCode(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isCode(undefined)
    expect(isValid).toBe(true)
  })
})
