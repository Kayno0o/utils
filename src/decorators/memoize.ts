export function Memoize(options?: { clearOn?: string[], ttl?: number }) {
  return function <This, Return>(
    originalMethod: (this: This) => Return,
    context: ClassGetterDecoratorContext<This, Return>,
  ) {
    const methodName = String(context.name)
    const cacheKey = `_${methodName}_cache`
    const cacheSetKey = `_${methodName}_cached`
    const timestampKey = `_${methodName}_timestamp`

    return function (this: This): Return {
      const now = Date.now()

      // Initialize cache clearing mechanism if not present
      if (!(this as any)._clearMemoizedCaches) {
        (this as any)._memoizedGetters = (this as any)._memoizedGetters || new Map()
        ;(this as any)._clearMemoizedCaches = (changedProp: string) => {
          for (const [getterName, deps] of (this as any)._memoizedGetters.entries()) {
            if (deps.includes(changedProp)) {
              (this as any)[`_${getterName}_cached`] = false
            }
          }
        }
      }

      // Register this getter's dependencies
      if (options?.clearOn) {
        (this as any)._memoizedGetters.set(methodName, options.clearOn)

        // Setup clearOn properties
        for (const prop of options.clearOn) {
          const setupKey = `_${prop}_memoize_setup`

          if (!((this as any)[setupKey])) {
            (this as any)[setupKey] = true

            // Store original value if it exists
            const originalValue = (this as any)[prop]
            let currentValue = originalValue

            // Define property with cache clearing
            Object.defineProperty(this, prop, {
              get() {
                return currentValue
              },
              set(value: any) {
                currentValue = value
                // Clear all memoized caches that depend on this property
                ;(this as any)._clearMemoizedCaches?.(prop)
              },
              enumerable: true,
              configurable: true,
            })
          }
        }
      }

      // Check if cached and not expired
      if ((this as any)[cacheSetKey]) {
        if (!options?.ttl || (now - (this as any)[timestampKey]) < options.ttl) {
          return (this as any)[cacheKey]
        }
        (this as any)[cacheSetKey] = false
      }

      // Calculate and cache
      const result = originalMethod.call(this)
      ;(this as any)[cacheKey] = result
      ;(this as any)[cacheSetKey] = true
      ;(this as any)[timestampKey] = now

      return result
    }
  }
}
