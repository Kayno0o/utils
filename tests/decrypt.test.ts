import { describe, expect, test as it } from 'bun:test'
import { decryptCaesar, decryptMonoalphabet, decryptVigenere } from '../src/decrypt'

describe('decryptCaesar', () => {
  it('shifts letters either way, keeping their case and the rest', () => {
    expect(decryptCaesar('ABC xyz!', 3)).toBe('DEF abc!')
    expect(decryptCaesar('DEF abc!', -3)).toBe('ABC xyz!')
    expect(decryptCaesar('A', 29)).toBe('D')
  })
})

describe('decryptVigenere', () => {
  it('shifts each letter by the key, skipping non-letters, any key case', () => {
    expect(decryptVigenere('ATTACK AT DAWN', 'lemon')).toBe('LXFOPV EF RNHR')
    expect(decryptVigenere('attack', 'LEMON')).toBe('lxfopv')
  })

  it('refuses a key without letters', () => {
    expect(() => decryptVigenere('abc', '')).toThrow(RangeError)
  })
})

describe('decryptMonoalphabet', () => {
  it('maps known characters and keeps the rest', () => {
    expect(decryptMonoalphabet('ab c?', { a: 'x', b: 'y', c: 'z' })).toBe('xy z?')
  })
})
