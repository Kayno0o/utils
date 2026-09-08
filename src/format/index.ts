export * from './number'

const DURATION_UNITS = [
  { ms: 86_400_000, short: 'd', long: 'day' },
  { ms: 3_600_000, short: 'h', long: 'hour' },
  { ms: 60_000, short: 'm', long: 'minute' },
  { ms: 1_000, short: 's', long: 'second' },
]

interface FormatDurationOptions {
  /** Spell the units out and separate them with commas: "2 hours, 5 minutes". */
  long?: boolean
  /** Keep only the N largest non-zero units, so a reading stays the same width as it grows. */
  maxUnits?: number
}

export function formatDuration(ms: number, { long = false, maxUnits = Infinity }: FormatDurationOptions = {}): string {
  let remaining = Math.abs(ms)
  const parts: string[] = []

  for (const unit of DURATION_UNITS) {
    const count = Math.floor(remaining / unit.ms)

    if (count > 0) {
      parts.push(long ? `${count} ${unit.long}${count > 1 ? 's' : ''}` : `${count}${unit.short}`)
      remaining -= count * unit.ms
    }

    if (parts.length >= maxUnits)
      break
  }

  return parts.join(long ? ', ' : ' ') || (long ? '0 seconds' : '0s')
}
