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

export class JWTBuilder<Payload> {
  constructor(
    public jwt: {
      generate: (payload: Payload, options: any) => string
      verify: (token: string, secret: string) => any
    },
    public secret: string,
  ) {}

  generate(payload: Payload) {
    return this.jwt.generate(payload, this.secret)
  }

  verify(token: string): Payload | undefined {
    try {
      return this.jwt.verify(token, this.secret) as Payload | undefined
    }
    catch {
      return undefined
    }
  }
}
