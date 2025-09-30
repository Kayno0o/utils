import { randomInt } from './number'

export function getRandomElement<T>(values: T[], isCrypto = false): T {
  const index = randomInt(0, values.length, isCrypto)

  return values[index]
}

export function uniqueArray<T extends string | number | symbol | boolean | null | undefined>(arr: T[]): T[] {
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

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]]
  }
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function chunkArray<T>(array: T[], parts: number): T[][] {
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
