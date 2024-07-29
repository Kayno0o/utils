import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('nonEmptyString rule', () => {
  const rules = getRules()

  it('should return true for non-empty string', () => {
    const isValid = rules.nonEmptyString('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for empty string', () => {
    const isValid = rules.nonEmptyString('')
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for string with only spaces', () => {
    const isValid = rules.nonEmptyString('   ')
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for null value', () => {
    const isValid = rules.nonEmptyString(null)
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })

  it('should return error message for undefined value', () => {
    const isValid = rules.nonEmptyString(undefined)
    const errorMessage = translateRules('rules.required')
    expect(isValid).toBe(errorMessage)
  })
})
