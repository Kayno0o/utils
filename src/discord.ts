import type { Buffer } from 'node:buffer'
import type { DiscordWebhookPayload } from './types'

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

export async function sendDiscordWebhook(url: string, payload: DiscordWebhookPayload, files: { buffer: Buffer, filename: string }[]): Promise<any> {
  const formData = new FormData()

  formData.append('payload_json', JSON.stringify(payload))

  for (let i = 0; i < files.length; ++i) {
    const file = files[i]!
    const thumbnailBlob = new Blob([new Uint8Array(file.buffer)], { type: 'image/png' })

    formData.append(`files[${i}]`, thumbnailBlob, file.filename)
  }

  const response = await fetch(url, {
    body: formData,
    method: 'POST',
  })

  if (!response.ok)
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`)

  return await response.json()
}
