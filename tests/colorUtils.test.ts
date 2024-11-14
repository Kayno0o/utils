import { colorFromString, hexToHsl, hexToRgb, hslToHex, opacityColor, randomHex, randomString, rgbToHex } from '~'
import { describe, expect, test as it } from 'bun:test'

describe('hexToRgb function', () => {
  it('hex with # and 3 chars', () => {
    expect(hexToRgb('#666')).toStrictEqual([102, 102, 102])
  })

  it('hex with # and 6 chars', () => {
    expect(hexToRgb('#F9301A')).toStrictEqual([249, 48, 26])
  })

  it('hex with # and 8 chars', () => {
    expect(hexToRgb('#F9301AFF')).toStrictEqual([249, 48, 26])
  })

  it('hex with 3 chars', () => {
    expect(hexToRgb('FFF')).toStrictEqual([255, 255, 255])
  })

  it('hex with 6 chars', () => {
    expect(hexToRgb('0FF00F')).toStrictEqual([15, 240, 15])
  })

  it('hex with 8 chars', () => {
    expect(hexToRgb('0FF00FFF')).toStrictEqual([15, 240, 15])
  })

  it('empty string', () => {
    expect(hexToRgb('')).toStrictEqual([0, 0, 0])
  })

  it('invalid characters', () => {
    expect(hexToRgb('#KG0')).toStrictEqual([0, 0, 0])
  })
})

describe('rgbToHex function', () => {
  it('rgb as array', () => {
    expect(rgbToHex([102, 102, 102])).toBe('#666666')
  })

  it('rgb as args', () => {
    expect(rgbToHex(15, 240, 15)).toBe('#0FF00F')
  })

  it('handle 0 as array', () => {
    expect(rgbToHex([0, 0, 0])).toBe('#000000')
  })

  it('handle 0 as args', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })
})

describe('hslToHex function', () => {
  it('should convert HSL to hex correctly for red', () => {
    const result = hslToHex(0, 100, 50) // Red
    expect(result).toBe('#ff0000')
  })

  it('should convert HSL to hex correctly for green', () => {
    const result = hslToHex(120, 100, 50) // Green
    expect(result).toBe('#00ff00')
  })

  it('should convert HSL to hex correctly for blue', () => {
    const result = hslToHex(240, 100, 50) // Blue
    expect(result).toBe('#0000ff')
  })

  it('should handle gray colors (zero saturation)', () => {
    const result = hslToHex(0, 0, 50) // Gray
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
    const [, s] = hexToHsl(color)

    expect(s).toBeGreaterThanOrEqual(30)
    expect(s).toBeLessThanOrEqual(70)
  })
})

describe('hexToHsl function', () => {
  it('should convert red hex color to HSL correctly', () => {
    const result = hexToHsl('#ff0000')
    expect(result).toEqual([0, 100, 50]) // HSL for pure red
  })

  it('should convert green hex color to HSL correctly', () => {
    const result = hexToHsl('#00ff00')
    expect(result).toEqual([120, 100, 50]) // HSL for pure green
  })

  it('should convert blue hex color to HSL correctly', () => {
    const result = hexToHsl('#0000ff')
    expect(result).toEqual([240, 100, 50]) // HSL for pure blue
  })

  it('should convert black hex color to HSL correctly', () => {
    const result = hexToHsl('#000000')
    expect(result).toEqual([0, 0, 0]) // HSL for black (no hue or saturation, 0 lightness)
  })

  it('should convert white hex color to HSL correctly', () => {
    const result = hexToHsl('#ffffff')
    expect(result).toEqual([0, 0, 100]) // HSL for white (no hue or saturation, 100 lightness)
  })

  it('should convert gray hex color to HSL correctly', () => {
    const result = hexToHsl('#808080')
    expect(result).toEqual([0, 0, 50]) // HSL for gray (no hue or saturation, 50 lightness)
  })

  it('should convert a custom hex color to HSL correctly', () => {
    const result = hexToHsl('#4682b4') // Steel blue color
    expect(result).toEqual([207, 44, 49]) // Expected HSL for steel blue
  })
})
