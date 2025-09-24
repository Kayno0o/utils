import { Memoize } from '~/decorators/memoize'

class Calculator {
  private _multiplier = 1
  private computationCount = 0

  get multiplier() { return this._multiplier }
  set multiplier(value: number) { this._multiplier = value }

  // Memoized getter (existing functionality)
  @Memoize({ clearOn: ['multiplier'] })
  get expensiveCalculation(): number {
    console.log('Computing expensive calculation...')
    let result = 0
    for (let i = 0; i < 1000; i++)
      result += i * this.multiplier

    return result
  }

  // Memoized method (new functionality)
  @Memoize()
  fibonacci(n: number): number {
    console.log(`Computing fibonacci(${n})`)
    this.computationCount++

    if (n <= 1)
      return n
    return this.fibonacci(n - 1) + this.fibonacci(n - 2)
  }

  // Memoized method with TTL
  @Memoize({ ttl: 2000 })
  fetchData(id: string, options?: { cache?: boolean }): string {
    console.log(`Fetching data for ${id} with options:`, options)
    return `Data for ${id} - ${Date.now()}`
  }

  // Memoized method that clears when multiplier changes
  @Memoize({ clearOn: ['multiplier'] })
  compute(base: number, power: number): number {
    console.log(`Computing ${base}^${power} * ${this.multiplier}`)
    return base ** power * this.multiplier
  }

  getComputationCount() {
    return this.computationCount
  }

  resetComputationCount() {
    this.computationCount = 0
  }
}

// Example usage
async function demonstrateMemoizedMethods() {
  const calc = new Calculator()

  console.log('=== Memoized Methods Demo ===\n')

  // 1. Basic method memoization
  console.log('1. Fibonacci with memoization:')
  calc.resetComputationCount()

  console.log('fibonacci(10):', calc.fibonacci(10))
  console.log('fibonacci(10) again:', calc.fibonacci(10)) // Should use cache
  console.log('fibonacci(8):', calc.fibonacci(8)) // Should use cache from previous computation
  console.log('Computation count:', calc.getComputationCount())
  console.log()

  // 2. Method with different arguments
  console.log('2. Methods with different arguments:')
  console.log('compute(2, 3):', calc.compute(2, 3))
  console.log('compute(2, 3) again:', calc.compute(2, 3)) // Cached
  console.log('compute(3, 2):', calc.compute(3, 2)) // Different args, not cached
  console.log('compute(2, 3) again:', calc.compute(2, 3)) // Still cached
  console.log()

  // 3. Cache invalidation with clearOn
  console.log('3. Cache invalidation:')
  console.log('compute(2, 4):', calc.compute(2, 4))
  console.log('compute(2, 4) again:', calc.compute(2, 4)) // Cached

  calc.multiplier = 2 // This should clear the cache
  console.log('After changing multiplier:')
  console.log('compute(2, 4):', calc.compute(2, 4)) // Recomputed
  console.log()

  // 4. TTL expiration
  console.log('4. TTL expiration:')
  console.log('fetchData("user1"):', calc.fetchData('user1'))
  console.log('fetchData("user1") again:', calc.fetchData('user1')) // Cached

  console.log('Waiting for TTL to expire...')
  await new Promise(resolve => setTimeout(resolve, 2100))

  console.log('fetchData("user1") after TTL:', calc.fetchData('user1')) // Recomputed
  console.log()

  // 5. Methods with complex arguments
  console.log('5. Complex arguments:')
  const opts1 = { cache: true }
  const opts2 = { cache: true }
  const opts3 = { cache: false }

  console.log('fetchData("user2", opts1):', calc.fetchData('user2', opts1))
  console.log('fetchData("user2", opts2):', calc.fetchData('user2', opts2)) // Same structure, cached
  console.log('fetchData("user2", opts3):', calc.fetchData('user2', opts3)) // Different structure, not cached
}

try {
  demonstrateMemoizedMethods()
}
catch (e) {
  console.error(e)
}
