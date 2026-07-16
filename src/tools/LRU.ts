import type { TtlCache } from '../cache'
import { createTtlCache } from '../cache'

/** @deprecated use `createTtlCache(ttlMs, { maxEntries, lru: true })` */
export class LRU<K, V> {
  private readonly _cache: TtlCache<K, V>

  constructor(max: number) {
    this._cache = createTtlCache<K, V>(Infinity, { maxEntries: max, lru: true })
  }

  get(key: K): V | undefined {
    return this._cache.get(key)
  }

  /** Get without promoting to MRU. */
  peek(key: K): V | undefined {
    return this._cache.peek(key)
  }

  set(key: K, value: V): this {
    this._cache.set(key, value)

    return this
  }

  has(key: K): boolean {
    return this._cache.has(key)
  }

  delete(key: K): boolean {
    return this._cache.delete(key)
  }

  clear(): void {
    this._cache.clear()
  }

  get size(): number {
    return this._cache.size
  }

  /** MRU-first. */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return [...this._cache].reverse()[Symbol.iterator]()
  }
}
