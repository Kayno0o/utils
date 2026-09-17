import { Color } from '../tools/ColorConverter'

const RGB_CHANNELS = /[\d.]+/g

/**
 * Any colour CSS understands, named, `rgb()`, `hsl()`, `oklch()` or hex, as the browser resolves
 * it to sRGB. `null` when CSS does not take it; the canvas is what does the resolving.
 */
export function parseCssColor(input: string): Color | null {
  const value = input.trim()

  if (!value || !CSS.supports('color', value))
    return null

  const context = document.createElement('canvas').getContext('2d')

  if (!context)
    return null

  context.fillStyle = value

  // A canvas gives an opaque colour back as `#rrggbb` and a translucent one as `rgba(...)`.
  const resolved = context.fillStyle

  if (resolved.startsWith('#'))
    return Color.from('hex', resolved.slice(1))

  const [r = 0, g = 0, b = 0, a = 1] = (resolved.match(RGB_CHANNELS) ?? []).map(Number)

  return Color.from('rgb', [r, g, b, a])
}
