import { describe, expect, it } from 'bun:test'
import { decodeJwt } from '../src/builders/jwt'
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
