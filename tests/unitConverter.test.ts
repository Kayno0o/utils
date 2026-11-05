import { describe, expect, test as it } from 'bun:test'
import { UnitConverter } from '../src/tools/UnitConverter'

describe('UnitConverter', () => {
  it('converts between units of the same type', () => {
    expect(new UnitConverter('byte', 'kB', 1).to('B')).toBe(1024)
    expect(new UnitConverter('distance', 'km', 1).to('m')).toBe(1000)
    expect(UnitConverter.from('speed', 'km/h', 36).to('m/s')).toBeCloseTo(10, 3)
  })

  it('converts temperatures through kelvin', () => {
    expect(UnitConverter.from('temperature', 'C', 100).to('F')).toBeCloseTo(212)
  })
})
