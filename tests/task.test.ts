import { describe, expect, it } from 'bun:test'
import { isTaskSettled, TASK_IN_FLIGHT_STATUSES } from '../src'

describe('isTaskSettled', () => {
  it('accepts the terminal statuses', () => {
    expect(isTaskSettled('completed')).toBe(true)
    expect(isTaskSettled('failed')).toBe(true)
  })

  it('rejects the in-flight statuses', () => {
    for (const status of TASK_IN_FLIGHT_STATUSES)
      expect(isTaskSettled(status)).toBe(false)
  })

  it('rejects an unknown status', () => {
    expect(isTaskSettled('')).toBe(false)
    expect(isTaskSettled('done')).toBe(false)
  })

  it('partitions the status space with TASK_IN_FLIGHT_STATUSES', () => {
    const all = ['pending', 'running', 'completed', 'failed']

    expect(all.filter(s => !isTaskSettled(s))).toEqual([...TASK_IN_FLIGHT_STATUSES])
  })
})
