import type { OllamaFetchOptions, OllamaInputMessage, OllamaInputOptions, OllamaMeta, OllamaOutputChatResponse } from './ollama'
import { mergeHeaders, readNdjson, toFetchError } from './browser/fetch'
import { combineSignals } from './fetch'
import { buildOllamaMeta, streamOllama } from './ollama'

/** Incremental text emitted while generating. */
export interface OllamaStreamDelta {
  content?: string
  thinking?: string
}

/**
 * One NDJSON line of the stream protocol: `delta` frames while generating, then a
 * single terminal `done` or `error`.
 */
export type OllamaStreamFrame<T = Record<string, unknown>>
  = | { delta: OllamaStreamDelta }
    | { done: T & { __meta: OllamaMeta } }
    | { error: string }

export interface StreamOllamaJsonOptions {
  model: string
  messages: OllamaInputMessage[]
  think: boolean
  options: OllamaInputOptions
  /** Ollama structured-output format; omit for free-form text (e.g. OCR). */
  format?: 'json' | Record<string, unknown>
  /** Raw user content, stored as `rawInput` in the response metadata. */
  rawInput: string
  signal?: AbortSignal
  /** Transport options for the Ollama call itself, e.g. `token` for an Ollama behind auth; `signal` stays top-level. A `timeout` bounds the whole generation, not only the first byte. */
  fetchOptions?: Omit<OllamaFetchOptions, 'signal'>
  /** Turns the accumulated raw content into the final data object (parse/transform/fallback). */
  finalize: (rawContent: string) => Record<string, unknown>
}

const encoder = new TextEncoder()

/**
 * Streams an Ollama generation to a client as NDJSON, one `OllamaStreamFrame` per line.
 * Finalizing here keeps the terminal `done` payload identical to what a non-streaming
 * route would return. Pair with `readOllamaJsonStream` on the client.
 */
export function streamOllamaJson(url: string, opts: StreamOllamaJsonOptions): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (frame: OllamaStreamFrame) => controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`))

      try {
        let content = ''
        let thinking = ''
        let last: OllamaOutputChatResponse | undefined

        const chunks = streamOllama(url, {
          model: opts.model,
          messages: opts.messages,
          think: opts.think,
          ...(opts.format ? { format: opts.format } : {}),
          options: opts.options,
        }, { ...opts.fetchOptions, signal: opts.signal })

        for await (const chunk of chunks) {
          const c = chunk.message.content ?? ''
          const t = chunk.message.thinking ?? ''

          content += c
          thinking += t

          if (chunk.done)
            last = chunk

          if (c || t)
            write({ delta: { ...(c ? { content: c } : {}), ...(t ? { thinking: t } : {}) } })
        }

        const data = opts.finalize(content)
        const meta = buildOllamaMeta({
          ...last,
          model: last?.model ?? opts.model,
          message: { role: 'assistant', content, thinking },
        } as OllamaOutputChatResponse, opts.rawInput)

        write({ done: { ...data, __meta: meta } })
        controller.close()
      }
      catch (err: any) {
        // AbortError = client disconnected mid-stream; nothing to report.
        if (err?.name !== 'AbortError')
          write({ error: err?.message ?? 'Generation failed' })

        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}

export interface ReadOllamaJsonStreamOptions extends Pick<OllamaFetchOptions, 'signal' | 'headers' | 'token' | 'timeout' | 'fetch'> {
  /** Fires for each `delta` frame while generating. */
  onDelta?: (delta: OllamaStreamDelta) => void
}

/**
 * POSTs `body` to a `streamOllamaJson` route and consumes its NDJSON, resolving to the
 * terminal `done` payload. Rejects if the stream carries an `error` frame or ends early or a line is not JSON.
 */
export async function readOllamaJsonStream<T>(
  url: string | URL,
  body: BodyInit,
  opts: ReadOllamaJsonStreamOptions = {},
): Promise<T & { __meta?: OllamaMeta }> {
  const res = await (opts.fetch ?? fetch)(url, {
    method: 'POST',
    headers: mergeHeaders(
      { Authorization: opts.token ? `Bearer ${opts.token}` : undefined },
      opts.headers,
    ),
    body,
    signal: combineSignals(opts.signal, opts.timeout),
  })

  if (!res.ok)
    throw await toFetchError(res, String(url))

  if (!res.body)
    throw new Error(`No body from ${url}`)

  let done: (T & { __meta?: OllamaMeta }) | undefined

  for await (const frame of readNdjson<OllamaStreamFrame<T>>(res.body)) {
    if ('delta' in frame)
      opts.onDelta?.(frame.delta)
    else if ('done' in frame)
      done = frame.done
    else if ('error' in frame)
      throw new Error(frame.error)
  }

  if (!done)
    throw new Error('Stream ended without a result')

  return done
}
