import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('nonEmptyString rule', () => {
  const rules = getRules()

  it('should return true for non-empty string', () => {
    const isValid = rules.nonEmptyString('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for empty string', () => {
    const isValid = rules.nonEmptyString('')
    expect(isValid).toBeString()
  })

  it('should return error message for string with only spaces', () => {
    const isValid = rules.nonEmptyString('   ')
    expect(isValid).toBeString()
  })

  it('should return error message for null value', () => {
    const isValid = rules.nonEmptyString(null)
    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = rules.nonEmptyString(undefined)
    expect(isValid).toBeString()
  })
})
