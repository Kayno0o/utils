import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('phone rule', () => {
  const rules = getRules()

  it('should return true for valid phone number', () => {
    const isValid = rules.phone('+33 6 12 34 56 78')
    expect(isValid).toBe(true)
  })

  it('should return true for valid phone number without country code', () => {
    const isValid = rules.phone('06 12 34 56 78')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid phone number', () => {
    const isValid = rules.phone('123456')
    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = rules.phone(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.phone(undefined)
    expect(isValid).toBe(true)
  })
})
