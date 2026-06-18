export class LRU<K, V> {
  private readonly _map = new Map<K, V>()

  constructor(private readonly max: number) {
    if (max <= 0)
      throw new RangeError('LRU max must be > 0')
  }

  get(key: K): V | undefined {
    const v = this._map.get(key)

    if (v === undefined)
      return undefined

    this._map.delete(key)
    this._map.set(key, v)

    return v
  }

  /** Get without promoting to MRU. */
  peek(key: K): V | undefined {
    return this._map.get(key)
  }

  set(key: K, value: V): this {
    if (this._map.has(key))
      this._map.delete(key)
    else if (this._map.size >= this.max)
      this._map.delete(this._map.keys().next().value as K)

    this._map.set(key, value)

    return this
  }

  has(key: K): boolean {
    return this._map.has(key)
  }

  delete(key: K): boolean {
    return this._map.delete(key)
  }

  clear(): void {
    this._map.clear()
  }

  get size(): number {
    return this._map.size
  }

  /** MRU-first. */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    const entries = [...this._map.entries()].reverse()
    let i = 0

    return {
      next(): IteratorResult<[K, V]> {
        return i < entries.length
          ? { value: entries[i++]!, done: false }
          : { value: undefined as any, done: true }
      },
      [Symbol.iterator]() { return this },
    }
  }
}
