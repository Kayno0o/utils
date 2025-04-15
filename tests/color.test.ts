import { describe, expect, test as it } from 'bun:test'
import { ColorConverter, colorFromString, opacityColor, randomHex, randomString } from '~'

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
  it('should blend two colors based on the specified opacity', () => {
    const result = opacityColor('#ff0000', '#0000ff', 0.5) // Red and Blue blend with 50% opacity
    expect(result).toBe('#800080') // Expected result is purple
  })

  it('should return the first color when opacity is 1', () => {
    const result = opacityColor('#ff0000', '#0000ff', 1) // Full opacity for the first color
    expect(result).toBe('#FF0000')
  })

  it('should return the second color when opacity is 0', () => {
    const result = opacityColor('#ff0000', '#0000ff', 0) // Full opacity for the second color
    expect(result).toBe('#0000FF')
  })
})

describe('colorFromString function', () => {
  it('should generate a consistent color for the same string', () => {
    const color1 = colorFromString('hello')
    const color2 = colorFromString('hello')
    expect(color1).toBe(color2) // Same color for the same string
  })

  it('should generate different colors for different strings', () => {
    const color1 = colorFromString('hello')
    const color2 = colorFromString('world')
    expect(color1).not.toBe(color2) // Different colors for different strings
  })

  it('should respect hue decay for the same string', () => {
    const color1 = colorFromString('test', { hueDecay: 10 })
    const color2 = colorFromString('test', { hueDecay: 20 })
    expect(color1).not.toBe(color2) // Different hues due to decay
  })

  it('should stay within saturation range', () => {
    const color = colorFromString(randomString(10), { sRange: [30, 70] })
    const [, s] = ColorConverter.from('hex', color).to('hsl')

    expect(s).toBeGreaterThanOrEqual(30)
    expect(s).toBeLessThanOrEqual(70)
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
