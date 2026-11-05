import type { JwtSignOptions } from '../src/builders/jwt'
import { describe, expect, it } from 'bun:test'
import { decodeJwt, JWTBuilder } from '../src/builders/jwt'
import { base64Encode } from '../src/text'

describe('decodeJwt', () => {
  const part = (value: object) => base64Encode(JSON.stringify(value), true)

  it('decodes the header, the payload and the time claims it carries', () => {
    const decoded = decodeJwt(`${part({ alg: 'HS256' })}.${part({ sub: 'ü', exp: 1_700_000_000 })}.sig`)

    expect(decoded?.header).toEqual({ alg: 'HS256' })
    expect(decoded?.payload.sub).toBe('ü')
    expect(decoded?.times).toEqual([{ claim: 'exp', label: 'Expires', at: new Date(1_700_000_000_000) }])
  })

  it('returns null for anything that is not a JWT', () => {
    expect(decodeJwt('not.a.jwt')).toBeNull()
    expect(decodeJwt('one.two')).toBeNull()
    expect(decodeJwt(`${part({ alg: 'HS256' })}.${base64Encode('"text"', true)}.sig`)).toBeNull()
  })
})

describe('JWTBuilder', () => {
  const part = (value: object) => base64Encode(JSON.stringify(value), true)
  const now = () => Math.floor(Date.now() / 1000)
  const calls: { secret: string, options?: JwtSignOptions }[] = []

  // A stand-in for jsonwebtoken: signs nothing, checks only the "signature" text and `exp`.
  const fakeJwt = {
    generate: (payload: { sub: string }, secret: string, options?: JwtSignOptions) => {
      calls.push({ secret, options })

      return `${part({ alg: options?.algorithm ?? 'HS256' })}.${part({ ...payload, exp: now() + Number(options?.expiresIn ?? 60) })}.${secret}`
    },
    verify: (token: string, secret: string) => {
      const decoded = decodeJwt(token)

      if (!decoded)
        throw Object.assign(new Error('jwt malformed'), { name: 'JsonWebTokenError' })

      if (!token.endsWith(`.${secret}`))
        throw Object.assign(new Error('invalid signature'), { name: 'JsonWebTokenError' })

      if ((decoded.payload.exp as number) <= now())
        throw Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' })

      return decoded.payload
    },
  }

  it('hands the secret and merged sign options to generate', () => {
    calls.length = 0

    const builder = new JWTBuilder(fakeJwt, 's3cret', { expiresIn: 3600 })
    const token = builder.generate({ sub: 'ana' }, { algorithm: 'HS512' })

    expect(calls[0]).toEqual({ secret: 's3cret', options: { expiresIn: 3600, algorithm: 'HS512' } })
    expect(decodeJwt(token)?.header).toEqual({ alg: 'HS512' })
    expect(builder.verify(token)?.sub).toBe('ana')
  })

  it('tells an expired token from a malformed or forged one', () => {
    const builder = new JWTBuilder(fakeJwt, 's3cret')
    const expired = builder.generate({ sub: 'ana' }, { expiresIn: -10 })
    const forged = new JWTBuilder(fakeJwt, 'other').generate({ sub: 'ana' })

    expect(builder.validate(expired)).toMatchObject({ ok: false, reason: 'expired' })
    expect(builder.validate('nope')).toMatchObject({ ok: false, reason: 'malformed' })
    expect(builder.validate(forged)).toMatchObject({ ok: false, reason: 'invalid' })
    expect(builder.verify(expired)).toBeUndefined()
  })

  it('reads expiry from the claims when the library names its error otherwise', () => {
    const builder = new JWTBuilder({ ...fakeJwt, verify: () => {
      throw new Error('nope')
    } }, 's3cret')

    expect(builder.validate(builder.generate({ sub: 'ana' }, { expiresIn: -10 }))).toMatchObject({ reason: 'expired' })
    expect(builder.validate(builder.generate({ sub: 'ana' }))).toMatchObject({ reason: 'invalid' })
  })
})
