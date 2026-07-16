import type { OllamaOutputChatResponse, OllamaSettings } from '../src/ollama'
import { describe, expect, it } from 'bun:test'
import { FetchError } from '../src/browser/fetch'
import { buildOllamaMeta, getOllamaUsage, promptOllama, promptOllamaJson, promptOllamaSafe, resolveOllamaSettings, streamOllama } from '../src/ollama'

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

function mockStream(chunks: string[]): MockCall {
  const call: MockCall = { url: '', init: {} }

  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL, init: RequestInit = {}) => {
      call.url = String(url)
      call.init = init

      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks)
            controller.enqueue(new TextEncoder().encode(chunk))

          controller.close()
        },
      })

      return { ok: true, status: 200, statusText: 'OK', url: String(url), body } as unknown as Response
    },
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch

  return call
}

const ENDPOINT = 'http://ollama.test/api/chat'

describe('promptOllama', () => {
  it('wraps a string message into a user message', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: 'hi' } })
    const res = await promptOllama(ENDPOINT, 'hello', { model: 'llama3' })

    expect(res.message.content).toBe('hi')
    expect(call.url).toBe(ENDPOINT)
    expect(JSON.parse(call.init.body as string)).toEqual({
      model: 'llama3',
      messages: [{ role: 'user', content: 'hello' }],
      stream: false,
    })
  })

  it('forwards a full request object', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: 'ok' } })

    await promptOllama(ENDPOINT, { model: 'llama3', messages: [{ role: 'system', content: 's' }] })

    expect(JSON.parse(call.init.body as string)).toEqual({
      model: 'llama3',
      messages: [{ role: 'system', content: 's' }],
      stream: false,
    })
  })

  it('throws FetchError on a non-2xx response', async () => {
    mockFetch('model not found', false, 404)

    const promise = promptOllama(ENDPOINT, 'hi', { model: 'nope' })

    await expect(promise).rejects.toBeInstanceOf(FetchError)
    await expect(promise).rejects.toMatchObject({ status: 404 })
  })

  it('rethrows when fetch throws', async () => {
    globalThis.fetch = Object.assign(
      async () => {
        throw new Error('network down')
      },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    await expect(promptOllama(ENDPOINT, 'hi', { model: 'llama3' })).rejects.toThrow('network down')
  })

  it('forwards transport options to fetch', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: 'hi' } })

    await promptOllama(ENDPOINT, 'hi', { model: 'llama3' }, { token: 'secret' })

    expect(new Headers(call.init.headers).get('Authorization')).toBe('Bearer secret')
  })

  it('exposes tool calls on the assistant message', async () => {
    const toolCall = { function: { name: 'getWeather', arguments: { city: 'Paris' } } }

    mockFetch({ message: { role: 'assistant', content: '', tool_calls: [toolCall] } })

    const res = await promptOllama(ENDPOINT, 'weather?', { model: 'llama3' })

    expect(res.message.tool_calls).toEqual([toolCall])
  })
})

describe('promptOllamaSafe', () => {
  it('returns the response on success', async () => {
    mockFetch({ message: { role: 'assistant', content: 'hi' } })
    const res = await promptOllamaSafe(ENDPOINT, 'hello', { model: 'llama3' })

    expect(res).not.toBeInstanceOf(Error)
  })

  it('returns an Error on a non-2xx response', async () => {
    mockFetch('model not found', false, 404)
    const res = await promptOllamaSafe(ENDPOINT, 'hi', { model: 'nope' })

    expect(res).toBeInstanceOf(Error)
    expect((res as Error).message).toContain('404')
  })
})

describe('promptOllamaJson', () => {
  it('defaults format to json and parses the content', async () => {
    const call = mockFetch({ message: { role: 'assistant', content: '{"ok":true}' } })
    const res = await promptOllamaJson<{ ok: boolean }>(ENDPOINT, 'hi', { model: 'llama3' })

    expect(res).toEqual({ ok: true })
    expect(JSON.parse(call.init.body as string).format).toBe('json')
  })

  it('keeps a caller-supplied schema', async () => {
    const schema = { type: 'object', properties: {} }
    const call = mockFetch({ message: { role: 'assistant', content: '{}' } })

    await promptOllamaJson(ENDPOINT, { model: 'llama3', messages: [], format: schema })

    expect(JSON.parse(call.init.body as string).format).toEqual(schema)
  })

  it('throws on invalid JSON content', async () => {
    mockFetch({ message: { role: 'assistant', content: 'not json' } })

    await expect(promptOllamaJson(ENDPOINT, 'hi', { model: 'llama3' })).rejects.toThrow('invalid JSON')
  })
})

describe('streamOllama', () => {
  it('yields each NDJSON chunk, tolerating split lines', async () => {
    const call = mockStream([
      '{"done":false,"message":{"role":"assistant","content":"he',
      'llo"}}\n{"done":false,"message":{"role":"assistant","content":" world"}}\n',
      '{"done":true,"message":{"role":"assistant","content":""}}',
    ])

    const chunks = []

    for await (const chunk of streamOllama(ENDPOINT, { model: 'llama3', messages: [] }))
      chunks.push(chunk)

    expect(chunks.map(c => c.message.content)).toEqual(['hello', ' world', ''])
    expect(chunks.at(-1)?.done).toBe(true)
    expect(JSON.parse(call.init.body as string).stream).toBe(true)
  })

  it('throws FetchError on a non-2xx response', async () => {
    mockFetch('boom', false, 500)

    const iterate = async () => {
      for await (const _ of streamOllama(ENDPOINT, { model: 'llama3', messages: [] }))
        void _
    }

    await expect(iterate()).rejects.toBeInstanceOf(FetchError)
  })
})

describe('getOllamaUsage', () => {
  it('maps count fields onto token usage', () => {
    const res = { prompt_eval_count: 12, eval_count: 34 } as Parameters<typeof getOllamaUsage>[0]

    expect(getOllamaUsage(res)).toEqual({ input_tokens: 12, output_tokens: 34 })
  })
})

describe('resolveOllamaSettings', () => {
  const base: OllamaSettings = { model: 'llama3', num_ctx: 4096, temperature: 0.4, think: false }

  it('falls back to the base settings', () => {
    expect(resolveOllamaSettings(base)).toEqual({
      model: 'llama3',
      think: false,
      options: { num_ctx: 4096, temperature: 0.4 },
    })
  })

  it('applies overrides over the base', () => {
    expect(resolveOllamaSettings(base, { model: 'gemma', num_ctx: 8192, temperature: 0.9, think: true })).toEqual({
      model: 'gemma',
      think: true,
      options: { num_ctx: 8192, temperature: 0.9 },
    })
  })

  it('keeps a zero temperature override', () => {
    expect(resolveOllamaSettings(base, { temperature: 0 }).options.temperature).toBe(0)
  })

  it('ignores an empty model override', () => {
    expect(resolveOllamaSettings(base, { model: '' }).model).toBe('llama3')
  })

  it('omits num_predict unless a non-zero value resolves', () => {
    expect(resolveOllamaSettings(base).options).not.toHaveProperty('num_predict')
    expect(resolveOllamaSettings(base, { num_predict: 0 }).options).not.toHaveProperty('num_predict')
    expect(resolveOllamaSettings({ ...base, num_predict: 256 }).options.num_predict).toBe(256)
    expect(resolveOllamaSettings({ ...base, num_predict: 256 }, { num_predict: 512 }).options.num_predict).toBe(512)
  })
})

describe('buildOllamaMeta', () => {
  const res = {
    model: 'llama3',
    message: { role: 'assistant', content: 'out', thinking: 'hmm' },
    total_duration: 2e9,
    load_duration: 1e8,
    prompt_eval_duration: 5e8,
    eval_duration: 1e9,
    prompt_eval_count: 12,
    eval_count: 50,
  } as OllamaOutputChatResponse

  it('converts nanosecond durations to milliseconds', () => {
    const meta = buildOllamaMeta(res, 'in')

    expect(meta).toMatchObject({ totalMs: 2000, loadMs: 100, promptEvalMs: 500, evalMs: 1000 })
  })

  it('carries model, token counts and raw text', () => {
    const meta = buildOllamaMeta(res, 'in')

    expect(meta).toMatchObject({
      model: 'llama3',
      promptTokens: 12,
      outputTokens: 50,
      rawInput: 'in',
      rawOutput: 'out',
      thinking: 'hmm',
    })
  })

  it('derives tokens per second from the eval duration', () => {
    expect(buildOllamaMeta(res, 'in').tokensPerSec).toBe(50)
  })

  it('reports zero tokens per second when nothing was evaluated', () => {
    expect(buildOllamaMeta({ ...res, eval_duration: 0 }, 'in').tokensPerSec).toBe(0)
  })

  it('defaults missing durations and counts to zero', () => {
    const meta = buildOllamaMeta({ model: 'llama3', message: { role: 'assistant', content: '' } } as OllamaOutputChatResponse, '')

    expect(meta).toMatchObject({ totalMs: 0, loadMs: 0, promptTokens: 0, outputTokens: 0, tokensPerSec: 0 })
  })
})
