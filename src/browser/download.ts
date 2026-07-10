import type { TextDataMimeType, TextMimeType } from '../types'

export function downloadFile(blob: Blob, name: string) {
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = blobUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** @deprecated use `downloadFromUrl` */
export const downloadFromURL = downloadFromUrl
export function downloadFromUrl(url: string, name: string) {
  const a = document.createElement('a')

  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadFromString(content: string, name: string, type: TextDataMimeType | TextMimeType = 'text/plain') {
  const blob = new Blob([content], { type })

  downloadFile(blob, name)
}
