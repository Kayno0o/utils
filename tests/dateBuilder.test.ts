import { describe, expect, test as it } from 'bun:test'
import { formatDate, loadDateLocale } from '../src/builders/date'
import { en } from '../src/i18n/date/en'

describe('formatDate', () => {
  it('names every weekday, Sunday included', () => {
    loadDateLocale(en)

    expect(formatDate(new Date(2026, 10, 1), d => d.weekDay4)).toBe('Sunday')
    expect(formatDate(new Date(2026, 10, 2), d => d.weekDay4)).toBe('Monday')
    expect(formatDate(new Date(2026, 10, 7), d => d.weekDay4)).toBe('Saturday')
  })
})
