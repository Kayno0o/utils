import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('isNumber rule', () => {
  const rules = getRules()

  it('should return true for valid number', () => {
    const isValid = rules.isNumber('123')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid number', () => {
    const isValid = rules.isNumber('abc')
    const errorMessage = translateRules('rules.isNumber')
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for null value', () => {
    const isValid = rules.isNumber(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isNumber(undefined)
    expect(isValid).toBe(true)
  })
})
