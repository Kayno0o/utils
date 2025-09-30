import { describe, expect, test as it } from 'bun:test'
import { Rules } from '~'

describe('isWeekDay rule', () => {
  it('should return true for weekday date', () => {
    const date = new Date('2023-07-27T10:00:00') // Thursday
    const isValid = Rules.isWeekDay(date)

    expect(isValid).toBe(true)
  })

  it('should return error message for weekend date', () => {
    const date = new Date('2023-07-29T10:00:00') // Saturday
    const isValid = Rules.isWeekDay(date)

    expect(isValid).toBeString()
  })

  it('should return true for null value', () => {
    const isValid = Rules.isWeekDay(null)

    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = Rules.isWeekDay(undefined)

    expect(isValid).toBe(true)
  })
})
