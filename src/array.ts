import type { RandomSource } from './number'
import { clamp, randomInt } from './number'

export function getRandomElement<T>(values: T[], random: RandomSource = Math.random): T {
  const index = randomInt(0, values.length, random)

  return values[index]!
}

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

    return value instanceof Map || value instanceof Set ? value.size === 0 : Object.keys(value).length === 0
  }

  return false
}

/** A shuffled copy of `items`, leaving `items` untouched. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1, random);

    [result[i], result[j]] = [result[j]!, result[i]!]
  }

  return result
}

/**
 * Samples `n` items uniformly at random without replacement.
 * Uses partial Fisher-Yates — O(n) in sample size, not array length.
 * Clamps `n` to `[0, items.length]`.
 */
export function sample<T>(items: T[], n: number, random: RandomSource = Math.random): T[] {
  const count = Math.max(0, Math.min(n, items.length))
  // swaps are recorded virtually, so only the touched slots are allocated
  const swapped = new Map<number, T>()
  const result: T[] = []

  for (let i = 0; i < count; i++) {
    const j = randomInt(i, items.length, random)

    result.push(swapped.has(j) ? swapped.get(j)! : items[j]!)
    swapped.set(j, swapped.has(i) ? swapped.get(i)! : items[i]!)
  }

  return result
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
    const key = getKey(item)

    acc[key] ??= []
    acc[key].push(item)

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

  const sorted = Float64Array.from(values).sort()
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

// p from 0 to 100, interpolating linearly between the two closest ranks like NumPy: percentile([1, 2, 3, 4], 50) is 2.5.
export function percentile(values: number[], p: number): number {
  return percentiles(values, [p])[0]!
}

/** Several percentiles of `values`, sorting once. */
export function percentiles(values: number[], ps: number[]): number[] {
  if (values.length === 0)
    return ps.map(() => 0)

  const sorted = Float64Array.from(values).sort()

  return ps.map((p) => {
    const rank = clamp(p, 0, 100) / 100 * (sorted.length - 1)
    const low = Math.floor(rank)
    const high = Math.ceil(rank)

    return sorted[low]! + (sorted[high]! - sorted[low]!) * (rank - low)
  })
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

/** A sorted copy of `items`, leaving `items` untouched; with mixed key types the numbers come before the strings (after them when `desc`). */
export function sortBy<T>(items: readonly T[], getKey: (item: T) => string | number, order: 'asc' | 'desc' = 'asc'): T[] {
  const direction = order === 'asc' ? 1 : -1

  return items.toSorted((a, b) => {
    const aKey = getKey(a)
    const bKey = getKey(b)

    if (typeof aKey === 'string' && typeof bKey === 'string')
      return direction * aKey.localeCompare(bKey)

    if (typeof aKey === 'number' && typeof bKey === 'number')
      return direction * (aKey - bKey)

    return direction * (typeof aKey === 'number' ? -1 : 1)
  })
}
