export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Determine whether a year is a leap year (366 days).
 *
 * Follows the Gregorian rule: divisible by 4, except centuries which must
 * also be divisible by 400 (so 2000 is a leap year, 1900 is not).
 *
 * @param year - The full year, e.g. `2024`.
 * @returns `true` when the year has a 29th of February.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function calculateEaster(year: number): Date {
  const f = Math.floor
  const G = year % 19
  const C = f(year / 100)
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11))
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
  const L = I - J
  const month = 3 + f((L + 40) / 44)
  const day = L + 28 - 31 * f(month / 4)

  return new Date(year, month - 1, day)
}

export function getFrenchHolidays(year: number): string[] {
  const holidays: Record<string, string> = {
    'All Saints\' Day': `${year}-11-01`,
    'Armistice Day': `${year}-11-11`,
    'Assumption of Mary': `${year}-08-15`,
    'Bastille Day': `${year}-07-14`,
    'Christmas Day': `${year}-12-25`,
    'Labour Day': `${year}-05-01`,
    'New Year\'s Day': `${year}-01-01`,
    'Victory in Europe Day': `${year}-05-08`,
  }

  const easter = calculateEaster(year)
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date)

    result.setDate(result.getDate() + days)

    return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
  }

  holidays['Easter Monday'] = addDays(easter, 1)
  holidays['Ascension Day'] = addDays(easter, 39)
  holidays['Whit Monday'] = addDays(easter, 50)

  return Object.values(holidays)
}

export function isHoliday(date: Date | string): boolean {
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const holidays = getFrenchHolidays(year)

  const formattedDate = dateObj.toISOString().split('T')[0]!

  return holidays.includes(formattedDate)
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  M: 1000 * 60 * 60 * 24 * 30,
  y: 1000 * 60 * 60 * 24 * 365,
}

/**
 * Convert a human-readable duration into milliseconds.
 *
 * Supports single units (`'5m'`) as well as compound durations made of
 * several space-separated (or concatenated) parts, e.g. `'1d 7h'` or `'1d7h30m'`.
 *
 * Units are case-sensitive: `m` is minutes while `M` is months.
 * Supported units: `s`, `m`, `h`, `d`, `w`, `M`, `y`.
 *
 * @param duration - A duration string, or a number that is returned unchanged (already ms).
 * @returns The duration in milliseconds, or `0` when no valid part is found.
 */
export function stringToMsDuration(duration: string | number): number {
  if (typeof duration === 'number')
    return duration

  let total = 0

  for (const [, time, unit] of duration.matchAll(/(\d+)\s*([a-z])/gi)) {
    const factor = DURATION_UNIT_MS[unit!]

    if (factor !== undefined)
      total += Number(time) * factor
  }

  return total
}

/**
 * Convert a duration in milliseconds into a human-readable string.
 *
 * The inverse of {@link stringToMsDuration}: the output round-trips back to the
 * same number of milliseconds when the same `units` are used. The duration is
 * decomposed greedily from the largest unit to the smallest, skipping zeroes.
 *
 * Units are case-sensitive: `m` is minutes while `M` is months.
 * Supported units: `s`, `m`, `h`, `d`, `w`, `M`, `y`.
 *
 * @param ms - The duration in milliseconds.
 * @param units - Which units to use, defaulting to `['d', 'h', 'm', 's']`.
 * @returns A duration string such as `'1d 7h 30m'`, or `'0s'` for an empty duration.
 */
export function msDurationToString(ms: number, units: string[] = ['d', 'h', 'm', 's']): string {
  const ordered = units
    .filter(unit => DURATION_UNIT_MS[unit] !== undefined)
    .sort((a, b) => DURATION_UNIT_MS[b]! - DURATION_UNIT_MS[a]!)

  const smallest = ordered.at(-1) ?? 's'

  let remaining = Math.floor(Math.abs(ms))
  const sign = ms < 0 ? '-' : ''
  const parts: string[] = []

  for (const unit of ordered) {
    const factor = DURATION_UNIT_MS[unit]!
    const value = Math.floor(remaining / factor)

    if (value > 0) {
      parts.push(`${value}${unit}`)
      remaining -= value * factor
    }
  }

  return parts.length === 0 ? `0${smallest}` : sign + parts.join(' ')
}

const RELATIVE_TIME_DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [DURATION_UNIT_MS.y!, 'year'],
  [DURATION_UNIT_MS.M!, 'month'],
  [DURATION_UNIT_MS.w!, 'week'],
  [DURATION_UNIT_MS.d!, 'day'],
  [DURATION_UNIT_MS.h!, 'hour'],
  [DURATION_UNIT_MS.m!, 'minute'],
  [DURATION_UNIT_MS.s!, 'second'],
]

export interface FormatRelativeTimeOptions {
  /** The date to measure against. Defaults to `new Date()`. */
  from?: Date | string | number
  /** A BCP 47 locale (or locales) for the output. Defaults to the runtime locale. */
  locale?: string | string[]
  /** Whether to use phrases like `'yesterday'` (`'auto'`) or always numeric. Defaults to `'auto'`. */
  numeric?: 'auto' | 'always'
}

/**
 * Format the distance between two dates as a human-readable phrase.
 *
 * Picks the largest sensible unit (e.g. `'3 hours ago'`, `'in 2 days'`) using
 * the platform's {@link Intl.RelativeTimeFormat}, so output is localized.
 *
 * @param date - The target date (past or future).
 * @param options - Reference date, locale and numeric style.
 * @returns A localized relative-time string.
 */
export function formatRelativeTime(date: Date | string | number, options: FormatRelativeTimeOptions = {}): string {
  const { from = new Date(), locale, numeric = 'auto' } = options
  const diff = new Date(date).getTime() - new Date(from).getTime()
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric })

  for (const [factor, unit] of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(diff) >= factor || unit === 'second')
      return formatter.format(Math.round(diff / factor), unit)
  }

  return formatter.format(0, 'second')
}
