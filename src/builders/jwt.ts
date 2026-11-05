import { base64Decode } from '../text'

export interface DecodedJwt {
  header: unknown
  payload: Record<string, unknown>
  /** From the `iat`, `nbf` and `exp` claims, when the token carries them. */
  times: { claim: string, label: string, at: Date }[]
}

const TIME_CLAIMS = [
  { claim: 'iat', label: 'Issued' },
  { claim: 'nbf', label: 'Valid from' },
  { claim: 'exp', label: 'Expires' },
]

/** A JWT's header and payload, which travel as base64url; `null` when the token does not parse. Reads a token without verifying it. */
export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split('.')

  if (parts.length !== 3)
    return null

  try {
    const header: unknown = JSON.parse(base64Decode(parts[0] ?? ''))
    const payload: unknown = JSON.parse(base64Decode(parts[1] ?? ''))

    if (typeof payload !== 'object' || payload === null)
      return null

    const claims = payload as Record<string, unknown>
    const times = TIME_CLAIMS.flatMap(({ claim, label }) => (typeof claims[claim] === 'number' ? [{ claim, label, at: new Date(claims[claim] * 1000) }] : []))

    return { header, payload: claims, times }
  }
  catch {
    return null
  }
}

/** What most JWT libraries take when signing, e.g. jsonwebtoken's `sign` options. */
export interface JwtSignOptions {
  /** Seconds, or a duration string such as `'1h'`. */
  expiresIn?: string | number
  algorithm?: string
  [option: string]: unknown
}

/** The JWT library calls the builder wraps, e.g. `{ generate: jwt.sign, verify: jwt.verify }`. */
export interface JwtLibrary<Payload, SignOptions = JwtSignOptions> {
  generate: (payload: Payload, secret: string, options?: SignOptions) => string
  verify: (token: string, secret: string) => unknown
}

export type JwtVerification<Payload>
  = | { ok: true, payload: Payload }
    | { ok: false, reason: 'expired' | 'malformed' | 'invalid', error: unknown }

const EXPIRED_ERROR_REGEX = /expired/i

/** jsonwebtoken names it `TokenExpiredError`, jose codes it `ERR_JWT_EXPIRED`; the unverified `exp` claim is never trusted, so a forged token reads `invalid`. */
function isExpiry(error: unknown): boolean {
  const { name, code } = (error ?? {}) as { name?: unknown, code?: unknown }

  return (typeof name === 'string' && EXPIRED_ERROR_REGEX.test(name)) || code === 'ERR_JWT_EXPIRED'
}

export class JWTBuilder<Payload, SignOptions extends object = JwtSignOptions> {
  constructor(
    public jwt: JwtLibrary<Payload, SignOptions>,
    public secret: string,
    /** Sign options every `generate` starts from, e.g. `{ expiresIn: '1h' }`. */
    public defaults?: NoInfer<SignOptions>,
  ) {}

  /** Signs `payload`; `options` win over the builder's defaults. */
  generate(payload: Payload, options?: SignOptions) {
    return this.jwt.generate(payload, this.secret, this.defaults || options ? { ...this.defaults, ...options } as SignOptions : undefined)
  }

  /** The payload, or `undefined` for any failure; `validate` says which. */
  verify(token: string): Payload | undefined {
    const result = this.validate(token)

    return result.ok ? result.payload : undefined
  }

  /** The payload, or why the token was refused: `expired`, `malformed` (not a JWT at all) or `invalid` (bad signature, wrong audience...). */
  validate(token: string): JwtVerification<Payload> {
    try {
      return { ok: true, payload: this.jwt.verify(token, this.secret) as Payload }
    }
    catch (error) {
      if (!decodeJwt(token))
        return { ok: false, reason: 'malformed', error }

      return { ok: false, reason: isExpiry(error) ? 'expired' : 'invalid', error }
    }
  }
}
