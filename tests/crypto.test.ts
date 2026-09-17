import { describe, expect, test as it, spyOn } from 'bun:test'
import { comparePasswords, digestHex, hashPassword, hmac, nanoid, PASSWORD_HASH_PARAMS, passwordNeedsRehash } from '../src'

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

  it('rejects an alphabet that cannot be drawn from a byte', () => {
    expect(() => nanoid(8, '')).toThrow(RangeError)
    expect(() => nanoid(8, 'a'.repeat(257))).toThrow(RangeError)
  })

  /*
   * 31 symbols means 256 % 31 leaves 8, so bytes 248-255 are the partial run: modulo would
   * fold them onto `2`-`9` and make those ~12.5% likelier. Fed a sequence that is mostly
   * those bytes, the result must skip them rather than emit an early symbol for each.
   */
  it('draws again rather than folding out-of-range bytes onto the first symbols', () => {
    const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'
    const feed = [0, 248, 250, 255, 1, 30]
    let cursor = 0
    const spy = spyOn(crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      const bytes = array as Uint8Array

      for (let i = 0; i < bytes.length; i++) bytes[i] = feed[cursor++] ?? 0

      return array
    })

    expect(nanoid(3, alphabet)).toBe('23z')

    spy.mockRestore()
  })
})

describe('password hashing', () => {
  it('produces an argon2id hash at the pinned parameters', async () => {
    const hash = await hashPassword('correct horse battery staple')

    expect(hash.startsWith('$argon2id$v=19$m=65536,t=2,p=1$')).toBe(true)
    expect(PASSWORD_HASH_PARAMS.memoryCost).toBe(65536)
  })

  it('salts every hash', async () => {
    expect(await hashPassword('same input')).not.toBe(await hashPassword('same input'))
  })

  it('verifies the right password and refuses the wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple')

    expect(await comparePasswords('correct horse battery staple', hash)).toBe(true)
    expect(await comparePasswords('Correct horse battery staple', hash)).toBe(false)
  })

  it('reads a malformed stored hash as a mismatch', async () => {
    expect(await comparePasswords('anything', '')).toBe(false)
    expect(await comparePasswords('anything', 'not-a-hash')).toBe(false)
    expect(await comparePasswords('anything', '$argon2id$garbage')).toBe(false)
  })

  it('leaves a hash at the current parameters alone', async () => {
    expect(passwordNeedsRehash(await hashPassword('whatever'))).toBe(false)
  })

  it('flags weaker parameters, another algorithm and unreadable hashes', () => {
    expect(passwordNeedsRehash('$argon2id$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA')).toBe(true)
    expect(passwordNeedsRehash('$argon2id$v=19$m=65536,t=1,p=1$c2FsdA$aGFzaA')).toBe(true)
    expect(passwordNeedsRehash('$argon2i$v=19$m=65536,t=2,p=1$c2FsdA$aGFzaA')).toBe(true)
    expect(passwordNeedsRehash('$2b$10$abcdefghijklmnopqrstuv')).toBe(true)
    expect(passwordNeedsRehash('')).toBe(true)
  })

  it('accepts parameters stronger than the current ones', () => {
    expect(passwordNeedsRehash('$argon2id$v=19$m=131072,t=4,p=1$c2FsdA$aGFzaA')).toBe(false)
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

describe('digestHex', () => {
  it('hashes to lowercase hex', async () => {
    expect(await digestHex('SHA-256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('gives each algorithm its own digest length', async () => {
    expect(await digestHex('SHA-1', '')).toHaveLength(40)
    expect(await digestHex('SHA-384', '')).toHaveLength(96)
    expect(await digestHex('SHA-512', '')).toHaveLength(128)
  })
})
