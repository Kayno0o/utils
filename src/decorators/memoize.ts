export function Memoize(options?: { clearOn?: string[], ttl?: number }) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    descriptor ||= Object.getOwnPropertyDescriptor(target, propertyKey)

    if (!descriptor?.get) {
      throw new Error(`@Memoize can only be applied to getters`)
    }

    const originalGetter = descriptor.get
    const cacheKey = `_${propertyKey}_cache`
    const cacheSetKey = `_${propertyKey}_cached`
    const timestampKey = `_${propertyKey}_timestamp`

    descriptor.get = function () {
      const now = Date.now()

      if (!(this as any)._clearMemoizedCaches) {
        (this as any)._memoizedGetters = new Map()
        ;(this as any)._clearMemoizedCaches = (changedProp: string) => {
          for (const [getterName, deps] of (this as any)._memoizedGetters.entries()) {
            if (deps.includes(changedProp)) {
              (this as any)[`_${getterName}_cached`] = false
            }
          }
        }
      }

      if (options?.clearOn) {
        (this as any)._memoizedGetters.set(propertyKey, options.clearOn)

        for (const prop of options.clearOn) {
          const setupKey = `_${prop}_memoize_setup`

          if (!(this as any)[setupKey]) {
            (this as any)[setupKey] = true

            let currentValue = (this as any)[prop]

            Object.defineProperty((this as any), prop, {
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

      if ((this as any)[cacheSetKey]) {
        if (!options?.ttl || (now - (this as any)[timestampKey]) < options.ttl) {
          return (this as any)[cacheKey]
        }
        (this as any)[cacheSetKey] = false
      }

      const result = originalGetter.call((this as any))
      ;(this as any)[cacheKey] = result
      ;(this as any)[cacheSetKey] = true
      ;(this as any)[timestampKey] = now

      return result
    }

    return descriptor
  }
}
