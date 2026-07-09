import type { QrCodeGenerateData } from 'uqr'
import { encode, QrCodeDataType } from 'uqr'

export type QrModuleShape = 'square' | 'rounded' | 'dot'
export type QrEyeShape = 'square' | 'rounded' | 'circle'

export interface QrGradientStop {
  offset: number
  color: string
}

export interface QrGradient {
  type?: 'linear' | 'radial'
  /** Rotation in degrees, linear gradients only. */
  rotation?: number
  stops: QrGradientStop[]
}

export interface QrLogoOptions {
  /** Image source (URL or data URI). */
  href: string
  /** Logo width/height as a fraction of the code, excluding margin. @default 0.2 */
  size?: number
  /** Clear padding around the logo, in modules. @default 1 */
  margin?: number
  /** Knockout color behind the logo. Defaults to the code background or white. */
  background?: string
  /** Corner radius of the knockout, in modules. */
  borderRadius?: number
}

export interface QrCodeSvgOptions {
  /** Error correction level. @default 'M' */
  ecc?: 'L' | 'M' | 'Q' | 'H'
  minVersion?: number
  maxVersion?: number
  boostEcc?: boolean
  maskPattern?: number

  /** Quiet zone around the code, in modules. @default 4 */
  margin?: number
  /** Output width/height in px. Omit for a responsive (viewBox-only) SVG. */
  size?: number

  /** Solid color or gradient for the modules. @default 'black' */
  foreground?: string | QrGradient
  /** Background color. `null` or `'transparent'` omits the background rect. @default 'white' */
  background?: string | null

  moduleShape?: QrModuleShape
  /** Corner radius for `rounded` modules, 0..0.5 of a module. @default 0.35 */
  moduleRadius?: number

  /** Finder-pattern (eye) shape. Defaults to match `moduleShape`. */
  eyeShape?: QrEyeShape
  /** Solid eye color. Defaults to the foreground. */
  eyeColor?: string
  /** Corner radius for `rounded` eyes, in modules. @default 0.8 */
  eyeRadius?: number

  logo?: QrLogoOptions

  /** Prefix for internal SVG ids. Pass a unique value when embedding many codes in one document. @default 'qr' */
  id?: string
}

function n(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, '')
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))

  if (rad <= 0)
    return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`

  return `M${n(x + rad)} ${n(y)}`
    + `h${n(w - 2 * rad)}a${n(rad)} ${n(rad)} 0 0 1 ${n(rad)} ${n(rad)}`
    + `v${n(h - 2 * rad)}a${n(rad)} ${n(rad)} 0 0 1 ${n(-rad)} ${n(rad)}`
    + `h${n(-(w - 2 * rad))}a${n(rad)} ${n(rad)} 0 0 1 ${n(-rad)} ${n(-rad)}`
    + `v${n(-(h - 2 * rad))}a${n(rad)} ${n(rad)} 0 0 1 ${n(rad)} ${n(-rad)}z`
}

function gradientDef(gradient: QrGradient, id: string): string {
  const stops = gradient.stops
    .map(s => `<stop offset="${n(s.offset)}" stop-color="${s.color}"/>`)
    .join('')

  if (gradient.type === 'radial')
    return `<radialGradient id="${id}">${stops}</radialGradient>`

  const a = ((gradient.rotation ?? 0) * Math.PI) / 180
  const x1 = 0.5 - Math.cos(a) / 2
  const y1 = 0.5 - Math.sin(a) / 2
  const x2 = 0.5 + Math.cos(a) / 2
  const y2 = 0.5 + Math.sin(a) / 2

  return `<linearGradient id="${id}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stops}</linearGradient>`
}

function eyePath(ox: number, oy: number, shape: QrEyeShape, radius: number): string {
  if (shape === 'circle') {
    const ringOuter = `M${n(ox)} ${n(oy + 3.5)}a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z`
    const ringInner = `M${n(ox + 0.5)} ${n(oy + 3.5)}a3 3 0 1 1 6 0a3 3 0 1 1 -6 0z`
    const pupil = `M${n(ox + 2)} ${n(oy + 3.5)}a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0z`

    return ringOuter + ringInner + pupil
  }

  const r = shape === 'rounded' ? radius : 0
  const ringOuter = roundedRectPath(ox, oy, 7, 7, r)
  const ringInner = roundedRectPath(ox + 1, oy + 1, 5, 5, Math.max(0, r - 1))
  const pupil = roundedRectPath(ox + 2, oy + 2, 3, 3, Math.max(0, r - 2))

  return ringOuter + ringInner + pupil
}

/**
 * Generate a strongly-customizable QR code as an SVG string.
 *
 * Uses `uqr` for encoding and renders vector modules, styled finder patterns,
 * gradients, and an optional center logo. For logos, use `ecc: 'H'`.
 */
export function qrCodeSvg(data: QrCodeGenerateData, options: QrCodeSvgOptions = {}): string {
  const {
    ecc = 'M',
    minVersion,
    maxVersion,
    boostEcc,
    maskPattern,
    margin = 4,
    size,
    foreground = 'black',
    background = 'white',
    moduleShape = 'square',
    moduleRadius = 0.35,
    eyeShape = moduleShape === 'dot' ? 'circle' : moduleShape,
    eyeColor,
    eyeRadius = 0.8,
    logo,
    id = 'qr',
  } = options

  const result = encode(data, { ecc, minVersion, maxVersion, boostEcc, maskPattern, border: 0 })
  const count = result.size
  const total = count + margin * 2

  const isGradient = typeof foreground === 'object' && foreground !== null
  const fgFill = isGradient ? `url(#${id}-fg)` : foreground

  const defs = isGradient ? `<defs>${gradientDef(foreground, `${id}-fg`)}</defs>` : ''

  const eyeCorners: [number, number][] = [
    [margin, margin],
    [margin + count - 7, margin],
    [margin, margin + count - 7],
  ]

  const modules: string[] = []

  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (!result.data[y]![x])
        continue

      if (result.types[y]![x] === QrCodeDataType.Position)
        continue

      const px = x + margin
      const py = y + margin

      if (moduleShape === 'dot')
        modules.push(`M${n(px + 0.5)} ${n(py)}a0.5 0.5 0 1 0 0 1a0.5 0.5 0 1 0 0 -1z`)
      else if (moduleShape === 'rounded')
        modules.push(roundedRectPath(px, py, 1, 1, moduleRadius))
      else
        modules.push(`M${n(px)} ${n(py)}h1v1h-1z`)
    }
  }

  const eyes = eyeCorners.map(([ex, ey]) => eyePath(ex, ey, eyeShape, eyeRadius)).join('')

  const parts: string[] = [defs]

  if (background && background !== 'transparent')
    parts.push(`<rect width="${n(total)}" height="${n(total)}" fill="${background}"/>`)

  parts.push(`<path fill="${fgFill}" d="${modules.join('')}"/>`)
  parts.push(`<path fill="${eyeColor ?? fgFill}" fill-rule="evenodd" d="${eyes}"/>`)

  if (logo) {
    const { href, size: logoSize = 0.2, margin: logoMargin = 1, background: logoBg, borderRadius = 0 } = logo
    const dim = count * logoSize
    const knockout = dim + logoMargin * 2
    const cx = margin + (count - knockout) / 2
    const cy = margin + (count - knockout) / 2
    const bg = logoBg ?? (background && background !== 'transparent' ? background : 'white')

    parts.push(`<path fill="${bg}" d="${roundedRectPath(cx, cy, knockout, knockout, borderRadius)}"/>`)
    parts.push(`<image href="${href}" x="${n(cx + logoMargin)}" y="${n(cy + logoMargin)}" width="${n(dim)}" height="${n(dim)}" preserveAspectRatio="xMidYMid meet"/>`)
  }

  const dimensions = size !== undefined ? ` width="${n(size)}" height="${n(size)}"` : ''
  const crisp = moduleShape === 'square' && eyeShape === 'square' ? ' shape-rendering="crispEdges"' : ''

  return `<svg xmlns="http://www.w3.org/2000/svg"${dimensions} viewBox="0 0 ${n(total)} ${n(total)}"${crisp}>${parts.join('')}</svg>`
}
