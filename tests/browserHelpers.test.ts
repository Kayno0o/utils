import { afterEach, describe, expect, it } from 'bun:test'
import { downloadCanvas } from '../src/browser/canvas'
import { getHtmlOrText, readClipboardEntries, readDataTransferEntries } from '../src/browser/clipboard'
import { downloadFile, downloadFromString, downloadFromUrl, downloadVCard } from '../src/browser/download'
import { isMobile, isMobileDevice, isMobileOrTablet } from '../src/browser/isMobile'

const globals = globalThis as Record<string, unknown>
const original = { window: globals.window, navigator: globals.navigator, document: globals.document }
const originalUrl = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL }

function stub(name: 'window' | 'navigator' | 'document', value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
}

afterEach(() => {
  for (const [name, value] of Object.entries(original))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })

  URL.createObjectURL = originalUrl.createObjectURL
  URL.revokeObjectURL = originalUrl.revokeObjectURL
})

function stubMedia(matches: Record<string, boolean>) {
  stub('window', { matchMedia: (query: string) => ({ matches: matches[query] ?? false }) })
}

describe('isMobile', () => {
  it('follows the coarse pointer media query', () => {
    stubMedia({ '(pointer: coarse)': true })
    expect(isMobile()).toBe(true)

    stubMedia({})
    expect(isMobile()).toBe(false)
  })
})

describe('isMobileOrTablet', () => {
  it('needs a coarse pointer and a screen of at most 1024px', () => {
    stubMedia({ '(pointer: coarse)': true, '(max-width: 1024px)': true })
    expect(isMobileOrTablet()).toBe(true)

    stubMedia({ '(pointer: coarse)': true })
    expect(isMobileOrTablet()).toBe(false)

    stubMedia({ '(max-width: 1024px)': true })
    expect(isMobileOrTablet()).toBe(false)
  })
})

describe('isMobileDevice', () => {
  it('prefers userAgentData when the browser has it', () => {
    stub('navigator', { userAgentData: { mobile: true }, userAgent: 'Linux desktop' })
    expect(isMobileDevice()).toBe(true)

    stub('navigator', { userAgentData: { mobile: false }, userAgent: 'iPhone' })
    expect(isMobileDevice()).toBe(false)
  })

  it('falls back to the user agent', () => {
    stub('window', {})
    stub('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' })
    expect(isMobileDevice()).toBe(true)

    stub('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })
    expect(isMobileDevice()).toBe(false)
  })

  it('falls back to the vendor, then the opera string', () => {
    stub('window', { opera: 'Opera Mini' })
    stub('navigator', { userAgent: '', vendor: '' })
    expect(isMobileDevice()).toBe(true)

    stub('window', {})
    stub('navigator', { userAgent: '', vendor: 'Android' })
    expect(isMobileDevice()).toBe(true)
  })
})

/** A document whose anchors are recorded, with the object URL calls of `URL` replaced. */
function stubDownload() {
  const anchors: { href: string, download: string, clicked: boolean }[] = []
  const attached = new Set<unknown>()
  const urls = { created: [] as Blob[], revoked: [] as string[] }

  stub('document', {
    createElement: () => {
      const anchor = { href: '', download: '', clicked: false, click() {
        anchor.clicked = attached.has(anchor)
      } }

      anchors.push(anchor)

      return anchor
    },
    body: { appendChild: (node: unknown) => attached.add(node), removeChild: (node: unknown) => attached.delete(node) },
  })
  URL.createObjectURL = (blob: Blob) => {
    urls.created.push(blob)

    return 'blob:test'
  }
  URL.revokeObjectURL = (url: string) => {
    urls.revoked.push(url)
  }

  return { anchors, attached, urls }
}

describe('download helpers', () => {
  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  it('downloadFromUrl clicks a temporary anchor and removes it', () => {
    const { anchors, attached } = stubDownload()

    downloadFromUrl('https://example.test/a.txt', 'a.txt')

    expect(anchors).toHaveLength(1)
    expect(anchors[0]).toMatchObject({ href: 'https://example.test/a.txt', download: 'a.txt', clicked: true })
    expect(attached.size).toBe(0)
  })

  it('downloadFile points an attached anchor at an object url of the blob, revoked after the click', async () => {
    const { anchors, attached, urls } = stubDownload()
    const blob = new Blob(['x'])

    downloadFile(blob, 'x.bin')

    expect(urls.created).toEqual([blob])
    expect(anchors[0]).toMatchObject({ href: 'blob:test', download: 'x.bin', clicked: true })
    expect(attached.size).toBe(0)
    expect(urls.revoked).toEqual([])

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(urls.revoked).toEqual(['blob:test'])
  })

  it('downloadFromUrl never revokes the url it was given', async () => {
    const { urls } = stubDownload()

    downloadFromUrl('blob:other', 'a.txt')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(urls.revoked).toEqual([])
  })

  it('downloadCanvas downloads the encoded blob through an attached anchor', async () => {
    const { anchors, urls } = stubDownload()
    const asked: unknown[] = []
    const canvas = { toBlob: (cb: (blob: Blob | null) => void, ...args: unknown[]) => {
      asked.push(...args)
      cb(new Blob(['png']))
    } }

    downloadCanvas(canvas as unknown as HTMLCanvasElement, 'a.png', 'image/webp', 0.5)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(asked).toEqual(['image/webp', 0.5])
    expect(anchors[0]).toMatchObject({ download: 'a.png', clicked: true })
    expect(urls.revoked).toEqual(['blob:test'])
  })

  it('downloadFromString wraps the content in a blob of the given type, text/plain by default', async () => {
    const { urls } = stubDownload()

    downloadFromString('hello', 'a.txt')
    downloadFromString('{}', 'a.json', 'application/json' as never)

    expect(urls.created.map(blob => blob.type)).toEqual(['text/plain;charset=utf-8', 'application/json;charset=utf-8'])
    expect(await urls.created[0]!.text()).toBe('hello')
  })

  it('downloadVCard downloads the contacts as text/vcard and revokes the url', async () => {
    const { anchors, urls } = stubDownload()

    downloadVCard([{ given_name: 'Ada' }], 'ada.vcf')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(urls.created[0]!.type).toBe('text/vcard')
    expect(await urls.created[0]!.text()).toContain('BEGIN:VCARD')
    expect(anchors[0]).toMatchObject({ href: 'blob:test', download: 'ada.vcf', clicked: true })
    expect(urls.revoked).toEqual(['blob:test'])
  })
})

describe('clipboard readers', () => {
  it('readDataTransferEntries reads text formats first, then images and other files', () => {
    URL.createObjectURL = () => 'blob:img'

    const image = new File(['i'], 'a.png', { type: 'image/png' })
    const doc = new File(['hello'], 'b.pdf', { type: 'application/pdf' })
    const formats: Record<string, string> = { 'text/plain': 'hi', 'text/html': '', 'Files': 'ignored' }
    const data = {
      types: Object.keys(formats),
      getData: (type: string) => formats[type],
      files: [image, doc],
    } as unknown as DataTransfer

    expect(readDataTransferEntries(data)).toEqual([
      { type: 'text/plain', kind: 'text', text: 'hi' },
      { type: 'image/png', kind: 'image', url: 'blob:img', name: 'a.png', size: 1 },
      { type: 'application/pdf', kind: 'file', name: 'b.pdf', size: 5 },
    ])
  })

  it('readClipboardEntries reads every type of every item', async () => {
    URL.createObjectURL = () => 'blob:img'

    const blobs: Record<string, Blob> = { 'text/html': new Blob(['<b>x</b>']), 'image/png': new Blob(['abc']) }

    stub('navigator', { clipboard: { read: async () => [{ types: Object.keys(blobs), getType: async (type: string) => blobs[type] }] } })

    expect(await readClipboardEntries()).toEqual([
      { type: 'text/html', kind: 'text', text: '<b>x</b>' },
      { type: 'image/png', kind: 'image', url: 'blob:img', size: 3 },
    ])
  })

  it('getHtmlOrText prefers html, then plain text, then an empty string', () => {
    expect(getHtmlOrText([{ type: 'text/plain', kind: 'text', text: 'p' }, { type: 'text/html', kind: 'text', text: '<i>h</i>' }])).toBe('<i>h</i>')
    expect(getHtmlOrText([{ type: 'text/plain', kind: 'text', text: 'p' }])).toBe('p')
    expect(getHtmlOrText([])).toBe('')
  })
})
