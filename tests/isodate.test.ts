import { describe, expect, it } from 'bun:test'
import { fromISODate, gridDays, toISODate, weekStartISO } from '../src'

describe('toISODate', () => {
  it('formats local date without UTC shift', () => {
    expect(toISODate(new Date(2024, 0, 5))).toBe('2024-01-05')
    expect(toISODate(new Date(2024, 11, 31))).toBe('2024-12-31')
  })

  it('pads month and day', () => {
    expect(toISODate(new Date(2024, 1, 3))).toBe('2024-02-03')
  })
})

describe('fromISODate', () => {
  it('round-trips with toISODate', () => {
    const dates = ['2024-01-01', '2024-06-15', '2024-12-31']

    for (const iso of dates)
      expect(toISODate(fromISODate(iso))).toBe(iso)
  })

  it('returns local midnight', () => {
    const d = fromISODate('2024-03-10')

    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('weekStartISO', () => {
  it('returns Monday for any day of the week', () => {
    // 2024-06-10 is Monday
    expect(weekStartISO(new Date(2024, 5, 10))).toBe('2024-06-10')
    expect(weekStartISO(new Date(2024, 5, 12))).toBe('2024-06-10') // Wednesday
    expect(weekStartISO(new Date(2024, 5, 16))).toBe('2024-06-10') // Sunday
  })

  it('does not mutate the input', () => {
    const d = new Date(2024, 5, 14)
    const before = d.getTime()

    weekStartISO(d)
    expect(d.getTime()).toBe(before)
  })
})

describe('gridDays', () => {
  it('returns 7×weeks days', () => {
    const days = gridDays(4, new Date(2024, 5, 16)) // Sunday

    expect(days).toHaveLength(28)
  })

  it('starts on a Monday', () => {
    const days = gridDays(2, new Date(2024, 5, 16))
    const start = fromISODate(days[0]!)

    expect(start.getDay()).toBe(1) // Monday
  })

  it('ends on today', () => {
    const today = new Date(2024, 5, 16)
    const days = gridDays(3, today)

    expect(days.at(-1)).toBe(toISODate(today))
  })

  it('ascending order', () => {
    const days = gridDays(2, new Date(2024, 5, 16))

    for (let i = 1; i < days.length; i++)
      expect(days[i]! > days[i - 1]!).toBe(true)
  })
})
