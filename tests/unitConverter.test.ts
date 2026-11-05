import { describe, expect, test as it } from 'bun:test'
import { formatFileSize } from '../src/format'
import { UnitConverter } from '../src/tools/UnitConverter'

describe('UnitConverter', () => {
  it('converts between units of the same type', () => {
    expect(new UnitConverter('byte', 'kB', 1).to('B')).toBe(1000)
    expect(new UnitConverter('byte', 'KiB', 1).to('B')).toBe(1024)
    expect(new UnitConverter('distance', 'km', 1).to('m')).toBe(1000)
    expect(UnitConverter.from('speed', 'km/h', 36).to('m/s')).toBeCloseTo(10, 12)
  })

  it('agrees with formatFileSize on kB and KiB', () => {
    expect(formatFileSize(new UnitConverter('byte', 'kB', 1.5).to('B'), { units: 'si' })).toBe('1.5 kB')
    expect(formatFileSize(new UnitConverter('byte', 'KiB', 1.5).to('B'))).toBe('1.5 KiB')
  })

  it('uses exact factors from the unit definitions', () => {
    expect(UnitConverter.from('speed', 'km/h', 3.6).to('m/s')).toBeCloseTo(1, 14)
    expect(UnitConverter.from('weight', 'oz', 1).to('g')).toBe(28.349523125)
    expect(UnitConverter.from('pressure', 'psi', 1).to('Pa')).toBe(6894.757293168)
    expect(UnitConverter.from('area', 'ac', 1).to('m2')).toBe(4046.8564224)
    expect(UnitConverter.from('area', 'ft2', 1).to('m2')).toBe(0.09290304)
    expect(UnitConverter.from('area', 'yd2', 1).to('m2')).toBe(0.83612736)
    expect(UnitConverter.from('pressure', 'mmHg', 1).to('Pa')).toBe(133.322387415)
    expect(UnitConverter.from('energy', 'BTU', 1).to('J')).toBe(1055.05585262)
    expect(UnitConverter.from('speed', 'kn', 3.6).to('m/s')).toBeCloseTo(1.852, 14)
    expect(UnitConverter.from('area', 'mi2', 1).to('m2')).toBe(2589988.110336)
    expect(UnitConverter.from('pressure', 'inHg', 1).to('Pa')).toBeCloseTo(3386.38864034, 8)
    expect(UnitConverter.from('volume', 'gal', 1).to('in3')).toBeCloseTo(231, 12)
    expect(UnitConverter.from('volume', 'cup', 1).to('tbsp')).toBeCloseTo(16, 12)
    expect(UnitConverter.from('volume', 'tbsp', 1).to('tsp')).toBeCloseTo(3, 12)
  })

  it('keeps the input in value and unit', () => {
    const converter = UnitConverter.from('distance', 'km', 2)

    expect(converter.value).toBe(2)
    expect(converter.unit).toBe('km')
    expect(converter.to('km')).toBe(2)
  })

  it('converts temperatures through kelvin', () => {
    expect(UnitConverter.from('temperature', 'C', 100).to('F')).toBeCloseTo(212)
  })
})
