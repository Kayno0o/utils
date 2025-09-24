export function Memoize(options?: { clearOn?: string[], ttl?: number }) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    descriptor ||= Object.getOwnPropertyDescriptor(target, propertyKey)

    const isGetter = descriptor?.get
    const isMethod = descriptor?.value && typeof descriptor.value === 'function'

    if ((!isGetter && !isMethod) || !descriptor)
      throw new Error(`@Memoize can only be applied to getters or methods`)

    if (isGetter) {
      const originalGetter = descriptor.get!
      const cacheKey = `_${propertyKey}_cache`
      const cacheSetKey = `_${propertyKey}_cached`
      const timestampKey = `_${propertyKey}_timestamp`

      descriptor.get = function () {
        const now = Date.now()

        setupClearHandlers.call(this)

        if ((this as any)[cacheSetKey]) {
          if (options?.ttl === undefined || (now - (this as any)[timestampKey]) < options.ttl) {
            return (this as any)[cacheKey]
          }
          (this as any)[cacheSetKey] = false
        }

        const result = originalGetter.call(this)
        ;(this as any)[cacheKey] = result
        ;(this as any)[cacheSetKey] = true
        ;(this as any)[timestampKey] = now

        return result
      }
    }
    else if (isMethod) {
      const originalMethod = descriptor.value
      const cacheMapKey = `_${propertyKey}_methodCache`

      descriptor.value = function (...args: any[]) {
        const now = Date.now()
        const argKey = JSON.stringify(args)

        setupClearHandlers.call(this);

        (this as any)[cacheMapKey] ??= new Map()

        const cache = (this as any)[cacheMapKey]
        const cached = cache.get(argKey)

        if (cached && (!options?.ttl || (now - cached.timestamp) < options.ttl))
          return cached.result

        const result = originalMethod.apply(this, args)
        cache.set(argKey, {
          result,
          timestamp: now,
        })

        return result
      }
    }

    function setupClearHandlers(this: any) {
      if (!(this as any)._clearMemoizedCaches) {
        (this as any)._memoizedGetters = new Map();
        (this as any)._memoizedMethods = new Map()

        ;(this as any)._clearMemoizedCaches = (changedProp: string) => {
          for (const [getterName, deps] of (this as any)._memoizedGetters.entries()) {
            if (deps.includes(changedProp))
              (this as any)[`_${getterName}_cached`] = false
          }

          for (const [methodName, deps] of (this as any)._memoizedMethods.entries()) {
            if (deps.includes(changedProp)) {
              const cacheMapKey = `_${methodName}_methodCache`
              if ((this as any)[cacheMapKey])
                (this as any)[cacheMapKey].clear()
            }
          }
        }
      }

      if (options?.clearOn) {
        if (isGetter)
          (this as any)._memoizedGetters.set(propertyKey, options.clearOn)

        else
          (this as any)._memoizedMethods.set(propertyKey, options.clearOn)

        for (const prop of options.clearOn) {
          const setupKey = `_${prop}_memoize_setup`

          if (!(this as any)[setupKey]) {
            (this as any)[setupKey] = true

            // get existing property descriptor
            const existingDesc = Object.getOwnPropertyDescriptor(this, prop)
              || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), prop)

            if (existingDesc && existingDesc.set) {
              // property already has a setter, wrap it
              const originalSetter = existingDesc.set
              const originalGetter = existingDesc.get

              Object.defineProperty(this, prop, {
                get: originalGetter,
                set(value: any) {
                  originalSetter.call(this, value)
                  ;(this as any)._clearMemoizedCaches?.(prop)
                },
                enumerable: existingDesc.enumerable,
                configurable: true,
              })
            }
            else {
              // property doesn't exist or is a simple value, create getter/setter
              let currentValue = (this as any)[prop]

              Object.defineProperty(this, prop, {
                get() {
                  return currentValue
                },
                set(value: any) {
                  currentValue = value
                  ;(this as any)._clearMemoizedCaches?.(prop)
                },
                enumerable: true,
                configurable: true,
              })
            }
          }
        }
      }
    }

    return descriptor
  }
}
