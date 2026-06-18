export class FetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`)
    this.name = 'FetchError'
  }
}

export interface FetchJsonOptions extends RequestInit {
  /** Overrides the URL base. */
  baseUrl?: string
  /** Adds `Authorization: Bearer <token>` header. */
  token?: string
}

/** Fetches JSON from `url`, throwing `FetchError` on non-2xx responses. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { baseUrl, token, ...init } = options
  const fullUrl = baseUrl ? new URL(url, baseUrl).href : url
  const headers = new Headers(init.headers)

  if (token)
    headers.set('Authorization', `Bearer ${token}`)

  headers.set('Accept', 'application/json')

  const res = await fetch(fullUrl, { ...init, headers })

  if (!res.ok)
    throw new FetchError(res.status, res.statusText, fullUrl)

  return res.json() as Promise<T>
}

/** Returns a `fetchJson` bound to `baseUrl`. */
export function createFetcher(baseUrl: string) {
  return <T>(url: string, options: Omit<FetchJsonOptions, 'baseUrl'> = {}) =>
    fetchJson<T>(url, { ...options, baseUrl })
}
