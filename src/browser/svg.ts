import { round } from '../number'

const VIEWBOX_RE = /viewBox=["']\s*([\d\-.]+)[\s,]+([\d\-.]+)[\s,]+([\d\-.]+)[\s,]+([\d\-.]+)\s*["']/
const VIEWBOX_VALUE_RE = /viewBox=["'][^"']*["']/
const SVG_DIM_RE = (attr: string) => new RegExp(`<svg[^>]+${attr}=["']([\\d.]+)(?:px)?["']`)

/** Parses the `viewBox` attribute from an SVG string. Returns `null` when absent. */
export function getViewBox(svg: string): { x: number, y: number, w: number, h: number } | null {
  const m = svg.match(VIEWBOX_RE)

  return m ? { x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]) } : null
}

/** Reads a `width` or `height` attribute value from the root `<svg>` element. */
export function getSvgDimension(svg: string, attr: 'width' | 'height'): number | null {
  const m = svg.match(SVG_DIM_RE(attr))

  return m ? Number(m[1]) : null
}

/** Replaces (or inserts) the `viewBox` attribute in an SVG string. */
export function setViewBox(svg: string, x: number, y: number, w: number, h: number): string {
  const vb = `viewBox="${round(x)} ${round(y)} ${round(w)} ${round(h)}"`

  if (VIEWBOX_VALUE_RE.test(svg))
    return svg.replace(VIEWBOX_VALUE_RE, vb)

  return svg.replace('<svg', `<svg ${vb}`)
}

/**
 * Crops an SVG string to its content bounding box using the browser DOM.
 * Temporarily attaches the element to the document to measure `getBBox()`.
 * `padding` adds extra space around the content in SVG user units.
 */
export async function cropSvg(svgString: string, padding = 0): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')

  if (doc.querySelector('parsererror'))
    throw new Error('Invalid SVG')

  const svgEl = doc.querySelector('svg')

  if (!svgEl)
    throw new Error('No <svg> element found')

  svgEl.setAttribute('style', 'position:absolute;left:-9999px;visibility:hidden')
  document.body.appendChild(svgEl)

  try {
    const bbox = svgEl.getBBox()

    if (bbox.width === 0 || bbox.height === 0)
      throw new Error('SVG has no renderable content')

    svgEl.setAttribute(
      'viewBox',
      `${round(bbox.x - padding)} ${round(bbox.y - padding)} ${round(bbox.width + padding * 2)} ${round(bbox.height + padding * 2)}`,
    )

    svgEl.removeAttribute('style')

    return svgEl.outerHTML
  }
  finally {
    document.body.removeChild(svgEl)
  }
}
