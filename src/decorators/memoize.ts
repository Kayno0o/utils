import type { TtlCache } from '../cache'
import { createTtlCache } from '../cache'

interface MemoizeDecoratorOptions {
  /** Properties whose assignment invalidates this cache. */
  clearOn?: string[]
  /** Entry lifetime in ms. Defaults to no expiry. */
  ttl?: number
}

interface MemoizeState {
  caches: Map<string, TtlCache<string, any>>
  deps: Map<string, string[]>
  patched: Set<string>
}

const states = new WeakMap<object, MemoizeState>()

const GETTER_KEY = ''

function stateOf(instance: object): MemoizeState {
  let state = states.get(instance)

  if (!state) {
    state = { caches: new Map(), deps: new Map(), patched: new Set() }
    states.set(instance, state)
  }

  return state
}

function cacheOf(instance: object, propertyKey: string, ttl?: number) {
  const { caches } = stateOf(instance)
  let cache = caches.get(propertyKey)

  if (!cache) {
    cache = createTtlCache<string, any>(ttl)
    caches.set(propertyKey, cache)
  }

  return cache
}

function clearDependents(instance: object, changedProp: string) {
  const state = states.get(instance)

  if (!state)
    return

  for (const [propertyKey, deps] of state.deps) {
    if (deps.includes(changedProp))
      state.caches.get(propertyKey)?.clear()
  }
}

/** Intercept assignment to `prop` so dependent memoized caches are cleared. */
function watchProp(instance: object, prop: string) {
  const state = stateOf(instance)

  if (state.patched.has(prop))
    return

  state.patched.add(prop)

  const existing = Object.getOwnPropertyDescriptor(instance, prop)
    ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), prop)

  if (existing?.set) {
    const originalSetter = existing.set

    Object.defineProperty(instance, prop, {
      get: existing.get,
      set(value: any) {
        originalSetter.call(this, value)
        clearDependents(this, prop)
      },
      enumerable: existing.enumerable,
      configurable: true,
    })

    return
  }

  let currentValue = (instance as any)[prop]

  Object.defineProperty(instance, prop, {
    get() {
      return currentValue
    },
    set(value: any) {
      currentValue = value
      clearDependents(this, prop)
    },
    enumerable: true,
    configurable: true,
  })
}

function register(instance: object, propertyKey: string, options?: MemoizeDecoratorOptions) {
  if (!options?.clearOn)
    return

  stateOf(instance).deps.set(propertyKey, options.clearOn)

  for (const prop of options.clearOn)
    watchProp(instance, prop)
}

/** Memoize a getter or method per instance, with optional TTL and `clearOn` invalidation. */
export function Memoize(options?: MemoizeDecoratorOptions) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    descriptor ||= Object.getOwnPropertyDescriptor(target, propertyKey)

    const isGetter = descriptor?.get
    const isMethod = descriptor?.value && typeof descriptor.value === 'function'

    if ((!isGetter && !isMethod) || !descriptor)
      throw new Error(`@Memoize can only be applied to getters or methods`)

    if (isGetter) {
      const originalGetter = descriptor.get!

      descriptor.get = function () {
        register(this, propertyKey, options)

        const cache = cacheOf(this, propertyKey, options?.ttl)

        if (cache.has(GETTER_KEY))
          return cache.get(GETTER_KEY)

        const result = originalGetter.call(this)

        cache.set(GETTER_KEY, result)

        return result
      }
    }
    else {
      const originalMethod = descriptor.value

      descriptor.value = function (...args: any[]) {
        register(this, propertyKey, options)

        const cache = cacheOf(this, propertyKey, options?.ttl)
        const key = JSON.stringify(args)

        if (cache.has(key))
          return cache.get(key)

        const result = originalMethod.apply(this, args)

        cache.set(key, result)

        return result
      }
    }

    return descriptor
  }
}
