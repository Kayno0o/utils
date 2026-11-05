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

describe('sleep signal', () => {
  it('rejects with the reason once aborted, and at once when already aborted', async () => {
    const controller = new AbortController()
    const started = Date.now()
    const pending = sleep(1000, { signal: controller.signal })

    controller.abort(new Error('stop'))
    await expect(pending).rejects.toThrow('stop')
    expect(Date.now() - started).toBeLessThan(100)

    await expect(sleep(1000, { signal: AbortSignal.abort(new Error('already')) })).rejects.toThrow('already')
  })
})

describe('retry options', () => {
  it('rethrows at once when shouldRetry says no', async () => {
    const thrown = new Error('400')
    let calls = 0

    await expect(retry(async () => {
      calls++

      throw thrown
    }, { delay: 0, shouldRetry: e => e !== thrown })).rejects.toBe(thrown)

    expect(calls).toBe(1)
  })

  it('reports each retry with its wait, capped by maxDelay', async () => {
    const seen: [number, number][] = []

    await expect(retry(async () => {
      throw new Error('nope')
    }, { attempts: 3, delay: 1, backoff: 10, maxDelay: 5, onRetry: (_e, attempt, wait) => seen.push([attempt, wait]) })).rejects.toThrow()

    expect(seen).toEqual([[0, 1], [1, 5], [2, 5]])
  })

  it('shortens waits by up to the jitter share', async () => {
    const waits: number[] = []

    await expect(retry(async () => {
      throw new Error('nope')
    }, { attempts: 20, delay: 1, backoff: 1, jitter: 0.5, onRetry: (_e, _a, wait) => waits.push(wait) })).rejects.toThrow()

    for (const wait of waits) {
      expect(wait).toBeGreaterThan(0.5)
      expect(wait).toBeLessThanOrEqual(1)
    }
  })

  it('stops during a wait when the signal aborts', async () => {
    const controller = new AbortController()
    let calls = 0
    const pending = retry(async () => {
      calls++

      throw new Error('nope')
    }, { delay: 1000, signal: controller.signal })

    await sleep(10)
    controller.abort(new Error('cancelled'))

    await expect(pending).rejects.toThrow('cancelled')
    expect(calls).toBe(1)
  })
})

describe('timeout options', () => {
  it('rejects with the given message and aborts the signal handed to fn', async () => {
    let seen: AbortSignal | undefined

    await expect(timeout(async (signal) => {
      seen = signal
      await sleep(200)
    }, { ms: 20, message: 'fetching users timed out' })).rejects.toThrow('fetching users timed out')

    expect(seen?.aborted).toBe(true)
    expect(seen?.reason).toBeInstanceOf(TimeoutError)
  })

  it('rejects with the caller signal reason when it aborts first', async () => {
    const controller = new AbortController()
    const pending = timeout(signal => sleep(1000, { signal }), { ms: 500, signal: controller.signal })

    controller.abort(new Error('user left'))
    await expect(pending).rejects.toThrow('user left')
  })
})

describe('mapConcurrent options', () => {
  it('settles every call with settle', async () => {
    const results = await mapConcurrent([1, 2, 3], { limit: 2, settle: true }, async (n) => {
      if (n === 2)
        throw new Error('boom')

      return n
    })

    expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
    expect(results[0]).toEqual({ status: 'fulfilled', value: 1 })
  })

  it('stops taking items after the first failure', async () => {
    const started: number[] = []

    await expect(mapConcurrent([1, 2, 3, 4, 5], 1, async (n) => {
      started.push(n)

      if (n === 2)
        throw new Error('boom')
    })).rejects.toThrow('boom')

    expect(started).toEqual([1, 2])
  })

  it('stops taking items once the signal aborts', async () => {
    const controller = new AbortController()
    const started: number[] = []
    const pending = mapConcurrent([1, 2, 3, 4], { limit: 1, signal: controller.signal }, async (n) => {
      started.push(n)
      await sleep(10)
    })

    await sleep(15)
    controller.abort(new Error('stop'))

    await expect(pending).rejects.toThrow('stop')
    expect(started).toEqual([1, 2])
  })

  it('runs every item at once without a limit', async () => {
    let peak = 0
    let inFlight = 0

    await mapConcurrent([1, 2, 3, 4], {}, async () => {
      peak = Math.max(peak, ++inFlight)
      await sleep(5)
      inFlight--
    })

    expect(peak).toBe(4)
  })
})
