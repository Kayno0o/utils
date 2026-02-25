import { describe, expect, test as it } from 'bun:test'
import { stripHtml } from '../src'

describe('stripHtml function', () => {
  it('should remove a single HTML tag', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold')
  })

  it('should remove multiple HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('should remove self-closing tags', () => {
    expect(stripHtml('line<br/>break')).toBe('linebreak')
  })

  it('should remove tags with attributes', () => {
    expect(stripHtml('<a href="https://example.com">link</a>')).toBe('link')
  })

  it('should handle string with no HTML', () => {
    expect(stripHtml('plain text')).toBe('plain text')
  })

  it('should handle empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('should handle nested tags', () => {
    expect(stripHtml('<div><span>nested</span></div>')).toBe('nested')
  })

  it('should preserve text between multiple tags', () => {
    expect(stripHtml('<p>one</p> and <p>two</p>')).toBe('one and two')
  })
})
