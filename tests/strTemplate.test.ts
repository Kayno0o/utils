import { describe, expect, test as it } from 'bun:test'
import { strTemplate } from '../src/text'

describe('strTemplate function', () => {
  it('should replace a single variable', () => {
    expect(strTemplate('Hello {name}', { name: 'World' })).toBe('Hello World')
  })

  it('should replace multiple variables', () => {
    expect(strTemplate('{greeting} {name}!', { greeting: 'Hello', name: 'World' })).toBe('Hello World!')
  })

  it('should replace repeated occurrences of the same variable', () => {
    expect(strTemplate('{x} and {x}', { x: 'A' })).toBe('A and A')
  })

  it('should return the original string when no variables', () => {
    expect(strTemplate('no variables here' as const, {} as never)).toBe('no variables here')
  })

  it('should handle variable at the start', () => {
    expect(strTemplate('{name} is here', { name: 'Bob' })).toBe('Bob is here')
  })

  it('should handle variable at the end', () => {
    expect(strTemplate('Hello {name}', { name: 'Bob' })).toBe('Hello Bob')
  })

  it('should handle empty string variable value', () => {
    expect(strTemplate('Hello {name}!', { name: '' })).toBe('Hello !')
  })
})
