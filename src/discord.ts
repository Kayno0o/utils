import type { Buffer } from 'node:buffer'
import type { FetchJsonOptions } from './browser/fetch'
import type { DiscordWebhookPayload } from './types'
import { fetchJson } from './browser/fetch'
import { DEFAULT_FETCH_TIMEOUT_MS } from './fetch'

export interface DiscordWebhookFile {
  buffer: Buffer
  filename: string
  /** @default 'image/png' */
  contentType?: string
}

/** Transport options, like `sendGotify`'s. */
export type DiscordFetchOptions = Pick<FetchJsonOptions, 'timeout' | 'signal' | 'headers' | 'fetch' | 'retry'>

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

/** POSTs `payload` and `files` to a Discord webhook, with a default timeout. Throws `FetchError` on a non-2xx response. */
export async function sendDiscordWebhook(url: string, payload: DiscordWebhookPayload, files: DiscordWebhookFile[] = [], options: DiscordFetchOptions = {}): Promise<any> {
  const formData = new FormData()

  formData.append('payload_json', JSON.stringify(payload))

  for (let i = 0; i < files.length; ++i) {
    const file = files[i]!
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.contentType ?? 'image/png' })

    formData.append(`files[${i}]`, blob, file.filename)
  }

  // Discord answers 204 with no body unless the url carries `?wait=true`, which `fetchJson` reads as null.
  return await fetchJson(url, { ...options, timeout: options.timeout ?? DEFAULT_FETCH_TIMEOUT_MS, method: 'POST', body: formData })
}
