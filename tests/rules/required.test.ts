import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('required rule', () => {
  const rules = getRules()

  it('should return true for non-empty string', () => {
    const isValid = rules.required('test')
    expect(isValid).toBe(true)
  })

  it('should return error message for empty string', () => {
    const isValid = rules.required('')
    expect(isValid).toBeString()
  })

  it('should return error message for string with only spaces', () => {
    const isValid = rules.required('   ')
    expect(isValid).toBeString()
  })

  it('should return true for non-zero number', () => {
    const isValid = rules.required(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for null value', () => {
    const isValid = rules.required(null)
    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = rules.required(undefined)
    expect(isValid).toBeString()
  })

  it('should return true for non-empty array', () => {
    const isValid = rules.required([1, 2, 3])
    expect(isValid).toBe(true)
  })

  it('should return error message for empty array', () => {
    const isValid = rules.required([])
    expect(isValid).toBeString()
  })

  it('should return true for non-empty object', () => {
    const isValid = rules.required({ key: 'value' })
    expect(isValid).toBe(true)
  })

  it('should return error message for empty object', () => {
    const isValid = rules.required({})
    expect(isValid).toBeString()
  })
})
