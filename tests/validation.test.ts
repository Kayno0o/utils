import { describe, expect, test as it } from 'bun:test'
import { isIP, isUUID } from '../src/validation'

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

describe('isUUID', () => {
  it('accepts a canonical UUID in either case', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isUUID('')).toBe(false)
    expect(isUUID('123e4567e89b12d3a456426614174000')).toBe(false)
    expect(isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false)
    expect(isUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false)
    expect(isUUID(' 123e4567-e89b-12d3-a456-426614174000')).toBe(false)
  })
})
