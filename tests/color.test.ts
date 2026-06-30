import { describe, expect, test as it } from 'bun:test'
import { opacityColor, randomHex, stringToHexColor } from '../src'
import { Color } from '../src/tools'

describe('hexToRgb function', () => {
  it('hex with # and 3 chars', () => {
    expect(Color.from('hex', '#666').to('rgb')).toStrictEqual([102, 102, 102])
  })

  it('hex with # and 6 chars', () => {
    expect(Color.from('hex', '#F9301A').to('rgb')).toStrictEqual([249, 48, 26])
  })

  it('hex with # and 8 chars', () => {
    expect(Color.from('hex', '#F9301AFF').to('rgb')).toStrictEqual([249, 48, 26])
  })

  it('hex with 3 chars', () => {
    expect(Color.from('hex', 'FFF').to('rgb')).toStrictEqual([255, 255, 255])
  })

  it('hex with 6 chars', () => {
    expect(Color.from('hex', '0FF00F').to('rgb')).toStrictEqual([15, 240, 15])
  })

  it('hex with 8 chars', () => {
    expect(Color.from('hex', '0FF00FFF').to('rgb')).toStrictEqual([15, 240, 15])
  })

  it('empty string', () => {
    expect(Color.from('hex', '').to('rgb')).toStrictEqual([0, 0, 0])
  })

  it('invalid characters', () => {
    expect(Color.from('hex', '#KG0').to('rgb')).toStrictEqual([0, 0, 0])
  })
})

describe('rgbToHex function', () => {
  it('rgb as array', () => {
    expect(Color.from('rgb', [102, 102, 102]).to('hex')).toBe('#666666')
  })

  it('rgb as args', () => {
    expect(Color.from('rgb', [15, 240, 15]).to('hex')).toBe('#0FF00F')
  })

  it('handle 0 as array', () => {
    expect(Color.from('rgb', [0, 0, 0]).to('hex')).toBe('#000000')
  })

  it('handle 0 as args', () => {
    expect(Color.from('rgb', [0, 0, 0]).to('hex')).toBe('#000000')
  })
})

describe('hslToHex function', () => {
  it('should convert HSL to hex correctly for red', () => {
    const result = Color.from('hsl', [0, 100, 50]).to('hex') // Red

    expect(result).toBe('#FF0000')
  })

  it('should convert HSL to hex correctly for green', () => {
    const result = Color.from('hsl', [120, 100, 50]).to('hex') // Green

    expect(result).toBe('#00FF00')
  })

  it('should convert HSL to hex correctly for blue', () => {
    const result = Color.from('hsl', [240, 100, 50]).to('hex') // Blue

    expect(result).toBe('#0000FF')
  })

  it('should handle gray colors (zero saturation)', () => {
    const result = Color.from('hsl', [0, 0, 50]).to('hex') // Gray

    expect(result).toBe('#808080')
  })
})

describe('randomHex function', () => {
  it('should generate a valid hex color string', () => {
    const result = randomHex()

    expect(result).toMatch(/^#[0-9A-F]{6}$/) // Checks format #XXXXXX with uppercase hex
  })

  it('should generate a different hex color each time', () => {
    const result1 = randomHex()
    const result2 = randomHex()

    expect(result1).not.toBe(result2) // Ensures randomness
  })
})

describe('opacityColor function', () => {
  const red = Color.from('hex', '#f00').to('rgb')
  const blue = Color.from('hex', '#00f').to('rgb')
  const purple = Color.from('hex', '#800080').to('rgb')

  it('should blend two colors based on the specified opacity', () => {
    const result = opacityColor(red, blue, 0.5) // Red and Blue blend with 50% opacity

    expect(result).toEqual(purple) // Expected result is purple
  })

  it('should return the first color when opacity is 1', () => {
    const result = opacityColor(red, blue, 1) // Full opacity for the first color

    expect(result).toEqual(red)
  })

  it('should return the second color when opacity is 0', () => {
    const result = opacityColor(red, blue, 0) // Full opacity for the second color

    expect(result).toEqual(blue)
  })
})

describe('stringToHex function', () => {
  it('always returns a 6-digit uppercase hex code', () => {
    const hex = stringToHexColor('foo')

    expect(hex).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('is deterministic: same input → same output', () => {
    const a = stringToHexColor('repeat-me')
    const b = stringToHexColor('repeat-me')

    expect(a).toBe(b)
  })

  it('produces different colors for different strings', () => {
    expect(stringToHexColor('apple')).not.toBe(stringToHexColor('banana'))
  })

  it('respects hueOffset', () => {
    const hex0 = stringToHexColor('hueTest', { hueOffset: 0 })
    const hex180 = stringToHexColor('hueTest', { hueOffset: 180 })
    const [h0] = Color.from('hex', hex0).to('hsl')
    const [h180] = Color.from('hex', hex180).to('hsl')

    // difference should be about 180 (mod 360)
    expect(Math.round((h180 - h0 + 360) % 360)).toBe(180)
  })

  it('limits saturation to sRange', () => {
    for (let i = 0; i < 10; i++) {
      const hex = stringToHexColor(`sat${i}`, { sRange: [10, 20] })
      const [, s] = Color.from('hex', hex).to('hsl')

      expect(s).toBeGreaterThanOrEqual(10)
      expect(s).toBeLessThanOrEqual(20)
    }
  })

  it('uses fixed lightness when l is a number', () => {
    const fixed = 42

    for (let i = 0; i < 5; i++) {
      const hex = stringToHexColor(`lum${i}`, { l: fixed })
      const [, , l] = Color.from('hex', hex).to('hsl')

      expect(Math.round(l)).toBe(fixed)
    }
  })
})

describe('hexToHsl function', () => {
  it('should convert red hex color to HSL correctly', () => {
    const result = Color.from('hex', '#ff0000').to('hsl')

    expect(result).toEqual([0, 100, 50]) // HSL for pure red
  })

  it('should convert green hex color to HSL correctly', () => {
    const result = Color.from('hex', '#00ff00').to('hsl')

    expect(result).toEqual([120, 100, 50]) // HSL for pure green
  })

  it('should convert blue hex color to HSL correctly', () => {
    const result = Color.from('hex', '#0000ff').to('hsl')

    expect(result).toEqual([240, 100, 50]) // HSL for pure blue
  })

  it('should convert black hex color to HSL correctly', () => {
    const result = Color.from('hex', '#000000').to('hsl')

    expect(result).toEqual([0, 0, 0]) // HSL for black (no hue or saturation, 0 lightness)
  })

  it('should convert white hex color to HSL correctly', () => {
    const result = Color.from('hex', '#ffffff').to('hsl')

    expect(result).toEqual([0, 0, 100]) // HSL for white (no hue or saturation, 100 lightness)
  })

  it('should convert gray hex color to HSL correctly', () => {
    const result = Color.from('hex', '#808080').to('hsl')

    expect(result).toEqual([0, 0, 50]) // HSL for gray (no hue or saturation, 50 lightness)
  })

  it('should convert a custom hex color to HSL correctly', () => {
    const result = Color.from('hex', '#4682b4').to('hsl') // Steel blue color

    expect(result).toEqual([207, 44, 49]) // Expected HSL for steel blue
  })
})

describe('hsv conversions', () => {
  it('should convert HSV to rgb correctly', () => {
    expect(Color.from('hsv', [0, 100, 100]).to('rgb')).toStrictEqual([255, 0, 0]) // Red
    expect(Color.from('hsv', [120, 100, 100]).to('rgb')).toStrictEqual([0, 255, 0]) // Green
    expect(Color.from('hsv', [240, 100, 100]).to('rgb')).toStrictEqual([0, 0, 255]) // Blue
    expect(Color.from('hsv', [0, 0, 100]).to('rgb')).toStrictEqual([255, 255, 255]) // White
    expect(Color.from('hsv', [0, 0, 0]).to('rgb')).toStrictEqual([0, 0, 0]) // Black
  })

  it('should convert HSV object to rgb correctly', () => {
    expect(Color.from('hsv', { h: 207, s: 61, v: 71 }).to('rgb')).toStrictEqual([71, 131, 181])
  })

  it('should convert rgb to HSV correctly', () => {
    expect(Color.from('rgb', [255, 0, 0]).to('hsv')).toEqual([0, 100, 100]) // Red
    expect(Color.from('rgb', [0, 255, 0]).to('hsv')).toEqual([120, 100, 100]) // Green
    expect(Color.from('rgb', [0, 0, 255]).to('hsv')).toEqual([240, 100, 100]) // Blue
    expect(Color.from('rgb', [255, 255, 255]).to('hsv')).toEqual([0, 0, 100]) // White
    expect(Color.from('rgb', [0, 0, 0]).to('hsv')).toEqual([0, 0, 0]) // Black
    expect(Color.from('hex', '#4682b4').to('hsv')).toEqual([207, 61, 71]) // Steel blue
  })

  it('should carry alpha through hsva', () => {
    expect(Color.from('hsv', [0, 100, 100, 0.5]).to('hsva')).toEqual([0, 100, 100, 0.5])
  })

  it('should round-trip rgb through hsv', () => {
    const hsv = Color.from('rgb', [71, 131, 181]).to('hsv')

    expect(Color.from('hsv', hsv).to('rgb')).toStrictEqual([71, 131, 181])
  })
})

describe('cmyk conversions', () => {
  it('should convert rgb to cmyk correctly', () => {
    expect(Color.from('rgb', [255, 0, 0]).to('cmyk')).toStrictEqual([0, 100, 100, 0]) // Red
    expect(Color.from('rgb', [0, 0, 0]).to('cmyk')).toStrictEqual([0, 0, 0, 100]) // Black
    expect(Color.from('rgb', [255, 255, 255]).to('cmyk')).toStrictEqual([0, 0, 0, 0]) // White
    expect(Color.from('hex', '#4682b4').to('cmyk')).toStrictEqual([61, 28, 0, 29]) // Steel blue
  })

  it('should convert cmyk to rgb correctly', () => {
    expect(Color.from('cmyk', [0, 100, 100, 0]).to('rgb')).toStrictEqual([255, 0, 0]) // Red
    expect(Color.from('cmyk', [0, 0, 0, 100]).to('rgb')).toStrictEqual([0, 0, 0]) // Black
    expect(Color.from('cmyk', { c: 0, m: 0, y: 0, k: 0 }).to('rgb')).toStrictEqual([255, 255, 255]) // White
  })

  it('should carry alpha through cmyka', () => {
    expect(Color.from('cmyk', [0, 100, 100, 0, 0.5]).to('cmyka')).toStrictEqual([0, 100, 100, 0, 0.5])
  })
})

describe('oklch conversions', () => {
  it('should convert rgb to oklch correctly', () => {
    expect(Color.from('rgb', [255, 0, 0]).to('oklch')).toStrictEqual([0.628, 0.2577, 29.22]) // Red
    expect(Color.from('rgb', [255, 255, 255]).to('oklch')).toStrictEqual([1, 0, 0]) // White
  })

  it('should convert oklch back to rgb correctly', () => {
    expect(Color.from('oklch', [0.628, 0.2577, 29.22]).to('rgb')).toStrictEqual([255, 0, 0])
    expect(Color.from('oklch', { l: 1, c: 0, h: 0 }).to('rgb')).toStrictEqual([255, 255, 255])
  })

  it('should round-trip rgb through oklch', () => {
    const oklch = Color.from('rgb', [71, 131, 181]).to('oklch')

    expect(Color.from('oklch', oklch).to('rgb')).toStrictEqual([71, 131, 181])
  })

  it('should carry alpha through oklcha', () => {
    expect(Color.from('oklch', [0.628, 0.2577, 29.22, 0.5]).to('oklcha')).toStrictEqual([0.628, 0.2577, 29.22, 0.5])
  })
})

describe('oklab conversions', () => {
  it('should convert rgb to oklab correctly', () => {
    expect(Color.from('rgb', [255, 0, 0]).to('oklab')).toStrictEqual([0.628, 0.2249, 0.1258]) // Red
    expect(Color.from('rgb', [255, 255, 255]).to('oklab')).toStrictEqual([1, 0, 0]) // White
  })

  it('should round-trip rgb through oklab', () => {
    const oklab = Color.from('rgb', [71, 131, 181]).to('oklab')

    expect(Color.from('oklab', oklab).to('rgb')).toStrictEqual([71, 131, 181])
  })

  it('should carry alpha through oklaba', () => {
    expect(Color.from('oklab', [0.628, 0.2249, 0.1258, 0.5]).to('oklaba')).toStrictEqual([0.628, 0.2249, 0.1258, 0.5])
  })
})
