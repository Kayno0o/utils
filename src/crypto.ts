const NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** Random id of `size` symbols drawn uniformly from `alphabet`, which must hold 1-256 of them. */
export function nanoid(size = 21, alphabet = NANOID_ALPHABET): string {
  if (alphabet.length < 1 || alphabet.length > 256)
    throw new RangeError('nanoid alphabet must hold 1-256 symbols')

  // Bytes past the last whole run over the alphabet fold back onto its first symbols and
  // skew them, so they are drawn again rather than taken modulo.
  const limit = 256 - (256 % alphabet.length)
  let id = ''

  while (id.length < size) {
    for (const byte of crypto.getRandomValues(new Uint8Array(size - id.length))) {
      if (byte < limit)
        id += alphabet[byte % alphabet.length]
    }
  }

  return id
}

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hmac(key: string, message: string, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algorithm }, false, ['sign'])

  return toHex(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message)))
}

/** Lowercase hex digest of the text's UTF-8 bytes. */
export async function digestHex(algorithm: HashAlgorithm, text: string): Promise<string> {
  return toHex(await crypto.subtle.digest(algorithm, new TextEncoder().encode(text)))
}

/**
 * Pinned rather than left to Bun's defaults, so a runtime upgrade can't quietly split the
 * stored corpus into two cost levels. Above the OWASP floor of m=19456, t=2, p=1.
 */
export const PASSWORD_HASH_PARAMS = { algorithm: 'argon2id', memoryCost: 65536, timeCost: 2 } as const

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, PASSWORD_HASH_PARAMS)
}

/** Verifies against any supported hash format; a malformed or unknown one is a mismatch, not a throw. */
export async function comparePasswords(plaintextPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await Bun.password.verify(plaintextPassword, hashedPassword)
  }
  catch {
    return false
  }
}

function argonCost(params: string, key: 'm' | 't'): number {
  return Number(params.split(',').find(p => p.startsWith(`${key}=`))?.slice(2))
}

/**
 * True when `hashedPassword` was made with anything weaker than `PASSWORD_HASH_PARAMS` -
 * call it after a successful `comparePasswords` to re-hash the plaintext while you hold it.
 */
export function passwordNeedsRehash(hashedPassword: string): boolean {
  const [, algorithm, , params = ''] = hashedPassword.split('$')

  // Negated comparisons so an absent or unparsable cost reads as NaN and needs a rehash.
  return algorithm !== PASSWORD_HASH_PARAMS.algorithm
    || !(argonCost(params, 'm') >= PASSWORD_HASH_PARAMS.memoryCost)
    || !(argonCost(params, 't') >= PASSWORD_HASH_PARAMS.timeCost)
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

/** @deprecated use `hashString` */
export const hashStr = hashString

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
 * hashString('my-service') // 0.6234...
 * hashString('my-service', { algorithm: 'sfc32' }) // 0.2841...
 */
export function hashString(str: string, { algorithm = 'FNV-1a' }: { algorithm?: 'FNV-1a' | 'sfc32' | 'djb2' } = {}): number {
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
