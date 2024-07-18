import { describe, expect, test as it } from 'bun:test'
import { hexToRgb, rgbToHex } from '../src/colorUtils'

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
