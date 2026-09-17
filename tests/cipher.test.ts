import { describe, expect, it } from 'bun:test'
import { alphabetOf, decodeCipher, encodeCipher, uniqueSymbols } from '../src/cipher'

describe('cipher', () => {
  const hex = alphabetOf('0123456789abcdef')

  it('writes each UTF-8 byte in the dictionary base, and reads it back', () => {
    expect(hex.width).toBe(2)
    expect(encodeCipher('Aé', hex)).toBe('41c3a9')
    expect(decodeCipher('41c3a9', hex)).toBe('Aé')
  })

  it('treats a symbol as one code point and drops repeated ones', () => {
    const emoji = alphabetOf('🙂🙃🙂')

    expect(uniqueSymbols('aab')).toBe('ab')
    expect(emoji.symbols).toEqual(['🙂', '🙃'])
    expect(emoji.width).toBe(8)
    expect(decodeCipher(encodeCipher('hi 👋', emoji), emoji)).toBe('hi 👋')
  })

  it('encodes nothing with a dictionary of under two symbols', () => {
    expect(encodeCipher('hi', alphabetOf('a'))).toBe('')
    expect(() => decodeCipher('a', alphabetOf('a'))).toThrow('at least two characters')
  })

  it('says what is wrong with text it cannot read', () => {
    expect(() => decodeCipher('4', hex)).toThrow('multiple of 2')
    expect(() => decodeCipher('4z', hex)).toThrow('"z" is not in this dictionary')
    expect(() => decodeCipher('ff', hex)).toThrow('not text')
    expect(() => decodeCipher('999', alphabetOf('0123456789'))).toThrow('no byte has')
  })
})
