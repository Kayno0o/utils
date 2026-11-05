import type { Buffer } from 'node:buffer'
import type { FetchJsonOptions } from './browser/fetch'
import type { DiscordWebhookPayload } from './types'
import { mergeHeaders, toFetchError } from './browser/fetch'
import { combineSignals } from './fetch'

export interface DiscordWebhookFile {
  buffer: Buffer
  filename: string
  /** @default 'image/png' */
  contentType?: string
}

/** Transport options, like `sendGotify`'s. */
export type DiscordFetchOptions = Pick<FetchJsonOptions, 'timeout' | 'signal' | 'headers'>

/** Discord CDN avatar URL; picks `gif` for animated hashes (`a_` prefix), else `png`. */
export function getDiscordAvatarUrl(userId: string, avatarHash: string): string {
  const format = avatarHash.startsWith('a_') ? 'gif' : 'png'

  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}`
}

/** Discord CDN banner URL; picks `gif` for animated hashes (`a_` prefix), else `png`. */
export function getDiscordBannerUrl(userId: string, bannerHash: string): string {
  const format = bannerHash.startsWith('a_') ? 'gif' : 'png'

  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${format}`
}

/** POSTs `payload` and `files` to a Discord webhook. Throws `FetchError` on a non-2xx response. */
export async function sendDiscordWebhook(url: string, payload: DiscordWebhookPayload, files: DiscordWebhookFile[] = [], options: DiscordFetchOptions = {}): Promise<any> {
  const formData = new FormData()

  formData.append('payload_json', JSON.stringify(payload))

  for (let i = 0; i < files.length; ++i) {
    const file = files[i]!
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.contentType ?? 'image/png' })

    formData.append(`files[${i}]`, blob, file.filename)
  }

  const response = await fetch(url, {
    body: formData,
    method: 'POST',
    headers: mergeHeaders(options.headers),
    signal: combineSignals(options.signal, options.timeout),
  })

  if (!response.ok)
    throw await toFetchError(response, url)

  // Discord answers 204 with no body unless the url carries `?wait=true`.
  return response.status === 204 ? null : await response.json()
}
