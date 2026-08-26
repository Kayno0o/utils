import type { FetchJsonOptions } from './browser/fetch'
import { fetchJson, mergeHeaders } from './browser/fetch'

export interface GotifyMessage {
  title: string
  message: string
  priority?: number
  clickUrl?: string
  /** Drawn in the shade by the client, which fetches it itself - so it must need no session of the sender's. */
  imageUrl?: string
  markdown?: boolean
}

/** Transport options forwarded to `fetchJson`, e.g. `timeout` and `signal`. */
export type GotifyFetchOptions = Pick<FetchJsonOptions, 'timeout' | 'signal' | 'headers'>

/** POSTs a single message to a Gotify `/message` endpoint, authenticating with the app token. Throws `FetchError` on a non-2xx response. */
export async function sendGotify(url: string, token: string, message: GotifyMessage, options: GotifyFetchOptions = {}): Promise<void> {
  const extras: Record<string, unknown> = {}

  if (message.markdown)
    extras['client::display'] = { contentType: 'text/markdown' }

  if (message.clickUrl || message.imageUrl) {
    extras['client::notification'] = {
      ...(message.clickUrl ? { click: { url: message.clickUrl } } : {}),
      ...(message.imageUrl ? { bigImageUrl: message.imageUrl } : {}),
    }
  }

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
