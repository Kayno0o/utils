import { describe, expect, setSystemTime, test } from 'bun:test'
import { createTtlCache, memoize } from '../src/cache'

describe('createTtlCache', () => {
  test('returns a stored value within the TTL', () => {
    const cache = createTtlCache<string, number>(1000)

    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('missing')).toBeUndefined()
  })

  test('expires a value past the TTL', () => {
    const cache = createTtlCache<string, number>(-1)

    cache.set('a', 1)
    expect(cache.get('a')).toBeUndefined()
  })

  test('never expires without a TTL', () => {
    const cache = createTtlCache<string, number>()

    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
  })

  test('evicts the oldest entry when maxEntries is exceeded', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 2 })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  test('rejects a non-positive maxEntries', () => {
    expect(() => createTtlCache(1000, { maxEntries: 0 })).toThrow(RangeError)
    expect(() => createTtlCache(1000, { maxEntries: -1 })).toThrow(RangeError)
  })

  test('re-setting a key moves it to the back of the eviction queue', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 2 })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 3)
    cache.set('c', 4)

    expect(cache.get('a')).toBe(3)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(4)
  })

  test('get does not promote under the default FIFO policy', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 2 })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a')
    cache.set('c', 3)

    expect(cache.get('a')).toBeUndefined()
  })

  test('lru evicts the least recently used entry', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 2, lru: true })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a')
    cache.set('c', 3)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
  })

  test('lru peek and has do not promote', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 2, lru: true })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.peek('a')
    cache.has('a')
    cache.set('c', 3)

    expect(cache.get('a')).toBeUndefined()
  })

  test('lru promotion does not extend the TTL', () => {
    const t0 = Date.now()

    setSystemTime(t0)

    const cache = createTtlCache<string, number>(100, { lru: true })

    cache.set('a', 1)

    setSystemTime(t0 + 60)
    expect(cache.get('a')).toBe(1)

    setSystemTime(t0 + 120)
    expect(cache.get('a')).toBeUndefined()

    setSystemTime()
  })

  test('iterates live entries in eviction order', () => {
    const cache = createTtlCache<string, number>(1000, { maxEntries: 3, lru: true })

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.get('a')

    expect([...cache]).toEqual([['b', 2], ['c', 3], ['a', 1]])
  })

  test('iteration skips expired entries', () => {
    const cache = createTtlCache<string, number>(-1)

    cache.set('a', 1)

    expect([...cache]).toEqual([])
  })

  test('has distinguishes a cached undefined from a miss', () => {
    const cache = createTtlCache<string, number | undefined>(1000)

    cache.set('a', undefined)

    expect(cache.has('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.has('missing')).toBe(false)
  })

  test('has reports an expired entry as absent', () => {
    const cache = createTtlCache<string, number>(-1)

    cache.set('a', 1)
    expect(cache.has('a')).toBe(false)
  })

  test('delete and clear drop entries', () => {
    const cache = createTtlCache<string, number>(1000)

    cache.set('a', 1)
    cache.set('b', 2)

    expect(cache.delete('a')).toBe(true)
    expect(cache.delete('a')).toBe(false)
    expect(cache.size).toBe(1)

    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('b')).toBeUndefined()
  })

  test('getOrLoad runs the loader once, then serves from cache', async () => {
    const cache = createTtlCache<string, number>(1000)
    let calls = 0
    const loader = async () => {
      calls++

      return 42
    }

    expect(await cache.getOrLoad('a', loader)).toBe(42)
    expect(await cache.getOrLoad('a', loader)).toBe(42)
    expect(calls).toBe(1)
  })

  test('getOrLoad serves a cached undefined without reloading', async () => {
    const cache = createTtlCache<string, number | undefined>(1000)
    let calls = 0
    const loader = async () => {
      calls++

      return undefined
    }

    expect(await cache.getOrLoad('a', loader)).toBeUndefined()
    expect(await cache.getOrLoad('a', loader)).toBeUndefined()
    expect(calls).toBe(1)
  })

  test('getOrLoad reloads once the entry has expired', async () => {
    const cache = createTtlCache<string, number>(-1)
    let calls = 0
    const loader = async () => ++calls

    expect(await cache.getOrLoad('a', loader)).toBe(1)
    expect(await cache.getOrLoad('a', loader)).toBe(2)
    expect(calls).toBe(2)
  })

  test('getOrLoad dedups concurrent misses for the same key', async () => {
    const cache = createTtlCache<string, number>(1000)
    let calls = 0
    const loader = async () => {
      calls++
      await Promise.resolve()

      return 7
    }

    const [a, b] = await Promise.all([cache.getOrLoad('k', loader), cache.getOrLoad('k', loader)])

    expect(a).toBe(7)
    expect(b).toBe(7)
    expect(calls).toBe(1)
  })

  test('getOrLoad retries after a failed load (inflight cleared)', async () => {
    const cache = createTtlCache<string, number>(1000)
    let calls = 0
    const loader = async () => {
      calls++

      if (calls === 1)
        throw new Error('boom')

      return 9
    }

    expect(cache.getOrLoad('k', loader)).rejects.toThrow('boom')
    expect(await cache.getOrLoad('k', loader)).toBe(9)
    expect(calls).toBe(2)
  })
})

describe('memoize', () => {
  test('caches per argument list', () => {
    let calls = 0
    const double = memoize((n: number) => {
      calls++

      return n * 2
    })

    expect(double(2)).toBe(4)
    expect(double(2)).toBe(4)
    expect(double(3)).toBe(6)
    expect(calls).toBe(2)
  })

  test('caches an undefined return', () => {
    let calls = 0
    const fn = memoize(() => {
      calls++

      return undefined
    })

    expect(fn()).toBeUndefined()
    expect(fn()).toBeUndefined()
    expect(calls).toBe(1)
  })

  test('expires entries past the TTL', () => {
    let calls = 0
    const fn = memoize(() => ++calls, { ttl: -1 })

    expect(fn()).toBe(1)
    expect(fn()).toBe(2)
  })

  test('evicts the oldest entry when maxEntries is exceeded', () => {
    let calls = 0
    const fn = memoize((n: number) => {
      calls++

      return n
    }, { maxEntries: 1 })

    fn(1)
    fn(2)
    fn(1)

    expect(calls).toBe(3)
  })

  test('honours a custom key', () => {
    let calls = 0
    const fn = memoize((user: { id: number, name: string }) => {
      calls++

      return user.name
    }, { key: user => String(user.id) })

    expect(fn({ id: 1, name: 'a' })).toBe('a')
    expect(fn({ id: 1, name: 'b' })).toBe('a')
    expect(calls).toBe(1)
  })

  test('preserves the caller `this`', () => {
    const obj = {
      base: 10,
      add: memoize(function (this: { base: number }, n: number) {
        return this.base + n
      }),
    }

    expect(obj.add(5)).toBe(15)
  })

  test('shares one in-flight run for concurrent async calls', async () => {
    let calls = 0
    const fn = memoize(async () => {
      calls++
      await Promise.resolve()

      return 7
    })

    const [a, b] = await Promise.all([fn(), fn()])

    expect(a).toBe(7)
    expect(b).toBe(7)
    expect(calls).toBe(1)
  })

  test('evicts a rejected promise so the next call retries', async () => {
    let calls = 0
    const fn = memoize(async () => {
      calls++

      if (calls === 1)
        throw new Error('boom')

      return 9
    })

    await expect(fn()).rejects.toThrow('boom')
    expect(await fn()).toBe(9)
    expect(calls).toBe(2)
  })

  test('exposes its cache for manual invalidation', () => {
    let calls = 0
    const fn = memoize((n: number) => {
      calls++

      return n
    })

    fn(1)
    fn.cache.clear()
    fn(1)

    expect(calls).toBe(2)
  })
})
