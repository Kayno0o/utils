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

    const entries = source instanceof Headers
      ? [...source]
      : Array.isArray(source) ? source : Object.entries(source)

    for (const [key, value] of entries) {
      if (value !== undefined)
        target.set(key, value)
    }
  }

  return target
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null)
    return false

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
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

function combineSignals(signal: AbortSignal | null | undefined, timeout: number | undefined): AbortSignal | undefined {
  if (timeout === undefined)
    return signal ?? undefined

  const timeoutSignal = AbortSignal.timeout(timeout)

  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
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
    const said = statedBy(data) ?? body

    super(`HTTP ${status} ${statusText} - ${url}${said ? ` - ${said}` : ''}`)
    this.name = 'FetchError'
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
  baseUrl?: string
  /** Adds `Authorization: Bearer <token>` header. */
  token?: string
  /** Query params appended to the URL; undefined values are skipped, arrays repeat the key. */
  query?: QueryInput
  /** Plain objects/arrays are JSON-encoded (with a JSON content type); `BodyInit` values pass through. */
  body?: BodyInit | Record<string, unknown> | unknown[] | null
  /** Header-shaped input merged over the defaults; undefined values are skipped. */
  headers?: HeadersInput
  /** Aborts the request after this many milliseconds, combined with any caller `signal`. */
  timeout?: number
  /**
   * Every response, ok or not, before it is read. Where a session that has expired under the
   * page is noticed once rather than at each call site - the body is still untouched here.
   */
  onResponse?: (res: Response) => void
}

/** Fetches JSON from `url`, throwing `FetchError` on non-2xx responses. An empty body resolves to `null`. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { baseUrl, token, query, body, headers, timeout, signal, onResponse, ...init } = options

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

  const res = await fetch(fullUrl, {
    ...init,
    headers: finalHeaders,
    signal: combineSignals(signal, timeout),
    body: body === undefined || body === null
      ? undefined
      : jsonBody ? JSON.stringify(body) : body as BodyInit,
  })

  onResponse?.(res)

  if (!res.ok)
    throw await toFetchError(res, fullUrl)

  const text = await res.text()

  if (!text)
    return null as T

  try {
    return JSON.parse(text) as T
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
