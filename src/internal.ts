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
