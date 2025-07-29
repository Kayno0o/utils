import { Memoize } from '../index'

// example 1: basic caching
class DataProcessor {
  private rawData = [1, 2, 3, 4, 5]

  @Memoize()
  get expensiveCalculation(): number {
    console.log('Computing expensive calculation for the first time...')
    return this.rawData.reduce((sum, n) => sum + n * n, 0)
  }
}

// example 2: TTL (Time-To-Live) caching
class WeatherService {
  private apiCallCount = 0

  @Memoize({ ttl: 5000 }) // Cache for 5 seconds
  get currentTemperature(): number {
    console.log(`API call #${++this.apiCallCount}`)
    return Math.floor(Math.random() * 30) + 10 // Simulate API call
  }
}

// example 3: cache invalidation with clearOn
class UserProfile {
  private _userId = 'user123'
  private _settings: any = { theme: 'dark' }

  get userId() { return this._userId }
  set userId(value: string) { this._userId = value }

  get settings() { return this._settings }
  set settings(value: any) { this._settings = value }

  @Memoize({ clearOn: ['userId'] })
  get userDisplayName(): string {
    console.log('Fetching display name from database...')
    return `Display name for ${this._userId}`
  }

  @Memoize({ clearOn: ['userId', 'settings'] })
  get userPreferences(): string {
    console.log('Computing user preferences...')
    return `${this._userId} prefers ${this._settings.theme} theme`
  }
}

// example 4: complex calculation with multiple dependencies
class ShoppingCart {
  private _items: { id: string, price: number, quantity: number }[] = []
  private _discountCode = ''
  private _taxRate = 0.08

  get items() { return this._items }
  set items(value: typeof this._items) { this._items = value }

  get discountCode() { return this._discountCode }
  set discountCode(value: string) { this._discountCode = value }

  get taxRate() { return this._taxRate }
  set taxRate(value: number) { this._taxRate = value }

  @Memoize({ clearOn: ['items'] })
  get subtotal(): number {
    console.log('Calculating subtotal...')
    return this._items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  @Memoize({ clearOn: ['items', 'discountCode'] })
  get discountAmount(): number {
    console.log('Calculating discount...')
    const subtotal = this.subtotal
    return this._discountCode === 'SAVE10' ? subtotal * 0.1 : 0
  }

  @Memoize({ clearOn: ['items', 'discountCode', 'taxRate'] })
  get total(): number {
    console.log('Calculating final total...')
    const afterDiscount = this.subtotal - this.discountAmount
    return afterDiscount + (afterDiscount * this._taxRate)
  }
}

// examples
console.log('=== Basic Example ===')
const processor = new DataProcessor()
console.log('First call:', processor.expensiveCalculation)
console.log('Second call:', processor.expensiveCalculation)

console.log('\n=== TTL Example ===')
const weather = new WeatherService()
console.log('Temperature:', weather.currentTemperature)
console.log('Temperature (cached):', weather.currentTemperature)
console.log('Waiting for cache to expire...')
await new Promise<void>((resolve) => {
  setTimeout(() => {
    console.log('Temperature (after TTL expired):', weather.currentTemperature)
    resolve()
  }, 6000)
})

console.log('\n=== ClearOn Example ===')
const profile = new UserProfile()
console.log('Display name:', profile.userDisplayName)
console.log('Display name (cached):', profile.userDisplayName)
profile.userId = 'user456'
console.log('Display name (cache cleared):', profile.userDisplayName)

console.log('\n=== Shopping Cart Example ===')
const cart = new ShoppingCart()
cart.items = [
  { id: '1', price: 10, quantity: 2 },
  { id: '2', price: 15, quantity: 1 },
]

console.log('Subtotal:', cart.subtotal)
console.log('Total:', cart.total)
console.log('Total (cached):', cart.total)

cart.discountCode = 'SAVE10'
console.log('Total (after discount):', cart.total)

cart.items = [...cart.items, { id: '3', price: 5, quantity: 3 }]
console.log('Total (after adding item):', cart.total)
