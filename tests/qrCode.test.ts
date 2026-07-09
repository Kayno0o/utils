import { describe, expect, test as it } from 'bun:test'
import { qrCodeSvg } from '../src/tools'

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
})
