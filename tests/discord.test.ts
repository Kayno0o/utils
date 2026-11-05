import { Buffer } from 'node:buffer'
import { afterEach, describe, expect, test as it, spyOn } from 'bun:test'
import { FetchError } from '../src/browser/fetch'
import { getDiscordAvatarUrl, getDiscordBannerUrl, sendDiscordWebhook } from '../src/discord'

const URL = 'https://discord.test/api/webhooks/1/abc'

function mockFetch(response: () => Response) {
  return spyOn(globalThis, 'fetch').mockImplementation((async () => response()) as unknown as typeof fetch)
}

afterEach(() => {
  spyOn(globalThis, 'fetch').mockRestore()
})

describe('sendDiscordWebhook', () => {
  it('types each file by its contentType, png by default', async () => {
    const fetchSpy = mockFetch(() => new Response(null, { status: 204 }))

    await sendDiscordWebhook(URL, { content: 'hi' }, [
      { buffer: Buffer.from('a'), filename: 'a.png' },
      { buffer: Buffer.from('b'), filename: 'b.pdf', contentType: 'application/pdf' },
    ])

    const body = fetchSpy.mock.calls[0]![1]!.body as FormData

    expect((body.get('files[0]') as File).type).toBe('image/png')
    expect((body.get('files[1]') as File).type).toBe('application/pdf')
  })

  it('sends headers and a deadline signal from its options', async () => {
    const fetchSpy = mockFetch(() => new Response(null, { status: 204 }))

    await sendDiscordWebhook(URL, { content: 'hi' }, [], { headers: { 'X-Test': '1' }, timeout: 1000 })

    const init = fetchSpy.mock.calls[0]![1]!

    expect(new Headers(init.headers).get('X-Test')).toBe('1')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('applies a default deadline when no timeout is given', async () => {
    const fetchSpy = mockFetch(() => new Response(null, { status: 204 }))

    await sendDiscordWebhook(URL, { content: 'hi' })

    expect(fetchSpy.mock.calls[0]![1]!.signal).toBeInstanceOf(AbortSignal)
  })

  it('aborts a webhook that hangs past its timeout', async () => {
    spyOn(globalThis, 'fetch').mockImplementation(((_url: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal!.addEventListener('abort', () => reject(init.signal!.reason))
    })) as unknown as typeof fetch)

    await expect(sendDiscordWebhook(URL, { content: 'hi' }, [], { timeout: 10 })).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  it('resolves to the parsed body under ?wait=true', async () => {
    mockFetch(() => new Response('{"id":"1"}', { status: 200 }))

    expect(await sendDiscordWebhook(URL, { content: 'hi' })).toEqual({ id: '1' })
  })

  it('retries a 5xx response when asked to', async () => {
    let calls = 0
    const fetchSpy = mockFetch(() => ++calls === 1 ? new Response('down', { status: 503 }) : new Response(null, { status: 204 }))

    await sendDiscordWebhook(URL, { content: 'hi' }, [], { retry: { attempts: 2, delay: 0 } })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does not retry by default', async () => {
    const fetchSpy = mockFetch(() => new Response('down', { status: 503 }))

    await expect(sendDiscordWebhook(URL, { content: 'hi' })).rejects.toBeInstanceOf(FetchError)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('throws a FetchError on a non-2xx response', async () => {
    mockFetch(() => new Response('{"message":"Invalid Webhook Token"}', { status: 401, statusText: 'Unauthorized' }))

    const request = sendDiscordWebhook(URL, { content: 'hi' })

    await expect(request).rejects.toBeInstanceOf(FetchError)
    await expect(request).rejects.toMatchObject({ status: 401, said: 'Invalid Webhook Token' })
  })
})

describe('Discord CDN urls', () => {
  it('builds a png avatar url, a gif one for an animated hash', () => {
    expect(getDiscordAvatarUrl('1', 'abc')).toBe('https://cdn.discordapp.com/avatars/1/abc.png')
    expect(getDiscordAvatarUrl('1', 'a_abc')).toBe('https://cdn.discordapp.com/avatars/1/a_abc.gif')
  })

  it('builds a png banner url, a gif one for an animated hash', () => {
    expect(getDiscordBannerUrl('2', 'def')).toBe('https://cdn.discordapp.com/banners/2/def.png')
    expect(getDiscordBannerUrl('2', 'a_def')).toBe('https://cdn.discordapp.com/banners/2/a_def.gif')
  })
})
