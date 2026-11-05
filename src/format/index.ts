export * from './number'

export type DurationUnit = 'd' | 'h' | 'm' | 's'

export interface DurationLabel {
  short?: string
  /** The singular word in `long` mode. */
  one?: string
  /** The plural word in `long` mode. */
  other?: string
}

const DURATION_UNITS: { unit: DurationUnit, ms: number, label: Required<DurationLabel> }[] = [
  { unit: 'd', ms: 86_400_000, label: { short: 'd', one: 'day', other: 'days' } },
  { unit: 'h', ms: 3_600_000, label: { short: 'h', one: 'hour', other: 'hours' } },
  { unit: 'm', ms: 60_000, label: { short: 'm', one: 'minute', other: 'minutes' } },
  { unit: 's', ms: 1_000, label: { short: 's', one: 'second', other: 'seconds' } },
]

export interface FormatDurationOptions {
  /** Spell the units out and separate them with commas: "2 hours, 5 minutes". */
  long?: boolean
  /** Keep only the N largest non-zero units, so a reading stays the same width as it grows. */
  maxUnits?: number
  /** The units to write, like `msDurationToString`'s (which also reaches `w`, `M` and `y`); what is smaller than the last one is dropped. */
  units?: DurationUnit[]
  /** What each unit is written as, for a locale that does not read them in English: `{ d: { short: 'j', one: 'jour', other: 'jours' } }`. */
  labels?: Partial<Record<DurationUnit, DurationLabel>>
}

function writeDuration(count: number, label: Required<DurationLabel>, override: DurationLabel | undefined, long: boolean): string {
  const { short, one, other } = { ...label, ...override }

  return long ? `${count} ${count === 1 ? one : other}` : `${count}${short}`
}

export function formatDuration(ms: number, { long = false, maxUnits = Infinity, units, labels }: FormatDurationOptions = {}): string {
  const selected = units ? DURATION_UNITS.filter(({ unit }) => units.includes(unit)) : DURATION_UNITS

  let remaining = Math.abs(ms)
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

  const smallest = selected.at(-1) ?? DURATION_UNITS.at(-1)!

  return parts.join(long ? ', ' : ' ') || writeDuration(0, smallest.label, labels?.[smallest.unit], long)
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
