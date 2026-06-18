import { describe, expect, it } from 'bun:test'
import { getSvgDimension, getViewBox, setViewBox } from '../src/browser/svg'

const SVG_WITH_VIEWBOX = '<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
const SVG_WITHOUT_VIEWBOX = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
const SVG_WITH_DIMS = '<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg"><rect/></svg>'

describe('getViewBox', () => {
  it('parses viewBox attribute', () => {
    expect(getViewBox(SVG_WITH_VIEWBOX)).toEqual({ x: 0, y: 0, w: 100, h: 200 })
  })

  it('returns null when viewBox is absent', () => {
    expect(getViewBox(SVG_WITHOUT_VIEWBOX)).toBeNull()
  })

  it('handles negative / decimal values', () => {
    const svg = '<svg viewBox="-10.5 -20 200.5 100">'

    expect(getViewBox(svg)).toEqual({ x: -10.5, y: -20, w: 200.5, h: 100 })
  })
})

describe('getSvgDimension', () => {
  it('reads width attribute', () => {
    expect(getSvgDimension(SVG_WITH_DIMS, 'width')).toBe(300)
  })

  it('reads height attribute', () => {
    expect(getSvgDimension(SVG_WITH_DIMS, 'height')).toBe(150)
  })

  it('returns null when attribute absent', () => {
    expect(getSvgDimension(SVG_WITHOUT_VIEWBOX, 'width')).toBeNull()
  })
})

describe('setViewBox', () => {
  it('replaces existing viewBox', () => {
    const result = setViewBox(SVG_WITH_VIEWBOX, 5, 10, 50, 80)

    expect(result).toContain('viewBox="5 10 50 80"')
    const matches = result.match(/viewBox=/g)

    expect(matches).toHaveLength(1)
  })

  it('inserts viewBox when absent', () => {
    const result = setViewBox(SVG_WITHOUT_VIEWBOX, 0, 0, 100, 100)

    expect(result).toContain('viewBox="0 0 100 100"')
  })
})
