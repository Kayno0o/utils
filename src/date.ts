import type { LocaleOrOptions } from './intlCache'
import { formatDateTime, getRelativeTimeFormat, resolveLocale } from './intlCache'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_LABEL_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}.*)?$/
const COMPACT_DATE_LABEL_REGEX = /^(\d{4})(\d{2})(\d{2})$/
const DURATION_PART_REGEX = /(\d+)\s*([a-z])/gi
const SLASH_DATE_LABEL_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/

export const SECOND_MS = 1000
export const MINUTE_MS = 60 * SECOND_MS
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS
export const WEEK_MS = 7 * DAY_MS

export const SECONDS_IN_MINUTE = 60
export const SECONDS_IN_HOUR = 3600
export const SECONDS_IN_DAY = 86400
export const SECONDS_IN_WEEK = 604800

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const pad = (n: number) => String(n).padStart(2, '0')

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

  holidays['Easter Monday'] = toISODate(addDays(easter, 1))
  holidays['Ascension Day'] = toISODate(addDays(easter, 39))
  holidays['Whit Monday'] = toISODate(addDays(easter, 50))

  return Object.values(holidays)
}

const holidaySets = new Map<number, Set<string>>()

function getHolidaySet(year: number): Set<string> {
  let set = holidaySets.get(year)

  if (!set) {
    if (holidaySets.size >= 64)
      holidaySets.clear()

    set = new Set(getFrenchHolidays(year))
    holidaySets.set(year, set)
  }

  return set
}

export function isHoliday(date: Date | string): boolean {
  // a bare `YYYY-MM-DD` already names the local day; `new Date()` would read it as UTC midnight
  const parsed = typeof date === 'string' && ISO_DATE_REGEX.test(date) ? null : new Date(date)

  if (parsed && Number.isNaN(parsed.getTime()))
    return false

  const formattedDate = parsed ? toISODate(parsed) : date as string

  return getHolidaySet(Number(formattedDate.slice(0, 4))).has(formattedDate)
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
 * A leading `-` makes the duration negative, as `formatDuration` writes it.
 * Units are case-sensitive: `m` is minutes while `M` is months.
 * Supported units: `s`, `m`, `h`, `d`, `w`, `M`, `y`.
 *
 * The inverse of `formatDuration` in its short mode.
 *
 * @param duration - A duration string, or a number that is returned unchanged (already ms).
 * @returns The duration in milliseconds, or `0` when no valid part is found.
 */
export function parseDuration(duration: string | number): number {
  if (typeof duration === 'number')
    return duration

  let total = 0

  for (const [, time, unit] of duration.matchAll(DURATION_PART_REGEX)) {
    const factor = DURATION_UNIT_MS[unit!]

    if (factor !== undefined)
      total += Number(time) * factor
  }

  return duration.trimStart().startsWith('-') && total > 0 ? -total : total
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

export interface FormatRelativeTimeOptions extends Intl.RelativeTimeFormatOptions {
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
 * @param localeOrOptions - A locale, or an options object with the locale, reference date and `Intl.RelativeTimeFormat` options.
 * @returns A localized relative-time string.
 */
export function formatRelativeTime(date: Date | string | number, localeOrOptions?: string | string[] | FormatRelativeTimeOptions): string {
  const [locale, { from = new Date(), numeric = 'auto', ...intlOptions }] = resolveLocale<FormatRelativeTimeOptions>(localeOrOptions)
  const diff = new Date(date).getTime() - new Date(from).getTime()
  const formatter = getRelativeTimeFormat(locale, { ...intlOptions, numeric })

  for (const [factor, unit] of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(diff) >= factor || unit === 'second')
      return formatter.format(Math.round(diff / factor), unit)
  }

  return formatter.format(0, 'second')
}

/** Short day-month label in the locale's order, e.g. "15 Jan" with the default `en-GB` (never the US month-first order). */
export function formatDayMonth(d: Date, localeOrOptions?: LocaleOrOptions<Intl.DateTimeFormatOptions>): string {
  const [locale, options] = resolveLocale(localeOrOptions, 'en-GB')

  return formatDateTime(d, locale, { day: 'numeric', month: 'short', ...options })
}

/** Short month-year label, e.g. "Jan 2026". */
export function formatMonthYear(d: Date, localeOrOptions?: LocaleOrOptions<Intl.DateTimeFormatOptions>): string {
  const [locale, options] = resolveLocale(localeOrOptions, 'en-GB')

  return formatDateTime(d, locale, { month: 'short', year: 'numeric', ...options })
}

/** Short month label, e.g. "Jan". */
export function formatMonthShort(d: Date, localeOrOptions?: LocaleOrOptions<Intl.DateTimeFormatOptions>): string {
  const [locale, options] = resolveLocale(localeOrOptions, 'en-GB')

  return formatDateTime(d, locale, { month: 'short', ...options })
}

/** Parse a date label in `YYYY-MM-DD` (a time may follow), `YYYYMMDD` or `D/M/Y` form (`M/D/Y` with `order: 'month-first'`) into a local-midnight Date, or `null` when it names no real day. */
export function parseDateLabel(label: string, { order = 'day-first' }: { order?: 'day-first' | 'month-first' } = {}): Date | null {
  let m = label.match(ISO_DATE_LABEL_REGEX) ?? label.match(COMPACT_DATE_LABEL_REGEX)

  if (m)
    return localDate(Number(m[1]), Number(m[2]), Number(m[3]))

  m = label.match(SLASH_DATE_LABEL_REGEX)

  if (!m)
    return null

  const [day, month] = order === 'day-first' ? [m[1], m[2]] : [m[2], m[1]]

  return localDate(m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]), Number(month), Number(day))
}

function localDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

/** Local-date ISO string `YYYY-MM-DD` without UTC shift (unlike `toISOString`). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse a `YYYY-MM-DD` string into a local-midnight Date, or `null` when it names no real day (`2024-02-30` included). */
export function fromISODate(iso: string): Date | null {
  const m = ISO_DATE_REGEX.test(iso) ? iso.split('-').map(Number) : null

  return m ? localDate(m[0]!, m[1]!, m[2]!) : null
}

/** A `getDay()` number, 0 for Sunday to 6 for Saturday. */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Days since the last `weekStart` (`getDay()` numbering), 0 on that day itself. */
function daysIntoWeek(date: Date, weekStart: WeekDay): number {
  return (date.getDay() - weekStart + 7) % 7
}

/** Week start (Monday by default, ISO) of the given date, as `YYYY-MM-DD`. DST-proof via local arithmetic. */
export function startOfWeekISO(d: Date, weekStart: WeekDay = 1): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  date.setDate(date.getDate() - daysIntoWeek(date, weekStart))

  return toISODate(date)
}

/** Ascending `YYYY-MM-DD` keys for a contribution grid: a `weeks`-week window ending on `today`, padded back to the preceding `weekStart` (Monday by default) so the result is always a clean 7×N block. */
export function gridDays(weeks: number, today: Date = new Date(), weekStart: WeekDay = 1): string[] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOffset = daysIntoWeek(end, weekStart) + (weeks - 1) * 7
  const start = new Date(end)

  start.setDate(start.getDate() - startOffset)

  const days: string[] = []

  // Step by calendar day: adding DAY_MS drifts an hour at each DST change, repeating one day and skipping another.
  for (const day = new Date(start); day.getTime() <= end.getTime(); day.setDate(day.getDate() + 1))
    days.push(toISODate(day))

  return days
}

/** An hour of the day as a clock label, e.g. 7 -> "07:00". */
export function formatHour(hour: number): string {
  return `${pad(hour)}:00`
}

/** Localized short date-time label, e.g. "Jan 15, 03:04 PM", in the runtime locale unless one is named. */
export function formatTime(value: Date | number, localeOrOptions?: LocaleOrOptions<Intl.DateTimeFormatOptions>): string {
  const [locale, options] = resolveLocale(localeOrOptions)

  return formatDateTime(value, locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/** Return a new Date shifted by `days` (may be negative). Does not mutate the input. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)

  result.setDate(result.getDate() + days)

  return result
}

/** Return a new Date shifted by `months`, clamping the day to the target month's length. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const day = result.getDate()

  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  result.setDate(Math.min(day, getDaysInMonth(result.getMonth() + 1, result.getFullYear())))

  return result
}

/** Return a new Date shifted by `years`, clamping Feb 29 to Feb 28 on non-leap years. */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12)
}

/** Whole days from `a` to `b` (positive when `b` is later), computed on local calendar days (DST-safe). */
export function diffInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)
}

export interface DateDifference {
  days: number
  weeks: number
  workingDays: number
  hours: number
  /** Whole years, months and days, counted on the calendar. */
  calendar: { years: number, months: number, days: number }
}

export interface BusinessDayOptions {
  /** `getDay()` numbers of the days off each week. Defaults to Saturday and Sunday. */
  weekendDays?: readonly WeekDay[]
  /** Also skips holidays: `true` for `isHoliday` (French public holidays), or a predicate of your own. Defaults to none. */
  holidays?: boolean | ((date: Date) => boolean)
}

const DEFAULT_WEEKEND_DAYS: readonly WeekDay[] = [0, 6]

/** Whether a local-midnight `date` is a working day under `options`. */
function isBusinessDay(date: Date, { weekendDays = DEFAULT_WEEKEND_DAYS, holidays = false }: BusinessDayOptions): boolean {
  if (weekendDays.includes(date.getDay() as WeekDay))
    return false

  if (!holidays)
    return true

  return !(holidays === true ? isHoliday(date) : holidays(date))
}

/** The span between two `YYYY-MM-DD` dates, in whichever order, counting days over `[from, to)` like any diff (unlike `businessDaysBetween`, which counts both ends), counted on UTC days so a daylight saving change never shifts it by an hour; `null` when either does not parse. `options` set what `workingDays` skips. */
export function dateDifference(from: string, to: string, options: BusinessDayOptions = {}): DateDifference | null {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)

  if (Number.isNaN(a) || Number.isNaN(b))
    return null

  const [start, end] = a <= b ? [a, b] : [b, a]
  const days = Math.round((end - start) / DAY_MS)
  let workingDays = 0

  for (let day = 0; day < days; day++) {
    const utc = new Date(start + day * DAY_MS)

    if (isBusinessDay(new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()), options))
      workingDays++
  }

  const first = new Date(start)
  const last = new Date(end)
  let months = (last.getUTCFullYear() - first.getUTCFullYear()) * 12 + last.getUTCMonth() - first.getUTCMonth()

  if (last.getUTCDate() < first.getUTCDate())
    months--

  // A start on the 31st anchors to the last day of a shorter month, rather than overflowing into the next one.
  const monthDays = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months + 1, 0)).getUTCDate()
  const anchor = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months, Math.min(first.getUTCDate(), monthDays))

  return {
    days,
    weeks: Math.floor(days / 7),
    workingDays,
    hours: days * 24,
    calendar: { years: Math.floor(months / 12), months: months % 12, days: Math.round((end - anchor) / DAY_MS) },
  }
}

/** Whole hours from `a` to `b` (positive when `b` is later). */
export function diffInHours(a: Date, b: Date): number {
  return Math.trunc((b.getTime() - a.getTime()) / HOUR_MS)
}

/** New Date at the start of `date`'s day (00:00:00.000 local). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** New Date at the end of `date`'s day (23:59:59.999 local). */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

/** New Date at the start of `date`'s month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** New Date at the end of `date`'s month (23:59:59.999 local on the last day). */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/** Whether two dates fall on the same local calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Whether `date` falls on one of `weekendDays`, Saturday or Sunday by default. */
export function isWeekend(date: Date, { weekendDays = DEFAULT_WEEKEND_DAYS }: Pick<BusinessDayOptions, 'weekendDays'> = {}): boolean {
  return weekendDays.includes(date.getDay() as WeekDay)
}

/** Whether `date` is on the current local calendar day. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export interface IsBetweenOptions {
  /** Whether the bounds themselves count. Defaults to `true`. */
  inclusive?: boolean
}

/** Whether `date` is within `[start, end]`, inclusive by default. */
export function isBetween(date: Date, start: Date, end: Date, { inclusive = true }: IsBetweenOptions = {}): boolean {
  const t = date.getTime()
  const lo = Math.min(start.getTime(), end.getTime())
  const hi = Math.max(start.getTime(), end.getTime())

  return inclusive ? t >= lo && t <= hi : t > lo && t < hi
}

/** ISO 8601 week number (1-53), where weeks start on Monday. */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))

  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}

/** Calendar quarter of `date` (1-4). */
export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1
}

/** Full years elapsed from `birth` to `at` (defaults to now). */
export function age(birth: Date, at: Date = new Date()): number {
  let years = at.getFullYear() - birth.getFullYear()
  const monthDiff = at.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate()))
    years--

  return years
}

/** Count of working days within `[start, end]`, both ends included as Excel's NETWORKDAYS does (unlike `dateDifference`, which counts `[from, to)`), Mon-Fri unless `options` say otherwise. Order-insensitive. */
export function businessDaysBetween(start: Date, end: Date, options: BusinessDayOptions = {}): number {
  let from = startOfDay(start)
  let to = startOfDay(end)

  if (from > to)
    [from, to] = [to, from]

  let count = 0

  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isBusinessDay(d, options))
      count++
  }

  return count
}

export interface FormatSessionTimeOptions extends Pick<Intl.DateTimeFormatOptions, 'hour12' | 'hourCycle'> {
  /** Defaults to the runtime's locale. */
  locale?: string | string[]
  labels?: { yesterday?: string }
  /** The moment the label is relative to. Defaults to now. */
  now?: Date | number
}

/** Relative session label: time today, "Yesterday", weekday within a week, else short date; days are counted on the calendar. */
export function formatSessionTime(date: Date, localeOrOptions?: string | string[] | FormatSessionTimeOptions): string {
  const [locale, { labels = {}, now = Date.now(), ...clock }] = resolveLocale<FormatSessionTimeOptions>(localeOrOptions)
  const diffDays = diffInDays(date, new Date(now))

  if (diffDays === 0)
    return formatDateTime(date, locale, { hour: '2-digit', minute: '2-digit', ...clock })

  if (diffDays === 1)
    return labels.yesterday ?? 'Yesterday'

  if (diffDays > 1 && diffDays < 7)
    return formatDateTime(date, locale, { weekday: 'short' })

  return formatDateTime(date, locale, { month: 'short', day: 'numeric' })
}
