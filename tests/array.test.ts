import { describe, expect, it } from 'bun:test'
import { countBy, cryptoRandom, getRandomElement, groupBy, isEmpty, keyBy, mean, median, notNullish, partition, percentile, percentiles, range, splitIntoParts, sum, toArray, unique } from '../src'

describe('groupBy function', () => {
  it('groups items and reads each key once', () => {
    let calls = 0
    const result = groupBy([1, 2, 3, 4], (n) => {
      calls++

      return n % 2 ? 'odd' : 'even'
    })

    expect(result).toEqual({ odd: [1, 3], even: [2, 4] })
    expect(calls).toBe(4)
  })
})

describe('keyBy function', () => {
  it('indexes items by a key', () => {
    const users = [{ id: 'a', n: 1 }, { id: 'b', n: 2 }]

    expect(keyBy(users, u => u.id)).toEqual({ a: { id: 'a', n: 1 }, b: { id: 'b', n: 2 } })
  })

  it('keeps the last item on key collision', () => {
    const items = [{ k: 1, v: 'first' }, { k: 1, v: 'last' }]

    expect(keyBy(items, i => i.k)).toEqual({ 1: { k: 1, v: 'last' } })
  })
})

describe('countBy function', () => {
  it('counts occurrences per key', () => {
    expect(countBy(['a', 'b', 'a', 'c', 'a'], x => x)).toEqual({ a: 3, b: 1, c: 1 })
  })
})

describe('sum / mean / median / percentile functions', () => {
  it('interpolates percentiles between ranks', () => {
    expect(percentile([4, 1, 3, 2], 50)).toBe(2.5)
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1)
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5)
    expect(percentile([0, 10], 95)).toBe(9.5)
    expect(percentile([7], 99)).toBe(7)
    expect(percentile([1, 2], 150)).toBe(2)
    expect(percentile([], 50)).toBeNaN()
    expect(percentiles([], [10, 90])).toEqual([Number.NaN, Number.NaN])
  })

  it('sums values', () => {
    expect(sum([1, 2, 3, 4])).toBe(10)
    expect(sum([])).toBe(0)
  })

  it('computes the mean', () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(mean([])).toBeNaN()
  })

  it('computes the median for odd and even counts', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(median([])).toBeNaN()
  })
})

describe('getRandomElement function', () => {
  it('should return an element from the array', () => {
    const values = [1, 2, 3, 4, 5]
    const element = getRandomElement(values)

    expect(values).toContain(element!)
  })

  it('should return an element from the array (crypto random)', () => {
    const values = [1, 2, 3, 4, 5]
    const element = getRandomElement(values, cryptoRandom)

    expect(values).toContain(element!)
  })

  it('returns undefined for an empty array without calling the source', () => {
    expect(getRandomElement([], () => {
      throw new Error('unexpected')
    })).toBeUndefined()
  })

  it('picks the index given by the source', () => {
    expect(getRandomElement(['a', 'b', 'c'], () => 0)).toBe('a')
    expect(getRandomElement(['a', 'b', 'c'], () => 0.99)).toBe('c')
  })
})

describe('unique function', () => {
  it('should return an array with unique elements', () => {
    const arr = [1, 2, 2, 3, 4, 4, 5]
    const uniqueArr = unique(arr)

    expect(uniqueArr).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle an array with only unique elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const uniqueArr = unique(arr)

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

describe('notNullish function', () => {
  it('should return true for non-null, non-undefined values', () => {
    expect(notNullish('test')).toBe(true)
    expect(notNullish(123)).toBe(true)
    expect(notNullish(true)).toBe(true)
    expect(notNullish({})).toBe(true)
    expect(notNullish([])).toBe(true)
  })

  it('should return false for null or undefined values', () => {
    expect(notNullish(null)).toBe(false)
    expect(notNullish(undefined)).toBe(false)
  })
})

describe('groupBy / keyBy / countBy with a __proto__ key', () => {
  const items = [{ k: '__proto__', v: 1 }, { k: '__proto__', v: 2 }, { k: 'a', v: 3 }]

  it('groups a __proto__ key as an own key', () => {
    const result = groupBy(items, item => item.k)

    expect(Object.keys(result)).toEqual(['__proto__', 'a'])
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual([items[0], items[1]])
  })

  it('keys a __proto__ key as an own key, the last item winning', () => {
    const result = keyBy(items, item => item.k)

    expect(Object.keys(result)).toEqual(['__proto__', 'a'])
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe(items[1])
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('counts a __proto__ key as an own key', () => {
    const result = countBy(items, item => item.k)

    expect(Object.keys(result)).toEqual(['__proto__', 'a'])
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe(2)
    expect(result.a).toBe(1)
  })

  it('does not see inherited names as existing keys', () => {
    expect(Object.entries(countBy(['toString', 'toString'], key => key))).toEqual([['toString', 2]])
    expect(Object.entries(groupBy(['constructor'], key => key))).toEqual([['constructor', ['constructor']]])
  })
})

describe('partition function', () => {
  it('splits into matching and other items, keeping order', () => {
    expect(partition([1, 2, 3, 4, 5], n => n % 2 === 0)).toEqual([[2, 4], [1, 3, 5]])
  })

  it('returns two empty arrays for no input', () => {
    expect(partition([], () => true)).toEqual([[], []])
  })
})

describe('splitIntoParts function', () => {
  it('spreads the remainder over the first parts', () => {
    expect(splitIntoParts([1, 2, 3, 4, 5], 2)).toEqual([[1, 2, 3], [4, 5]])
    expect(splitIntoParts([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
  })

  it('returns empty parts when there are more parts than items', () => {
    expect(splitIntoParts([1], 3)).toEqual([[1], [], []])
  })

  it('throws for fewer than one part', () => {
    expect(() => splitIntoParts([1], 0)).toThrow('Parts must be greater than 0')
  })
})

describe('toArray function', () => {
  it('wraps a single value and keeps an array', () => {
    expect(toArray(1)).toEqual([1])
    const list = [1, 2]

    expect(toArray(list)).toBe(list)
  })
})

describe('isEmpty function', () => {
  it('is true for nullish, blank strings and empty collections', () => {
    for (const value of [null, undefined, '', '  ', [], {}, new Map(), new Set()])
      expect(isEmpty(value)).toBe(true)
  })

  it('is false for content, numbers, booleans and dates', () => {
    for (const value of ['a', [0], { a: 1 }, new Map([[1, 1]]), new Set([1]), 0, false, new Date()])
      expect(isEmpty(value)).toBe(false)
  })
})
