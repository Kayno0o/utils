import { describe, expect, test as it, spyOn } from 'bun:test'
import { retry, sleep, timeout, TimeoutError } from '../src'

describe('retry function', () => {
  it('returns the first result without waiting', async () => {
    let calls = 0
    const result = await retry(async () => {
      calls++

      return 'ok'
    })

    expect(result).toBe('ok')
    expect(calls).toBe(1)
  })

  it('hands the attempt number to the callback', async () => {
    const seen: number[] = []

    await retry(async (i) => {
      seen.push(i)

      if (i < 2)
        throw new Error('again')

      return i
    }, { delay: 0 })

    expect(seen).toEqual([0, 1, 2])
  })

  it('tries once more than the attempts asked for', async () => {
    let calls = 0

    await expect(retry(async () => {
      calls++

      throw new Error('nope')
    }, { attempts: 2, delay: 0 })).rejects.toThrow('Failed after 2 retries')

    expect(calls).toBe(3)
  })

  it('keeps the last failure as the cause', async () => {
    const thrown = new Error('the real reason')

    try {
      await retry(async () => {
        throw thrown
      }, { attempts: 1, delay: 0 })

      expect.unreachable()
    }
    catch (e) {
      expect((e as Error).cause).toBe(thrown)
    }
  })

  it('waits between tries and not after the last one', async () => {
    const started = Date.now()

    await expect(retry(async () => {
      throw new Error('nope')
    }, { attempts: 2, delay: 50, backoff: 1 })).rejects.toThrow()

    const took = Date.now() - started

    expect(took).toBeGreaterThanOrEqual(90)
    expect(took).toBeLessThan(135)
  })
})

describe('timeout function', () => {
  it('returns what finished in time', async () => {
    expect(await timeout(async () => 'ok', 100)).toBe('ok')
  })

  it('gives up on what did not', async () => {
    await expect(timeout(() => sleep(200), 40)).rejects.toBeInstanceOf(TimeoutError)
  })

  it('passes on the failure rather than waiting it out', async () => {
    const started = Date.now()

    await expect(timeout(async () => {
      throw new Error('the real reason')
    }, 500)).rejects.toThrow('the real reason')

    expect(Date.now() - started).toBeLessThan(100)
  })

  it('leaves no timer behind when the call fails', async () => {
    const cleared = spyOn(globalThis, 'clearTimeout')

    await expect(timeout(async () => {
      throw new Error('nope')
    }, 5000)).rejects.toThrow('nope')

    expect(cleared).toHaveBeenCalled()
    cleared.mockRestore()
  })
})
