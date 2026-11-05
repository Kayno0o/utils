import { afterEach, describe, expect, setSystemTime, test } from 'bun:test'
import { alphaHex } from '../src/colors'
import { inDays } from '../src/format'
import { formatLocalDate, getLocalDayHour, getWallClock, getZoneOffsetMs, localDayRange, localDayStart, localInstant, resolveTimeZone } from '../src/timezone'

const PARIS = 'Europe/Paris'

describe('resolveTimeZone', () => {
  test('keeps a zone the runtime knows', () => {
    expect(resolveTimeZone('Asia/Tokyo', PARIS)).toBe('Asia/Tokyo')
  })

  test('falls back for a name it does not', () => {
    expect(resolveTimeZone('Mars/Olympus', PARIS)).toBe(PARIS)
    expect(resolveTimeZone(undefined, PARIS)).toBe(PARIS)
  })
})

describe('getWallClock', () => {
  test('reads the zone rather than the host clock', () => {
    expect(getWallClock(new Date('2026-01-15T23:30:00Z'), 'Asia/Tokyo')).toEqual({
      year: 2026,
      month: 1,
      day: 16,
      hour: 8,
      minute: 30,
      second: 0,
    })
  })
})

describe('formatLocalDate', () => {
  test('an instant belongs to the local day, not the UTC one', () => {
    expect(formatLocalDate(new Date('2026-01-15T23:30:00Z'), PARIS)).toBe('2026-01-16')
    expect(formatLocalDate(new Date('2026-01-15T23:30:00Z'), 'UTC')).toBe('2026-01-15')
  })
})

describe('localInstant', () => {
  test('winter offset is one hour behind Paris', () => {
    expect(localInstant('2026-01-15', '09:00', PARIS).toISOString()).toBe('2026-01-15T08:00:00.000Z')
  })

  test('summer offset is two, which is what the second read catches', () => {
    expect(localInstant('2026-07-15', '09:00', PARIS).toISOString()).toBe('2026-07-15T07:00:00.000Z')
  })
})

describe('localDayRange', () => {
  test('bounds a local day as [start, end)', () => {
    expect(localDayRange('2026-01-15', PARIS)).toEqual({
      start: '2026-01-14T23:00:00.000Z',
      end: '2026-01-15T23:00:00.000Z',
    })
  })

  test('a spring-forward day is 23 hours long', () => {
    const { start, end } = localDayRange('2026-03-29', PARIS)

    expect(Date.parse(end) - Date.parse(start)).toBe(23 * 3600 * 1000)
  })

  test('starts where localDayStart says', () => {
    expect(localDayRange('2026-01-15', PARIS).start).toBe(localDayStart('2026-01-15', PARIS).toISOString())
  })
})

describe('alphaHex', () => {
  test('spans the byte and clamps past either end', () => {
    expect(alphaHex(0)).toBe('00')
    expect(alphaHex(1)).toBe('ff')
    expect(alphaHex(0.5)).toBe('80')
    expect(alphaHex(-1)).toBe('00')
    expect(alphaHex(2)).toBe('ff')
  })

  test('pads a single digit so the suffix is always two chars', () => {
    expect(alphaHex(0.02)).toBe('05')
  })
})

describe('inDays', () => {
  test('names the near days rather than counting them', () => {
    expect(inDays(0)).toBe('today')
    expect(inDays(-3)).toBe('today')
    expect(inDays(1)).toBe('tomorrow')
  })

  test('counts the rest, short or long', () => {
    expect(inDays(3)).toBe('in 3 days')
    expect(inDays(3, { short: true })).toBe('in 3d')
  })
})

describe('localDayRange input', () => {
  test('throws on a date that names no real day', () => {
    expect(() => localDayRange('2024-02-30', PARIS)).toThrow(RangeError)
  })
})

describe('getZoneOffsetMs', () => {
  test('reads the offset ahead of UTC, with daylight saving', () => {
    expect(getZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), PARIS)).toBe(3_600_000)
    expect(getZoneOffsetMs(new Date('2026-07-15T12:00:00Z'), PARIS)).toBe(7_200_000)
    expect(getZoneOffsetMs(new Date('2026-07-15T12:00:00Z'), 'UTC')).toBe(0)
    expect(getZoneOffsetMs(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toBe(-5 * 3_600_000)
  })

  test('ignores the milliseconds of the instant', () => {
    expect(getZoneOffsetMs(new Date('2026-01-15T12:00:00.789Z'), 'Asia/Kolkata')).toBe(5.5 * 3_600_000)
  })
})

describe('getLocalDayHour', () => {
  afterEach(() => {
    setSystemTime()
  })

  test('gives the local date and hour of now', () => {
    setSystemTime(new Date('2026-03-10T23:30:00Z'))

    expect(getLocalDayHour(PARIS)).toEqual({ date: '2026-03-11', hour: 0 })
    expect(getLocalDayHour('UTC')).toEqual({ date: '2026-03-10', hour: 23 })
    expect(getLocalDayHour('America/New_York')).toEqual({ date: '2026-03-10', hour: 19 })
  })
})
