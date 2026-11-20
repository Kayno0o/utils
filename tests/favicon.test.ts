import { afterAll, describe, expect, it } from 'bun:test'
import { parseFaviconLinks, pickFaviconLink, resolveFavicon } from '../src/favicon'

const ICO = new Uint8Array([0, 0, 1, 0, 1, 0])
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), char => char.charCodeAt(0))

// One server under two host names, 127.0.0.1 standing for the site and localhost for the login page a gated site sends visitors to.
const server = Bun.serve({
  port: 0,
  fetch(request): Response {
    switch (new URL(request.url).pathname) {
      case '/':
        return new Response('<link rel="mask-icon" href="/mask.svg"><link rel="icon" sizes="16x16" href="/small.png"><link rel="icon" sizes="32x32" href="/icon.png">', { headers: { 'content-type': 'text/html' } })
      case '/icon.png':
        return new Response(PNG, { headers: { 'content-type': 'image/png; charset=binary' } })
      case '/bare/':
        return new Response('<p>no icon declared</p>', { headers: { 'content-type': 'text/html' } })
      case '/favicon.ico':
        return new Response(ICO)
      case '/big':
        return new Response('<link rel="icon" href="/big.png">', { headers: { 'content-type': 'text/html' } })
      case '/big.png':
        return new Response(new Uint8Array(2048), { headers: { 'content-type': 'image/png' } })
      case '/gated':
        return Response.redirect(`http://localhost:${server.port}/login`)
      case '/login':
        return new Response('<link rel="icon" href="/icon.png">', { headers: { 'content-type': 'text/html' } })
      case '/html':
        return new Response('<link rel="icon" href="/page">', { headers: { 'content-type': 'text/html' } })
      case '/page':
        return new Response('<p>not an icon</p>', { headers: { 'content-type': 'text/html' } })
      default:
        return new Response(null, { status: 404 })
    }
  },
})
const origin = `http://127.0.0.1:${server.port}`

afterAll(async () => {
  await server.stop(true)
})

describe('picking a page\'s icon', () => {
  it('prefers an svg, then the smallest of 32 px or more, and skips mask icons', () => {
    expect(pickFaviconLink(parseFaviconLinks('<link rel="icon" sizes="16x16" href="/a.png"><link rel="icon" sizes="64x64" href="/b.png"><link rel="apple-touch-icon" sizes="180x180" href="/c.png">'))?.href).toBe('/b.png')
    expect(pickFaviconLink(parseFaviconLinks('<link rel="icon" sizes="64x64" href="/b.png"><link rel="icon" href="/d.svg?v=2">'))?.href).toBe('/d.svg?v=2')
    expect(pickFaviconLink(parseFaviconLinks('<link rel="mask-icon" href="/m.svg"><link rel="icon" sizes="16x16" href="/a.png">'))?.href).toBe('/a.png')
    expect(pickFaviconLink(parseFaviconLinks('<link rel="stylesheet" href="/s.css">'))).toBeUndefined()
  })

  it('fetches the declared icon, its type without parameters', async () => {
    expect(await resolveFavicon(`${origin}/`)).toEqual({ data: PNG, mime: 'image/png' })
  })

  it('falls back on the origin\'s /favicon.ico, its type read from the extension when the server names none', async () => {
    expect(await resolveFavicon(`${origin}/bare/`)).toEqual({ data: ICO, mime: 'image/x-icon' })
  })

  it('takes the site\'s own /favicon.ico over the icon of a login page it redirects to', async () => {
    expect(await resolveFavicon(`${origin}/gated`)).toEqual({ data: ICO, mime: 'image/x-icon' })
  })

  it('takes nothing that is not an image, nor past maxBytes', async () => {
    expect(await resolveFavicon(`${origin}/html`)).toBeNull()
    expect(await resolveFavicon(`${origin}/big`, { maxBytes: 1024 })).toBeNull()
    expect((await resolveFavicon(`${origin}/big`))?.data.length).toBe(2048)
  })
})
