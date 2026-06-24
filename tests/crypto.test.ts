import { describe, expect, test as it } from 'bun:test'
import { nanoid } from '../src'

describe('nanoid', () => {
  it('returns default length of 21', () => {
    expect(nanoid()).toHaveLength(21)
  })

  it('returns custom length', () => {
    expect(nanoid(10)).toHaveLength(10)
  })

  it('uses only characters from the default alphabet', () => {
    expect(nanoid(100)).toMatch(/^[\w\-]+$/)
  })

  it('uses custom alphabet', () => {
    expect(nanoid(8, '0123456789')).toMatch(/^\d{8}$/)
  })

  it('returns unique values', () => {
    expect(nanoid()).not.toBe(nanoid())
  })
})
