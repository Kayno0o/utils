import { describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

describe('isNumber rule', () => {
  it('should return true for valid number', () => {
    const isValid = Rules.isNumber('123')

    expect(isValid).toBe(true)
  })

  it('should return error message for invalid number', () => {
    const isValid = Rules.isNumber('abc')

    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.isNumber(null)

    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.isNumber(undefined)

    expect(isValid).toBe(true)
  })
})
