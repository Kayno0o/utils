export * from './number'

const DURATION_UNITS = [
  { ms: 86_400_000, short: 'd', long: 'day' },
  { ms: 3_600_000, short: 'h', long: 'hour' },
  { ms: 60_000, short: 'm', long: 'minute' },
  { ms: 1_000, short: 's', long: 'second' },
]

export function formatDuration(ms: number, { long = false } = {}): string {
  let remaining = Math.abs(ms)
  const parts: string[] = []

  for (const unit of DURATION_UNITS) {
    const count = Math.floor(remaining / unit.ms)

    if (count > 0) {
      parts.push(long ? `${count} ${unit.long}${count > 1 ? 's' : ''}` : `${count}${unit.short}`)
      remaining -= count * unit.ms
    }
  }

  return parts.join(long ? ', ' : ' ') || (long ? '0 seconds' : '0s')
}
