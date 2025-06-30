export function Memoize<T>(options?: { clearOn?: string[], ttl?: number }): {
  (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
  (target: any, propertyKey: string): void
}

export function Memoize<T>(options?: { clearOn?: string[], ttl?: number }) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    descriptor ||= Object.getOwnPropertyDescriptor(target, propertyKey)

    if (!descriptor?.get) {
      throw new Error(`@Memoize can only be applied to getters`)
    }

    const originalGetter = descriptor.get as () => T
    const cacheKey = `_${propertyKey}_cache`
    const cacheSetKey = `_${propertyKey}_cached`
    const timestampKey = `_${propertyKey}_timestamp`

    if (options?.clearOn) {
      for (const prop of options.clearOn) {
        const setupKey = `_${prop}_memoize_setup`

        if (!target[setupKey]) {
          target[setupKey] = true

          const existingDescriptor = Object.getOwnPropertyDescriptor(target, prop)

          if (existingDescriptor) {
            const originalGet = existingDescriptor.get
            const originalSet = existingDescriptor.set
            const hasValue = 'value' in existingDescriptor

            Object.defineProperty(target, prop, {
              get() {
                if (originalGet) {
                  return originalGet.call(this)
                } if (hasValue) {
                  return this[`_${prop}_value`] ?? existingDescriptor.value
                }
                return undefined
              },
              set(value: any) {
                this._clearMemoizedCaches?.(prop)

                if (originalSet) {
                  originalSet.call(this, value)
                }
                else if (hasValue) {
                  this[`_${prop}_value`] = value
                }
              },
              enumerable: existingDescriptor.enumerable ?? true,
              configurable: true,
            })
          }
        }
      }
    }

    descriptor.get = function (): T {
      const now = Date.now()

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

      if (options?.clearOn) {
        (this as any)._memoizedGetters.set(propertyKey, options.clearOn)
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
