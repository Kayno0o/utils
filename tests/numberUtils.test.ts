import { describe, expect, test as it } from 'bun:test'
import { formatEuro, formatFileSize, formatUnit, map, randomInt, round } from '~'

describe('randomInt function', () => {
  it('within the specified range', () => {
    const max = 100
    const result = randomInt(0, max)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(max)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('from 0 to the specified max', () => {
    const max = 100
    const result = randomInt(max)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(max)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('negative min and max', () => {
    const min = -100
    const max = 100
    const result = randomInt(min, max)
    expect(result).toBeGreaterThanOrEqual(min)
    expect(result).toBeLessThanOrEqual(max)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('max as 0', () => {
    const min = 0
    const max = 0
    const result = randomInt(min, max)
    expect(result).toBe(0)
    expect(Number.isInteger(result)).toBe(true)
  })

  it('max range', () => {
    const min = Number.MIN_SAFE_INTEGER
    const max = Number.MAX_SAFE_INTEGER
    const result = randomInt(min, max)
    expect(result).toBeGreaterThanOrEqual(min)
    expect(result).toBeLessThanOrEqual(max)
    expect(Number.isInteger(result)).toBe(true)
  })
})

describe('map function', () => {
  it('map with int value', () => {
    expect(map(50, 0, 100, 0, 10)).toBe(5)
  })

  it('map with float value', () => {
    expect(map(2.5, 0, 4, 0, 1)).toBe(0.625)
  })

  it('map with start different from 0', () => {
    expect(map(2.5, 1, 4, 0, 2)).toBe(1)
  })
})

describe('formatFileSize function', () => {
  it('handle negative bytes', () => {
    expect(formatFileSize(-1024)).toEqual('-1.0 KiB')
  })

  it('handle 0', () => {
    expect(formatFileSize(0)).toEqual('0 B')
  })

  it('default parameters', () => {
    expect(formatFileSize(1024)).toEqual('1.0 KiB')
  })

  it('metric units', () => {
    expect(formatFileSize(1500000, true)).toEqual('1.5 MB')
  })

  it('custom decimal places', () => {
    expect(formatFileSize(5368709120, false, 2)).toEqual('5.00 GiB')
  })

  it('handle very large bytes', () => {
    expect(formatFileSize(1234567890345678, false, 2)).toEqual('1.10 PiB')
  })
})

describe('round function', () => {
  it('handle 0', () => {
    expect(round(0.00000)).toEqual(0.0)
  })

  it('handle exact value', () => {
    expect(round(13.51, 2)).toEqual(13.51)
  })

  it('handle negative exact value', () => {
    expect(round(-35.17, 2)).toEqual(-35.17)
  })

  it('handle value', () => {
    expect(round(13.5143, 2)).toEqual(13.51)
  })

  it('handle negative value', () => {
    expect(round(-35.171234, 2)).toEqual(-35.17)
  })

  it('handle ceil value', () => {
    expect(round(35.179234, 2)).toEqual(35.18)
  })

  it('handle ceil negative value', () => {
    expect(round(-35.179234, 2)).toEqual(-35.18)
  })

  it('handle negative precision', () => {
    expect(round(135.179234, -2)).toEqual(100)
  })

  it('handle negative precision', () => {
    expect(round(135.179234, 4)).toEqual(135.1792)
  })
})

describe('formatEuro function', () => {
  it('should format positive amounts in Euro currency', () => {
    const result = formatEuro(1234.56)
    expect(result).toEqual('1.234,56 €')
  })

  it('should format zero amount correctly', () => {
    const result = formatEuro(0)
    expect(result).toEqual('0,00 €')
  })

  it('should format negative amounts correctly', () => {
    const result = formatEuro(-1234.56)
    expect(result).toEqual('-1.234,56 €')
  })

  it('should handle large amounts correctly', () => {
    const result = formatEuro(1000000)
    expect(result).toEqual('1.000.000,00 €')
  })
})

describe('formatUnit function', () => {
  it('should return the number as a string if it is less than 1000', () => {
    const result = formatUnit(999)
    expect(result).toEqual('999')
  })

  it('should format thousands with "k"', () => {
    const result = formatUnit(1500)
    expect(result).toEqual('1.5k')
  })

  it('should format millions with "M"', () => {
    const result = formatUnit(2000000)
    expect(result).toEqual('2.0M')
  })

  it('should format billions with "B"', () => {
    const result = formatUnit(3500000000)
    expect(result).toEqual('3.5B')
  })

  it('should format trillions with "T"', () => {
    const result = formatUnit(4200000000000)
    expect(result).toEqual('4.2T')
  })

  it('should handle numbers exactly at unit boundaries', () => {
    expect(formatUnit(1000)).toEqual('1.0k')
    expect(formatUnit(1000000)).toEqual('1.0M')
    expect(formatUnit(1000000000)).toEqual('1.0B')
    expect(formatUnit(1000000000000)).toEqual('1.0T')
  })
})
