import { describe, expect, test as it } from 'bun:test'
import { cronExpressionExplainer, cronMatches, getNextCronRuns, getPreviousCronRuns } from '../src'

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

describe('getNextCronRuns / getPreviousCronRuns', () => {
  it('returns upcoming runs ignoring a trailing command', () => {
    const runs = getNextCronRuns('0 0 * * * /bin/bash', { from: new Date(2026, 5, 8, 12), count: 2 })

    expect(runs).toEqual([
      new Date(2026, 5, 9, 0, 0),
      new Date(2026, 5, 10, 0, 0),
    ])
  })

  it('returns past runs, most recent first', () => {
    const runs = getPreviousCronRuns('0 0 * * *', { from: new Date(2026, 5, 8, 12), count: 3 })

    expect(runs).toEqual([
      new Date(2026, 5, 8, 0, 0),
      new Date(2026, 5, 7, 0, 0),
      new Date(2026, 5, 6, 0, 0),
    ])
  })

  it('steps backwards across month boundaries', () => {
    const runs = getPreviousCronRuns('0 0 1 * *', { from: new Date(2026, 2, 15), count: 3 })

    // 1st of March, February, January 2026.
    expect(runs).toEqual([
      new Date(2026, 2, 1, 0, 0),
      new Date(2026, 1, 1, 0, 0),
      new Date(2026, 0, 1, 0, 0),
    ])
  })

  it('previous runs are leap-year aware', () => {
    const runs = getPreviousCronRuns('0 0 29 2 *', { from: new Date(2030, 0, 1), count: 2 })

    expect(runs).toEqual([
      new Date(2028, 1, 29, 0, 0),
      new Date(2024, 1, 29, 0, 0),
    ])
  })
})

describe('cronMatches day fields', () => {
  it('ANDs the day fields when one starts with a star, as Vixie cron does', () => {
    // 2026-06-15 is a Monday, the 15th: odd, so `*/2` (1, 3, 5...) matches it.
    expect(cronMatches('0 0 */2 * 1', new Date(2026, 5, 15, 0, 0))).toBe(true)
    // 2026-06-16 is a Tuesday, the 16th: neither an odd day nor a Monday.
    expect(cronMatches('0 0 */2 * 1', new Date(2026, 5, 16, 0, 0))).toBe(false)
    // 2026-06-17 is a Wednesday, the 17th: an odd day, not a Monday.
    expect(cronMatches('0 0 */2 * 1', new Date(2026, 5, 17, 0, 0))).toBe(false)
  })

  it('ORs two restricted day fields', () => {
    expect(cronMatches('0 0 17 * 1', new Date(2026, 5, 17, 0, 0))).toBe(true)
    expect(cronMatches('0 0 17 * 1', new Date(2026, 5, 15, 0, 0))).toBe(true)
  })
})

describe('cronMatches', () => {
  it('returns true when the date satisfies the expression', () => {
    expect(cronMatches('0 * * * 0', new Date(2026, 5, 14, 0, 0))).toBe(true) // Sunday, minute 0
    expect(cronMatches('0 * * * 0', new Date(2026, 5, 14, 3, 0))).toBe(true)
  })

  it('returns false when any field does not match', () => {
    expect(cronMatches('0 * * * 0', new Date(2026, 5, 14, 0, 30))).toBe(false) // minute 30
    expect(cronMatches('0 * * * 0', new Date(2026, 5, 13, 0, 0))).toBe(false) // Saturday
  })

  it('ignores seconds and a trailing command', () => {
    expect(cronMatches('0 * * * 0 /bin/bash', new Date(2026, 5, 14, 0, 0, 42))).toBe(true)
  })

  it('agrees with getNextCronRuns', () => {
    const [next] = getNextCronRuns('*/15 9-17 * * mon-fri', { from: new Date(2026, 5, 8), count: 1 })

    expect(cronMatches('*/15 9-17 * * mon-fri', next!)).toBe(true)
  })
})
