type Locale = string | string[] | undefined

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>()
const numberFormats = new Map<string, Intl.NumberFormat>()
const relativeTimeFormats = new Map<string, Intl.RelativeTimeFormat>()

function cacheKey(locale: Locale, options: object | undefined): string {
  return `${Array.isArray(locale) ? locale.join(',') : locale ?? ''}|${options ? JSON.stringify(options) : ''}`
}

export function getDateTimeFormat(locale: Locale, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = cacheKey(locale, options)

  let cached = dateTimeFormats.get(key)

  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options)
    dateTimeFormats.set(key, cached)
  }

  return cached
}

export function getNumberFormat(locale: Locale, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = cacheKey(locale, options)

  let cached = numberFormats.get(key)

  if (!cached) {
    cached = new Intl.NumberFormat(locale, options)
    numberFormats.set(key, cached)
  }

  return cached
}

export function getRelativeTimeFormat(locale: Locale, options?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
  const key = cacheKey(locale, options)

  let cached = relativeTimeFormats.get(key)

  if (!cached) {
    cached = new Intl.RelativeTimeFormat(locale, options)
    relativeTimeFormats.set(key, cached)
  }

  return cached
}
