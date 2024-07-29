import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('nonZero rule', () => {
  const rules = getRules()

  it('should return true for non-zero number', () => {
    const isValid = rules.nonZero(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for zero number', () => {
    const isValid = rules.nonZero(0)
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for null value', () => {
    const isValid = rules.nonZero(null)
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for undefined value', () => {
    const isValid = rules.nonZero(undefined)
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })
})
