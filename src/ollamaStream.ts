import type { OllamaFetchOptions, OllamaInputMessage, OllamaInputOptions, OllamaMeta, OllamaOutputChatResponse } from './ollama'
import { mergeHeaders } from './browser/fetch'
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
  /** Ollama `/api/chat` endpoint. */
  url: string
  model: string
  messages: OllamaInputMessage[]
  think: boolean
  options: OllamaInputOptions
  /** Ollama structured-output format; omit for free-form text (e.g. OCR). */
  format?: 'json' | Record<string, unknown>
  /** Raw user content, stored as `rawInput` in the response metadata. */
  rawInput: string
  signal?: AbortSignal
  /** Turns the accumulated raw content into the final data object (parse/transform/fallback). */
  finalize: (rawContent: string) => Record<string, unknown>
}

const encoder = new TextEncoder()

/**
 * Streams an Ollama generation to a client as NDJSON, one `OllamaStreamFrame` per line.
 * Finalizing here keeps the terminal `done` payload identical to what a non-streaming
 * route would return. Pair with `readOllamaJsonStream` on the client.
 */
export function streamOllamaJson(opts: StreamOllamaJsonOptions): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (frame: OllamaStreamFrame) => controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`))

      try {
        let content = ''
        let thinking = ''
        let last: OllamaOutputChatResponse | undefined

        const chunks = streamOllama(opts.url, {
          model: opts.model,
          messages: opts.messages,
          think: opts.think,
          ...(opts.format ? { format: opts.format } : {}),
          options: opts.options,
        }, { signal: opts.signal })

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
          ...(last ?? {}),
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

export interface ReadOllamaJsonStreamOptions extends Pick<OllamaFetchOptions, 'signal' | 'headers' | 'token'> {
  /** Fires for each `delta` frame while generating. */
  onDelta?: (delta: OllamaStreamDelta) => void
}

/**
 * POSTs `body` to a `streamOllamaJson` route and consumes its NDJSON, resolving to the
 * terminal `done` payload. Rejects if the stream carries an `error` frame or ends early.
 */
export async function readOllamaJsonStream<T>(
  url: string | URL,
  body: BodyInit,
  opts: ReadOllamaJsonStreamOptions = {},
): Promise<T & { __meta?: OllamaMeta }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: mergeHeaders(
      { Authorization: opts.token ? `Bearer ${opts.token}` : undefined },
      opts.headers,
    ),
    body,
    signal: opts.signal,
  })

  if (!res.ok || !res.body)
    throw new Error(`HTTP ${res.status}`)

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let done: (T & { __meta?: OllamaMeta }) | undefined

  try {
    while (true) {
      const { done: streamDone, value } = await reader.read()

      if (streamDone)
        break

      buffer += value

      const lines = buffer.split('\n')

      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim())
          continue

        let frame: OllamaStreamFrame<T>

        try {
          frame = JSON.parse(line)
        }
        catch {
          continue
        }

        if ('delta' in frame)
          opts.onDelta?.(frame.delta)
        else if ('done' in frame)
          done = frame.done
        else if ('error' in frame)
          throw new Error(frame.error)
      }
    }
  }
  finally {
    // Releases the connection when we throw or break out before the stream ends.
    try {
      await reader.cancel()
    }
    catch {}
  }

  if (!done)
    throw new Error('Stream ended without a result')

  return done
}
