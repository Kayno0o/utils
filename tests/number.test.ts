import { describe, expect, test as it } from 'bun:test'
import { clamp, convertBase, cryptoRandom, degToRad, entropyBits, formatNumber, gcd, isPrime, lcm, mapRange, ordinal, percentage, radToDeg, randomBool, randomFloat, randomInt, reduceRatio, round, sfc32 } from '../src'

describe('random sources', () => {
  it('refuses the true of 2.x instead of falling back to Math.random', () => {
    expect(() => randomInt(10, true as never)).toThrow(TypeError)
    expect(() => randomInt(0, 10, true as never)).toThrow(TypeError)
    expect(() => randomFloat(10, true as never)).toThrow(TypeError)
    expect(() => randomFloat(0, 10, true as never)).toThrow(TypeError)
  })

  it('draws cryptoRandom in [0, 1) on 53 bits', () => {
    const values = Array.from({ length: 200 }, cryptoRandom)

    expect(values.every(value => value >= 0 && value < 1)).toBe(true)
    expect(values.some(value => !Number.isInteger(value * 2 ** 32))).toBe(true)
  })
})

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

describe('mapRange function', () => {
  it('mapRange with int value', () => {
    expect(mapRange(
      50,
      0,
      100,
      0,
      10,
    )).toBe(5)
  })

  it('mapRange with float value', () => {
    expect(mapRange(
      2.5,
      0,
      4,
      0,
      1,
    )).toBe(0.625)
  })

  it('mapRange with start different from 0', () => {
    expect(mapRange(
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

describe('seeded random source', () => {
  it('randomInt maps the source onto [min, max)', () => {
    expect(randomInt(5, 10, () => 0)).toBe(5)
    expect(randomInt(5, 10, () => 0.99)).toBe(9)
    expect(randomInt(10, () => 0.5)).toBe(5)
    expect(randomInt(1, 7, sfc32(1, 2, 3, 4))).toBe(randomInt(1, 7, sfc32(1, 2, 3, 4)))
  })

  it('randomFloat maps the source onto [min, max)', () => {
    expect(randomFloat(2, 4, () => 0.5)).toBe(3)
    expect(randomFloat(8, () => 0.25)).toBe(2)
  })

  it('randomBool compares the source to the probability', () => {
    expect(randomBool(0.5, () => 0.4)).toBe(true)
    expect(randomBool(0.5, () => 0.6)).toBe(false)
  })

  it('cryptoRandom stays in [0, 1) and plugs into every helper', () => {
    for (let i = 0; i < 100; i++) {
      const value = cryptoRandom()

      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }

    expect(randomInt(3, cryptoRandom)).toBeLessThan(3)
    expect(randomFloat(3, cryptoRandom)).toBeLessThan(3)
    expect(typeof randomBool(0.5, cryptoRandom)).toBe('boolean')
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

describe('reduceRatio', () => {
  it('reduces ratios of positive whole numbers', () => {
    expect(reduceRatio(1920, 1080)).toEqual({ w: 16, h: 9 })
    expect(reduceRatio(0, 10)).toBeNull()
    expect(reduceRatio(1.5, 10)).toBeNull()
  })
})

describe('convertBase', () => {
  it('converts exactly past the safe integer range, stripping a prefix only in its own base', () => {
    expect(convertBase('18446744073709551615', 10)).toEqual({ bin: '1'.repeat(64), oct: '1777777777777777777777', dec: '18446744073709551615', hex: 'FFFFFFFFFFFFFFFF' })
    expect(convertBase('0xff', 16)?.dec).toBe('255')
    expect(convertBase('0b1', 16)?.dec).toBe('177')
    expect(convertBase('-1_010', 2)?.dec).toBe('-10')
    expect(convertBase('12', 2)).toBeNull()
  })

  it('keeps zero unsigned', () => {
    expect(convertBase('-0', 10)?.dec).toBe('0')
  })
})

describe('entropyBits', () => {
  it('rates entropy by bits', () => {
    expect(entropyBits(16, 94)).toBe(104)
    expect(entropyBits(10, 1)).toBe(0)
  })
})

describe('clamp function', () => {
  it('limits a value to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('wraps around the range with modulo', () => {
    expect(clamp(12, 0, 10, true)).toBe(2)
    expect(clamp(-1, 0, 10, true)).toBe(9)
    expect(clamp(10, 0, 10, true)).toBe(0)
    expect(clamp(7, 5, 10, true)).toBe(7)
    expect(clamp(4, 5, 10, true)).toBe(9)
  })
})
