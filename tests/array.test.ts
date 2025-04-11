import { describe, expect, it } from 'bun:test'
import { getRandomElement, notEmpty, range, uniqueArray } from '~'

describe('getRandomElement function', () => {
  it('should return an element from the array', () => {
    const values = [1, 2, 3, 4, 5]
    const element = getRandomElement(values)
    expect(values).toContain(element)
  })

  it('should return an element from the array (crypto random)', () => {
    const values = [1, 2, 3, 4, 5]
    const element = getRandomElement(values, true)
    expect(values).toContain(element)
  })
})

describe('uniqueArray function', () => {
  it('should return an array with unique elements', () => {
    const arr = [1, 2, 2, 3, 4, 4, 5]
    const uniqueArr = uniqueArray(arr)
    expect(uniqueArr).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle an array with only unique elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const uniqueArr = uniqueArray(arr)
    expect(uniqueArr).toEqual([1, 2, 3, 4, 5])
  })
})

describe('range function', () => {
  it('should return an array of numbers from 0 to n-1', () => {
    const n = 5
    const result = range(n)
    expect(result).toEqual([0, 1, 2, 3, 4])
  })

  it('should return an empty array when n is 0', () => {
    const n = 0
    const result = range(n)
    expect(result).toEqual([])
  })
})

describe('notEmpty function', () => {
  it('should return true for non-null, non-undefined values', () => {
    expect(notEmpty('test')).toBe(true)
    expect(notEmpty(123)).toBe(true)
    expect(notEmpty(true)).toBe(true)
    expect(notEmpty({})).toBe(true)
    expect(notEmpty([])).toBe(true)
  })

  it('should return false for null or undefined values', () => {
    expect(notEmpty(null)).toBe(false)
    expect(notEmpty(undefined)).toBe(false)
  })
})
