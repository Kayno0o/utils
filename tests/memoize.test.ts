/* eslint-disable ts/class-literal-property-style */
/* eslint-disable ts/no-unused-expressions */
import { beforeEach, describe, expect, it } from 'bun:test'
import { Memoize } from '../index'

class TestService {
  private _value = 'initial'
  private _count = 0

  get value(): string {
    return this._value
  }

  set value(newValue: string) {
    this._value = newValue
  }

  get count(): number {
    return this._count
  }

  set count(newCount: number) {
    this._count = newCount
  }

  @Memoize()
  get expensiveOperation(): string {
    return `computed-${Math.random()}-${Date.now()}`
  }

  @Memoize({ clearOn: ['value'] })
  get dependentComputation(): string {
    return `dependent-${this.value}-${Math.random()}`
  }

  @Memoize({ ttl: 100 })
  get timedComputation(): number {
    return Math.random()
  }

  @Memoize({ clearOn: ['value', 'count'] })
  get multiDependentComputation(): string {
    return `multi-${this.value}-${this.count}-${Math.random()}`
  }
}

class Calculator {
  private _multiplier = 1

  get multiplier(): number {
    return this._multiplier
  }

  set multiplier(value: number) {
    this._multiplier = value
  }

  @Memoize({ clearOn: ['multiplier'] })
  get expensiveCalculation(): number {
    let result = 0
    for (let i = 0; i < 1000; i++) {
      result += i * this.multiplier
    }
    return result
  }
}

describe('Memoize decorator', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  describe('basic caching', () => {
    it('should cache getter results', () => {
      const first = service.expensiveOperation
      const second = service.expensiveOperation
      expect(first).toBe(second)
    })

    it('should return same cached value multiple times', () => {
      const results = Array.from({ length: 5 }, () => service.expensiveOperation)
      expect(results.every(r => r === results[0])).toBe(true)
    })
  })

  describe('cache invalidation with clearOn', () => {
    it('should clear cache when single dependency changes', () => {
      const first = service.dependentComputation
      service.value = 'changed'
      const second = service.dependentComputation

      expect(first).not.toBe(second)
    })

    it('should clear cache when any dependency changes', () => {
      const first = service.multiDependentComputation

      service.value = 'new-value'
      const second = service.multiDependentComputation
      expect(first).not.toBe(second)

      service.count = 42
      const third = service.multiDependentComputation
      expect(second).not.toBe(third)
    })

    it('should not clear cache when non-dependent property changes', () => {
      const first = service.dependentComputation
      service.count = 999
      const second = service.dependentComputation

      expect(first).toBe(second)
    })
  })

  describe('TTL expiration', () => {
    it('should expire cache after TTL', async () => {
      const first = service.timedComputation
      const immediate = service.timedComputation
      expect(first).toBe(immediate)

      await new Promise(resolve => setTimeout(resolve, 120))
      const afterTTL = service.timedComputation
      expect(first).not.toBe(afterTTL)
    })

    it('should not expire before TTL', async () => {
      const first = service.timedComputation

      await new Promise(resolve => setTimeout(resolve, 50))
      const beforeTTL = service.timedComputation
      expect(first).toBe(beforeTTL)
    })
  })

  describe('performance benefits', () => {
    it('should avoid expensive recalculations', () => {
      const calc = new Calculator()
      calc.multiplier = 10

      const start = performance.now()

      calc.expensiveCalculation
      const firstTime = performance.now() - start

      const start2 = performance.now()
      calc.expensiveCalculation
      const cachedTime = performance.now() - start2

      expect(cachedTime).toBeLessThan(firstTime)
    })
  })

  describe('multiple instances', () => {
    it('should maintain separate caches per instance', () => {
      const service1 = new TestService()
      const service2 = new TestService()

      const result1 = service1.expensiveOperation
      const result2 = service2.expensiveOperation

      expect(result1).not.toBe(result2)
      expect(service1.expensiveOperation).toBe(result1)
      expect(service2.expensiveOperation).toBe(result2)
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined return values', () => {
      class NullService {
        @Memoize()
        get nullValue(): null {
          return null
        }

        @Memoize()
        get undefinedValue(): undefined {
          return undefined
        }
      }

      const service = new NullService()
      expect(service.nullValue).toBeNull()
      expect(service.nullValue).toBeNull()
      expect(service.undefinedValue).toBeUndefined()
      expect(service.undefinedValue).toBeUndefined()
    })

    it('should handle complex object returns', () => {
      class ObjectService {
        @Memoize()
        get complexObject(): object {
          return { id: Math.random(), nested: { value: 'test' } }
        }
      }

      const service = new ObjectService()
      const first = service.complexObject
      const second = service.complexObject
      expect(first).toBe(second)
    })
  })
})
