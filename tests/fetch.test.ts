import { describe, expect, it } from 'bun:test'
import { createFetcher, FetchError, fetchJson, FetchParseError, mergeHeaders } from '../src/browser/fetch'
import { combineSignals, fetchWithTimeout } from '../src/fetch'
import { tryCatch } from '../src/function'

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

/** A refusal whose body is not JSON at all, which `mockFetch` cannot produce. */
function mockText(status: number, text: string): void {
  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL) => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'Error',
      url: String(url),
      text: async () => text,
    } as unknown as Response),
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch
}

describe('FetchError body', () => {
  async function refused(): Promise<FetchError> {
    try {
      await fetchJson('http://example.com/refused')
    }
    catch (e) {
      return e as FetchError
    }

    throw new Error('expected a refusal')
  }

  it('carries the refusal parsed, so a caller reads it rather than reparsing', async () => {
    mockFetch(422, { error: 'Nom déjà pris', problems: ['name'] }, false)

    const error = await refused()

    expect(error.data).toEqual({ error: 'Nom déjà pris', problems: ['name'] })
    expect(error.body).toBe('{"error":"Nom déjà pris","problems":["name"]}')
  })

  it('leaves data undefined when the body is not JSON', async () => {
    mockText(502, '<html>Bad Gateway</html>')

    const error = await refused()

    expect(error.data).toBeUndefined()
    expect(error.body).toBe('<html>Bad Gateway</html>')
  })

  it('leaves data undefined when there is no body', async () => {
    mockText(404, '')

    const error = await refused()

    expect(error.data).toBeUndefined()
    expect(error.body).toBeUndefined()
  })

  it('says what the api said rather than dumping its json', async () => {
    mockFetch(409, { error: 'Déjà lié' }, false)

    expect((await refused()).message).toBe('HTTP 409 Error - http://example.com/refused - Déjà lié')
  })

  it('reads message and detail as well as error', async () => {
    mockFetch(400, { message: 'from message' }, false)
    expect((await refused()).message).toEndWith('- from message')

    mockFetch(400, { detail: 'from detail' }, false)
    expect((await refused()).message).toEndWith('- from detail')
  })

  it('falls back to the raw body when the api states nothing', async () => {
    mockFetch(500, { code: 17 }, false)

    expect((await refused()).message).toEndWith('- {"code":17}')
  })

  it('hands the api its own word back, for a toast rather than a log line', async () => {
    mockFetch(409, { error: 'Déjà lié' }, false)

    expect((await refused()).said).toBe('Déjà lié')
  })

  it('says nothing where the refusal named nothing, rather than handing over a page of html', async () => {
    mockText(502, '<html>Bad Gateway</html>')
    expect((await refused()).said).toBeUndefined()

    mockFetch(500, { code: 17 }, false)
    expect((await refused()).said).toBeUndefined()
  })
})

describe('onResponse', () => {
  it('sees a refusal before the body is read', async () => {
    mockFetch(401, { error: 'expired' }, false)

    const seen: number[] = []

    await tryCatch(async () => fetchJson('http://example.com/gated', {
      onResponse: res => void seen.push(res.status),
    }))

    expect(seen).toEqual([401])
  })

  it('sees an answer that succeeded too', async () => {
    mockFetch(200, { id: 1 })

    const seen: number[] = []

    await fetchJson('http://example.com/ok', { onResponse: res => void seen.push(res.status) })

    expect(seen).toEqual([200])
  })

  it('carries through a fetcher, so one hook covers every call', async () => {
    mockFetch(401, {}, false)

    const seen: number[] = []
    const fetcher = createFetcher({
      baseUrl: 'http://api.example.com',
      onResponse: res => void seen.push(res.status),
    })

    await tryCatch(async () => fetcher('/users'))

    expect(seen).toEqual([401])
  })
})

describe('combineSignals', () => {
  it('gives back what it was handed when there is nothing to combine', () => {
    const controller = new AbortController()

    expect(combineSignals(undefined, undefined)).toBeUndefined()
    expect(combineSignals(controller.signal, undefined)).toBe(controller.signal)
  })

  it('aborts on whichever of the two fires first', () => {
    const controller = new AbortController()
    const combined = combineSignals(controller.signal, 10_000)

    controller.abort(new Error('caller went away'))

    expect(combined?.aborted).toBe(true)
  })
})

describe('fetchWithTimeout', () => {
  /** Answers nothing, so only an abort ever settles the call. */
  function mockHangingFetch(): { signal: () => AbortSignal | null | undefined } {
    let seen: AbortSignal | null | undefined

    globalThis.fetch = Object.assign(
      async (_url: RequestInfo | URL, init: RequestInit = {}) => {
        seen = init.signal

        return await new Promise<Response>((_, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    return { signal: () => seen }
  }

  it('aborts on its own deadline', async () => {
    mockHangingFetch()

    const [error] = await tryCatch(async () => fetchWithTimeout('/slow', { timeoutMs: 5 }))

    expect(error).toBeInstanceOf(Error)
  })

  it('still aborts on the caller signal', async () => {
    const mock = mockHangingFetch()
    const controller = new AbortController()
    const call = tryCatch(async () => fetchWithTimeout('/slow', { signal: controller.signal, timeoutMs: 10_000 }))

    controller.abort(new Error('caller went away'))

    const [error] = await call

    expect(error).toBeInstanceOf(Error)
    expect(mock.signal()?.aborted).toBe(true)
  })
})
