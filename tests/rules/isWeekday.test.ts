import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('isWeekDay rule', () => {
  const rules = getRules()

  it('should return true for weekday date', () => {
    const date = new Date('2023-07-27T10:00:00') // Thursday
    const isValid = rules.isWeekDay(date)
    expect(isValid).toBe(true)
  })

  it('should return error message for weekend date', () => {
    const date = new Date('2023-07-29T10:00:00') // Saturday
    const errorMessage = translateRules('rules.isWeekDay')
    const isValid = rules.isWeekDay(date)
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for null value', () => {
    const isValid = rules.isWeekDay(null)
    expect(isValid).toBe(true)
  })

  it('should return true for undefined value', () => {
    const isValid = rules.isWeekDay(undefined)
    expect(isValid).toBe(true)
  })
})
