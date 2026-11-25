// Shared by the modules but kept out of the index, so none of it is public API.

export const utf8Encoder = new TextEncoder()
export const utf8StrictDecoder = new TextDecoder('utf-8', { fatal: true })

// Below this a grey's float noise in a and b would hand it an arbitrary hue.
export const ACHROMATIC_CHROMA = 5e-5

// One table for formatDuration and parseDuration, so the two stay inverses: a month is 30 days, a year 365.
export const DURATION_UNIT_MS = {
  y: 365 * 24 * 60 * 60 * 1000,
  M: 30 * 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
} as const

const ASCII_ONLY = /^\p{ASCII}*$/u
const COMBINING_MARKS_REGEX = /[\u0300-\u036F]/g

/** Strips accents and diacritics; ASCII inputs short-circuit without NFD allocation. */
export function stripAccents(str: string): string {
  return ASCII_ONLY.test(str) ? str : str.normalize('NFD').replace(COMBINING_MARKS_REGEX, '')
}

/** Reads or inserts a cached entry, resetting the map once it reaches `maxEntries` so caches stay bounded. */
export function getOrCreateCapped<K, V>(map: Map<K, V>, key: K, create: () => V, maxEntries = 256): V {
  let cached = map.get(key)

  if (cached === undefined) {
    if (map.size >= maxEntries)
      map.clear()

    cached = create()
    map.set(key, cached)
  }

  return cached
}
