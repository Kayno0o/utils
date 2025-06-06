export type RgbArrayType = [r: number, g: number, b: number]
export interface RgbObjectType { r: number, g: number, b: number, a?: number }
export type RgbaArrayType = [r: number, g: number, b: number, a: number]

export type HslArrayType = [h: number, s: number, l: number]
export interface HslObjectType { h: number, s: number, l: number, a?: number }
export type HslaArrayType = [h: number, s: number, l: number, a: number]

function hexToRgb(hex: string): [number, number, number] | [number, number, number, number] {
  // Remove leading '#' and convert to lowercase
  const cleanHex = hex.startsWith('#') ? hex.slice(1).toLowerCase() : hex.toLowerCase()

  // Validate hex characters
  if (!/^[a-f0-9]+$/.test(cleanHex))
    return [0, 0, 0]

  const len = cleanHex.length

  const parse = (s: string) => Number.parseInt(s, 16)

  if (len === 3 || len === 4) {
    const r = parse(cleanHex[0] + cleanHex[0])
    const g = parse(cleanHex[1] + cleanHex[1])
    const b = parse(cleanHex[2] + cleanHex[2])
    const a = len === 4 ? parse(cleanHex[3] + cleanHex[3]) : undefined
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

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
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

export type ColorType = 'hsl' | 'rgb' | 'hex' | 'hsl' | 'hsla' | 'rgba' | 'hexa'

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

      if (Array.isArray(value)) {
        [h, s, l, a] = value
      }
      else {
        ({ h, s, l, a } = value as HslObjectType)
      }

      const [r, g, b] = hslToRgb(h, s, l)

      return new Color(r, g, b, a)
    }

    throw new Error('Invalid input')
  }

  to(type: 'hsl'): HslArrayType
  to(type: 'rgb'): RgbArrayType
  to(type: 'hsla'): HslaArrayType
  to(type: 'rgba'): RgbaArrayType
  /** @return hex without # */
  to(type: 'hex'): string
  /** @return hex(a) without # */
  to(type: 'hexa'): string
  to(type: ColorType): RgbArrayType | RgbaArrayType | HslArrayType | HslaArrayType | string {
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
        return rgbToHsl([this.r, this.g, this.b])
      case 'hsla':
        return [...rgbToHsl([this.r, this.g, this.b]), this.a]
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

  /**
   * Pick black or white as the ideal foreground based on WCAG contrast ratio.
   */
  public bestContrastForeground(): Color {
    const white = new Color(255, 255, 255, 1)
    const black = new Color(0, 0, 0, 1)

    // compare contrast against white vs. black
    const contrastWithWhite = this.contrastRatio(white)
    const contrastWithBlack = this.contrastRatio(black)

    return contrastWithWhite >= contrastWithBlack ? white : black
  }
}
