import { describe, expect, test as it, spyOn, test } from 'bun:test'
import { mapConcurrent, retry, sleep, timeout, TimeoutError, within } from '../src'

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

describe('mapConcurrent', () => {
  it('keeps results in input order', async () => {
    const out = await mapConcurrent([30, 10, 20, 5], 2, async (ms) => {
      await sleep(ms)

      return ms
    })

    expect(out).toEqual([30, 10, 20, 5])
  })

  it('never exceeds the limit', async () => {
    let inFlight = 0
    let peak = 0

    await mapConcurrent(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await sleep(5)
      inFlight--
    })

    expect(peak).toBe(3)
  })

  it('hands the index to the callback', async () => {
    expect(await mapConcurrent(['a', 'b', 'c'], 2, async (item, i) => `${i}${item}`)).toEqual(['0a', '1b', '2c'])
  })

  it('handles an empty list without hanging', async () => {
    expect(await mapConcurrent([], 4, async () => 1)).toEqual([])
  })

  it('rejects when a call rejects', async () => {
    expect(mapConcurrent([1, 2], 2, async (n) => {
      if (n === 2)
        throw new Error('boom')

      return n
    })).rejects.toThrow('boom')
  })
})

describe('within', () => {
  test('answers with the work when it lands inside the budget', async () => {
    expect(await within(Promise.resolve('done'), 50)).toBe('done')
  })

  test('gives up on a straggler rather than holding the caller', async () => {
    const slow = new Promise(resolve => setTimeout(resolve, 200, 'late'))

    expect(await within(slow, 10)).toBeNull()
  })

  test('a fallback other than null stands in for the answer', async () => {
    const slow = new Promise<string>(resolve => setTimeout(resolve, 200, 'late'))

    expect(await within(slow, 10, 'gave up')).toBe('gave up')
  })

  test('a rejection still rejects - only the wait is bounded', async () => {
    expect(within(Promise.reject(new Error('boom')), 50)).rejects.toThrow('boom')
  })
})
