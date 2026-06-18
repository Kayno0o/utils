import { describe, expect, it } from 'bun:test'
import { createFetcher, FetchError, fetchJson } from '../src/browser/fetch'

function mockFetch(status: number, body: unknown, ok?: boolean): void {
  globalThis.fetch = Object.assign(
    async () => ({
      ok: ok ?? (status >= 200 && status < 300),
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => body,
      url: 'http://test',
    }) as unknown as Response,
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch
}

describe('fetchJson', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch(200, { id: 1 })
    const data = await fetchJson<{ id: number }>('http://example.com/api')

    expect(data).toEqual({ id: 1 })
  })

  it('throws FetchError on non-2xx', async () => {
    mockFetch(404, null, false)
    await expect(fetchJson('http://example.com/missing')).rejects.toBeInstanceOf(FetchError)
  })

  it('FetchError carries status code', async () => {
    mockFetch(500, null, false)

    try {
      await fetchJson('http://example.com/error')
    }
    catch (e) {
      expect(e).toBeInstanceOf(FetchError)
      expect((e as FetchError).status).toBe(500)
    }
  })
})

describe('createFetcher', () => {
  it('prepends baseUrl', async () => {
    let capturedUrl = ''

    globalThis.fetch = Object.assign(
      async (url: RequestInfo | URL) => {
        capturedUrl = String(url)

        return { ok: true, status: 200, json: async () => ({}) } as unknown as Response
      },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    const fetcher = createFetcher('http://api.example.com')

    await fetcher('/users')
    expect(capturedUrl).toBe('http://api.example.com/users')
  })
})
