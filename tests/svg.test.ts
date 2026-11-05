import { afterEach, describe, expect, it } from 'bun:test'
import { cropSvg, getSvgDimension, getViewBox, setViewBox } from '../src/browser/svg'

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

  it('reads the width attribute itself, not stroke-width or data-width', () => {
    expect(getSvgDimension('<svg stroke-width="2" width="24" data-height="9" height="12">', 'width')).toBe(24)
    expect(getSvgDimension('<svg width="24" stroke-width="2">', 'width')).toBe(24)
    expect(getSvgDimension('<svg data-height="9" height="12">', 'height')).toBe(12)
    expect(getSvgDimension('<svg stroke-width="2">', 'width')).toBeNull()
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

describe('cropSvg', () => {
  const globals = globalThis as Record<string, unknown>
  const original = { DOMParser: globals.DOMParser, document: globals.document }

  afterEach(() => {
    globals.DOMParser = original.DOMParser
    globals.document = original.document
  })

  /** A DOM stub whose parsed svg measures `bbox`, recording its attributes and whether it was attached. */
  function stubDom(bbox: { x: number, y: number, width: number, height: number }, { parseError = false, hasSvg = true } = {}) {
    const attributes = new Map<string, string>()
    const log: string[] = []
    const svg = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
      getBBox: () => bbox,
      get outerHTML() {
        return `<svg viewBox="${attributes.get('viewBox')}" style="${attributes.get('style') ?? ''}"/>`
      },
    }

    globals.DOMParser = class {
      parseFromString() {
        const svgNode = hasSvg ? svg : null
        const errorNode = parseError ? {} : null

        return { querySelector: (selector: string) => (selector === 'parsererror' ? errorNode : svgNode) }
      }
    }
    globals.document = { body: { appendChild: () => log.push('attach'), removeChild: () => log.push('detach') } }

    return log
  }

  it('sets the viewBox to the content box plus padding and detaches the element', async () => {
    const log = stubDom({ x: 10, y: 20, width: 30, height: 40 })

    expect(await cropSvg('<svg/>', 5)).toBe('<svg viewBox="5 15 40 50" style=""/>')
    expect(log).toEqual(['attach', 'detach'])
  })

  it('throws for an invalid svg, a missing svg element or empty content', async () => {
    stubDom({ x: 0, y: 0, width: 1, height: 1 }, { parseError: true })
    await expect(cropSvg('x')).rejects.toThrow('Invalid SVG')

    stubDom({ x: 0, y: 0, width: 1, height: 1 }, { hasSvg: false })
    await expect(cropSvg('x')).rejects.toThrow('No <svg> element found')

    const log = stubDom({ x: 0, y: 0, width: 0, height: 5 })

    await expect(cropSvg('<svg/>')).rejects.toThrow('SVG has no renderable content')
    expect(log).toEqual(['attach', 'detach'])
  })
})
