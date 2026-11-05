type Locale = string | string[] | undefined

const MAX_DATE_MS = 8.64e15

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>()
const numberFormats = new Map<string, Intl.NumberFormat>()
const relativeTimeFormats = new Map<string, Intl.RelativeTimeFormat>()

function cacheKey(locale: Locale, options: object | undefined, extra?: string): string {
  return JSON.stringify([locale ?? null, options ?? null, extra])
}

/** A format built without a `timeZone` captures the ambient one, so it is keyed on the current `TZ`. */
export function getDateTimeFormat(locale: Locale, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = cacheKey(locale, options, options?.timeZone ? undefined : globalThis.process?.env?.TZ ?? '')

  let cached = dateTimeFormats.get(key)

  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options)
    dateTimeFormats.set(key, cached)
  }

  return cached
}

/** `format` that returns `'Invalid Date'` for a non-finite date like `toLocaleString`, instead of throwing. */
export function formatDateTime(date: Date | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return Math.abs(Number(date)) <= MAX_DATE_MS ? getDateTimeFormat(locale, options).format(date) : 'Invalid Date'
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

/** A locale, or an options object that names one next to the `Intl` options of the formatter. */
export type LocaleOrOptions<O extends object> = Locale | ({ locale?: Locale } & O)

/** Split a `locale | { locale, ...options }` argument into its locale and the rest, `defaultLocale` standing in when none is named. */
export function resolveLocale<O extends object>(arg: LocaleOrOptions<O>, defaultLocale?: Locale): [locale: Locale, options: Omit<O, 'locale'>] {
  if (arg === undefined || typeof arg === 'string' || Array.isArray(arg))
    return [arg ?? defaultLocale, {} as Omit<O, 'locale'>]

  const { locale, ...options } = arg as { locale?: Locale } & O

  return [locale ?? defaultLocale, options as Omit<O, 'locale'>]
}
