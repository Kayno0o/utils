import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('required rule', () => {
  it('should return true for non-empty string', () => {
    const isValid = Rules.required('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for empty string', () => {
    const isValid = Rules.required('')
    expect(isValid).toBeString()
  })

  it('should return error message for string with only spaces', () => {
    const isValid = Rules.required('   ')
    expect(isValid).toBeString()
  })

  it('should return true for non-zero number', () => {
    const isValid = Rules.required(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for null value', () => {
    const isValid = Rules.required(null)
    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = Rules.required(undefined)
    expect(isValid).toBeString()
  })

  it('should return true for non-empty array', () => {
    const isValid = Rules.required([1, 2, 3])
    expect(isValid).toBe(true)
  })

  it('should return error message for empty array', () => {
    const isValid = Rules.required([])
    expect(isValid).toBeString()
  })

  it('should return true for non-empty object', () => {
    const isValid = Rules.required({ key: 'value' })
    expect(isValid).toBe(true)
  })

  it('should return error message for empty object', () => {
    const isValid = Rules.required({})
    expect(isValid).toBeString()
  })
})
