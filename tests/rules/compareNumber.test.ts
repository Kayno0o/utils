import { describe, expect, test as it } from 'bun:test'
import { getRules, translateRules } from '~/utils'

describe('compareNumber rule', () => {
  const rules = getRules()

  it('should return true for equal comparison', () => {
    const isValid = rules.compareNumber('eq', 5)(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for not equal comparison', () => {
    const isValid = rules.compareNumber('eq', 5)(4)
    const errorMessage = translateRules('rules.compareNumber.eq', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for not equal comparison', () => {
    const isValid = rules.compareNumber('neq', 5)(4)
    expect(isValid).toBe(true)
  })

  it('should return error message for equal comparison when using not equal', () => {
    const isValid = rules.compareNumber('neq', 5)(5)
    const errorMessage = translateRules('rules.compareNumber.neq', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for greater than comparison', () => {
    const isValid = rules.compareNumber('gt', 5)(6)
    expect(isValid).toBe(true)
  })

  it('should return error message for less than or equal to comparison when using greater than', () => {
    const isValid = rules.compareNumber('gt', 5)(5)
    const errorMessage = translateRules('rules.compareNumber.gt', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for greater than or equal to comparison', () => {
    const isValid = rules.compareNumber('gte', 5)(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for less than comparison when using greater than or equal to', () => {
    const isValid = rules.compareNumber('gte', 5)(4)
    const errorMessage = translateRules('rules.compareNumber.gte', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for less than comparison', () => {
    const isValid = rules.compareNumber('lt', 5)(4)
    expect(isValid).toBe(true)
  })

  it('should return error message for greater than or equal to comparison when using less than', () => {
    const isValid = rules.compareNumber('lt', 5)(5)
    const errorMessage = translateRules('rules.compareNumber.lt', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return true for less than or equal to comparison', () => {
    const isValid = rules.compareNumber('lte', 5)(5)
    expect(isValid).toBe(true)
  })

  it('should return error message for greater than comparison when using less than or equal to', () => {
    const isValid = rules.compareNumber('lte', 5)(6)
    const errorMessage = translateRules('rules.compareNumber.lte', { nb: 5 })
    expect(isValid).toBe(errorMessage)
  })

  it('should return default error message for invalid comparator', () => {
    const isValid = rules.compareNumber('invalid' as any, 5)(5)
    const errorMessage = translateRules('rules.compareNumber.invalid')
    expect(isValid).toBe(errorMessage)
  })
})
