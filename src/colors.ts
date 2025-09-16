import type { RgbArrayType } from './tools/ColorConverter'
import { numberFromString, randomInt } from './number'
import { Color } from './tools/ColorConverter'

export function randomHex(isCrypto = false) {
  return `#${Math.floor(randomInt(0, 16777215, isCrypto)).toString(16).padStart(6, '0')}`.toUpperCase()
}

export function opacityColor(rgb1: RgbArrayType, rgb2: RgbArrayType, a1: number): RgbArrayType {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2

  const r3 = Math.round(r2 + (r1 - r2) * a1)
  const g3 = Math.round(g2 + (g1 - g2) * a1)
  const b3 = Math.round(b2 + (b1 - b2) * a1)

  return [r3, g3, b3]
}

export function stringToHex(str: string, {
  // hueOffset lets you rotate the whole palette,
  // lRange lets you randomize lightness if you want
  hueOffset = 0,
  l = 65,
  sRange = [40, 60] as [number, number],
} = {}): string {
  const h = (numberFromString(`${str}|hue`, 0, 360) + hueOffset) % 360
  const s = numberFromString(`${str}|sat`, sRange[0], sRange[1])

  return Color.from('hsl', [h, s, l]).to('hex')
}
