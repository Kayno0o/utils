import { describe, expect, test as it } from 'bun:test'
import { truncate } from '../src'

describe('truncate function', () => {
  it('should not truncate strings shorter than len', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('should not truncate strings exactly at len', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('should truncate strings longer than len', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('should use custom suffix', () => {
    expect(truncate('hello world', 5, '…')).toBe('hello…')
  })

  it('should handle empty suffix', () => {
    expect(truncate('hello world', 5, '')).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('should handle len of 0', () => {
    expect(truncate('hello', 0)).toBe('...')
  })
})
