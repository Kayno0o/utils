/** Resolves after `ms`; an aborted `signal` rejects with its reason and clears the timer. */
export function sleep(ms: number, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(signal.reason)

    const pid = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    function onAbort() {
      clearTimeout(pid)
      reject(signal!.reason)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
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

export interface DebounceOptions {
  /** Run on the first call of a burst. Default `false` for `debounce`, `true` for `throttle`. */
  leading?: boolean
  /** Run once the burst is over, with the last call's arguments. Default `true` for `debounce`, `false` for `throttle`. */
  trailing?: boolean
  /** Longest a call waits while calls keep coming, at least `delay`. Defaults to `delay` for `throttle`. */
  maxWait?: number
}

export interface Debounced<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** Drops the pending call. */
  cancel: () => void
  /** Runs the pending call now, if any. */
  flush: () => void
}

/** Runs `func` once calls stop for `delay`; `leading`, `trailing` and `maxWait` pick which edges of a burst run it. */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number, { leading = false, trailing = true, maxWait }: DebounceOptions = {}): Debounced<T> {
  const maxing = maxWait !== undefined
  const longest = Math.max(maxWait ?? 0, delay)
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArgs: Parameters<T> | undefined
  let lastCall: number | undefined
  let lastInvoke = 0

  function invoke(time: number): void {
    const args = pendingArgs!

    pendingArgs = undefined
    lastInvoke = time
    func(...args)
  }

  function shouldInvoke(time: number): boolean {
    if (lastCall === undefined)
      return true

    const sinceCall = time - lastCall

    return sinceCall >= delay || sinceCall < 0 || (maxing && time - lastInvoke >= longest)
  }

  function remaining(time: number): number {
    const untilQuiet = delay - (time - lastCall!)

    return maxing ? Math.min(untilQuiet, longest - (time - lastInvoke)) : untilQuiet
  }

  function trailingEdge(time: number): void {
    timer = undefined

    if (trailing && pendingArgs)
      invoke(time)

    pendingArgs = undefined
  }

  function onTimer(): void {
    const time = Date.now()

    if (shouldInvoke(time))
      trailingEdge(time)
    else
      timer = setTimeout(onTimer, remaining(time))
  }

  const debounced = (...args: Parameters<T>): void => {
    const time = Date.now()
    const invoking = shouldInvoke(time)

    pendingArgs = args
    lastCall = time

    if (invoking && timer === undefined) {
      lastInvoke = time
      timer = setTimeout(onTimer, delay)

      if (leading)
        invoke(time)

      return
    }

    if (invoking && maxing) {
      clearTimeout(timer)
      timer = setTimeout(onTimer, delay)
      invoke(time)

      return
    }

    timer ??= setTimeout(onTimer, delay)
  }

  debounced.cancel = (): void => {
    clearTimeout(timer)
    timer = pendingArgs = lastCall = undefined
    lastInvoke = 0
  }

  debounced.flush = (): void => {
    if (timer === undefined)
      return

    clearTimeout(timer)
    trailingEdge(Date.now())
  }

  return debounced
}

export interface CoalesceOptions {
  /** Wait from the first trigger of a burst before running, never pushed back by later triggers. */
  delay: number
  /** Gets a failed run's error. Default `console.error`. */
  onError?: (error: unknown) => void
}

/** Runs an async task at most once at a time: a burst of triggers within `delay` runs it once, triggers during a run queue one more, a failure goes to `onError`. */
export function coalesce(task: () => Promise<void>, options: CoalesceOptions): () => void
export function coalesce(task: () => Promise<void>, delay: number, onError?: (error: unknown) => void): () => void
export function coalesce(task: () => Promise<void>, delayOrOptions: number | CoalesceOptions, onErrorArg?: (error: unknown) => void): () => void {
  const { delay, onError = console.error } = typeof delayOrOptions === 'number' ? { delay: delayOrOptions, onError: onErrorArg } : delayOrOptions
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let again = false

  async function start(): Promise<void> {
    timer = undefined
    running = true

    try {
      await task()
    }
    catch (error) {
      onError(error)
    }

    running = false

    if (again) {
      again = false
      trigger()
    }
  }

  function trigger(): void {
    if (running) {
      again = true

      return
    }

    timer ??= setTimeout(() => void start(), delay)
  }

  return trigger
}

/** Returns a runner starting each task it is given once the ones given before have settled, in call order; a failure rejects only its own call. */
export function createMutex(): <T>(task: () => Promise<T>) => Promise<T> {
  let last: Promise<void> = Promise.resolve()

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const before = last
    let release!: () => void

    last = new Promise<void>(resolve => (release = resolve))

    try {
      await before

      return await task()
    }
    finally {
      release()
    }
  }
}

/** Returns a gate resolving each call at least `interval` after the one before, slots reserved at call time so concurrent callers spread out; an aborted `signal` rejects only its own wait. */
export function createRateLimiter(interval: number): (options?: { signal?: AbortSignal }) => Promise<void> {
  let nextSlot = 0

  return async ({ signal } = {}) => {
    signal?.throwIfAborted()

    const now = Date.now()
    const slot = Math.max(now, nextSlot)

    nextSlot = slot + interval

    if (slot > now)
      await sleep(slot - now, { signal })
  }
}

/** Runs `func` at most once per `delay`; by default on the first call of each window, dropping the rest. */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number, { leading = true, trailing = false, maxWait = delay }: DebounceOptions = {}): Debounced<T> {
  return debounce(func, delay, { leading, trailing, maxWait })
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
