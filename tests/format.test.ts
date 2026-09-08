import { describe, expect, test as it } from 'bun:test'
import { formatDuration, formatFileSize } from '../src'

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
})

describe('formatFileSize', () => {
  it('defaults to binary steps with IEC labels', () => {
    expect(formatFileSize(1024)).toBe('1.0 KiB')
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GiB')
  })

  it('takes metric steps with si', () => {
    expect(formatFileSize(1000, true)).toBe('1.0 kB')
  })

  it('mixes binary steps with the short labels', () => {
    expect(formatFileSize(1024 ** 3, { units: 'binary' })).toBe('1.0 GB')
    expect(formatFileSize(1536 * 1024 ** 2, { units: 'binary' })).toBe('1.5 GB')
  })

  it('leaves values under the threshold in bytes', () => {
    expect(formatFileSize(512, { units: 'binary' })).toBe('512 B')
  })

  it('honours the decimal places in both forms', () => {
    expect(formatFileSize(1536, false, 2)).toBe('1.50 KiB')
    expect(formatFileSize(1536, { units: 'binary', dp: 0 })).toBe('2 kB')
  })
})
