export type RgbArrayType = [r: number, g: number, b: number]
export interface RgbObjectType { r: number, g: number, b: number, a?: number }
export type RgbaArrayType = [r: number, g: number, b: number, a: number]

export type HslArrayType = [h: number, s: number, l: number]
export interface HslObjectType { h: number, s: number, l: number, a?: number }
export type HslaArrayType = [h: number, s: number, l: number, a: number]

export type HsvArrayType = [h: number, s: number, v: number]
export interface HsvObjectType { h: number, s: number, v: number, a?: number }
export type HsvaArrayType = [h: number, s: number, v: number, a: number]

export type CmykArrayType = [c: number, m: number, y: number, k: number]
export interface CmykObjectType { c: number, m: number, y: number, k: number, a?: number }
export type CmykaArrayType = [c: number, m: number, y: number, k: number, a: number]

export type OklchArrayType = [l: number, c: number, h: number]
export interface OklchObjectType { l: number, c: number, h: number, a?: number }
export type OklchaArrayType = [l: number, c: number, h: number, a: number]

export type OklabArrayType = [l: number, a: number, b: number]
export interface OklabObjectType { l: number, a: number, b: number, alpha?: number }
export type OklabaArrayType = [l: number, a: number, b: number, alpha: number]

const HEX_DIGITS = /^[a-f0-9]+$/i

function hexToRgb(hex: string): [number, number, number] | [number, number, number, number] {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex

  if (!HEX_DIGITS.test(cleanHex))
    return [0, 0, 0]

  const len = cleanHex.length

  if (len === 6) {
    const value = Number.parseInt(cleanHex, 16)

    return [value >> 16, value >> 8 & 255, value & 255]
  }

  const parse = (s: string) => Number.parseInt(s, 16)

  if (len === 3 || len === 4) {
    const r = parse(cleanHex[0]! + cleanHex[0]!)
    const g = parse(cleanHex[1]! + cleanHex[1]!)
    const b = parse(cleanHex[2]! + cleanHex[2]!)
    const a = len === 4 ? parse(cleanHex[3]! + cleanHex[3]!) : undefined

    return a !== undefined ? [r, g, b, a] : [r, g, b]
  }

  if (len !== 6 && len !== 8)
    throw new Error(`Invalid hex color length: ${len}`)

  const r = parse(cleanHex.slice(0, 2))
  const g = parse(cleanHex.slice(2, 4))
  const b = parse(cleanHex.slice(4, 6))
  const a = len === 8 ? parse(cleanHex.slice(6, 8)) : undefined

  if ([r, g, b].some(Number.isNaN) || (a !== undefined && Number.isNaN(a)))
    throw new Error(`Invalid hex color value: ${hex}`)

  return a !== undefined ? [r, g, b, a] : [r, g, b]
}

function rgbToHex(rgb: RgbArrayType | RgbaArrayType): string {
  const [r, g, b, a] = rgb

  if (a)
    return `#${((r << 24) | (g << 16) | (b << 8) | Math.round((a ?? 1) * 255)).toString(16).padStart(8, '0').toUpperCase()}`

  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase()}`
}

function hslToRgb(h: number, s: number, l: number): RgbArrayType {
  h = (h % 360 + 360) % 360
  l /= 100

  const a = s * Math.min(l, 1 - l) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)

    return Math.round(255 * color)
  }

  return [f(0), f(8), f(4)]
}

function rgbToHsl(rgb: RgbArrayType): HslArrayType

function rgbToHsl(rgb: RgbArrayType): HslArrayType {
  let [r, g, b] = rgb

  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min

    s = l > 0 && l < 1 ? d / (1 - Math.abs(2 * l - 1)) : 0

    if (max === r)
      h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g)
      h = (b - r) / d + 2
    else h = (r - g) / d + 4

    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

function hsvToRgb(h: number, s: number, v: number): RgbArrayType {
  h = (h % 360 + 360) % 360
  s /= 100
  v /= 100

  const f = (n: number) => {
    const k = (n + h / 60) % 6
    const color = v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)

    return Math.round(255 * color)
  }

  return [f(5), f(3), f(1)]
}

function rgbToHsv(rgb: RgbArrayType): HsvArrayType {
  let [r, g, b] = rgb

  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (d !== 0) {
    if (max === r)
      h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g)
      h = (b - r) / d + 2
    else h = (r - g) / d + 4

    h /= 6
  }

  return [h * 360, s * 100, v * 100]
}

function rgbToCmyk(rgb: RgbArrayType): CmykArrayType {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const k = 1 - Math.max(r, g, b)

  if (k === 1)
    return [0, 0, 0, 100]

  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)

  return [c * 100, m * 100, y * 100, k * 100]
}

function cmykToRgb(c: number, m: number, y: number, k: number): RgbArrayType {
  c /= 100
  m /= 100
  y /= 100
  k /= 100

  return [
    Math.round(255 * (1 - c) * (1 - k)),
    Math.round(255 * (1 - m) * (1 - k)),
    Math.round(255 * (1 - y) * (1 - k)),
  ]
}

const srgbToLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
// The 256 channel values every conversion from RGB starts from, worked out once rather than three pow calls a colour.
const LINEAR_OF_BYTE = Array.from({ length: 256 }, (_, byte) => srgbToLinear(byte / 255))
const linearOfChannel = (channel: number) => Number.isInteger(channel) && channel >= 0 && channel <= 255 ? LINEAR_OF_BYTE[channel]! : srgbToLinear(channel / 255)
const linearToSrgb = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055

function roundTo(n: number, p: number): number {
  const scale = p === 4 ? 10_000 : p === 2 ? 100 : 10 ** p

  return Math.round(n * scale) / scale
}

function rgbToOklab(rgb: RgbArrayType): OklabArrayType {
  const r = linearOfChannel(rgb[0])
  const g = linearOfChannel(rgb[1])
  const b = linearOfChannel(rgb[2])

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToRgb(L: number, a: number, b: number): RgbArrayType {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  const r = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bb = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)

  const clamp = (c: number) => Math.min(255, Math.max(0, Math.round(c * 255)))

  return [clamp(r), clamp(g), clamp(bb)]
}

// Below this a grey's float noise in a and b would hand it an arbitrary hue.
const ACHROMATIC_CHROMA = 5e-5

function rgbToOklch(rgb: RgbArrayType): OklchArrayType {
  const [l, a, b] = rgbToOklab(rgb)
  const c = Math.sqrt(a * a + b * b)
  const h = c < ACHROMATIC_CHROMA ? 0 : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360

  return [l, c, h]
}

function oklchToRgb(l: number, c: number, h: number): RgbArrayType {
  const rad = h * Math.PI / 180

  return oklabToRgb(l, c * Math.cos(rad), c * Math.sin(rad))
}

/**
 * Convert sRGB channel (0–255) → linearized channel per WCAG2 (for relative luminance).
 */
function linearize(channel: number): number {
  const c = channel / 255

  return c <= 0.03928
    ? c / 12.92
    : ((c + 0.055) / 1.055) ** 2.4
}

export type ColorType = 'hsl' | 'rgb' | 'hex' | 'hsla' | 'rgba' | 'hexa' | 'hsv' | 'hsva' | 'cmyk' | 'cmyka' | 'oklch' | 'oklcha' | 'oklab' | 'oklaba'

export interface ColorToOptions {
  /** Decimals kept on each channel, `false` for none dropped. Defaults to whole numbers for hsl, hsv and cmyk, 4 decimals for oklab, and 4, 4, 2 for oklch. */
  precision?: number | false
}

/** Rounds each channel to `precision` decimals, or to `defaults` per channel; alpha is left alone. */
function roundChannels<T extends number[]>(values: T, defaults: number[], precision: number | false | undefined): T {
  return precision === false ? values : values.map((value, i) => roundTo(value, precision ?? defaults[i]!)) as T
}

const WHOLE = [0, 0, 0, 0]
const OKLAB_DECIMALS = [4, 4, 4]
const OKLCH_DECIMALS = [4, 4, 2]

export class Color {
  private r: number
  private g: number
  private b: number
  private a: number

  constructor(r: number, g: number, b: number, a = 1) {
    this.r = r
    this.g = g
    this.b = b
    this.a = a
  }

  static from(type: 'hex', value: string | number): Color
  static from(type: 'rgb', value: RgbArrayType | RgbaArrayType | RgbObjectType): Color
  static from(type: 'hsl', value: HslArrayType | HslaArrayType | HslObjectType): Color
  static from(type: 'hsv', value: HsvArrayType | HsvaArrayType | HsvObjectType): Color
  static from(type: 'cmyk', value: CmykArrayType | CmykaArrayType | CmykObjectType): Color
  static from(type: 'oklch', value: OklchArrayType | OklchaArrayType | OklchObjectType): Color
  static from(type: 'oklab', value: OklabArrayType | OklabaArrayType | OklabObjectType): Color
  static from(type: ColorType, value: any): Color {
    if (type === 'hex') {
      const [r, g, b, a] = hexToRgb(value)

      return new Color(r, g, b, a)
    }

    if (type === 'rgb') {
      if (Array.isArray(value)) {
        const [r, g, b, a] = value as RgbArrayType | RgbaArrayType

        return new Color(r, g, b, a)
      }

      const { r, g, b, a } = value as RgbObjectType

      return new Color(r, g, b, a)
    }

    if (type === 'hsl') {
      let h, s, l, a

      if (Array.isArray(value))
        [h, s, l, a] = value

      else
        ({ h, s, l, a } = value as HslObjectType)

      const [r, g, b] = hslToRgb(h, s, l)

      return new Color(r, g, b, a)
    }

    if (type === 'hsv') {
      let h, s, v, a

      if (Array.isArray(value))
        [h, s, v, a] = value

      else
        ({ h, s, v, a } = value as HsvObjectType)

      const [r, g, b] = hsvToRgb(h, s, v)

      return new Color(r, g, b, a)
    }

    if (type === 'cmyk') {
      let c, m, y, k, a

      if (Array.isArray(value))
        [c, m, y, k, a] = value

      else
        ({ c, m, y, k, a } = value as CmykObjectType)

      const [r, g, b] = cmykToRgb(c, m, y, k)

      return new Color(r, g, b, a)
    }

    if (type === 'oklch') {
      let l, c, h, a

      if (Array.isArray(value))
        [l, c, h, a] = value

      else
        ({ l, c, h, a } = value as OklchObjectType)

      const [r, g, b] = oklchToRgb(l, c, h)

      return new Color(r, g, b, a)
    }

    if (type === 'oklab') {
      let l, a, b, alpha

      if (Array.isArray(value))
        [l, a, b, alpha] = value

      else
        ({ l, a, b, alpha } = value as OklabObjectType)

      const [r, g, bl] = oklabToRgb(l, a, b)

      return new Color(r, g, bl, alpha)
    }

    throw new Error('Invalid input')
  }

  to(type: 'hsl', options?: ColorToOptions): HslArrayType
  to(type: 'rgb', options?: ColorToOptions): RgbArrayType
  to(type: 'hsla', options?: ColorToOptions): HslaArrayType
  to(type: 'hsv', options?: ColorToOptions): HsvArrayType
  to(type: 'hsva', options?: ColorToOptions): HsvaArrayType
  to(type: 'cmyk', options?: ColorToOptions): CmykArrayType
  to(type: 'cmyka', options?: ColorToOptions): CmykaArrayType
  to(type: 'oklch', options?: ColorToOptions): OklchArrayType
  to(type: 'oklcha', options?: ColorToOptions): OklchaArrayType
  to(type: 'oklab', options?: ColorToOptions): OklabArrayType
  to(type: 'oklaba', options?: ColorToOptions): OklabaArrayType
  to(type: 'rgba', options?: ColorToOptions): RgbaArrayType
  /** @return hex without # */
  to(type: 'hex', options?: ColorToOptions): string
  /** @return hex(a) without # */
  to(type: 'hexa', options?: ColorToOptions): string
  to(type: ColorType, { precision }: ColorToOptions = {}): RgbArrayType | RgbaArrayType | HslArrayType | HslaArrayType | HsvArrayType | HsvaArrayType | CmykArrayType | CmykaArrayType | OklchArrayType | OklchaArrayType | OklabArrayType | OklabaArrayType | string {
    const rgb: RgbArrayType = [this.r, this.g, this.b]

    switch (type) {
      case 'rgb':
        return [this.r, this.g, this.b]

      case 'rgba':
        return [this.r, this.g, this.b, this.a]

      case 'hex':
        return rgbToHex([this.r, this.g, this.b])

      case 'hexa':
        return rgbToHex([this.r, this.g, this.b, this.a])

      case 'hsl':
        return roundChannels(rgbToHsl(rgb), WHOLE, precision)

      case 'hsla':
        return [...roundChannels(rgbToHsl(rgb), WHOLE, precision), this.a]

      case 'hsv':
        return roundChannels(rgbToHsv(rgb), WHOLE, precision)

      case 'hsva':
        return [...roundChannels(rgbToHsv(rgb), WHOLE, precision), this.a]

      case 'cmyk':
        return roundChannels(rgbToCmyk(rgb), WHOLE, precision)

      case 'cmyka':
        return [...roundChannels(rgbToCmyk(rgb), WHOLE, precision), this.a]

      case 'oklch':
        return roundChannels(rgbToOklch(rgb), OKLCH_DECIMALS, precision)

      case 'oklcha':
        return [...roundChannels(rgbToOklch(rgb), OKLCH_DECIMALS, precision), this.a]

      case 'oklab':
        return roundChannels(rgbToOklab(rgb), OKLAB_DECIMALS, precision)

      case 'oklaba':
        return [...roundChannels(rgbToOklab(rgb), OKLAB_DECIMALS, precision), this.a]
      default:
        return [this.r, this.g, this.b]
    }
  }

  /**
   * Compute relative luminance (0–1) per WCAG2:
   * L = 0.2126 R + 0.7152 G + 0.0722 B
   */
  private getLuminance(): number {
    const R = linearize(this.r)
    const G = linearize(this.g)
    const B = linearize(this.b)

    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }

  /**
   * Contrast ratio between this color and another:
   * (L1 + 0.05) / (L2 + 0.05), L1 ≥ L2
   */
  public contrastRatio(other: Color): number {
    const L1 = this.getLuminance()
    const L2 = other.getLuminance()
    const [bright, dark] = L1 >= L2 ? [L1, L2] : [L2, L1]

    return (bright + 0.05) / (dark + 0.05)
  }

  /** The candidate with the highest WCAG contrast against this color, white then black by default; a tie goes to the earlier one. */
  public bestContrastForeground(candidates: Color[] = [new Color(255, 255, 255, 1), new Color(0, 0, 0, 1)]): Color {
    let best = candidates[0]

    if (!best)
      throw new Error('bestContrastForeground needs at least one candidate')

    let bestRatio = this.contrastRatio(best)

    for (const candidate of candidates.slice(1)) {
      const ratio = this.contrastRatio(candidate)

      if (ratio > bestRatio) {
        best = candidate
        bestRatio = ratio
      }
    }

    return best
  }
}
