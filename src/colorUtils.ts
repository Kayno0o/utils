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

export function hslToHex(h: number, s: number, l: number) {
  h = (h % 360 + 360) % 360
  l /= 100

  const a = s * Math.min(l, 1 - l) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }

  return `#${f(0)}${f(8)}${f(4)}`
}

export function randomHex(isCrypto = false) {
  return `#${Math.floor(randomInt(0, 16777215, isCrypto)).toString(16).padStart(6, '0')}`.toUpperCase()
}

export function opacityColor(hex1: string, hex2: string, a1: number) {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)

  const r3 = Math.round(r2 + (r1 - r2) * a1)
  const g3 = Math.round(g2 + (g1 - g2) * a1)
  const b3 = Math.round(b2 + (b1 - b2) * a1)

  return rgbToHex(r3, g3, b3)
}

export function colorFromString(str: string, { hueDecay = 0, l = 65, sRange = [40, 60] }: { hueDecay?: number, l?: number, sRange?: [number, number] } = {}) {
  let hash = 0
  for (const char of str) {
    hash ^= char.charCodeAt(0) + ((hash << 5) - hash)
  }

  const h = (hash + hueDecay) % 360
  const s = sRange[0] + (Math.abs(hash) % (sRange[1] - sRange[0]))

  return hslToHex(h, s, l)
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(value => value / 255)

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
