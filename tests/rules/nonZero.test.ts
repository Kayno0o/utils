import { describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

describe('nonZero rule', () => {
  it('should return true for non-zero number', () => {
    const isValid = Rules.nonZero(5)

    expect(isValid).toBe(true)
  })

  it('should return error message for zero number', () => {
    const isValid = Rules.nonZero(0)

    expect(isValid).toBeString()
  })

  it('should return error message for null value', () => {
    const isValid = Rules.nonZero(null)

    expect(isValid).toBeString()
  })

  it('should return error message for undefined value', () => {
    const isValid = Rules.nonZero(undefined)

    expect(isValid).toBeString()
  })
})
