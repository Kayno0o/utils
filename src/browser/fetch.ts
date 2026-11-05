import type { RetryOptions } from '../promise'
import { combineSignals } from '../fetch'
import { isPlainObject } from '../object'
import { retry as retryCall } from '../promise'

type HeaderValue = string | undefined
export type HeadersInput = [string, HeaderValue][] | Record<string, HeaderValue> | Headers

export type QueryValue = string | number | boolean | undefined
export type QueryInput = Record<string, QueryValue | QueryValue[]>

/** Merges header-shaped sources into a new `Headers`, skipping undefined values. Later sources win. */
export function mergeHeaders(...sources: (HeadersInput | undefined)[]): Headers {
  const target = new Headers()

  for (const source of sources) {
    if (!source)
      continue

    let entries: Iterable<[string, HeaderValue]>

    if (source instanceof Headers)
      entries = [...source]
    else
      entries = Array.isArray(source) ? source : Object.entries(source)

    for (const [key, value] of entries) {
      if (value !== undefined)
        target.set(key, value)
    }
  }

  return target
}

function isJsonBody(body: unknown): boolean {
  return isPlainObject(body) || Array.isArray(body)
}

function isBodyInit(body: unknown): body is BodyInit {
  return typeof body === 'string'
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body)
    || body instanceof FormData
    || body instanceof URLSearchParams
    || body instanceof ReadableStream
    || (typeof Blob !== 'undefined' && body instanceof Blob)
}

/** Placeholder origin used to parse relative URLs, stripped back off afterwards. */
const RELATIVE_BASE = 'http://relative.invalid'

function parseUrl(url: string): { parsed: URL, relative: boolean } {
  try {
    return { parsed: new URL(url), relative: false }
  }
  catch {
    return { parsed: new URL(url, RELATIVE_BASE), relative: true }
  }
}

/** Appends `query` to `url`, keeping a relative URL relative - `fetch` accepts those, `URL` does not. */
function applyQuery(url: string, query: QueryInput | undefined): string {
  if (!query)
    return url

  const { parsed, relative } = parseUrl(url)

  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined)
        parsed.searchParams.append(key, String(item))
    }
  }

  if (!relative)
    return parsed.href

  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`

  return parsed.origin === RELATIVE_BASE ? path : `//${parsed.host}${path}`
}

/** A refusal's body as JSON, where an api puts a 422's problems or a 409's roster. */
function parsedBody(body: string): unknown {
  if (!body)
    return undefined

  try {
    return JSON.parse(body)
  }
  catch {
    return undefined
  }
}

/** The api's own word for what went wrong, under whichever of the usual keys it wrote it. */
function statedBy(data: unknown): string | undefined {
  if (!isPlainObject(data))
    return undefined

  for (const key of ['error', 'message', 'detail'] as const) {
    if (typeof data[key] === 'string' && data[key])
      return data[key]
  }

  return undefined
}

export class FetchError extends Error {
  /**
   * The api's own word for the refusal, off the body's `error`, `message` or `detail`, and
   * undefined where it wrote none. What a toast shows, where `message` is the `HTTP 422 - url`
   * line a log wants. A body that is not JSON says nothing here rather than handing a page of
   * HTML to whatever renders it.
   */
  readonly said: string | undefined

  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    public readonly body?: string,
    /**
     * The body parsed as JSON, when it is one. A caller wanting to read a refusal rather than
     * only report it - a 422's problems, a 409's roster - narrows this instead of reparsing
     * `body` or forking the fetcher to keep it.
     */
    public readonly data?: unknown,
  ) {
    const said = statedBy(data)
    const context = said ?? body

    super(`HTTP ${status} ${statusText} - ${url}${context ? ` - ${context}` : ''}`)
    this.name = 'FetchError'
    this.said = said
  }
}

/** Builds a `FetchError` from a non-ok response, best-effort reading its body for context. */
export async function toFetchError(res: Response, fallbackUrl: string): Promise<FetchError> {
  let body: string

  try {
    body = await res.text()
  }
  catch {
    body = ''
  }

  return new FetchError(res.status, res.statusText, res.url || fallbackUrl, body || undefined, parsedBody(body))
}

/** Thrown when a 2xx response body is not valid JSON. */
export class FetchParseError extends Error {
  constructor(
    public readonly url: string,
    public readonly body: string,
    cause?: unknown,
  ) {
    super(`Invalid JSON response from ${url} - ${body.slice(0, 200)}`, { cause })
    this.name = 'FetchParseError'
  }
}

export interface FetchJsonOptions extends Omit<RequestInit, 'body' | 'headers'> {
  /** Overrides the URL base. */
  baseUrl?: string | undefined
  /** Adds `Authorization: Bearer <token>` header. */
  token?: string | undefined
  /** Query params appended to the URL; undefined values are skipped, arrays repeat the key. */
  query?: QueryInput | undefined
  /** Plain objects/arrays are JSON-encoded (with a JSON content type); `BodyInit` values pass through. */
  body?: BodyInit | Record<string, unknown> | unknown[] | null | undefined
  /** Header-shaped input merged over the defaults; undefined values are skipped. */
  headers?: HeadersInput | undefined
  /** Aborts the request after this many milliseconds, combined with any caller `signal`. */
  timeout?: number | undefined
  /**
   * Every response, ok or not, before it is read. Where a session that has expired under the
   * page is noticed once rather than at each call site - the body is still untouched here.
   */
  onResponse?: ((res: Response) => void) | undefined
  /** Gets the error `fetchJson` is about to throw, after any retries. */
  onError?: ((error: unknown) => void) | undefined
  /** The `fetch` to call, for tests, SSR or a runtime-specific client. Defaults to the global `fetch`. */
  fetch?: typeof fetch | undefined
  /** Reads a non-empty response body. Defaults to `JSON.parse`. */
  parse?: ((text: string) => unknown) | undefined
  /** Writes a plain object or array body. Defaults to `JSON.stringify`. */
  serialize?: ((body: Record<string, unknown> | unknown[]) => string) | undefined
  /** Retries a failed request, a count or `retry`'s options; by default network errors, timeouts, 408, 429 and 5xx, whatever the method, so mind a POST that is not idempotent, and a stream body cannot be sent twice. Off by default. */
  retry?: number | Omit<RetryOptions, 'signal'> | undefined
}

/** Network failures, per-attempt timeouts and statuses a later try may get past. */
function isRetryable(error: unknown): boolean {
  if (error instanceof FetchError)
    return error.status === 408 || error.status === 429 || error.status >= 500

  return error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError')
}

/** Fetches JSON from `url`, throwing `FetchError` on non-2xx responses. An empty body resolves to `null`. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { retry, onError, ...request } = options
  const { signal } = request

  try {
    const prepared = prepareJsonRequest(url, request)

    if (!retry)
      return await sendJsonRequest<T>(prepared)

    const { attempts = 3, shouldRetry = isRetryable, ...retryOptions } = typeof retry === 'number' ? { attempts: retry } : retry

    // The last try is refused a retry so its own error is thrown, not retry's summary.
    return await retryCall(() => sendJsonRequest<T>(prepared), {
      ...retryOptions,
      attempts,
      signal: signal ?? undefined,
      shouldRetry: (error, attempt) => attempt < attempts && !signal?.aborted && shouldRetry(error, attempt),
    })
  }
  catch (error) {
    onError?.(error)

    throw error
  }
}

interface PreparedJsonRequest {
  fullUrl: string
  init: RequestInit
  fetcher: typeof fetch
  parse: (text: string) => unknown
  onResponse?: ((response: Response) => void) | undefined
  timeout?: number | undefined
  signal?: AbortSignal | null | undefined
}

function serializeBody(body: FetchJsonOptions['body'], jsonBody: boolean, serialize: (body: Record<string, unknown> | unknown[]) => string): BodyInit | null {
  if (body === undefined || body === null)
    return null

  return jsonBody ? serialize(body as Record<string, unknown> | unknown[]) : body as BodyInit
}

// Built once, outside the retries, so a bad body or a throwing `serialize` fails at once instead of being retried.
function prepareJsonRequest(url: string, options: Omit<FetchJsonOptions, 'retry' | 'onError'>): PreparedJsonRequest {
  const { baseUrl, token, query, body, headers, timeout, signal, onResponse, fetch: fetcher = fetch, parse = JSON.parse, serialize = JSON.stringify, ...init } = options

  const fullUrl = applyQuery(baseUrl ? new URL(url, baseUrl).href : url, query)
  const jsonBody = isJsonBody(body)

  // Without this, a Date or class instance would be sent as "[object Object]".
  if (body !== undefined && body !== null && !jsonBody && !isBodyInit(body))
    throw new TypeError(`Unsupported body type for ${fullUrl}: ${Object.getPrototypeOf(body)?.constructor?.name ?? typeof body}`)

  const finalHeaders = mergeHeaders(
    {
      'Accept': 'application/json',
      'Content-Type': jsonBody ? 'application/json' : undefined,
      'Authorization': token ? `Bearer ${token}` : undefined,
    },
    headers,
  )

  return {
    fullUrl,
    init: {
      ...init,
      headers: finalHeaders,
      body: serializeBody(body, jsonBody, serialize),
    },
    fetcher,
    parse,
    onResponse,
    timeout,
    signal,
  }
}

async function sendJsonRequest<T>({ fullUrl, init, fetcher, parse, onResponse, timeout, signal }: PreparedJsonRequest): Promise<T> {
  const combined = combineSignals(signal, timeout)
  const res = await fetcher(fullUrl, { ...init, ...(combined ? { signal: combined } : {}) })

  onResponse?.(res)

  if (!res.ok)
    throw await toFetchError(res, fullUrl)

  const text = await res.text()

  if (!text)
    return null as T

  try {
    return parse(text) as T
  }
  catch (e) {
    throw new FetchParseError(res.url || fullUrl, text, e)
  }
}

/** Returns a `fetchJson` with `defaults` applied; per-call options win, headers merge. */
export function createFetcher(defaults: string | FetchJsonOptions) {
  const base: FetchJsonOptions = typeof defaults === 'string' ? { baseUrl: defaults } : defaults

  return <T>(url: string, options: FetchJsonOptions = {}) => fetchJson<T>(url, {
    ...base,
    ...options,
    query: base.query || options.query ? { ...base.query, ...options.query } : undefined,
    headers: mergeHeaders(base.headers, options.headers),
  })
}

/** Yields each non-empty line of an NDJSON body parsed as JSON. Throws a `SyntaxError` naming the line on one that is not JSON, and cancels the body when the consumer stops early. */
export async function* readNdjson<T>(body: NonNullable<Response['body']>): AsyncGenerator<T, void> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let lineNumber = 0

  function parseLine(line: string): T {
    try {
      return JSON.parse(line) as T
    }
    catch (e) {
      throw new SyntaxError(`Invalid NDJSON at line ${lineNumber}: ${line.slice(0, 200)}`, { cause: e })
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done)
        break

      buffer += value

      const lines = buffer.split('\n')

      buffer = lines.pop() ?? ''

      for (const line of lines) {
        ++lineNumber

        if (line.trim())
          yield parseLine(line)
      }
    }

    ++lineNumber

    if (buffer.trim())
      yield parseLine(buffer)
  }
  finally {
    try {
      await reader.cancel()
    }
    catch {}
  }
}
