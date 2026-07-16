import { describe, expect, it } from 'bun:test'
import { promptOllama } from '../src/ollama'

interface MockCall {
  url: string
  init: RequestInit
}

function mockFetch(body: unknown, ok = true, status = 200): MockCall {
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
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
      } as unknown as Response
    },
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch

  return call
}

const URL = 'http://ollama.test/api/chat'

describe('promptOllama', () => {
  it('wraps a string message into a user message', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: 'hi' } })
    const res = await promptOllama(URL, 'hello', { model: 'llama3' })

    expect(res).not.toBeInstanceOf(Error)
    expect(call.url).toBe(URL)
    expect(JSON.parse(call.init.body as string)).toEqual({
      model: 'llama3',
      messages: [{ role: 'user', content: 'hello' }],
    })
  })

  it('forwards a full request object', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: 'ok' } })

    await promptOllama(URL, { model: 'llama3', messages: [{ role: 'system', content: 's' }] })

    expect(JSON.parse(call.init.body as string)).toEqual({
      model: 'llama3',
      messages: [{ role: 'system', content: 's' }],
    })
  })

  it('returns an Error on a non-2xx response', async () => {
    mockFetch('model not found', false, 404)
    const res = await promptOllama(URL, 'hi', { model: 'nope' })

    expect(res).toBeInstanceOf(Error)
    expect((res as Error).message).toContain('404')
  })

  it('returns an Error when fetch throws', async () => {
    globalThis.fetch = Object.assign(
      async () => {
        throw new Error('network down')
      },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    const res = await promptOllama(URL, 'hi', { model: 'llama3' })

    expect(res).toBeInstanceOf(Error)
    expect((res as Error).message).toBe('network down')
  })
})
