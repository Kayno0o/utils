import { describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

describe('isUrl rule', () => {
  it('should return true for a valid HTTP URL', () => {
    const result = Rules.isUrl('http://example.com')

    expect(result).toBe(true)
  })

  it('should return true for a valid HTTPS URL', () => {
    const result = Rules.isUrl('https://example.com')

    expect(result).toBe(true)
  })

  it('should return error message for an invalid URL', () => {
    const result = Rules.isUrl('not a url')

    expect(result).toBeString()
  })

  it('should return error message for non-http(s) protocols', () => {
    const result = Rules.isUrl('ftp://example.com')

    expect(result).toBe('Must be an HTTP or HTTPS URL')
  })

  it('should return error message for missing protocol', () => {
    const result = Rules.isUrl('example.com')

    expect(result).toBe('Must be a valid URL')
  })

  it('should return error message if secured is true but using HTTP', () => {
    const result = Rules.isUrl('http://example.com', true)

    expect(result).toBe('URL must use HTTPS')
  })

  it('should return true if secured is true and using HTTPS', () => {
    const result = Rules.isUrl('https://example.com', true)

    expect(result).toBe(true)
  })

  it('should return error message for empty string', () => {
    const result = Rules.isUrl('')

    expect(result).toBe('Must be a valid URL')
  })

  it('should return error message for null input', () => {
    const result = Rules.isUrl(null as any)

    expect(result).toBe('Must be a valid URL')
  })

  it('should return error message for undefined input', () => {
    const result = Rules.isUrl(undefined as any)

    expect(result).toBe('Must be a valid URL')
  })
})
