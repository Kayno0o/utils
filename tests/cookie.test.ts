import { beforeEach, describe, expect, test as it } from 'bun:test'
import { CookieBuilder, CookieManager } from '../src/builders/cookie'

// Mock document.cookie
const mockCookieJar = new Map<string, string>()

Object.defineProperty(globalThis, 'document', {
  value: {
    get cookie() {
      return Array.from(mockCookieJar.entries())
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('; ')
    },
    set cookie(str: string) {
      const [pair] = str.split(';')
      const [key, value] = pair!.split('=')

      if (!key)
        return

      // Handle deletion logic used by CookieManager.delete
      // It sets expires to 1970
      if (str.includes('expires=Thu, 01 Jan 1970 00:00:00 GMT')) {
        mockCookieJar.delete(decodeURIComponent(key.trim()))
      }
      else {
        mockCookieJar.set(
          decodeURIComponent(key.trim()),
          decodeURIComponent(value || ''),
        )
      }
    },
  },
  writable: true,
})

describe('CookieBuilder', () => {
  beforeEach(() => {
    mockCookieJar.clear()
  })

  it('should set a cookie with name and value', () => {
    new CookieBuilder('user_id', '12345').build()

    expect(mockCookieJar.has('user_id')).toBe(true)
    expect(mockCookieJar.get('user_id')).toBe('12345')
    expect(document.cookie).toContain('user_id=12345')
  })

  it('should encode name and value', () => {
    new CookieBuilder('foo bar', 'baz qux').build()

    expect(mockCookieJar.has('foo bar')).toBe(true)
    expect(mockCookieJar.get('foo bar')).toBe('baz qux')
    // document.cookie returns encoded values
    expect(document.cookie).toContain('foo%20bar=baz%20qux')
  })

  it('should return the built cookie string', () => {
    const builder = new CookieBuilder('foo', 'bar').secure().path('/')
    const result = builder.build()

    expect(result).toContain('foo=bar')
    expect(result).toContain('; secure')
    expect(result).toContain('; path=/')
  })

  it('should include all options in the built string', () => {
    const date = new Date('2023-01-01T00:00:00.000Z')
    const result = new CookieBuilder('foo', 'bar')
      .expires(date)
      .maxAge(3600)
      .domain('example.com')
      .sameSite('Strict')
      .build()

    expect(result).toContain('expires=Sun, 01 Jan 2023 00:00:00 GMT')
    expect(result).toContain('max-age=3600')
    expect(result).toContain('domain=example.com')
    expect(result).toContain('sameSite=Strict')
  })
})

describe('CookieManager', () => {
  beforeEach(() => {
    mockCookieJar.clear()
  })

  it('should set a cookie using set()', () => {
    CookieManager.set('theme', 'dark').build()

    expect(mockCookieJar.get('theme')).toBe('dark')
  })

  it('should get a cookie using get()', () => {
    mockCookieJar.set('token', 'abc-123')

    const value = CookieManager.get('token')

    expect(value).toBe('abc-123')
  })

  it('should return null if cookie does not exist', () => {
    const value = CookieManager.get('nonexistent')

    expect(value).toBeNull()
  })

  it('should get all cookies using getAll()', () => {
    mockCookieJar.set('a', '1')
    mockCookieJar.set('b', '2')

    const all = CookieManager.getAll()

    expect(all).toEqual({ a: '1', b: '2' })
  })

  it('should delete a cookie', () => {
    mockCookieJar.set('temp', 'val')

    CookieManager.delete('temp')

    expect(mockCookieJar.has('temp')).toBe(false)
  })

  it('should check if cookie exists', () => {
    mockCookieJar.set('exists', 'yes')

    expect(CookieManager.exists('exists')).toBe(true)
    expect(CookieManager.exists('nope')).toBe(false)
  })

  it('should clear all cookies', () => {
    mockCookieJar.set('c1', 'v1')
    mockCookieJar.set('c2', 'v2')

    CookieManager.clear()

    expect(mockCookieJar.size).toBe(0)
  })

  it('should update a cookie', () => {
    mockCookieJar.set('count', '1')

    CookieManager.update('count', '2').build()

    expect(mockCookieJar.get('count')).toBe('2')
  })
})
