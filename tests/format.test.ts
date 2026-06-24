import { describe, expect, test as it } from 'bun:test'
import { formatDuration } from '../src'

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
})
