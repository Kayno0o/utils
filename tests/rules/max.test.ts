import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('max rule', () => {
  const rules = getRules()

  it('should return true for number less than or equal to max (inclusive)', () => {
    const isValid = rules.max(10)(8)
    expect(isValid).toBe(true)
  })

  it('should return true for number less than max (exclusive)', () => {
    const isValid = rules.max(10, false)(9)
    expect(isValid).toBe(true)
  })

  it('should return error message for number greater than max (inclusive)', () => {
    const isValid = rules.max(10)(11)
    expect(isValid).toBeString()
  })
})
