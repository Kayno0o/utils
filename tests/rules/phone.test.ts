import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('phone rule', () => {
  it('should return true for valid phone number', () => {
    const isValid = Rules.phone('+33 6 12 34 56 78')
    expect(isValid).toBe(true)
  })

  it('should return true for valid phone number without country code', () => {
    const isValid = Rules.phone('06 12 34 56 78')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid phone number', () => {
    const isValid = Rules.phone('123456')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.phone(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.phone(undefined)
    expect(isValid).toBe(true)
  })
})
