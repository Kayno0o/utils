import decodeQR from '@paulmillr/qr/decode.js'
import { Resvg } from '@resvg/resvg-js'
import { describe, expect, test as it } from 'bun:test'
import { qrCodeDataUri, qrCodeSvg } from '../src/tools'

describe('qrCodeSvg', () => {
  it('produces a valid svg with a viewBox and default quiet zone', () => {
    const svg = qrCodeSvg('hello')

    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).toContain('viewBox="0 0')
    // default margin 4 on both sides, smallest QR is 21 modules -> 29
    expect(svg).toContain('viewBox="0 0 29 29"')
  })

  it('omits the background rect when background is transparent', () => {
    expect(qrCodeSvg('x', { background: null })).not.toContain('<rect')
    expect(qrCodeSvg('x', { background: 'transparent' })).not.toContain('<rect')
    expect(qrCodeSvg('x', { background: '#fff' })).toContain('fill="#fff"')
  })

  it('applies solid foreground and separate eye color', () => {
    const svg = qrCodeSvg('x', { foreground: '#123456', eyeColor: '#abcdef' })

    expect(svg).toContain('fill="#123456"')
    expect(svg).toContain('fill="#abcdef"')
  })

  it('emits a gradient def and references it', () => {
    const svg = qrCodeSvg('x', {
      id: 'demo',
      foreground: { type: 'linear', rotation: 45, stops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }] },
    })

    expect(svg).toContain('<linearGradient id="demo-fg"')
    expect(svg).toContain('url(#demo-fg)')
    expect(svg).toContain('stop-color="red"')
  })

  it('sets width/height only when size is given', () => {
    expect(qrCodeSvg('x', { size: 300 })).toContain('width="300" height="300"')
    // the <svg> root has no width when size is omitted (the background rect still does)
    expect(qrCodeSvg('x', { background: null })).not.toContain('width=')
  })

  it('uses crispEdges only for square modules and eyes', () => {
    expect(qrCodeSvg('x')).toContain('shape-rendering="crispEdges"')
    expect(qrCodeSvg('x', { moduleShape: 'dot' })).not.toContain('crispEdges')
    expect(qrCodeSvg('x', { moduleShape: 'rounded' })).not.toContain('crispEdges')
  })

  it('renders a logo image and knockout when provided', () => {
    const svg = qrCodeSvg('x', { ecc: 'H', logo: { href: 'data:image/png;base64,AAA', size: 0.25 } })

    expect(svg).toContain('<image href="data:image/png;base64,AAA"')
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
  })

  it('respects a custom margin', () => {
    expect(qrCodeSvg('hello', { margin: 0 })).toContain('viewBox="0 0 21 21"')
  })

  it('escapes attribute-breaking characters in colors, href and id', () => {
    const svg = qrCodeSvg('x', {
      id: 'a"b c',
      foreground: { stops: [{ offset: 0, color: '"><script>a' }, { offset: 1, color: 'blue' }] },
      logo: { href: '"><script>' },
    })

    expect(svg).not.toContain('<script>')
    expect(svg).toContain('&quot;&gt;&lt;script&gt;')
    // id is sanitized down to url-safe characters
    expect(svg).toContain('url(#abc-fg)')
    expect(svg).toContain('id="abc-fg"')
  })

  it('defaults ecc to H when a logo is set', () => {
    // logo forces version/ecc up, enlarging the code vs the default M with no logo
    const withLogo = qrCodeSvg('hello world', { logo: { href: 'x' } })
    const eccH = qrCodeSvg('hello world', { ecc: 'H' })
    const viewBox = (svg: string) => svg.match(/viewBox="([^"]+)"/)![1]

    expect(viewBox(withLogo)).toBe(viewBox(eccH))
  })

  it('clamps logo size to the ecc budget', () => {
    const svg = qrCodeSvg('hello', { ecc: 'H', logo: { href: 'x', size: 0.9, margin: 0 } })
    const width = Number(svg.match(/<image[^>]*width="([\d.]+)"/)![1])
    // H tolerates ~30% area loss -> knockout side <= sqrt(0.3) of the code
    const modules = 21

    expect(width).toBeLessThanOrEqual(modules * Math.sqrt(0.3) + 0.001)
  })

  it('connects adjacent rounded modules by only rounding open corners', () => {
    // a plain rounded square module has 4 arcs; connected runs have fewer
    const svg = qrCodeSvg('hello world', { moduleShape: 'rounded' })
    const path = svg.match(/<path fill="black" d="([^"]+)"/)![1]!
    const arcs = (path.match(/a/g) ?? []).length
    const moduleStarts = (path.match(/M/g) ?? []).length

    expect(arcs).toBeLessThan(moduleStarts * 4)
  })

  it('shrinks modules within their cell when moduleScale < 1', () => {
    // full-scale square modules span a whole cell (h1 ... v1); scaled ones do not
    expect(qrCodeSvg('x')).toContain('h1v1h-1z')
    const scaled = qrCodeSvg('x', { moduleScale: 0.6 })

    expect(scaled).not.toContain('h1v1h-1z')
    expect(scaled).toContain('h0.6v0.6h-0.6z')
  })

  it('renders gapped rounded modules as standalone rounded rects', () => {
    const svg = qrCodeSvg('hello world', { moduleShape: 'rounded', moduleScale: 0.8 })
    const path = svg.match(/<path fill="black" d="([^"]+)"/)![1]!
    const arcs = (path.match(/a/g) ?? []).length
    const moduleStarts = (path.match(/M/g) ?? []).length

    // every standalone rounded module has exactly 4 corner arcs
    expect(arcs).toBe(moduleStarts * 4)
  })

  it('accepts a gradient eye color', () => {
    const svg = qrCodeSvg('x', {
      id: 'g',
      eyeColor: { type: 'linear', stops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'lime' }] },
    })

    expect(svg).toContain('<linearGradient id="g-eye"')
    expect(svg).toContain('fill="url(#g-eye)"')
  })

  it('styles each eye independently via the eyes array', () => {
    const svg = qrCodeSvg('x', {
      id: 'e',
      eyes: [
        { shape: 'circle', color: '#f00' },
        { shape: 'square', color: '#0f0' },
        { shape: 'rounded', color: { stops: [{ offset: 0, color: 'a' }, { offset: 1, color: 'b' }] } },
      ],
    })

    expect(svg).toContain('fill="#f00"')
    expect(svg).toContain('fill="#0f0"')
    expect(svg).toContain('<linearGradient id="e-eye2"')
    expect(svg).toContain('fill="url(#e-eye2)"')
  })

  it('qrCodeDataUri wraps the svg as a data uri', () => {
    const uri = qrCodeDataUri('x')

    expect(uri.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(uri.slice('data:image/svg+xml,'.length)).startsWith('<svg')).toBe(true)
  })
})

describe('qrCodeSvg accessibility', () => {
  it('is not labelled by default', () => {
    const svg = qrCodeSvg('x')

    expect(svg).not.toContain('role="img"')
    expect(svg).not.toContain('<title>')
  })

  it('title emits role="img", a <title>, and a matching aria-label', () => {
    const svg = qrCodeSvg('x', { title: 'Scan me' })

    expect(svg).toContain('role="img"')
    expect(svg).toContain('aria-label="Scan me"')
    expect(svg).toContain('<title>Scan me</title>')
    // the title is the first child of the svg for assistive tech
    expect(svg).toMatch(/<svg\b[^>]*>\s*<title>/)
  })

  it('ariaLabel overrides the aria-label but keeps the title text', () => {
    const svg = qrCodeSvg('x', { title: 'Visible', ariaLabel: 'Spoken' })

    expect(svg).toContain('aria-label="Spoken"')
    expect(svg).toContain('<title>Visible</title>')
  })

  it('ariaLabel alone labels the code without a <title>', () => {
    const svg = qrCodeSvg('x', { ariaLabel: 'Scan me' })

    expect(svg).toContain('role="img"')
    expect(svg).toContain('aria-label="Scan me"')
    expect(svg).not.toContain('<title>')
  })

  it('escapes markup in title and aria-label', () => {
    const svg = qrCodeSvg('x', { title: '"a" & <b>', ariaLabel: '"c" & <d>' })

    expect(svg).not.toContain('<b>')
    expect(svg).toContain('<title>&quot;a&quot; &amp; &lt;b&gt;</title>')
    expect(svg).toContain('aria-label="&quot;c&quot; &amp; &lt;d&gt;"')
  })
})

describe('qrCodeSvg decode round-trip', () => {
  function scan(svg: string): string {
    const { pixels, width, height } = new Resvg(svg, {
      fitTo: { mode: 'width', value: 512 },
      background: 'white',
    }).render()

    return decodeQR({ width, height, data: new Uint8Array(pixels) })
  }

  const payload = 'https://example.com/qr-round-trip?id=42'

  it('a plain code renders to pixels that decode back', () => {
    expect(scan(qrCodeSvg(payload))).toBe(payload)
  })

  it('rounded modules and eyes stay scannable', () => {
    expect(scan(qrCodeSvg(payload, { moduleShape: 'rounded', eyeShape: 'rounded' }))).toBe(payload)
  })

  it('a gradient foreground stays scannable', () => {
    const svg = qrCodeSvg(payload, {
      foreground: { type: 'linear', rotation: 45, stops: [{ offset: 0, color: '#001' }, { offset: 1, color: '#00a' }] },
    })

    expect(scan(svg)).toBe(payload)
  })

  it('gapped modules stay scannable', () => {
    expect(scan(qrCodeSvg(payload, { moduleShape: 'dot', moduleScale: 0.7, eyeShape: 'square' }))).toBe(payload)
    expect(scan(qrCodeSvg(payload, { moduleShape: 'rounded', moduleScale: 0.85 }))).toBe(payload)
  })

  it('per-eye styling stays scannable', () => {
    const svg = qrCodeSvg(payload, {
      eyes: [
        { shape: 'square', color: '#e11d48' },
        { shape: 'rounded' },
        { shape: 'square', color: { stops: [{ offset: 0, color: '#001' }, { offset: 1, color: '#00a' }] } },
      ],
    })

    expect(scan(svg)).toBe(payload)
  })

  it('a code with a center logo stays scannable', () => {
    // 1x1 transparent png; ecc defaults to H so the knockout is recoverable
    const href = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    const svg = qrCodeSvg(payload, { moduleShape: 'rounded', logo: { href, size: 0.2 } })

    expect(scan(svg)).toBe(payload)
  })
})
