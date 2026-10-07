import { clamp, randomInt } from './number'

export function getRandomElement<T>(values: T[], isCrypto = false): T {
  const index = randomInt(0, values.length, isCrypto)

  return values[index]!
}

/** @deprecated use `unique` */
export const uniqueArray = unique
export function unique<T extends string | number | symbol | boolean | null | undefined>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function notNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isEmpty(value: any): boolean {
  if (value === null || value === undefined)
    return true

  if (typeof value === 'string')
    return value.trim() === ''

  if (Array.isArray(value))
    return value.length === 0

  if (typeof value === 'object') {
    if (value instanceof Date)
      return false

    if (value instanceof Map || value instanceof Set)
      return value.size === 0

    return Object.keys(value).length === 0
  }

  return false
}

/** @deprecated use `shuffle` */
export const shuffleArray = shuffle
export function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Samples `n` items uniformly at random without replacement.
 * Uses partial Fisher-Yates — O(n) in sample size, not array length.
 * Clamps `n` to `[0, items.length]`.
 */
export function sample<T>(items: T[], n: number): T[] {
  const pool = [...items]
  const count = Math.max(0, Math.min(n, pool.length))

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));

    [pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }

  return pool.slice(0, count)
}

/**
 * Creates a `rows × cols` 2D array where each cell is independent.
 * `fill` may be a static value or a factory `(row, col) => T`.
 */
export function createBoard<T>(
  rows: number,
  cols: number,
  fill: T | ((row: number, col: number) => T),
): T[][] {
  const fn = typeof fill === 'function' ? fill as (r: number, c: number) => T : () => fill

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => fn(r, c)))
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

/** @deprecated use `splitIntoParts` */
export const chunkArray = splitIntoParts
export function splitIntoParts<T>(array: T[], parts: number): T[][] {
  if (parts <= 0)
    throw new Error('Parts must be greater than 0')

  const result: T[][] = []
  const minChunkSize = Math.floor(array.length / parts)
  const remainder = array.length % parts

  let start = 0

  for (let i = 0; i < parts; i++) {
    const extra = i < remainder ? 1 : 0
    const end = start + minChunkSize + extra

    result.push(array.slice(start, end))
    start = end
  }

  return result
}

export function groupBy<T>(items: T[], getKey: (item: T) => string | number): Record<string | number, T[]> {
  return items.reduce((acc, item) => {
    acc[getKey(item)] ??= []
    acc[getKey(item)]!.push(item)

    return acc
  }, {} as Record<string | number, T[]>)
}

export function keyBy<T>(items: T[], getKey: (item: T) => string | number): Record<string | number, T> {
  return items.reduce((acc, item) => {
    acc[getKey(item)] = item

    return acc
  }, {} as Record<string | number, T>)
}

export function countBy<T>(items: T[], getKey: (item: T) => string | number): Record<string | number, number> {
  return items.reduce((acc, item) => {
    const key = getKey(item)

    acc[key] = (acc[key] ?? 0) + 1

    return acc
  }, {} as Record<string | number, number>)
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0)
    return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

// p from 0 to 100, interpolating linearly between the two closest ranks like NumPy: percentile([1, 2, 3, 4], 50) is 2.5.
export function percentile(values: number[], p: number): number {
  if (values.length === 0)
    return 0

  const sorted = [...values].sort((a, b) => a - b)
  const rank = clamp(p, 0, 100) / 100 * (sorted.length - 1)
  const low = Math.floor(rank)
  const high = Math.ceil(rank)

  return sorted[low]! + (sorted[high]! - sorted[low]!) * (rank - low)
}

export function partition<T>(items: T[], getGroup: (item: T) => boolean): [T[], T[]] {
  const result: [T[], T[]] = [[], []]

  for (const item of items) {
    if (getGroup(item))
      result[0].push(item)
    else result[1].push(item)
  }

  return result
}

export function sortBy<T>(items: T[], getKey: (item: T) => string | number, order: 'asc' | 'desc' = 'asc'): T[] {
  return items.sort((a, b) => {
    const aKey = getKey(a)
    const bKey = getKey(b)

    if (typeof aKey === 'string' && typeof bKey === 'string')
      return order === 'asc' ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey)

    if (typeof aKey === 'number' && typeof bKey === 'number')
      return order === 'asc' ? aKey - bKey : bKey - aKey

    return 0
  })
}
