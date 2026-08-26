import { describe, expect, it } from 'bun:test'
import { FetchError } from '../src/browser/fetch'
import { sendGotify } from '../src/gotify'

interface MockCall {
  url: string
  init: RequestInit
}

function mockFetch(ok = true, status = 200): MockCall {
  const call: MockCall = { url: '', init: {} }

  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL, init: RequestInit = {}) => {
      call.url = String(url)
      call.init = init

      return {
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        url: String(url),
        text: async () => JSON.stringify({ id: 1 }),
        json: async () => ({ id: 1 }),
      } as unknown as Response
    },
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch

  return call
}

const ENDPOINT = 'http://gotify.test/message'

describe('sendGotify', () => {
  it('POSTs the message with the app token and a default priority', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body' })

    expect(call.url).toBe(ENDPOINT)
    expect(call.init.method).toBe('POST')
    expect(new Headers(call.init.headers).get('X-Gotify-Key')).toBe('secret')
    expect(JSON.parse(call.init.body as string)).toEqual({ title: 'Hi', message: 'Body', priority: 5 })
  })

  it('keeps an explicit priority', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body', priority: 8 })

    expect(JSON.parse(call.init.body as string).priority).toBe(8)
  })

  it('adds markdown and click extras when set', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: '**bold**', markdown: true, clickUrl: 'https://x.test' })

    expect(JSON.parse(call.init.body as string).extras).toEqual({
      'client::display': { contentType: 'text/markdown' },
      'client::notification': { click: { url: 'https://x.test' } },
    })
  })

  it('carries an image url in the notification extra, beside a click', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body', clickUrl: 'https://x.test', imageUrl: 'https://x.test/shot.jpg' })

    expect(JSON.parse(call.init.body as string).extras).toEqual({
      'client::notification': { click: { url: 'https://x.test' }, bigImageUrl: 'https://x.test/shot.jpg' },
    })
  })

  it('carries an image url with no click', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body', imageUrl: 'https://x.test/shot.jpg' })

    expect(JSON.parse(call.init.body as string).extras).toEqual({
      'client::notification': { bigImageUrl: 'https://x.test/shot.jpg' },
    })
  })

  it('omits extras when neither markdown nor clickUrl is set', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body' })

    expect(JSON.parse(call.init.body as string).extras).toBeUndefined()
  })

  it('merges caller headers', async () => {
    const call = mockFetch()

    await sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body' }, { headers: { 'X-Trace': 'abc' } })

    expect(new Headers(call.init.headers).get('X-Trace')).toBe('abc')
    expect(new Headers(call.init.headers).get('X-Gotify-Key')).toBe('secret')
  })

  it('throws FetchError on a non-2xx response', async () => {
    mockFetch(false, 500)

    await expect(sendGotify(ENDPOINT, 'secret', { title: 'Hi', message: 'Body' })).rejects.toBeInstanceOf(FetchError)
  })
})
