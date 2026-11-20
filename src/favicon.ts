import type { FetchWithTimeoutInit } from './fetch'
import { SECOND_MS } from './date'
import { fetchWithTimeout } from './fetch'

const WHITESPACE = /\s+/
const MAX_HTML_BYTES = 512 * 1024
const LINK_TAG = /<link\b[^>]*>/gi
const REL = /\brel\s*=\s*["']([^"']*)["']/i
const HREF = /\bhref\s*=\s*["']([^"']*)["']/i
const SIZES = /\bsizes\s*=\s*["']([^"']*)["']/i
const SVG_HREF = /\.svg(?:$|[?#])/i
const EXTENSION = /\.(\w+)(?:$|[?#])/
const MIME_PARAMS = /;.*$/s
const WWW_PREFIX = /^www\./
const EXTENSION_MIME: Record<string, string> = { ico: 'image/x-icon', png: 'image/png', svg: 'image/svg+xml', gif: 'image/gif', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

/** The largest icon `resolveFavicon` keeps by default. */
export const MAX_FAVICON_BYTES = 256 * 1024

export interface Favicon {
  data: Uint8Array<ArrayBuffer>
  mime: string
}

export interface FaviconLink {
  href: string
  /** The largest side its `sizes` names, `Infinity` for `any`, 0 when it names none. */
  size: number
}

export interface ResolveFaviconOptions {
  headers?: HeadersInit | undefined
  /** Per request, 10 s by default. */
  timeout?: number | undefined
  maxBytes?: number | undefined
}

function largestSize(sizes: string | undefined): number {
  if (sizes === undefined)
    return 0

  return Math.max(0, ...sizes.toLowerCase().split(WHITESPACE).map(size => (size === 'any' ? Number.POSITIVE_INFINITY : Math.max(...size.split('x').map(Number).filter(Number.isFinite)))))
}

/** The icon links of an HTML page, mask and fluid icons left out. */
export function parseFaviconLinks(html: string): FaviconLink[] {
  return [...html.matchAll(LINK_TAG)].flatMap(([tag]) => {
    const rel = REL.exec(tag)?.[1]?.toLowerCase() ?? ''
    const href = HREF.exec(tag)?.[1]

    if (!rel.includes('icon') || rel.includes('mask-icon') || rel.includes('fluid-icon') || href === undefined || href === '')
      return []

    return [{ href, size: largestSize(SIZES.exec(tag)?.[1]) }]
  })
}

/** An SVG first, then the smallest of 32 px or more, then the largest with a size, then the first. */
export function pickFaviconLink(links: FaviconLink[]): FaviconLink | undefined {
  const sized = links.filter(link => link.size > 0).sort((a, b) => a.size - b.size)

  return links.find(link => SVG_HREF.test(link.href)) ?? sized.find(link => link.size >= 32) ?? sized.at(-1) ?? links[0]
}

// www. and the bare name are one site; any other host a request ended on is not.
function sameHost(a: string, b: string): boolean {
  return a.replace(WWW_PREFIX, '') === b.replace(WWW_PREFIX, '')
}

async function iconUrl(pageUrl: string, init: FetchWithTimeoutInit): Promise<string> {
  const page = new URL(pageUrl)
  const fallback = `${page.origin}/favicon.ico`

  try {
    const response = await fetchWithTimeout(page, init)

    // A site behind a login sends the request to the login page, whose icon is not the site's.
    if (!response.ok || !sameHost(new URL(response.url || pageUrl).hostname, page.hostname))
      return fallback

    const html = new TextDecoder().decode((await response.arrayBuffer()).slice(0, MAX_HTML_BYTES))
    const best = pickFaviconLink(parseFaviconLinks(html))

    return best === undefined ? fallback : new URL(best.href, response.url || pageUrl).href
  }
  catch {
    return fallback
  }
}

function mimeOf(response: Response, url: string): string {
  const declared = (response.headers.get('content-type') ?? '').replace(MIME_PARAMS, '').trim()

  // A server that does not know the type says octet-stream, which names nothing.
  if (declared !== '' && declared !== 'application/octet-stream')
    return declared

  return EXTENSION_MIME[EXTENSION.exec(new URL(url).pathname)?.[1]?.toLowerCase() ?? ''] ?? 'image/x-icon'
}

/** The icon a page declares, else its origin's /favicon.ico; null when neither is an image of at most `maxBytes`, or one a redirect to another host gave. */
export async function resolveFavicon(pageUrl: string, { headers, timeout = 10 * SECOND_MS, maxBytes = MAX_FAVICON_BYTES }: ResolveFaviconOptions = {}): Promise<Favicon | null> {
  const init = { timeout, ...headers === undefined ? {} : { headers } }
  const url = await iconUrl(pageUrl, init)

  try {
    const response = await fetchWithTimeout(url, init)

    if (!response.ok || !sameHost(new URL(response.url || url).hostname, new URL(url).hostname))
      return null

    const data = new Uint8Array(await response.arrayBuffer())
    const mime = mimeOf(response, url)

    return data.length === 0 || data.length > maxBytes || !mime.startsWith('image/') ? null : { data, mime }
  }
  catch {
    return null
  }
}
