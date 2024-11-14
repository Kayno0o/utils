import { getRules } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('isSlug rule', () => {
  const rules = getRules()

  it('should return true for valid slug', () => {
    const isValid = rules.isSlug('valid_slug')
    expect(isValid).toBe(true)
  })

  it('should return error message for invalid slug with uppercase letters', () => {
    const isValid = rules.isSlug('Invalid_Slug')
    expect(isValid).toBeString()
  })

  it('should return error message for invalid slug with special characters', () => {
    const isValid = rules.isSlug('invalid-slug!')
    expect(isValid).toBeString()
  })

  it('should return true for empty string', () => {
    const isValid = rules.isSlug('')
    expect(isValid).toBe(true)
  })

  it('should return true for null value', () => {
    const isValid = rules.isSlug(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isSlug(undefined)
    expect(isValid).toBe(true)
  })
})
