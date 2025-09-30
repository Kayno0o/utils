import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('isSlug rule', () => {
  it('should return true for valid slug', () => {
    const isValid = Rules.isSlug('valid_slug')

    expect(isValid).toBe(true)
  })

  it('should return error message for invalid slug with uppercase letters', () => {
    const isValid = Rules.isSlug('Invalid_Slug')

    expect(isValid).toBeString()
  })

  it('should return error message for invalid slug with special characters', () => {
    const isValid = Rules.isSlug('invalid-slug!')

    expect(isValid).toBeString()
  })

  it('should return true for empty string', () => {
    const isValid = Rules.isSlug('')

    expect(isValid).toBe(true)
  })

  it('should return true for null value', () => {
    const isValid = Rules.isSlug(null)

    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.isSlug(undefined)

    expect(isValid).toBe(true)
  })
})
