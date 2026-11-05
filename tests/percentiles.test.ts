import { describe, expect, test as it } from 'bun:test'
import { percentile, percentiles, sample, sortBy } from '../src'

describe('percentiles function', () => {
  it('matches percentile for each requested rank', () => {
    const values = [9, 1, 5, 3, 7, 2]

    expect(percentiles(values, [0, 25, 50, 90, 100])).toEqual([0, 25, 50, 90, 100].map(p => percentile(values, p)))
    expect(values).toEqual([9, 1, 5, 3, 7, 2])
  })

  it('returns zeros for no values', () => {
    expect(percentiles([], [50, 90])).toEqual([0, 0])
  })
})

describe('sample function', () => {
  it('draws distinct items without touching the input', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const picked = sample(items, 20)

    expect(new Set(picked).size).toBe(20)
    expect(picked.every(i => items.includes(i))).toBe(true)
    expect(items).toEqual(Array.from({ length: 50 }, (_, i) => i))
  })

  it('returns every item as a permutation when n is at least the length', () => {
    expect(sample([1, 2, 3], 10).toSorted()).toEqual([1, 2, 3])
  })
})

describe('sortBy function', () => {
  it('sorts by string and number keys in both orders', () => {
    expect(sortBy(['b', 'a', 'c'], s => s)).toEqual(['a', 'b', 'c'])
    expect(sortBy([{ n: 2 }, { n: 3 }, { n: 1 }], o => o.n, 'desc').map(o => o.n)).toEqual([3, 2, 1])
  })

  it('returns a new array and leaves the input untouched', () => {
    const items = [3, 1, 2]

    expect(sortBy(items, x => x)).toEqual([1, 2, 3])
    expect(items).toEqual([3, 1, 2])
  })

  it('orders mixed key types deterministically, numbers first', () => {
    const items: (string | number)[] = ['b', 2, 'a', 1]

    expect(sortBy(items, x => x)).toEqual([1, 2, 'a', 'b'])
    expect(sortBy([...items].reverse(), x => x)).toEqual([1, 2, 'a', 'b'])
    expect(sortBy(items, x => x, 'desc')).toEqual(['b', 'a', 2, 1])
  })
})
