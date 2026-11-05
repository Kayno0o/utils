import { describe, expect, test as it } from 'bun:test'
import { formatEuro, formatFileSize, formatSiret, formatUnit } from '../src/format/number'

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
    expect(formatFileSize(1500000, { units: 'si' })).toEqual('1.5 MB')
  })

  it('custom decimal places', () => {
    expect(formatFileSize(5368709120, { dp: 2 })).toEqual('5.00 GiB')
  })

  it('handle very large bytes', () => {
    expect(formatFileSize(1234567890345678, { dp: 2 })).toEqual('1.10 PiB')
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

  it('formats negative numbers like positive ones', () => {
    expect(formatUnit(-5000)).toEqual('-5.0k')
    expect(formatUnit(-999)).toEqual('-999')
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

describe('formatEuro locale and options', () => {
  it('follows the given locale and options', () => {
    expect(formatEuro(1234.5, 'en-US')).toEqual('€1,234.50')
    expect(formatEuro(1234.5, { currency: 'USD' })).toEqual(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(1234.5))
    expect(formatEuro(1234.5, { locale: 'fr-FR', maximumFractionDigits: 0 })).toEqual(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(1234.5))
  })
})

describe('formatUnit rounding', () => {
  it('moves to the next unit instead of printing 1000.0', () => {
    expect(formatUnit(999_999)).toBe('1.0M')
    expect(formatUnit(999_949)).toBe('999.9k')
    expect(formatUnit(-1_500)).toBe('-1.5k')
  })
})

describe('formatSiret', () => {
  it('groups the first 14 digits 3-3-3-5', () => {
    expect(formatSiret('732 829 320 00074')).toBe('732 829 320 00074')
    expect(formatSiret('73282932000074999')).toBe('732 829 320 00074')
    expect(formatSiret('7328')).toBe('732 8')
  })
})
