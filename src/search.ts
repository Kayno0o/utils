import { stripAccents } from './internal'

export interface SearchOptions {
  /** Tells `A` from `a`. Defaults to false. */
  caseSensitive?: boolean
  /** Tells `é` from `e`. Defaults to false. */
  accentSensitive?: boolean
}

type SearchArgs = string[] | [values: string[], options?: SearchOptions | undefined]

/** Splits the variadic form from the `(values, options)` one. */
function readSearchArgs(args: SearchArgs): { values: string[], fold: (str: string) => string } {
  const [first, options = {}] = args
  const values = Array.isArray(first) ? first : args as string[]
  const { caseSensitive = false, accentSensitive = false } = Array.isArray(first) ? options as SearchOptions : {}

  return {
    values,
    fold: (str) => {
      const folded = accentSensitive ? str : stripAccents(str)

      return caseSensitive ? folded : folded.toLowerCase()
    },
  }
}

/** Whether any value contains the query, case and accents folded unless `options` say otherwise. */
export function searchOne(query: string, ...values: string[]): boolean
export function searchOne(query: string, values: string[], options?: SearchOptions): boolean
export function searchOne(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const needle = fold(query)

  return values.some(value => fold(value).includes(needle))
}

/** Whether every value contains the query, case and accents folded unless `options` say otherwise. */
export function searchAll(query: string, ...values: string[]): boolean
export function searchAll(query: string, values: string[], options?: SearchOptions): boolean
export function searchAll(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const needle = fold(query)

  return values.every(value => fold(value).includes(needle))
}

/** whether the needle's characters appear in the value in order, contiguous or not */
function isSubsequence(needle: string, value: string): boolean {
  const wanted = [...needle]
  let at = 0

  for (const char of value) {
    if (char === wanted[at])
      at++

    if (at === wanted.length)
      return true
  }

  return at === wanted.length
}

const WHITESPACE_RUN_REGEX = /\s+/

/** whether every whitespace-separated term of the query is spread through one of the values, in order */
export function searchFuzzy(query: string, ...values: string[]): boolean
export function searchFuzzy(query: string, values: string[], options?: SearchOptions): boolean
export function searchFuzzy(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const terms = fold(query).split(WHITESPACE_RUN_REGEX).filter(Boolean)

  if (!terms.length)
    return true

  const haystacks = values.map(fold)

  return terms.every(term => haystacks.some(value => isSubsequence(term, value)))
}

export function commonPrefixLength(str1: string, str2: string): number {
  let length = 0
  const minLength = Math.min(str1.length, str2.length)

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i])
      break

    length++
  }

  return length
}

export function commonPrefix(str1: string, str2: string): string {
  const length = commonPrefixLength(str1, str2)

  return str1.substring(0, length)
}

/** edits turning one string into the other, a swap of two neighbours counting as one edit like an insertion, deletion or substitution */
export function editDistance(str1: string, str2: string): number {
  // Spread so an astral character counts as one edit, not two halves.
  return distanceBetween([...str1], [...str2])
}

function distanceBetween(a: ArrayLike<string>, b: ArrayLike<string>): number {
  let beforePrevious = new Int32Array(b.length + 1)
  let previous = new Int32Array(b.length + 1)
  let current = new Int32Array(b.length + 1)

  for (let j = 0; j <= b.length; j++)
    previous[j] = j

  for (let i = 1; i <= a.length; i++) {
    current[0] = i

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost)

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        current[j] = Math.min(current[j]!, beforePrevious[j - 2]! + 1)
    }

    const recycled = beforePrevious

    beforePrevious = previous
    previous = current
    current = recycled
  }

  return previous[b.length]!
}

const SURROGATE_RE = /[\uD800-\uDFFF]/

/** the string itself when each UTF-16 unit is one character, else its code points */
function toComparable(str: string): ArrayLike<string> {
  return SURROGATE_RE.test(str) ? [...str] : str
}

export interface ClosestMatchOptions {
  /** Most edits a match may be away. Defaults to a third of the query, at least 1. */
  maxDistance?: number
  /** Tells `A` from `a`. Defaults to false, like `searchOne`. */
  caseSensitive?: boolean
}

/** the candidate nearest the query, for a "did you mean", or undefined when none is within `maxDistance` edits (a third of the query by default) */
export function closestMatch(query: string, candidates: Iterable<string>, maxDistanceOrOptions: number | ClosestMatchOptions = {}): string | undefined {
  const { maxDistance = Math.max(1, Math.floor([...query].length / 3)), caseSensitive = false } = typeof maxDistanceOrOptions === 'number' ? { maxDistance: maxDistanceOrOptions } : maxDistanceOrOptions
  const queryChars = toComparable(caseSensitive ? query : query.toLowerCase())

  let best: string | undefined
  let bestDistance = maxDistance + 1

  for (const original of candidates) {
    const candidate = caseSensitive ? original : original.toLowerCase()

    // the distance is at least the length difference, so a candidate that far off cannot win
    if (Math.abs(queryChars.length - candidate.length) >= bestDistance && !SURROGATE_RE.test(candidate))
      continue

    const distance = distanceBetween(queryChars, toComparable(candidate))

    if (distance < bestDistance) {
      best = original
      bestDistance = distance
    }
  }

  return best
}
