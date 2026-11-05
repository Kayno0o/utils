import type { TextDataMimeType, TextMimeType } from '../types'
import type { VCardContact } from '../vcard'
import { generateVCard } from '../vcard'
import { clickAnchor, clickBlobAnchor } from './anchor'

/** Downloads `blob` as `name`. */
export function downloadFile(blob: Blob, name: string): void {
  clickBlobAnchor(blob, name)
}

export function downloadFromUrl(url: string, name: string): void {
  clickAnchor(url, name)
}

export function downloadFromString(content: string, name: string, type: TextDataMimeType | TextMimeType = 'text/plain'): void {
  downloadFile(new Blob([content], { type }), name)
}

/** Downloads the contacts as one `.vcf` file. */
export function downloadVCard(contacts: VCardContact[], filename: string): void {
  downloadFile(new Blob([contacts.map(generateVCard).join('\n')], { type: 'text/vcard' }), filename)
}
