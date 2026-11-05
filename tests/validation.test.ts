import { describe, expect, test as it } from 'bun:test'
import { isIP } from '../src/validation'

describe('isIP', () => {
  it('checks IPv4 by default', () => {
    expect(isIP('192.168.0.1')).toBe(true)
    expect(isIP('::1')).toBe(false)
  })

  it('checks the version it is given', () => {
    expect(isIP('::1', { version: 6 })).toBe(true)
    expect(isIP('192.168.0.1', { version: 6 })).toBe(false)
    expect(isIP('192.168.0.1', { version: 4 })).toBe(true)
  })
})
