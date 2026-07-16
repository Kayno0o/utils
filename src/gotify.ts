import type { FetchJsonOptions } from './browser/fetch'
import { fetchJson, mergeHeaders } from './browser/fetch'

export interface GotifyMessage {
  title: string
  message: string
  priority?: number
  clickUrl?: string
  markdown?: boolean
}

/** Transport options forwarded to `fetchJson`, e.g. `timeout` and `signal`. */
export type GotifyFetchOptions = Pick<FetchJsonOptions, 'timeout' | 'signal' | 'headers'>

/** POSTs a single message to a Gotify `/message` endpoint, authenticating with the app token. Throws `FetchError` on a non-2xx response. */
export async function sendGotify(url: string, token: string, message: GotifyMessage, options: GotifyFetchOptions = {}): Promise<void> {
  const extras: Record<string, unknown> = {}

  if (message.markdown)
    extras['client::display'] = { contentType: 'text/markdown' }

  if (message.clickUrl)
    extras['client::notification'] = { click: { url: message.clickUrl } }

  await fetchJson(url, {
    ...options,
    method: 'POST',
    headers: mergeHeaders({ 'X-Gotify-Key': token }, options.headers),
    body: {
      title: message.title,
      message: message.message,
      priority: message.priority ?? 5,
      ...(Object.keys(extras).length ? { extras } : {}),
    },
  })
}
