import { describe, expect, it } from 'bun:test'
import { createFetcher, FetchError, fetchJson, FetchParseError, mergeHeaders } from '../src/browser/fetch'

interface MockCall {
  url: string
  init: RequestInit
}

function mockFetch(status: number, body: unknown, ok?: boolean): MockCall {
  const call: MockCall = { url: '', init: {} }
  const text = body === undefined ? '' : JSON.stringify(body)

  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL, init: RequestInit = {}) => {
      call.url = String(url)
      call.init = init

      return {
        ok: ok ?? (status >= 200 && status < 300),
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        url: String(url),
        text: async () => text,
        json: async () => body,
      } as unknown as Response
    },
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch

  return call
}

describe('fetchJson', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch(200, { id: 1 })
    const data = await fetchJson<{ id: number }>('http://example.com/api')

    expect(data).toEqual({ id: 1 })
  })

  it('resolves an empty body to null', async () => {
    mockFetch(200, undefined)
    const data = await fetchJson('http://example.com/empty')

    expect(data).toBeNull()
  })

  it('throws FetchError on non-2xx', async () => {
    mockFetch(404, null, false)
    await expect(fetchJson('http://example.com/missing')).rejects.toBeInstanceOf(FetchError)
  })

  it('FetchError carries status code and body', async () => {
    mockFetch(500, { message: 'boom' }, false)

    try {
      await fetchJson('http://example.com/error')
    }
    catch (e) {
      expect(e).toBeInstanceOf(FetchError)
      expect((e as FetchError).status).toBe(500)
      expect((e as FetchError).body).toBe('{"message":"boom"}')
    }
  })

  it('appends query params, skipping undefined', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { query: { a: '1', b: undefined, c: '3' } })

    expect(call.url).toBe('http://example.com/api?a=1&c=3')
  })

  it('JSON-encodes a plain-object body with a content type', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { method: 'POST', body: { name: 'x' } })

    expect(call.init.body).toBe('{"name":"x"}')
    expect(new Headers(call.init.headers).get('Content-Type')).toBe('application/json')
  })

  it('passes a string body through untouched', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { method: 'POST', body: 'raw' })

    expect(call.init.body).toBe('raw')
    expect(new Headers(call.init.headers).get('Content-Type')).toBeNull()
  })

  it('merges caller headers over defaults, skipping undefined', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', {
      token: 'abc',
      headers: { 'X-One': '1', 'X-Skip': undefined, 'Accept': 'text/plain' },
    })

    const sent = new Headers(call.init.headers)

    expect(sent.get('Authorization')).toBe('Bearer abc')
    expect(sent.get('X-One')).toBe('1')
    expect(sent.has('X-Skip')).toBe(false)
    expect(sent.get('Accept')).toBe('text/plain')
  })

  it('appends query to a relative URL without a baseUrl', async () => {
    const call = mockFetch(200, {})

    await fetchJson('/api/items', { query: { page: '2' } })

    expect(call.url).toBe('/api/items?page=2')
  })

  it('preserves an existing query string on a relative URL', async () => {
    const call = mockFetch(200, {})

    await fetchJson('/api/items?a=1', { query: { b: '2' } })

    expect(call.url).toBe('/api/items?a=1&b=2')
  })

  it('stringifies number and boolean query values', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { query: { page: 2, active: true } })

    expect(call.url).toBe('http://example.com/api?page=2&active=true')
  })

  it('repeats the key for array query values, skipping undefined', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { query: { tag: ['a', undefined, 'b'] } })

    expect(call.url).toBe('http://example.com/api?tag=a&tag=b')
  })

  it('JSON-encodes a null-prototype object body', async () => {
    const call = mockFetch(200, {})
    const body = Object.assign(Object.create(null), { name: 'x' })

    await fetchJson('http://example.com/api', { method: 'POST', body })

    expect(call.init.body).toBe('{"name":"x"}')
    expect(new Headers(call.init.headers).get('Content-Type')).toBe('application/json')
  })

  it('JSON-encodes an array body', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { method: 'POST', body: [1, 2] })

    expect(call.init.body).toBe('[1,2]')
  })

  it('passes URLSearchParams through untouched', async () => {
    const call = mockFetch(200, {})
    const body = new URLSearchParams({ a: '1' })

    await fetchJson('http://example.com/api', { method: 'POST', body })

    expect(call.init.body).toBe(body)
    expect(new Headers(call.init.headers).get('Content-Type')).toBeNull()
  })

  it('throws on a body that is neither JSON-encodable nor BodyInit', async () => {
    mockFetch(200, {})

    await expect(fetchJson('http://example.com/api', { method: 'POST', body: new Date() as unknown as BodyInit }))
      .rejects
      .toThrow('Unsupported body type')
  })

  it('throws FetchParseError when a 2xx body is not JSON', async () => {
    mockFetch(200, undefined)
    globalThis.fetch = (async (url: RequestInfo | URL) => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      url: String(url),
      text: async () => '<html>nope</html>',
    })) as unknown as typeof fetch

    await expect(fetchJson('http://example.com/api')).rejects.toBeInstanceOf(FetchParseError)
  })

  it('passes a timeout signal to fetch', async () => {
    const call = mockFetch(200, {})

    await fetchJson('http://example.com/api', { timeout: 1000 })

    expect(call.init.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('mergeHeaders', () => {
  it('lets later sources win and skips undefined', () => {
    const merged = mergeHeaders(
      { 'X-A': '1', 'X-B': '2' },
      new Headers({ 'X-B': 'override' }),
      [['X-C', '3'], ['X-D', undefined]],
    )

    expect(merged.get('X-A')).toBe('1')
    expect(merged.get('X-B')).toBe('override')
    expect(merged.get('X-C')).toBe('3')
    expect(merged.has('X-D')).toBe(false)
  })
})

describe('createFetcher', () => {
  it('prepends baseUrl', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher('http://api.example.com')

    await fetcher('/users')
    expect(call.url).toBe('http://api.example.com/users')
  })

  it('applies default token and headers', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher({
      baseUrl: 'http://api.example.com',
      token: 'abc',
      headers: { 'X-App': 'demo' },
    })

    await fetcher('/users')

    const sent = new Headers(call.init.headers)

    expect(sent.get('Authorization')).toBe('Bearer abc')
    expect(sent.get('X-App')).toBe('demo')
  })

  it('merges per-call headers over defaults instead of clobbering', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher({
      baseUrl: 'http://api.example.com',
      headers: { 'X-App': 'demo', 'X-Env': 'prod' },
    })

    await fetcher('/users', { headers: { 'X-Env': 'test' } })

    const sent = new Headers(call.init.headers)

    expect(sent.get('X-App')).toBe('demo')
    expect(sent.get('X-Env')).toBe('test')
  })

  it('merges default and per-call query params', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher({ baseUrl: 'http://api.example.com', query: { key: 'k' } })

    await fetcher('/users', { query: { page: '2' } })

    expect(call.url).toBe('http://api.example.com/users?key=k&page=2')
  })

  it('lets a per-call option override a default', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher({ baseUrl: 'http://api.example.com', token: 'default' })

    await fetcher('/users', { token: 'override' })

    expect(new Headers(call.init.headers).get('Authorization')).toBe('Bearer override')
  })
})
