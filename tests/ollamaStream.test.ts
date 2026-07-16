import { describe, expect, it } from 'bun:test'
import { readOllamaJsonStream, streamOllamaJson } from '../src/ollamaStream'

const OLLAMA = 'http://ollama.test/api/chat'
const ROUTE = 'http://app.test/api/ai/tool'

function ndjsonResponse(lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines)
        controller.enqueue(new TextEncoder().encode(line))

      controller.close()
    },
  })

  return { ok: true, status: 200, statusText: 'OK', body } as unknown as Response
}

function chunk(content: string, thinking = '') {
  return `${JSON.stringify({ model: 'llama3', message: { role: 'assistant', content, thinking }, done: false })}\n`
}

function finalChunk() {
  return `${JSON.stringify({
    model: 'llama3',
    message: { role: 'assistant', content: '' },
    done: true,
    total_duration: 2e9,
    load_duration: 1e8,
    prompt_eval_duration: 5e8,
    eval_duration: 1e9,
    prompt_eval_count: 12,
    eval_count: 50,
  })}\n`
}

/** Serves the Ollama endpoint from `chunks`; any other URL is handled by `route`. */
function mockFetch(chunks: string[], route?: (url: string, init: RequestInit) => Response) {
  const calls: { url: string, init: RequestInit }[] = []

  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL, init: RequestInit = {}) => {
      calls.push({ url: String(url), init })

      if (String(url) === OLLAMA)
        return ndjsonResponse(chunks)

      if (route)
        return route(String(url), init)

      throw new Error(`Unexpected fetch: ${url}`)
    },
    // eslint-disable-next-line ts/no-empty-function
    { preconnect: () => {} },
  ) as unknown as typeof fetch

  return calls
}

async function readLines(res: Response): Promise<any[]> {
  const text = await new Response(res.body).text()

  return text.trim().split('\n').map(l => JSON.parse(l))
}

function baseOpts() {
  return {
    url: OLLAMA,
    model: 'llama3',
    messages: [{ role: 'user' as const, content: 'hi' }],
    think: false,
    options: { num_ctx: 4096 },
    rawInput: 'hi',
    finalize: (raw: string) => ({ text: raw }),
  }
}

describe('streamOllamaJson', () => {
  it('emits a delta per chunk then a finalized done frame', async () => {
    mockFetch([chunk('Hel'), chunk('lo'), finalChunk()])

    const frames = await readLines(streamOllamaJson(baseOpts()))

    expect(frames.slice(0, 2)).toEqual([
      { delta: { content: 'Hel' } },
      { delta: { content: 'lo' } },
    ])
    expect(frames[2].done.text).toBe('Hello')
  })

  it('sets NDJSON headers', () => {
    mockFetch([finalChunk()])

    const res = streamOllamaJson(baseOpts())

    expect(res.headers.get('Content-Type')).toBe('application/x-ndjson')
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('builds meta from the final chunk over the accumulated content', async () => {
    mockFetch([chunk('Hel'), chunk('lo'), finalChunk()])

    const frames = await readLines(streamOllamaJson(baseOpts()))
    const { __meta } = frames[2].done

    expect(__meta.model).toBe('llama3')
    expect(__meta.rawOutput).toBe('Hello')
    expect(__meta.rawInput).toBe('hi')
    expect(__meta.totalMs).toBe(2000)
    expect(__meta.outputTokens).toBe(50)
    expect(__meta.tokensPerSec).toBe(50)
  })

  it('accumulates thinking separately from content', async () => {
    mockFetch([chunk('', 'hmm'), chunk('yes'), finalChunk()])

    const frames = await readLines(streamOllamaJson(baseOpts()))

    expect(frames[0]).toEqual({ delta: { thinking: 'hmm' } })
    expect(frames[2].done.text).toBe('yes')
    expect(frames[2].done.__meta.thinking).toBe('hmm')
  })

  it('skips chunks that carry neither content nor thinking', async () => {
    mockFetch([chunk(''), chunk('x'), finalChunk()])

    const frames = await readLines(streamOllamaJson(baseOpts()))

    expect(frames.filter(f => f.delta)).toHaveLength(1)
  })

  it('passes format through and omits it when unset', async () => {
    const withFormat = mockFetch([finalChunk()])

    await readLines(streamOllamaJson({ ...baseOpts(), format: 'json' }))
    expect(JSON.parse(withFormat[0]!.init.body as string).format).toBe('json')

    const without = mockFetch([finalChunk()])

    await readLines(streamOllamaJson(baseOpts()))
    expect(JSON.parse(without[0]!.init.body as string)).not.toHaveProperty('format')
  })

  it('emits an error frame when the generation throws', async () => {
    globalThis.fetch = Object.assign(
      async () => { throw new Error('ollama down') },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    const frames = await readLines(streamOllamaJson(baseOpts()))

    expect(frames).toEqual([{ error: 'ollama down' }])
  })

  it('stays silent when the client aborts mid-stream', async () => {
    globalThis.fetch = Object.assign(
      async () => {
        const err = new Error('aborted')

        err.name = 'AbortError'

        throw err
      },
      // eslint-disable-next-line ts/no-empty-function
      { preconnect: () => {} },
    ) as unknown as typeof fetch

    const text = await new Response(streamOllamaJson(baseOpts()).body).text()

    expect(text).toBe('')
  })
})

describe('readOllamaJsonStream', () => {
  it('reports deltas and resolves the done payload', async () => {
    mockFetch([], () => ndjsonResponse([
      `${JSON.stringify({ delta: { content: 'a' } })}\n`,
      `${JSON.stringify({ delta: { content: 'b' } })}\n`,
      `${JSON.stringify({ done: { text: 'ab', __meta: { model: 'llama3' } } })}\n`,
    ]))

    const deltas: any[] = []
    const done = await readOllamaJsonStream<{ text: string }>(ROUTE, new FormData(), {
      onDelta: d => deltas.push(d),
    })

    expect(deltas).toEqual([{ content: 'a' }, { content: 'b' }])
    expect(done.text).toBe('ab')
    expect(done.__meta?.model).toBe('llama3')
  })

  it('reassembles frames split across reads', async () => {
    mockFetch([], () => ndjsonResponse(['{"delta":{"con', 'tent":"a"}}\n{"done":{"text":"a"}}\n']))

    const deltas: any[] = []
    const done = await readOllamaJsonStream<{ text: string }>(ROUTE, new FormData(), {
      onDelta: d => deltas.push(d),
    })

    expect(deltas).toEqual([{ content: 'a' }])
    expect(done.text).toBe('a')
  })

  it('sends a bearer token when given, and none otherwise', async () => {
    const withToken = mockFetch([], () => ndjsonResponse([`${JSON.stringify({ done: {} })}\n`]))

    await readOllamaJsonStream(ROUTE, new FormData(), { token: 'abc' })
    expect(new Headers(withToken[0]!.init.headers).get('Authorization')).toBe('Bearer abc')

    const without = mockFetch([], () => ndjsonResponse([`${JSON.stringify({ done: {} })}\n`]))

    await readOllamaJsonStream(ROUTE, new FormData())
    expect(new Headers(without[0]!.init.headers).has('Authorization')).toBe(false)
  })

  it('throws on an error frame', async () => {
    mockFetch([], () => ndjsonResponse([`${JSON.stringify({ error: 'boom' })}\n`]))

    await expect(readOllamaJsonStream(ROUTE, new FormData())).rejects.toThrow('boom')
  })

  it('throws when the stream ends without a done frame', async () => {
    mockFetch([], () => ndjsonResponse([`${JSON.stringify({ delta: { content: 'a' } })}\n`]))

    await expect(readOllamaJsonStream(ROUTE, new FormData())).rejects.toThrow('Stream ended without a result')
  })

  it('throws on a non-2xx response', async () => {
    mockFetch([], () => ({ ok: false, status: 500, body: null }) as unknown as Response)

    await expect(readOllamaJsonStream(ROUTE, new FormData())).rejects.toThrow('HTTP 500')
  })

  it('ignores unparsable lines', async () => {
    mockFetch([], () => ndjsonResponse([`not json\n${JSON.stringify({ done: { text: 'a' } })}\n`]))

    const done = await readOllamaJsonStream<{ text: string }>(ROUTE, new FormData())

    expect(done.text).toBe('a')
  })

  it('round-trips a real streamOllamaJson response', async () => {
    mockFetch(
      [chunk('Hel'), chunk('lo'), finalChunk()],
      () => streamOllamaJson(baseOpts()),
    )

    const deltas: any[] = []
    const done = await readOllamaJsonStream<{ text: string }>(ROUTE, new FormData(), {
      onDelta: d => deltas.push(d),
    })

    expect(deltas).toEqual([{ content: 'Hel' }, { content: 'lo' }])
    expect(done.text).toBe('Hello')
    expect(done.__meta?.rawOutput).toBe('Hello')
  })
})
