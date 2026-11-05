import { describe, expect, test as it } from 'bun:test'
import { formatMonthShort, formatTime, normalizeAccents } from '../src'
import { formatDateTime, getDateTimeFormat, getNumberFormat } from '../src/intlCache'

describe('intlCache', () => {
  it('reuses the same instance for the same locale and options', () => {
    expect(getNumberFormat('en-US', { style: 'percent' })).toBe(getNumberFormat('en-US', { style: 'percent' }))
    expect(getNumberFormat('en-US')).not.toBe(getNumberFormat('fr-FR'))
  })

  it('does not collide an undefined locale with an empty one', () => {
    getNumberFormat(undefined)

    expect(() => getNumberFormat('')).toThrow(RangeError)
  })

  it('returns Invalid Date instead of throwing, like toLocaleString', () => {
    expect(formatDateTime(new Date(Number.NaN), 'en-GB', { month: 'short' })).toBe('Invalid Date')
    expect(formatMonthShort(new Date(Number.NaN))).toBe('Invalid Date')
    expect(formatTime(8.64e15 + 1)).toBe('Invalid Date')
  })

  it('follows a runtime TZ change for formats without a timeZone', () => {
    const previous = process.env.TZ
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const
    const date = new Date('2026-01-15T12:00:00Z')

    try {
      process.env.TZ = 'Asia/Tokyo'
      expect(getDateTimeFormat('en-GB', options).format(date)).toBe('21:00')

      process.env.TZ = 'UTC'
      expect(getDateTimeFormat('en-GB', options).format(date)).toBe('12:00')
    }
    finally {
      if (previous === undefined)
        delete process.env.TZ
      else process.env.TZ = previous
    }
  })
})

describe('normalizeAccents fast path', () => {
  it('keeps ASCII and strips accents', () => {
    expect(normalizeAccents('plain text')).toBe('plain text')
    expect(normalizeAccents('éàü')).toBe('eau')
  })
})
