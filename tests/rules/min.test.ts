import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('min rule', () => {
  const rules = getRules()

  it('should return true for number greater than or equal to min (inclusive)', () => {
    const isValid = rules.min(5)(5)
    expect(isValid).toBe(true)
  })

  it('should return true for number greater than min (exclusive)', () => {
    const isValid = rules.min(5, false)(6)
    expect(isValid).toBe(true)
  })

  it('should return error message for number less than min (inclusive)', () => {
    const isValid = rules.min(5)(4)
    expect(isValid).toBeString()
  })
})
