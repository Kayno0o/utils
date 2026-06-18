import { describe, expect, it } from 'bun:test'
import { LRU } from '../src'

describe('LRU', () => {
  it('stores and retrieves values', () => {
    const cache = new LRU<string, number>(3)

    cache.set('a', 1).set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
    expect(cache.get('z')).toBeUndefined()
  })

  it('evicts the least-recently-used entry when full', () => {
    const cache = new LRU<string, number>(3)

    cache.set('a', 1).set('b', 2).set('c', 3)
    // access 'a' to make 'b' the LRU
    cache.get('a')
    cache.set('d', 4) // should evict 'b'
    expect(cache.has('b')).toBe(false)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('c')).toBe(true)
    expect(cache.has('d')).toBe(true)
  })

  it('updates an existing key without evicting', () => {
    const cache = new LRU<string, number>(2)

    cache.set('a', 1).set('b', 2)
    cache.set('a', 99) // update, not insert
    expect(cache.size).toBe(2)
    expect(cache.get('a')).toBe(99)
    expect(cache.has('b')).toBe(true)
  })

  it('peek does not promote entry', () => {
    const cache = new LRU<string, number>(2)

    cache.set('a', 1).set('b', 2)
    cache.peek('a') // should NOT make 'a' MRU
    cache.set('c', 3) // evicts LRU which is 'a' (since peek didn't promote)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
  })

  it('delete removes an entry', () => {
    const cache = new LRU<string, number>(3)

    cache.set('a', 1).set('b', 2)
    expect(cache.delete('a')).toBe(true)
    expect(cache.delete('z')).toBe(false)
    expect(cache.has('a')).toBe(false)
    expect(cache.size).toBe(1)
  })

  it('clear empties the cache', () => {
    const cache = new LRU<string, number>(3)

    cache.set('a', 1).set('b', 2)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.has('a')).toBe(false)
  })

  it('iterates entries most-recently-used first', () => {
    const cache = new LRU<string, number>(3)

    cache.set('a', 1).set('b', 2).set('c', 3)
    cache.get('a') // promote 'a' to MRU
    const entries = [...cache]

    expect(entries.map(([k]) => k)).toEqual(['a', 'c', 'b'])
  })

  it('throws for max <= 0', () => {
    expect(() => new LRU(0)).toThrow(RangeError)
    expect(() => new LRU(-1)).toThrow(RangeError)
  })
})
