import { describe, expect, test as it } from 'bun:test'
import { renderTemplate } from '../src/text'

describe('renderTemplate function', () => {
  it('should replace a single variable', () => {
    expect(renderTemplate('Hello {name}', { name: 'World' })).toBe('Hello World')
  })

  it('should replace multiple variables', () => {
    expect(renderTemplate('{greeting} {name}!', { greeting: 'Hello', name: 'World' })).toBe('Hello World!')
  })

  it('should replace repeated occurrences of the same variable', () => {
    expect(renderTemplate('{x} and {x}', { x: 'A' })).toBe('A and A')
  })

  it('should return the original string when no variables', () => {
    expect(renderTemplate('no variables here' as const, {} as never)).toBe('no variables here')
  })

  it('should handle variable at the start', () => {
    expect(renderTemplate('{name} is here', { name: 'Bob' })).toBe('Bob is here')
  })

  it('should handle variable at the end', () => {
    expect(renderTemplate('Hello {name}', { name: 'Bob' })).toBe('Hello Bob')
  })

  it('should handle empty string variable value', () => {
    expect(renderTemplate('Hello {name}!', { name: '' })).toBe('Hello !')
  })
})

describe('renderTemplate values', () => {
  it('inserts values as is, never reading them as replace patterns or variables', () => {
    expect(renderTemplate('{a} {b}', { a: '$& {b}', b: 'x' })).toBe('$& {b} x')
    expect(renderTemplate('{price}', { price: '$$5' })).toBe('$$5')
  })

  it('keeps a placeholder with no value', () => {
    expect(renderTemplate('{a} {b}', { a: '1' } as never)).toBe('1 {b}')
  })
})
