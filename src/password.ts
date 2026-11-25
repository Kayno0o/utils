/**
 * Pinned rather than left to Bun's defaults, so a runtime upgrade can't quietly split the
 * stored corpus into two cost levels. Above the OWASP floor of m=19456, t=2, p=1.
 */
export const PASSWORD_HASH_PARAMS = { algorithm: 'argon2id', memoryCost: 65536, timeCost: 2 } as const

/** Argon2 costs to hash with, e.g. cheap ones in tests; unset ones keep `PASSWORD_HASH_PARAMS`. */
export interface PasswordHashParams {
  algorithm?: 'argon2id' | 'argon2i' | 'argon2d' | undefined
  /** KiB of memory per hash. */
  memoryCost?: number | undefined
  /** Passes over that memory. */
  timeCost?: number | undefined
}

/** The defaults under `params`, a key left `undefined` keeping its default. */
function passwordHashTarget(params: PasswordHashParams): { algorithm: NonNullable<PasswordHashParams['algorithm']>, memoryCost: number, timeCost: number } {
  return { ...PASSWORD_HASH_PARAMS, ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) }
}

export async function hashPassword(password: string, params: PasswordHashParams = {}): Promise<string> {
  return Bun.password.hash(password, passwordHashTarget(params))
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

/** True when `hashedPassword` was made with anything weaker than `PASSWORD_HASH_PARAMS`, or `params` when given: call it after a successful `comparePasswords` to re-hash the plaintext while you hold it. */
export function passwordNeedsRehash(hashedPassword: string, params: PasswordHashParams = {}): boolean {
  const target = passwordHashTarget(params)
  const [, algorithm, , costs = ''] = hashedPassword.split('$')

  // Negated comparisons so an absent or unparsable cost reads as NaN and needs a rehash.
  return algorithm !== target.algorithm
    || !(argonCost(costs, 'm') >= target.memoryCost)
    || !(argonCost(costs, 't') >= target.timeCost)
}
