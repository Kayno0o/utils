import type { Buffer } from 'node:buffer'
import type { DiscordWebhookPayload } from './discord'

export async function sendWebhook(url: string, payload: DiscordWebhookPayload, files: { buffer: Buffer, filename: string }[]): Promise<any> {
  const formData = new FormData()

  formData.append('payload_json', JSON.stringify(payload))

  for (let i = 0; i < files.length; ++i) {
    const file = files[i]
    const thumbnailBlob = new Blob([file.buffer], { type: 'image/png' })
    formData.append(`files[${i}]`, thumbnailBlob, file.filename)
  }

  const response = await fetch(url, {
    body: formData,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}
