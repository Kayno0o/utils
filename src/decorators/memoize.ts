import type { Memoized, MemoizeOptions, TtlCache } from '../cache'
import type { AnyFunction } from '../types'
import { createTtlCache, memoize } from '../cache'

// A decorator cannot see the method's parameters, so `key` gets them untyped rather than as `never`.
type DecoratedArgs = Parameters<AnyFunction>

/** `memoize`'s options; `key` only applies to methods, a getter has a single entry. */
interface MemoizeDecoratorOptions extends MemoizeOptions<DecoratedArgs> {
  /** Properties whose assignment invalidates this cache. */
  clearOn?: string[]
}

interface MemoizeState {
  caches: Map<string, TtlCache<string, unknown>>
  methods: Map<string, Memoized<DecoratedArgs, unknown>>
  deps: Map<string, string[]>
  patched: Set<string>
}

const states = new WeakMap<object, MemoizeState>()

const GETTER_KEY = ''

function stateOf(instance: object): MemoizeState {
  let state = states.get(instance)

  if (!state) {
    state = { caches: new Map(), methods: new Map(), deps: new Map(), patched: new Set() }
    states.set(instance, state)
  }

  return state
}

function cacheOf(instance: object, propertyKey: string, options?: MemoizeDecoratorOptions) {
  const { caches } = stateOf(instance)
  let cache = caches.get(propertyKey)

  if (!cache) {
    cache = createTtlCache<string, unknown>(options)
    caches.set(propertyKey, cache)
  }

  return cache
}

/** A method goes through `memoize`, so a rejected promise is evicted the same way. */
function methodOf(instance: object, propertyKey: string, method: AnyFunction, options?: MemoizeDecoratorOptions) {
  const { caches, methods } = stateOf(instance)
  let memoized = methods.get(propertyKey)

  if (!memoized) {
    memoized = memoize(method, options)
    methods.set(propertyKey, memoized)
    caches.set(propertyKey, memoized.cache)
  }

  return memoized
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
      get() {
        return existing.get?.call(this)
      },
      set(value: unknown) {
        originalSetter.call(this, value)
        clearDependents(this, prop)
      },
      ...(existing.enumerable === undefined ? {} : { enumerable: existing.enumerable }),
      configurable: true,
    })

    return
  }

  let currentValue = (instance as Record<string, unknown>)[prop]

  Object.defineProperty(instance, prop, {
    get() {
      return currentValue
    },
    set(value: unknown) {
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
  return function (target: object, propertyKey: string, descriptor?: PropertyDescriptor) {
    descriptor ||= Object.getOwnPropertyDescriptor(target, propertyKey)

    const isGetter = descriptor?.get
    const isMethod = descriptor?.value && typeof descriptor.value === 'function'

    if ((!isGetter && !isMethod) || !descriptor)
      throw new Error(`@Memoize can only be applied to getters or methods`)

    if (isGetter) {
      const originalGetter = descriptor.get!

      descriptor.get = function () {
        register(this, propertyKey, options)

        const cache = cacheOf(this, propertyKey, options)

        if (cache.has(GETTER_KEY))
          return cache.get(GETTER_KEY)

        const result = originalGetter.call(this)

        cache.set(GETTER_KEY, result)

        return result
      }
    }
    else {
      const originalMethod = descriptor.value

      descriptor.value = function (this: object, ...args: DecoratedArgs) {
        register(this, propertyKey, options)

        return methodOf(this, propertyKey, originalMethod, options).apply(this, args)
      }
    }

    return descriptor
  }
}
