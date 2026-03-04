import { plural } from './text'
import { sleep } from './timing'

export async function retry<T>(
  fn: (retryCount: number) => Promise<T>,
  { attempts = 3, delay = 1000, backoff = 2 }: { attempts?: number, delay?: number, backoff?: number } = {},
): Promise<T> {
  for (let i = 0; i < attempts + 1; i++) {
    try {
      return await fn(i)
    }
    catch (e) {
      await sleep(delay * backoff ** i)
    }
  }

  throw new Error(`Failed after ${attempts} ${plural('retry', attempts)}`)
}
