import { describe, expect, test as it } from 'bun:test'
import { hmac, nanoid } from '../src'

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

describe('hmac', () => {
  it('returns a hex string', async () => {
    const result = await hmac('key', 'message')

    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('returns consistent output for same inputs', async () => {
    const a = await hmac('secret', 'payload')
    const b = await hmac('secret', 'payload')

    expect(a).toBe(b)
  })

  it('changes output when key changes', async () => {
    const a = await hmac('key1', 'msg')
    const b = await hmac('key2', 'msg')

    expect(a).not.toBe(b)
  })

  it('supports SHA-512', async () => {
    const result = await hmac('key', 'message', 'SHA-512')

    expect(result).toHaveLength(128)
  })
})
