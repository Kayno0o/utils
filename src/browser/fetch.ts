type HeadersInput = [string, string | undefined][] | Record<string, string | undefined> | Headers

/** Merge header-shaped input into `target`, skipping undefined values. Later entries win. */
function appendHeaders(target: Headers, source?: HeadersInput): void {
  if (!source)
    return

  if (source instanceof Headers) {
    for (const [key, value] of source)
      target.set(key, value)

    return
  }

  const entries = Array.isArray(source) ? source : Object.entries(source)

  for (const [key, value] of entries) {
    if (value !== undefined)
      target.set(key, value)
  }
}

export class FetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    public readonly body?: string,
  ) {
    super(`HTTP ${status} ${statusText} - ${url}${body ? ` - ${body}` : ''}`)
    this.name = 'FetchError'
  }
}

export interface FetchJsonOptions extends Omit<RequestInit, 'body' | 'headers'> {
  /** Overrides the URL base. */
  baseUrl?: string
  /** Adds `Authorization: Bearer <token>` header. */
  token?: string
  /** Query params appended to the URL; undefined values are skipped. */
  query?: Record<string, string | undefined>
  /** Plain objects/arrays are JSON-encoded (with a JSON content type); other values pass through. */
  body?: BodyInit | Record<string, unknown> | unknown[] | null
  /** Header-shaped input merged over the defaults; undefined values are skipped. */
  headers?: HeadersInput
}

/** Fetches JSON from `url`, throwing `FetchError` on non-2xx responses. An empty body resolves to `null`. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { baseUrl, token, query, body, headers, ...init } = options

  let fullUrl = baseUrl ? new URL(url, baseUrl).href : url

  if (query) {
    const parsed = new URL(fullUrl)

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined)
        parsed.searchParams.append(key, value)
    }

    fullUrl = parsed.href
  }

  let isJsonBody = false

  if (body !== undefined && body !== null) {
    const isPlainObject = (body as object).constructor === Object || Array.isArray(body)

    if (isPlainObject) {
      (init as RequestInit).body = JSON.stringify(body)
      isJsonBody = true
    }
    else {
      (init as RequestInit).body = body as BodyInit
    }
  }

  const finalHeaders = new Headers()

  finalHeaders.set('Accept', 'application/json')

  if (isJsonBody)
    finalHeaders.set('Content-Type', 'application/json')

  if (token)
    finalHeaders.set('Authorization', `Bearer ${token}`)

  appendHeaders(finalHeaders, headers)

  const res = await fetch(fullUrl, { ...init, headers: finalHeaders })

  if (!res.ok) {
    let errorBody: string | undefined

    try {
      errorBody = await res.text()
    }
    catch {
      errorBody = undefined
    }

    throw new FetchError(res.status, res.statusText, res.url || fullUrl, errorBody || undefined)
  }

  const text = await res.text()

  return (text ? JSON.parse(text) : null) as T
}

/** Returns a `fetchJson` bound to `baseUrl`. */
export function createFetcher(baseUrl: string) {
  return <T>(url: string, options: Omit<FetchJsonOptions, 'baseUrl'> = {}) =>
    fetchJson<T>(url, { ...options, baseUrl })
}
