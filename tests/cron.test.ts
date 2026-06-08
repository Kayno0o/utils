import { describe, expect, test as it } from 'bun:test'
import { cronExpressionExplainer } from '../src'

describe('cronExpressionExplainer', () => {
  it('parses the schedule, command and description', () => {
    const result = cronExpressionExplainer('0 * * * 0 /bin/bash', { from: new Date(2026, 5, 8) })

    expect(result.expression).toBe('0 * * * 0')
    expect(result.command).toBe('/bin/bash')
    expect(result.description).toBe('Minute 0, on Sunday, running `/bin/bash`')
  })

  it('omits the command when absent', () => {
    const result = cronExpressionExplainer('0 * * * 0', { from: new Date(2026, 5, 8) })

    expect(result.command).toBeUndefined()
    expect(result.description).toBe('Minute 0, on Sunday')
  })

  it('computes the next runs after the reference date', () => {
    const from = new Date(2026, 5, 13, 12, 30) // Sat 13 June 2026
    const result = cronExpressionExplainer('0 * * * 0', { from })

    // First Sunday at minute 0 is 14 June 2026 00:00.
    expect(result.nextRuns).toEqual([
      new Date(2026, 5, 14, 0, 0),
      new Date(2026, 5, 14, 1, 0),
      new Date(2026, 5, 14, 2, 0),
      new Date(2026, 5, 14, 3, 0),
      new Date(2026, 5, 14, 4, 0),
    ])
  })

  it('respects the count option', () => {
    const result = cronExpressionExplainer('* * * * *', { from: new Date(2026, 0, 1, 0, 0), count: 3 })

    expect(result.nextRuns).toEqual([
      new Date(2026, 0, 1, 0, 1),
      new Date(2026, 0, 1, 0, 2),
      new Date(2026, 0, 1, 0, 3),
    ])
  })

  it('handles leap years (Feb 29th only fires on leap years)', () => {
    const result = cronExpressionExplainer('0 0 29 2 *', { from: new Date(2025, 0, 1), count: 2 })

    // 2025, 2026, 2027 are not leap years; next Feb 29ths are 2028 and 2032.
    expect(result.nextRuns).toEqual([
      new Date(2028, 1, 29, 0, 0),
      new Date(2032, 1, 29, 0, 0),
    ])
  })

  it('rolls day-of-month over short months correctly', () => {
    const result = cronExpressionExplainer('0 0 31 * *', { from: new Date(2026, 1, 1), count: 3 })

    // February has no 31st; next are March, May, July 2026.
    expect(result.nextRuns).toEqual([
      new Date(2026, 2, 31, 0, 0),
      new Date(2026, 4, 31, 0, 0),
      new Date(2026, 6, 31, 0, 0),
    ])
  })

  it('supports steps, ranges, lists and aliases', () => {
    expect(cronExpressionExplainer('*/15 * * * *').description).toBe('Every 15 minutes')
    expect(cronExpressionExplainer('0 9-17 * * *').description).toBe('Minute 0, at hour 9 through 17')
    expect(cronExpressionExplainer('0 0 1,15 * *').description).toBe('Minute 0, at hour 0, on day 1 and 15 of the month')
    expect(cronExpressionExplainer('0 0 * jan mon').description).toBe('Minute 0, at hour 0, in January, on Monday')
  })

  it('treats both 0 and 7 as Sunday', () => {
    const sunday0 = cronExpressionExplainer('0 0 * * 0', { from: new Date(2026, 5, 8), count: 1 })
    const sunday7 = cronExpressionExplainer('0 0 * * 7', { from: new Date(2026, 5, 8), count: 1 })

    expect(sunday7.nextRuns).toEqual(sunday0.nextRuns)
  })

  it('describes the catch-all expression', () => {
    expect(cronExpressionExplainer('* * * * *').description).toBe('Every minute')
  })

  it('throws on malformed expressions', () => {
    expect(() => cronExpressionExplainer('* * *')).toThrow()
    expect(() => cronExpressionExplainer('99 * * * *')).toThrow()
  })
})
