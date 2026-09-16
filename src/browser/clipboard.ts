import TurndownService from 'turndown'

/** Copies `text`, with an `html` version alongside for apps that paste rich text, such as documents and mail. */
export async function copy(text: string, options: { html?: string } = {}) {
  const formats: Record<string, Blob> = { 'text/plain': new Blob([text], { type: 'text/plain' }) }

  if (options.html)
    formats['text/html'] = new Blob([options.html], { type: 'text/html' })

  await navigator.clipboard.write([new ClipboardItem(formats)])
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

export function htmlToMarkdown(html: string): string {
  return html ? turndown.turndown(html) : ''
}

export interface ClipboardEntry {
  type: string
  kind: 'text' | 'image' | 'file'
  text?: string
  url?: string
  name?: string
  size?: number
}

// DataTransfer is only valid synchronously during the paste event, so read every format before any await.
export function entriesFromDataTransfer(data: DataTransfer): ClipboardEntry[] {
  const entries: ClipboardEntry[] = []

  for (const type of data.types) {
    if (type === 'Files')
      continue

    const text = data.getData(type)

    if (text)
      entries.push({ type, kind: 'text', text })
  }

  for (const file of data.files) {
    if (file.type.startsWith('image/'))
      entries.push({ type: file.type, kind: 'image', url: URL.createObjectURL(file), name: file.name, size: file.size })
    else
      entries.push({ type: file.type, kind: 'file', name: file.name, size: file.size })
  }

  return entries
}

export async function readClipboardEntries(): Promise<ClipboardEntry[]> {
  const items = await navigator.clipboard.read()
  const out: ClipboardEntry[] = []

  for (const item of items) {
    for (const type of item.types) {
      const blob = await item.getType(type)

      if (type.startsWith('image/'))
        out.push({ type, kind: 'image', url: URL.createObjectURL(blob), size: blob.size })
      else
        out.push({ type, kind: 'text', text: await blob.text() })
    }
  }

  return out
}

export function pickHtml(entries: ClipboardEntry[]): string {
  return entries.find(e => e.type === 'text/html')?.text
    ?? entries.find(e => e.type === 'text/plain')?.text
    ?? ''
}
