import { describe, expect, test as it } from 'bun:test'
import { formatEuro, formatFileSize, formatUnit } from '../src/format/number'

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

describe('formatEuro function', () => {
  it('should format positive amounts in Euro currency', () => {
    const result = formatEuro(1234.56)

    expect(result).toEqual('1 234,56 €')
  })

  it('should format zero amount correctly', () => {
    const result = formatEuro(0)

    expect(result).toEqual('0,00 €')
  })

  it('should format negative amounts correctly', () => {
    const result = formatEuro(-1234.56)

    expect(result).toEqual('-1 234,56 €')
  })

  it('should handle large amounts correctly', () => {
    const result = formatEuro(1000000)

    expect(result).toEqual('1 000 000,00 €')
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
