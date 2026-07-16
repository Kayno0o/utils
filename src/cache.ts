export interface TtlCacheOptions {
  /** Evict past this many entries. Defaults to unbounded. */
  maxEntries?: number
  /** Promote an entry to most-recently-used on `get`, so eviction drops the least recently used. Defaults to insertion order (FIFO). */
  lru?: boolean
}

export interface TtlCache<K, V> {
  get: (key: K) => V | undefined
  peek: (key: K) => V | undefined
  has: (key: K) => boolean
  set: (key: K, value: V) => void
  delete: (key: K) => boolean
  clear: () => void
  readonly size: number
  getOrLoad: (key: K, loader: (key: K) => Promise<V>) => Promise<V>
  /** Live entries in eviction order (first out first). */
  [Symbol.iterator]: () => IterableIterator<[K, V]>
}

/** In-memory TTL cache with optional size-based eviction, FIFO by default or LRU via `options.lru`. */
export function createTtlCache<K, V>(ttlMs = Infinity, options?: TtlCacheOptions): TtlCache<K, V> {
  const { maxEntries = Infinity, lru = false } = options ?? {}

  if (maxEntries <= 0)
    throw new RangeError('maxEntries must be > 0')

  const map = new Map<K, { value: V, at: number }>()
  const inflight = new Map<K, Promise<V>>()

  /** Drops the entry if expired. `at` is the write time, so promotion must not touch it. */
  function read(key: K) {
    const hit = map.get(key)

    if (!hit)
      return undefined

    if (Date.now() - hit.at >= ttlMs) {
      map.delete(key)

      return undefined
    }

    return hit
  }

  const cache: TtlCache<K, V> = {
    get(key) {
      const hit = read(key)

      if (!hit)
        return undefined

      if (lru) {
        map.delete(key)
        map.set(key, hit)
      }

      return hit.value
    },
    /** Like `get`, but never promotes. */
    peek(key) {
      return read(key)?.value
    },
    /** Distinguishes a cached `undefined` from a miss, unlike `get`. Never promotes. */
    has(key) {
      return read(key) !== undefined
    },
    set(key, value) {
      if (map.has(key))
        map.delete(key)
      else if (map.size >= maxEntries)
        map.delete(map.keys().next().value as K)

      map.set(key, { value, at: Date.now() })
    },
    delete(key) {
      inflight.delete(key)

      return map.delete(key)
    },
    clear() {
      map.clear()
      inflight.clear()
    },
    get size() {
      return map.size
    },
    /** Return the cached value, or run `loader`, cache its result and return it. Concurrent misses for one key share a single `loader` call. */
    async getOrLoad(key, loader) {
      const hit = read(key)

      if (hit)
        return hit.value

      const pending = inflight.get(key)

      if (pending)
        return pending

      const promise = (async () => {
        try {
          const value = await loader(key)

          cache.set(key, value)

          return value
        }
        finally {
          inflight.delete(key)
        }
      })()

      inflight.set(key, promise)

      return promise
    },
    * [Symbol.iterator]() {
      for (const key of [...map.keys()]) {
        const hit = read(key)

        if (hit)
          yield [key, hit.value] as [K, V]
      }
    },
  }

  return cache
}

export interface MemoizeOptions<A extends any[]> extends TtlCacheOptions {
  /** Entry lifetime in ms. Defaults to no expiry. */
  ttl?: number
  /** Cache key for a call. Defaults to `JSON.stringify(args)`. */
  key?: (...args: A) => string
}

export type Memoized<A extends any[], R> = ((...args: A) => R) & { cache: TtlCache<string, R> }

/**
 * Wrap `fn` in a TTL cache keyed by its arguments. A returned promise is cached as-is,
 * so concurrent calls share one in-flight run and a rejection evicts the entry.
 */
export function memoize<A extends any[], R>(fn: (...args: A) => R, options?: MemoizeOptions<A>): Memoized<A, R> {
  const cache = createTtlCache<string, R>(options?.ttl, options)
  const toKey = options?.key ?? ((...args: A) => JSON.stringify(args))

  const memoized = function (this: unknown, ...args: A): R {
    const key = toKey(...args)

    if (cache.has(key))
      return cache.get(key) as R

    const result = fn.apply(this, args)

    cache.set(key, result)

    if (result instanceof Promise) {
      void (async () => {
        try {
          await result
        }
        catch {
          cache.delete(key)
        }
      })()
    }

    return result
  } as Memoized<A, R>

  memoized.cache = cache

  return memoized
}
