import { sleep } from './function'
import { plural } from './text'

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

export class TimeoutError extends Error {}

export async function timeout<T>(fn: () => Promise<T>, maxTime = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const pid = setTimeout(() => {
      reject(new TimeoutError('Method took too long to process'))
    }, maxTime)

    // eslint-disable-next-line kaynooo/no-then
    fn().then((val: T) => {
      clearTimeout(pid)
      resolve(val)
    })
  })
}
