import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('nonZero rule', () => {
  const rules = getRules()

  it('should return true for non-zero number', () => {
    const isValid = rules.nonZero(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for zero number', () => {
    const isValid = rules.nonZero(0)
    expect(isValid).toBeString()
  })

  it('should return error message for null value', () => {
    const isValid = rules.nonZero(null)
    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = rules.nonZero(undefined)
    expect(isValid).toBeString()
  })
})
