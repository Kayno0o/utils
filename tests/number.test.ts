import { describe, expect, test as it } from 'bun:test'
import { map, randomInt, round } from '~'

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
