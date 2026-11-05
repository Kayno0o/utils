import { sleep } from './function'
import { plural } from './text'

export interface RetryOptions {
  /** Retries after the first try. Defaults to 3. */
  attempts?: number
  /** Wait before the first retry, in ms. Defaults to 1000. */
  delay?: number
  /** Multiplier applied to the wait after each retry. Defaults to 2. */
  backoff?: number
  /** Upper bound on any single wait, in ms. Defaults to none. */
  maxDelay?: number
  /** Shortens each wait by a random share of up to this fraction (`true` is 1), so callers failing together do not retry together. Defaults to none. */
  jitter?: boolean | number
  /** Returning false stops retrying and rethrows `error` as is. Defaults to retrying every error. */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  /** Fires before each wait. */
  onRetry?: (error: unknown, attempt: number, nextDelay: number) => void
  /** Stops before the next try or during a wait, rejecting with the signal's reason. */
  signal?: AbortSignal
}

export async function retry<T>(
  fn: (retryCount: number) => Promise<T>,
  { attempts = 3, delay = 1000, backoff = 2, maxDelay = Infinity, jitter = false, shouldRetry, onRetry, signal }: RetryOptions = {},
): Promise<T> {
  const jitterShare = jitter === true ? 1 : Number(jitter)
  let last: unknown

  for (let i = 0; i < attempts + 1; i++) {
    signal?.throwIfAborted()

    try {
      return await fn(i)
    }
    catch (e) {
      last = e

      if (shouldRetry && !shouldRetry(e, i))
        throw e

      // The wait spaces out the next try, and there is none left after the last one.
      if (i < attempts) {
        const wait = Math.min(delay * backoff ** i, maxDelay) * (1 - jitterShare * Math.random())

        onRetry?.(e, i, wait)
        await sleep(wait, { signal })
      }
    }
  }

  throw new Error(`Failed after ${attempts} ${plural('retry', attempts)}`, { cause: last })
}

export class TimeoutError extends Error {}

export interface TimeoutOptions {
  /** Defaults to 5000. */
  ms?: number
  /** The `TimeoutError` message, to tell which operation ran out. */
  message?: string
  /** Aborts the wait and the signal handed to `fn`. */
  signal?: AbortSignal
}

/** Runs `fn` within a deadline. `fn` gets a signal aborted on expiry, so the work itself can stop instead of running on unseen. */
export async function timeout<T>(fn: (signal: AbortSignal) => Promise<T>, msOrOptions: number | TimeoutOptions = 5000): Promise<T> {
  const { ms = 5000, message = 'Method took too long to process', signal } = typeof msOrOptions === 'number' ? { ms: msOrOptions } : msOrOptions
  const controller = new AbortController()
  const onAbort = () => controller.abort(signal!.reason)
  let pid: ReturnType<typeof setTimeout> | undefined

  signal?.throwIfAborted()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    return await Promise.race([
      fn(controller.signal),
      new Promise<never>((_, reject) => {
        pid = setTimeout(() => {
          const error = new TimeoutError(message)

          controller.abort(error)
          reject(error)
        }, ms)
        controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true })
      }),
    ])
  }
  finally {
    clearTimeout(pid)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Maps over `items` with at most `limit` calls in flight, keeping the results in input order.
 *
 * Unlike a chunked `Promise.all`, a worker takes the next item as soon as it is free, so one slow
 * item does not hold up the rest of its batch.
 */
export interface MapConcurrentOptions {
  /** Calls in flight at once. Defaults to all of them. */
  limit?: number
  /** Stops handing out items and rejects with the signal's reason; calls in flight are not cancelled. */
  signal?: AbortSignal
  /** Resolve with every call's `PromiseSettledResult` instead of rejecting on the first failure. */
  settle?: boolean
}

export async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>
export async function mapConcurrent<T, R>(items: T[], options: MapConcurrentOptions & { settle: true }, fn: (item: T, index: number) => Promise<R>): Promise<PromiseSettledResult<R>[]>
export async function mapConcurrent<T, R>(items: T[], options: MapConcurrentOptions, fn: (item: T, index: number) => Promise<R>): Promise<R[]>
export async function mapConcurrent<T, R>(items: T[], limitOrOptions: number | MapConcurrentOptions, fn: (item: T, index: number) => Promise<R>): Promise<R[] | PromiseSettledResult<R>[]> {
  const { limit = Infinity, signal, settle = false } = typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : limitOrOptions
  const results = Array.from({ length: items.length }) as (R | PromiseSettledResult<R>)[]
  let next = 0
  // a failure stops the other workers from taking more items, the run being lost anyway
  let failed = false

  const worker = async (): Promise<void> => {
    for (let i = next++; i < items.length && !failed; i = next++) {
      signal?.throwIfAborted()

      if (!settle) {
        try {
          results[i] = await fn(items[i] as T, i)
        }
        catch (error) {
          failed = true

          throw error
        }

        continue
      }

      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i] as T, i) }
      }
      catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker))

  return results as R[] | PromiseSettledResult<R>[]
}

/**
 * The work's answer if it lands inside `ms`, else `fallback`. Only the wait is bounded - the work
 * keeps running and its answer is dropped, which is what makes this the right shape for a budget
 * (a render, a page's seeds) rather than for cancelling the work itself.
 */
export async function within<T, F = null>(work: Promise<T>, ms: number, fallback: F = null as F): Promise<T | F> {
  let pid: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      work,
      new Promise<F>((resolve) => {
        pid = setTimeout(resolve, ms, fallback)
      }),
    ])
  }
  finally {
    clearTimeout(pid)
  }
}
