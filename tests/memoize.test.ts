/* eslint-disable ts/class-literal-property-style */
/* eslint-disable ts/no-unused-expressions */
import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { Memoize } from '../src/decorators'

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

    for (let i = 0; i < 1000; i++)
      result += i * this.multiplier

    return result
  }
}

describe('Memoize decorator', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  afterEach(() => {
    setSystemTime()
  })

  describe('basic caching', () => {
    it('should cache getter results', () => {
      const first = service.expensiveOperation
      const second = service.expensiveOperation

      expect(first).toBe(second)
    })

    it('should return same cached value multiple times', () => {
      const results = Array.from({ length: 5 }).fill(service.expensiveOperation)

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
    it('should expire cache after TTL', () => {
      const t0 = Date.now()

      setSystemTime(t0)
      const first = service.timedComputation
      const immediate = service.timedComputation

      expect(first).toBe(immediate)

      setSystemTime(t0 + 120)
      const afterTTL = service.timedComputation

      expect(first).not.toBe(afterTTL)
    })

    it('should not expire before TTL', () => {
      const t0 = Date.now()

      setSystemTime(t0)
      const first = service.timedComputation

      setSystemTime(t0 + 50)
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

describe('Memoize decorator cache options', () => {
  it('bounds a method cache with maxEntries and lru', () => {
    let calls = 0

    class Service {
      @Memoize({ maxEntries: 2, lru: true })
      double(n: number): number {
        calls++

        return n * 2
      }
    }

    const service = new Service()

    service.double(1)
    service.double(2)
    service.double(1)
    service.double(3)
    expect(calls).toBe(3)

    service.double(1)
    expect(calls).toBe(3)

    service.double(2)
    expect(calls).toBe(4)
  })

  it('keys method calls with a custom key', () => {
    let calls = 0

    class Service {
      @Memoize({ key: (user: { id: number }) => String(user.id) })
      greet(user: { id: number, name: string }): string {
        calls++

        return `hi ${user.name}`
      }
    }

    const service = new Service()

    expect(service.greet({ id: 1, name: 'Ann' })).toBe('hi Ann')
    expect(service.greet({ id: 1, name: 'Renamed' })).toBe('hi Ann')
    expect(calls).toBe(1)
  })

  it('takes a key whose parameters are left unannotated', () => {
    class Service {
      @Memoize({ key: (a, b) => `${a.toFixed(0)}:${b.toFixed(0)}` })
      add(a: number, b: number): number {
        return a + b
      }
    }

    expect(new Service().add(1, 2)).toBe(3)
  })
})

describe('Memoize decorator on async methods', () => {
  it('evicts a rejected promise so the next call retries', async () => {
    let calls = 0

    class Service {
      @Memoize()
      async load(): Promise<string> {
        calls++

        if (calls === 1)
          throw new Error('flaky')

        return 'ok'
      }
    }

    const service = new Service()

    await expect(service.load()).rejects.toThrow('flaky')
    expect(await service.load()).toBe('ok')
    expect(await service.load()).toBe('ok')
    expect(calls).toBe(2)
  })
})
