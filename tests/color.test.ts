import { describe, expect, test as it } from 'bun:test'
import { ColorConverter, opacityColor, randomHex, stringToHex } from '~'

describe('hexToRgb function', () => {
  it('hex with # and 3 chars', () => {
    expect(ColorConverter.from('hex', '#666').to('rgb')).toStrictEqual([102, 102, 102])
  })

  it('hex with # and 6 chars', () => {
    expect(ColorConverter.from('hex', '#F9301A').to('rgb')).toStrictEqual([249, 48, 26])
  })

  it('hex with # and 8 chars', () => {
    expect(ColorConverter.from('hex', '#F9301AFF').to('rgb')).toStrictEqual([249, 48, 26])
  })

  it('hex with 3 chars', () => {
    expect(ColorConverter.from('hex', 'FFF').to('rgb')).toStrictEqual([255, 255, 255])
  })

  it('hex with 6 chars', () => {
    expect(ColorConverter.from('hex', '0FF00F').to('rgb')).toStrictEqual([15, 240, 15])
  })

  it('hex with 8 chars', () => {
    expect(ColorConverter.from('hex', '0FF00FFF').to('rgb')).toStrictEqual([15, 240, 15])
  })

  it('empty string', () => {
    expect(ColorConverter.from('hex', '').to('rgb')).toStrictEqual([0, 0, 0])
  })

  it('invalid characters', () => {
    expect(ColorConverter.from('hex', '#KG0').to('rgb')).toStrictEqual([0, 0, 0])
  })
})

describe('rgbToHex function', () => {
  it('rgb as array', () => {
    expect(ColorConverter.from('rgb', [102, 102, 102]).to('hex')).toBe('#666666')
  })

  it('rgb as args', () => {
    expect(ColorConverter.from('rgb', [15, 240, 15]).to('hex')).toBe('#0FF00F')
  })

  it('handle 0 as array', () => {
    expect(ColorConverter.from('rgb', [0, 0, 0]).to('hex')).toBe('#000000')
  })

  it('handle 0 as args', () => {
    expect(ColorConverter.from('rgb', [0, 0, 0]).to('hex')).toBe('#000000')
  })
})

describe('hslToHex function', () => {
  it('should convert HSL to hex correctly for red', () => {
    const result = ColorConverter.from('hsl', [0, 100, 50]).to('hex') // Red
    expect(result).toBe('#FF0000')
  })

  it('should convert HSL to hex correctly for green', () => {
    const result = ColorConverter.from('hsl', [120, 100, 50]).to('hex') // Green
    expect(result).toBe('#00FF00')
  })

  it('should convert HSL to hex correctly for blue', () => {
    const result = ColorConverter.from('hsl', [240, 100, 50]).to('hex') // Blue
    expect(result).toBe('#0000FF')
  })

  it('should handle gray colors (zero saturation)', () => {
    const result = ColorConverter.from('hsl', [0, 0, 50]).to('hex') // Gray
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
  const red = ColorConverter.from('hex', '#f00').to('rgb')
  const blue = ColorConverter.from('hex', '#00f').to('rgb')
  const purple = ColorConverter.from('hex', '#800080').to('rgb')
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
    const hex = stringToHex('foo')
    expect(hex).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('is deterministic: same input → same output', () => {
    const a = stringToHex('repeat-me')
    const b = stringToHex('repeat-me')
    expect(a).toBe(b)
  })

  it('produces different colors for different strings', () => {
    expect(stringToHex('apple')).not.toBe(stringToHex('banana'))
  })

  it('respects hueOffset', () => {
    const hex0 = stringToHex('hueTest', { hueOffset: 0 })
    const hex180 = stringToHex('hueTest', { hueOffset: 180 })
    const [h0] = ColorConverter.from('hex', hex0).to('hsl')
    const [h180] = ColorConverter.from('hex', hex180).to('hsl')
    // difference should be about 180 (mod 360)
    expect(Math.round((h180 - h0 + 360) % 360)).toBe(180)
  })

  it('limits saturation to sRange', () => {
    for (let i = 0; i < 10; i++) {
      const hex = stringToHex(`sat${i}`, { sRange: [10, 20] })
      const [, s] = ColorConverter.from('hex', hex).to('hsl')
      expect(s).toBeGreaterThanOrEqual(10)
      expect(s).toBeLessThanOrEqual(20)
    }
  })

  it('uses fixed lightness when l is a number', () => {
    const fixed = 42
    for (let i = 0; i < 5; i++) {
      const hex = stringToHex(`lum${i}`, { l: fixed })
      const [, , l] = ColorConverter.from('hex', hex).to('hsl')
      expect(Math.round(l)).toBe(fixed)
    }
  })
})

describe('hexToHsl function', () => {
  it('should convert red hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#ff0000').to('hsl')
    expect(result).toEqual([0, 100, 50]) // HSL for pure red
  })

  it('should convert green hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#00ff00').to('hsl')
    expect(result).toEqual([120, 100, 50]) // HSL for pure green
  })

  it('should convert blue hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#0000ff').to('hsl')
    expect(result).toEqual([240, 100, 50]) // HSL for pure blue
  })

  it('should convert black hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#000000').to('hsl')
    expect(result).toEqual([0, 0, 0]) // HSL for black (no hue or saturation, 0 lightness)
  })

  it('should convert white hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#ffffff').to('hsl')
    expect(result).toEqual([0, 0, 100]) // HSL for white (no hue or saturation, 100 lightness)
  })

  it('should convert gray hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#808080').to('hsl')
    expect(result).toEqual([0, 0, 50]) // HSL for gray (no hue or saturation, 50 lightness)
  })

  it('should convert a custom hex color to HSL correctly', () => {
    const result = ColorConverter.from('hex', '#4682b4').to('hsl') // Steel blue color
    expect(result).toEqual([207, 44, 49]) // Expected HSL for steel blue
  })
})
