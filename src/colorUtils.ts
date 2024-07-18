import { randomInt } from './numberUtils'

export function hexToRgb(hex: string): [number, number, number] {
  if (/[^#a-f0-9]/i.test(hex))
    return [0, 0, 0]

  if (hex.startsWith('#'))
    hex = hex.substring(1)

  if (hex.length === 3 || hex.length === 4)
    hex = hex.split('').map(char => char.repeat(2)).join('')

  if (hex.length !== 6 && hex.length !== 8)
    return [0, 0, 0]

  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)

  return [r, g, b]
}

export function rgbToHex(rgb: [number, number, number]): string
export function rgbToHex(r: number, g: number, b: number): string

export function rgbToHex(rgb: [number, number, number] | number, g?: number, b?: number): string {
  if (Array.isArray(rgb))
    [rgb, g, b] = rgb
  return `#${((1 << 24) + (rgb << 16) + (g! << 8) + b!).toString(16).slice(1)}`.toUpperCase()
}

export function randomHex(isCrypto = false) {
  return `#${Math.floor(randomInt(0, 16777215, isCrypto)).toString(16).padStart(6, '0')}`.toUpperCase()
}

export function opacityColor(hex1: string, hex2: string, a1: number) {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)

  const r3 = r2 + (r1 - r2) * a1
  const g3 = g2 + (g1 - g2) * a1
  const b3 = b2 + (b1 - b2) * a1

  return rgbToHex(r3, g3, b3)
}
