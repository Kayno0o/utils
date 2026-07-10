import { describe, expect, test as it } from 'bun:test'
import { degToRad, formatNumber, gcd, isPrime, lcm, map, ordinal, percentage, radToDeg, randomBool, randomFloat, randomInt, round } from '../src'

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
    expect(map(
      50,
      0,
      100,
      0,
      10,
    )).toBe(5)
  })

  it('map with float value', () => {
    expect(map(
      2.5,
      0,
      4,
      0,
      1,
    )).toBe(0.625)
  })

  it('map with start different from 0', () => {
    expect(map(
      2.5,
      1,
      4,
      0,
      2,
    )).toBe(1)
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

describe('randomFloat function', () => {
  it('within the specified range', () => {
    const result = randomFloat(1, 2)

    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThan(2)
  })

  it('from 0 to the specified max', () => {
    const result = randomFloat(5)

    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(5)
  })
})

describe('randomBool function', () => {
  it('always true at probability 1', () => {
    expect(randomBool(1)).toBe(true)
  })

  it('always false at probability 0', () => {
    expect(randomBool(0)).toBe(false)
  })
})

describe('formatNumber function', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
  })
})

describe('percentage function', () => {
  it('computes a rounded percentage', () => {
    expect(percentage(1, 3, 2)).toBe(33.33)
  })

  it('returns 0 when total is 0', () => {
    expect(percentage(5, 0)).toBe(0)
  })
})

describe('ordinal function', () => {
  it('handles common suffixes', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
  })

  it('handles the teens exception', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(21)).toBe('21st')
  })
})

describe('gcd / lcm functions', () => {
  it('computes gcd', () => {
    expect(gcd(12, 18)).toBe(6)
    expect(gcd(-12, 18)).toBe(6)
  })

  it('computes lcm', () => {
    expect(lcm(4, 6)).toBe(12)
    expect(lcm(0, 5)).toBe(0)
  })
})

describe('isPrime function', () => {
  it('detects primes', () => {
    expect(isPrime(2)).toBe(true)
    expect(isPrime(17)).toBe(true)
    expect(isPrime(97)).toBe(true)
  })

  it('rejects non-primes', () => {
    expect(isPrime(1)).toBe(false)
    expect(isPrime(0)).toBe(false)
    expect(isPrime(-7)).toBe(false)
    expect(isPrime(9)).toBe(false)
    expect(isPrime(4.5)).toBe(false)
  })
})

describe('degToRad / radToDeg functions', () => {
  it('converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI)
  })

  it('converts radians to degrees', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180)
  })
})
