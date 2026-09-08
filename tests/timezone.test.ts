import { describe, expect, test } from 'bun:test'
import { alphaHex } from '../src/colors'
import { inDays } from '../src/format'
import { knownZone, localDate, localDayRange, localDayStart, localInstant, wallClock } from '../src/timezone'

const PARIS = 'Europe/Paris'

describe('knownZone', () => {
  test('keeps a zone the runtime knows', () => {
    expect(knownZone('Asia/Tokyo', PARIS)).toBe('Asia/Tokyo')
  })

  test('falls back for a name it does not', () => {
    expect(knownZone('Mars/Olympus', PARIS)).toBe(PARIS)
    expect(knownZone(undefined, PARIS)).toBe(PARIS)
  })
})

describe('wallClock', () => {
  test('reads the zone rather than the host clock', () => {
    expect(wallClock(new Date('2026-01-15T23:30:00Z'), 'Asia/Tokyo')).toEqual({
      year: 2026,
      month: 1,
      day: 16,
      hour: 8,
      minute: 30,
      second: 0,
    })
  })
})

describe('localDate', () => {
  test('an instant belongs to the local day, not the UTC one', () => {
    expect(localDate(new Date('2026-01-15T23:30:00Z'), PARIS)).toBe('2026-01-16')
    expect(localDate(new Date('2026-01-15T23:30:00Z'), 'UTC')).toBe('2026-01-15')
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
