export async function hashPassword(password: string) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${salt}:${hash}`
}

export async function comparePasswords(plaintextPassword: string, hashedPassword: string): Promise<boolean> {
  const [salt, originalHash] = hashedPassword.split(':')
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintextPassword + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return hash === originalHash
}

// string → seed hash (32-bit)
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)

    return (h ^= h >>> 16) >>> 0
  }
}

// sfc32 PRNG: four 32-bit seeds → uniform [0,1)
export function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function () {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    const t = (a + b) | 0

    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    const result = (t + d) | 0

    c = (c + result) | 0

    // Convert to [0, 1)
    return (result >>> 0) / 4294967296
  }
}

/**
 * Hashes a string to a normalized float in the range [0, 1].
 *
 * @param str - The string to hash
 * @param options - Hashing options
 * @param options.algorithm - The hashing algorithm to use
 * - `FNV-1a` *(default)* — fast, good distribution, suitable for most use cases
 * - `sfc32` — higher quality output via PRNG seeded with xmur3, slightly slower
 * - `djb2` — extremely simple and fast, decent distribution
 * @returns A deterministic float in [0, 1]
 *
 * @example
 * hashStr('my-service') // 0.6234...
 * hashStr('my-service', { algorithm: 'sfc32' }) // 0.2841...
 */
export function hashStr(str: string, { algorithm = 'FNV-1a' }: { algorithm?: 'FNV-1a' | 'sfc32' | 'djb2' } = {}): number {
  if (algorithm === 'sfc32') {
    const seed = xmur3(str)
    const rand = sfc32(seed(), seed(), seed(), seed())

    return rand()
  }

  if (algorithm === 'djb2') {
    let hash = 5381

    for (let i = 0; i < str.length; i++)
      hash = Math.imul(hash, 33) ^ str.charCodeAt(i)

    return hash
  }

  let hash = 2166136261

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
    hash >>>= 0
  }

  return hash / 0xFFFFFFFF
}
