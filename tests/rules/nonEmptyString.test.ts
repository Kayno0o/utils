import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('nonEmptyString rule', () => {
  it('should return true for non-empty string', () => {
    const isValid = Rules.nonEmptyString('test')

    expect(isValid).toBe(true)
  })

  it('should return error message for empty string', () => {
    const isValid = Rules.nonEmptyString('')

    expect(isValid).toBeString()
  })

  it('should return error message for string with only spaces', () => {
    const isValid = Rules.nonEmptyString('   ')

    expect(isValid).toBeString()
  })

  it('should return error message for null value', () => {
    const isValid = Rules.nonEmptyString(null)

    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = Rules.nonEmptyString(undefined)

    expect(isValid).toBeString()
  })
})
