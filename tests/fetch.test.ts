import { describe, expect, it } from 'bun:test'
import { createFetcher, FetchError, fetchJson } from '../src/browser/fetch'

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
})

describe('createFetcher', () => {
  it('prepends baseUrl', async () => {
    const call = mockFetch(200, {})
    const fetcher = createFetcher('http://api.example.com')

    await fetcher('/users')
    expect(call.url).toBe('http://api.example.com/users')
  })
})
