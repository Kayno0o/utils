import { sleep } from './function'
import { plural } from './text'

export async function retry<T>(
  fn: (retryCount: number) => Promise<T>,
  { attempts = 3, delay = 1000, backoff = 2 }: { attempts?: number, delay?: number, backoff?: number } = {},
): Promise<T> {
  let last: unknown

  for (let i = 0; i < attempts + 1; i++) {
    try {
      return await fn(i)
    }
    catch (e) {
      last = e

      // The wait spaces out the next try, and there is none left after the last one.
      if (i < attempts)
        await sleep(delay * backoff ** i)
    }
  }

  throw new Error(`Failed after ${attempts} ${plural('retry', attempts)}`, { cause: last })
}

export class TimeoutError extends Error {}

export async function timeout<T>(fn: () => Promise<T>, maxTime = 5000): Promise<T> {
  let pid: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        pid = setTimeout(() => reject(new TimeoutError('Method took too long to process')), maxTime)
      }),
    ])
  }
  finally {
    clearTimeout(pid)
  }
}

/**
 * Maps over `items` with at most `limit` calls in flight, keeping the results in input order.
 *
 * Unlike a chunked `Promise.all`, a worker takes the next item as soon as it is free, so one slow
 * item does not hold up the rest of its batch.
 */
export async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = Array.from({ length: items.length }) as R[]
  let next = 0

  const worker = async (): Promise<void> => {
    for (let i = next++; i < items.length; i = next++)
      results[i] = await fn(items[i] as T, i)
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker))

  return results
}
