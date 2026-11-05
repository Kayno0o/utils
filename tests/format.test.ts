import { describe, expect, test as it } from 'bun:test'
import { formatDuration, formatFileSize, formatUnit, parseDuration } from '../src'

describe('formatDuration', () => {
  it('formats short duration', () => {
    expect(formatDuration(90_061_000)).toBe('1d 1h 1m 1s')
  })

  it('skips zero units', () => {
    expect(formatDuration(3_600_000)).toBe('1h')
  })

  it('formats long duration', () => {
    expect(formatDuration(90_061_000, { long: true })).toBe('1 day, 1 hour, 1 minute, 1 second')
  })

  it('pluralizes long units', () => {
    expect(formatDuration(172_800_000, { long: true })).toBe('2 days')
  })

  it('returns 0s for zero', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(0, { long: true })).toBe('0 seconds')
  })

  it('keeps only the largest units when capped', () => {
    expect(formatDuration(90_061_000, { maxUnits: 2 })).toBe('1d 1h')
    expect(formatDuration(3_690_000, { maxUnits: 2 })).toBe('1h 1m')
    expect(formatDuration(45_000, { maxUnits: 2 })).toBe('45s')
  })

  it('skips zero units while counting towards the cap', () => {
    expect(formatDuration(86_405_000, { maxUnits: 2 })).toBe('1d 5s')
  })

  it('writes only the given units', () => {
    expect(formatDuration(90_061_000, { units: ['h', 'm'] })).toBe('25h 1m')
    expect(formatDuration(30_000, { units: ['h', 'm'] })).toBe('0m')
  })

  it('relabels units in both registers', () => {
    const labels = { d: { short: 'j', one: 'jour', other: 'jours' }, h: { one: 'heure', other: 'heures' } }

    expect(formatDuration(90_000_000, { labels })).toBe('1j 1h')
    expect(formatDuration(176_400_000, { long: true, labels })).toBe('2 jours, 1 heure')
    expect(formatDuration(0, { long: true, labels: { s: { other: 'secondes' } } })).toBe('0 secondes')
  })
})

describe('formatDuration signs, wide units and round trip', () => {
  it('keeps the sign', () => {
    expect(formatDuration(-90_061_000)).toBe('-1d 1h 1m 1s')
    expect(formatDuration(-86_405_000, { maxUnits: 2 })).toBe('-1d 5s')
    expect(formatDuration(-7_200_000, { long: true })).toBe('-2 hours')
    expect(formatDuration(-500)).toBe('0s')
  })

  it('reaches w, M and y', () => {
    expect(formatDuration(parseDuration('1y 2w 3d'), { units: ['y', 'w', 'd'] })).toBe('1y 2w 3d')
    expect(formatDuration(parseDuration('1M 1w'), { units: ['M', 'w'], long: true })).toBe('1 month, 1 week')
    expect(formatDuration(2 * 365 * 86_400_000, { units: ['y'], long: true })).toBe('2 years')
  })

  it('labels the zero unit it falls back to', () => {
    expect(formatDuration(0, { units: ['m'], labels: { m: { short: 'min' } } })).toBe('0min')
  })

  it('round-trips through parseDuration in short mode', () => {
    const all: ('y' | 'M' | 'w' | 'd' | 'h' | 'm' | 's')[] = ['y', 'M', 'w', 'd', 'h', 'm', 's']

    for (const ms of [0, 1000, 59_000, 90_061_000, 86_400_000 * 400 + 3_723_000, -5_400_000]) {
      expect(parseDuration(formatDuration(ms))).toBe(ms)
      expect(parseDuration(formatDuration(ms, { units: all }))).toBe(ms)
    }
  })
})

describe('formatFileSize', () => {
  it('writes the number in a locale', () => {
    expect(formatFileSize(1536 * 1024, { units: 'si', locale: 'fr-FR' })).toBe('1,6 MB')
    expect(formatFileSize(1536, { dp: 2, locale: 'de-DE' })).toBe('1,50 KiB')
  })
})

describe('formatUnit', () => {
  it('writes the number in a locale', () => {
    expect(formatUnit(1500, { locale: 'fr-FR' })).toBe('1,5k')
    expect(formatUnit(-2_500_000, { locale: 'de-DE' })).toBe('-2,5M')
    expect(formatUnit(1500)).toBe('1.5k')
  })
})

describe('formatFileSize (defaults)', () => {
  it('defaults to binary steps with IEC labels', () => {
    expect(formatFileSize(1024)).toBe('1.0 KiB')
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GiB')
  })

  it('takes metric steps with si', () => {
    expect(formatFileSize(1000, { units: 'si' })).toBe('1.0 kB')
    expect(formatFileSize(1500000, { units: 'si' })).toBe('1.5 MB')
  })

  it('mixes binary steps with the short labels', () => {
    expect(formatFileSize(1024 ** 3, { units: 'binary' })).toBe('1.0 GB')
    expect(formatFileSize(1536 * 1024 ** 2, { units: 'binary' })).toBe('1.5 GB')
  })

  it('leaves values under the threshold in bytes', () => {
    expect(formatFileSize(512, { units: 'binary' })).toBe('512 B')
  })

  it('honours the decimal places in both forms', () => {
    expect(formatFileSize(1536, { dp: 2 })).toBe('1.50 KiB')
    expect(formatFileSize(1536, { units: 'binary', dp: 0 })).toBe('2 kB')
  })
})
