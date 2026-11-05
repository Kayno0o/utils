import { DAY_MS, HOUR_MS, MINUTE_MS, SECOND_MS, WEEK_MS } from '../date'

export * from './number'

export type DurationUnit = 'y' | 'M' | 'w' | 'd' | 'h' | 'm' | 's'

export interface DurationLabel {
  short?: string
  /** The singular word in `long` mode. */
  one?: string
  /** The plural word in `long` mode. */
  other?: string
}

const DURATION_UNITS: { unit: DurationUnit, ms: number, label: Required<DurationLabel> }[] = [
  { unit: 'y', ms: 365 * DAY_MS, label: { short: 'y', one: 'year', other: 'years' } },
  { unit: 'M', ms: 30 * DAY_MS, label: { short: 'M', one: 'month', other: 'months' } },
  { unit: 'w', ms: WEEK_MS, label: { short: 'w', one: 'week', other: 'weeks' } },
  { unit: 'd', ms: DAY_MS, label: { short: 'd', one: 'day', other: 'days' } },
  { unit: 'h', ms: HOUR_MS, label: { short: 'h', one: 'hour', other: 'hours' } },
  { unit: 'm', ms: MINUTE_MS, label: { short: 'm', one: 'minute', other: 'minutes' } },
  { unit: 's', ms: SECOND_MS, label: { short: 's', one: 'second', other: 'seconds' } },
]

export interface FormatDurationOptions {
  /** Spell the units out and separate them with commas: "2 hours, 5 minutes". */
  long?: boolean
  /** Keep only the N largest non-zero units, so a reading stays the same width as it grows. */
  maxUnits?: number
  /** The units to write, `['d', 'h', 'm', 's']` by default; what is smaller than the last one is dropped. `m` is minutes while `M` is months. */
  units?: DurationUnit[]
  /** What each unit is written as, for a locale that does not read them in English: `{ d: { short: 'j', one: 'jour', other: 'jours' } }`. Relabelled output no longer round-trips through `parseDuration`. */
  labels?: Partial<Record<DurationUnit, DurationLabel>>
}

function writeDuration(count: number, label: Required<DurationLabel>, override: DurationLabel | undefined, long: boolean): string {
  const { short, one, other } = { ...label, ...override }

  return long ? `${count} ${count === 1 ? one : other}` : `${count}${short}`
}

const DEFAULT_DURATION_UNITS: DurationUnit[] = ['d', 'h', 'm', 's']

/** A duration in milliseconds as text such as `1d 7h 30m` (negative ones keep their sign); in short mode with the default labels, `parseDuration` reads it back. */
export function formatDuration(ms: number, { long = false, maxUnits = Infinity, units = DEFAULT_DURATION_UNITS, labels }: FormatDurationOptions = {}): string {
  const selected = DURATION_UNITS.filter(({ unit }) => units.includes(unit))

  let remaining = Math.floor(Math.abs(ms))
  const parts: string[] = []

  for (const { unit, ms: unitMs, label } of selected) {
    const count = Math.floor(remaining / unitMs)

    if (count > 0) {
      parts.push(writeDuration(count, label, labels?.[unit], long))
      remaining -= count * unitMs
    }

    if (parts.length >= maxUnits)
      break
  }

  if (parts.length === 0) {
    const smallest = selected.at(-1) ?? DURATION_UNITS.at(-1)!

    return writeDuration(0, smallest.label, labels?.[smallest.unit], long)
  }

  return (ms < 0 ? '-' : '') + parts.join(long ? ', ' : ' ')
}

export interface InDaysOptions {
  /** The compact register a dense strip reads in: `in 3d` rather than `in 3 days`. */
  short?: boolean
}

/** A day count as when it lands. */
export function inDays(days: number, { short = false }: InDaysOptions = {}): string {
  if (days <= 0)
    return 'today'

  if (days === 1)
    return 'tomorrow'

  return short ? `in ${days}d` : `in ${days} days`
}
