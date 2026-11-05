import { Buffer } from 'node:buffer'
import { afterEach, describe, expect, test as it, spyOn } from 'bun:test'
import { FetchError } from '../src/browser/fetch'
import { sendDiscordWebhook } from '../src/discord'

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

  it('throws a FetchError on a non-2xx response', async () => {
    mockFetch(() => new Response('{"message":"Invalid Webhook Token"}', { status: 401, statusText: 'Unauthorized' }))

    const request = sendDiscordWebhook(URL, { content: 'hi' })

    await expect(request).rejects.toBeInstanceOf(FetchError)
    await expect(request).rejects.toMatchObject({ status: 401, said: 'Invalid Webhook Token' })
  })
})
