export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function delay<T extends (...args: any[]) => any>(ms: number, callback?: T, ...args: Parameters<T>): Promise<T extends undefined ? void : ReturnType<T>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = callback?.(...args)

        resolve(result as any)
      }
      catch (error) {
        reject(error)
      }
    }, ms)
  })
}

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) {
  let timeoutId: ReturnType<typeof setTimeout> | number

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(func, delay, ...args)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let canRun = true

  return (...args: Parameters<T>) => {
    if (canRun)
      func(...args)

    canRun = false

    timeoutId ||= setTimeout(() => {
      canRun = true
      timeoutId = undefined
    }, delay)
  }
}

export function once<T extends (...args: any[]) => any>(func: T): ((...args: Parameters<T>) => ReturnType<T>) {
  let response: ReturnType<T> | undefined
  let hasRun = false

  return (...args: Parameters<T>) => {
    if (hasRun)
      return response as ReturnType<T>

    response = func(...args)
    hasRun = true

    return response as ReturnType<T>
  }
}

/** Returns its argument unchanged. */
export function identity<T>(value: T): T {
  return value
}

/** Does nothing. Useful as a default callback. */
export function noop(): void {
  // intentionally empty
}

/** Runs `fn` on `value` for its side effect, then returns `value`. Handy inside a `pipe`. */
export function tap<T>(value: T, fn: (value: T) => void): T {
  fn(value)

  return value
}

/** Returns a predicate that negates `predicate`. */
export function negate<T extends any[]>(predicate: (...args: T) => boolean): ((...args: T) => boolean) {
  return (...args: T) => !predicate(...args)
}

/** Pre-applies leading `preset` arguments to `func`. */
export function partial<T extends (...args: any[]) => any>(func: T, ...preset: any[]): ((...args: any[]) => ReturnType<T>) {
  return (...args: any[]) => func(...preset, ...args)
}

export function pipe<A extends any[], B>(fn1: (...a: A) => B): (...a: A) => B
export function pipe<A extends any[], B, C>(fn1: (...a: A) => B, fn2: (b: B) => C): (...a: A) => C
export function pipe<A extends any[], B, C, D>(fn1: (...a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (...a: A) => D
export function pipe<A extends any[], B, C, D, E>(fn1: (...a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): (...a: A) => E
export function pipe(...fns: ((...args: any[]) => any)[]): (...args: any[]) => any
/** Compose functions left-to-right: `pipe(f, g)(x)` is `g(f(x))`. */
export function pipe(...fns: ((...args: any[]) => any)[]) {
  return (...args: any[]) => fns.reduce<any>((acc, fn, i) => i === 0 ? fn(...acc) : fn(acc), args)
}

export function compose<A extends any[], B>(fn1: (...a: A) => B): (...a: A) => B
export function compose<A extends any[], B, C>(fn2: (b: B) => C, fn1: (...a: A) => B): (...a: A) => C
export function compose<A extends any[], B, C, D>(fn3: (c: C) => D, fn2: (b: B) => C, fn1: (...a: A) => B): (...a: A) => D
export function compose<A extends any[], B, C, D, E>(fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (...a: A) => B): (...a: A) => E
export function compose(...fns: ((...args: any[]) => any)[]): (...args: any[]) => any
/** Compose functions right-to-left: `compose(g, f)(x)` is `g(f(x))`. */
export function compose(...fns: ((...args: any[]) => any)[]) {
  return (...args: any[]) => fns.reduceRight<any>((acc, fn, i) => i === fns.length - 1 ? fn(...acc) : fn(acc), args)
}

/** Curry `func` so it can be called with arguments one (or several) at a time until `arity` is reached. */
export function curry(func: (...args: any[]) => any, arity = func.length): ((...args: any[]) => any) {
  return function curried(...args: any[]): any {
    if (args.length >= arity)
      return func(...args)

    return (...rest: any[]) => curried(...args, ...rest)
  }
}

export type Result<T, E = Error> = [error: undefined, value: T] | [error: E, value: undefined]

const toError = (error: unknown): Error => error instanceof Error ? error : new Error(String(error))

export function tryCatch<T>(func: () => Promise<T>): Promise<Result<T>>
export function tryCatch<T>(func: () => T): Result<T>
/** Run `func`, returning a `[error, value]` tuple instead of throwing. Awaits and catches promises too. */
export function tryCatch<T>(func: () => T | Promise<T>): Result<T> | Promise<Result<T>> {
  try {
    const value = func()

    if (value instanceof Promise) {
      return (async (): Promise<Result<T>> => {
        try {
          return [undefined, await value]
        }
        catch (error) {
          return [toError(error), undefined]
        }
      })()
    }

    return [undefined, value]
  }
  catch (error) {
    return [toError(error), undefined]
  }
}
