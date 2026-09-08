import { addDays, fromISODate, toISODate } from './date'

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatters.get(timeZone)

  if (!cached) {
    cached = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timeZone, cached)
  }

  return cached
}

/** A zone this runtime knows, or `fallback` when the caller names one it doesn't. */
export function knownZone(timeZone: string | undefined, fallback: string): string {
  if (!timeZone)
    return fallback

  try {
    formatter(timeZone)

    return timeZone
  }
  catch {
    return fallback
  }
}

export interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** What a clock in `timeZone` reads at that instant. */
export function wallClock(at: Date, timeZone: string): WallClock {
  const parts = formatter(timeZone).formatToParts(at)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0)

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Local 'YYYY-MM-DD' + hour (0-23) right now. Both the "is it time yet" check and the per-day
 * dedupe key of a daily report read from this, so a send lands on the local day.
 */
export function localDayHour(timeZone: string): { date: string, hour: number } {
  const { year, month, day, hour } = wallClock(new Date(), timeZone)

  return { date: isoDate(year, month, day), hour }
}

/** Local 'YYYY-MM-DD' of an instant, which is the day something that happened at it belongs to. */
export function localDate(at: Date, timeZone: string): string {
  const { year, month, day } = wallClock(at, timeZone)

  return isoDate(year, month, day)
}

/** How far `timeZone` runs ahead of UTC at that instant, in ms. */
export function zoneOffsetMs(at: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = wallClock(at, timeZone)
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second)

  return asUtc - Math.floor(at.getTime() / 1000) * 1000
}

/** The instant a local wall clock reads `date` at `time` ('HH:MM'). Offset is read twice so a DST-shifted day lands right. */
export function localInstant(date: string, time: string, timeZone: string): Date {
  const asUtc = Date.parse(`${date}T${time}:00.000Z`)
  const guess = new Date(asUtc - zoneOffsetMs(new Date(asUtc), timeZone))

  return new Date(asUtc - zoneOffsetMs(guess, timeZone))
}

export function localDayStart(date: string, timeZone: string): Date {
  return localInstant(date, '00:00', timeZone)
}

/**
 * UTC ISO bounds of a local day, as `[start, end)`. A window built from the date string alone
 * would carry the host's UTC midnight and slide the day by the local offset.
 */
export function localDayRange(date: string, timeZone: string): { start: string, end: string } {
  const next = toISODate(addDays(fromISODate(date), 1))

  return {
    start: localDayStart(date, timeZone).toISOString(),
    end: localDayStart(next, timeZone).toISOString(),
  }
}
