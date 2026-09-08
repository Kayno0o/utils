import type { RgbArrayType } from './tools/ColorConverter'
import { hashString } from './crypto'
import { clamp, mapRange, randomInt } from './number'
import { Color } from './tools/ColorConverter'

export function randomHex(isCrypto = false) {
  return `#${Math.floor(randomInt(0, 16777215, isCrypto)).toString(16).padStart(6, '0')}`.toUpperCase()
}

/** @deprecated use `blendRgb` */
export const opacityColor = blendRgb
export function blendRgb(rgb1: RgbArrayType, rgb2: RgbArrayType, a1: number): RgbArrayType {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2

  const r3 = Math.round(r2 + (r1 - r2) * a1)
  const g3 = Math.round(g2 + (g1 - g2) * a1)
  const b3 = Math.round(b2 + (b1 - b2) * a1)

  return [r3, g3, b3]
}

export function stringToHexColor(str: string, {
  // hueOffset lets you rotate the whole palette,
  // lRange lets you randomize lightness if you want
  hueOffset = 0,
  l = 65,
  sRange = [40, 60] as [number, number],
} = {}): string {
  const h = (Math.round(mapRange(hashString(`${str}|hue`), 0, 1, 0, 360)) + hueOffset) % 360
  const s = Math.round(mapRange(hashString(`${str}|sat`), 0, 1, sRange[0], sRange[1]))

  return Color.from('hsl', [h, s, l]).to('hex')
}

/** WCAG relative luminance (0-1) of a hex color. */
export function luminance(color: string): number {
  const [r, g, b] = Color.from('hex', color).to('rgb')
  const lin = (channel: number) => {
    const c = channel / 255

    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio (1-21) between two hex colors, order-insensitive. */
export function contrastRatio(color1: string, color2: string): number {
  return Color.from('hex', color1).contrastRatio(Color.from('hex', color2))
}

/** Whether white text reads better than black on `color` (i.e. the color is dark). */
export function isDark(color: string): boolean {
  return Color.from('hex', color).bestContrastForeground().to('rgb')[0] === 255
}

/** Opposite of {@link isDark}. */
export function isLight(color: string): boolean {
  return !isDark(color)
}

/** Lighten a hex color by `amount` (0-1) of the full lightness range. */
export function lighten(color: string, amount: number): string {
  const [h, s, l] = Color.from('hex', color).to('hsl')

  return Color.from('hsl', [h, s, clamp(l + amount * 100, 0, 100)]).to('hex')
}

/** Darken a hex color by `amount` (0-1) of the full lightness range. */
export function darken(color: string, amount: number): string {
  return lighten(color, -amount)
}

/** Blend two hex colors in RGB space; `weight` is the proportion of `color2` (0-1, default 0.5). */
export function mix(color1: string, color2: string, weight = 0.5): string {
  const [r1, g1, b1] = Color.from('hex', color1).to('rgb')
  const [r2, g2, b2] = Color.from('hex', color2).to('rgb')
  const w = clamp(weight, 0, 1)
  const blend = (a: number, b: number) => Math.round(a + (b - a) * w)

  return Color.from('rgb', [blend(r1, r2), blend(g1, g2), blend(b1, b2)]).to('hex')
}

/** Complementary hex color (hue rotated 180deg). */
export function complementary(color: string): string {
  const [h, s, l] = Color.from('hex', color).to('hsl')

  return Color.from('hsl', [(h + 180) % 360, s, l]).to('hex')
}

/** Triadic palette: the color plus the two hues 120deg apart. */
export function triadic(color: string): [string, string, string] {
  const [h, s, l] = Color.from('hex', color).to('hsl')

  return [
    Color.from('hsl', [h, s, l]).to('hex'),
    Color.from('hsl', [(h + 120) % 360, s, l]).to('hex'),
    Color.from('hsl', [(h + 240) % 360, s, l]).to('hex'),
  ]
}

/** 0..1 alpha as the 2-char hex suffix of an 8-digit hex colour. */
export function alphaHex(alpha: number): string {
  return Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0')
}
