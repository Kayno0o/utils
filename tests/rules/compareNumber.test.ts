import { describe, expect, test as it } from 'bun:test'
import { Rules } from '../../src'

describe('compareNumber rule', () => {
  it('should return true for equal comparison', () => {
    const isValid = Rules.compareNumber('eq', 5)(5)

    expect(isValid).toBe(true)
  })

  it('should return error message for not equal comparison', () => {
    const isValid = Rules.compareNumber('eq', 5)(4)

    expect(isValid).toBeString()
  })

  it('should return true for not equal comparison', () => {
    const isValid = Rules.compareNumber('neq', 5)(4)

    expect(isValid).toBe(true)
  })

  it('should return error message for equal comparison when using not equal', () => {
    const isValid = Rules.compareNumber('neq', 5)(5)

    expect(isValid).toBeString()
  })

  it('should return true for greater than comparison', () => {
    const isValid = Rules.compareNumber('gt', 5)(6)

    expect(isValid).toBe(true)
  })

  it('should return error message for less than or equal to comparison when using greater than', () => {
    const isValid = Rules.compareNumber('gt', 5)(5)

    expect(isValid).toBeString()
  })

  it('should return true for greater than or equal to comparison', () => {
    const isValid = Rules.compareNumber('gte', 5)(5)

    expect(isValid).toBe(true)
  })

  it('should return error message for less than comparison when using greater than or equal to', () => {
    const isValid = Rules.compareNumber('gte', 5)(4)

    expect(isValid).toBeString()
  })

  it('should return true for less than comparison', () => {
    const isValid = Rules.compareNumber('lt', 5)(4)

    expect(isValid).toBe(true)
  })

  it('should return error message for greater than or equal to comparison when using less than', () => {
    const isValid = Rules.compareNumber('lt', 5)(5)

    expect(isValid).toBeString()
  })

  it('should return true for less than or equal to comparison', () => {
    const isValid = Rules.compareNumber('lte', 5)(5)

    expect(isValid).toBe(true)
  })

  it('should return error message for greater than comparison when using less than or equal to', () => {
    const isValid = Rules.compareNumber('lte', 5)(6)

    expect(isValid).toBeString()
  })

  it('should return default error message for invalid comparator', () => {
    const isValid = Rules.compareNumber('invalid' as any, 5)(5)

    expect(isValid).toBeString()
  })
})
