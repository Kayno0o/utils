import { describe, expect, test as it, jest } from 'bun:test'
import { coalesce, compose, createMutex, createRateLimiter, curry, debounce, identity, negate, noop, partial, pipe, tap, throttle, tryCatch } from '../src'

describe('identity / noop', () => {
  it('identity returns its argument', () => {
    const obj = { a: 1 }

    expect(identity(obj)).toBe(obj)
    expect(identity(5)).toBe(5)
  })

  it('noop returns undefined', () => {
    expect(noop()).toBeUndefined()
  })
})

describe('tap function', () => {
  it('runs the side effect and returns the value', () => {
    let seen = 0
    const result = tap(42, v => (seen = v))

    expect(seen).toBe(42)
    expect(result).toBe(42)
  })
})

describe('negate function', () => {
  it('inverts a predicate', () => {
    const isEven = (n: number) => n % 2 === 0
    const isOdd = negate(isEven)

    expect(isOdd(3)).toBe(true)
    expect(isOdd(4)).toBe(false)
  })
})

describe('partial function', () => {
  it('pre-applies leading arguments', () => {
    const add = (a: number, b: number, c: number) => a + b + c
    const add10 = partial(add, 10)

    expect(add10(20, 30)).toBe(60)
  })
})

describe('pipe function', () => {
  it('composes left to right', () => {
    const fn = pipe((x: number) => x + 1, x => x * 2, x => String(x))

    expect(fn(3)).toBe('8')
  })

  it('passes multiple initial arguments to the first function', () => {
    const fn = pipe((a: number, b: number) => a + b, x => x * 10)

    expect(fn(2, 3)).toBe(50)
  })
})

describe('compose function', () => {
  it('composes right to left', () => {
    const fn = compose((x: number) => x * 2, (x: number) => x + 1)

    expect(fn(3)).toBe(8)
  })
})

describe('curry function', () => {
  it('collects arguments until arity is reached', () => {
    const add = (a: number, b: number, c: number) => a + b + c
    const curried = curry(add)

    expect(curried(1)(2)(3)).toBe(6)
    expect(curried(1, 2)(3)).toBe(6)
    expect(curried(1, 2, 3)).toBe(6)
  })
})

describe('tryCatch function', () => {
  it('returns a value tuple on success', () => {
    const [error, value] = tryCatch(() => 42)

    expect(error).toBeUndefined()
    expect(value).toBe(42)
  })

  it('returns an error tuple on throw', () => {
    const [error, value] = tryCatch((): number => {
      throw new Error('boom')
    })

    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('boom')
    expect(value).toBeUndefined()
  })

  it('wraps non-Error throws', () => {
    const [error] = tryCatch((): number => {
      // eslint-disable-next-line no-throw-literal
      throw 'oops'
    })

    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('oops')
  })

  it('handles resolved promises', async () => {
    const [error, value] = await tryCatch(() => Promise.resolve('ok'))

    expect(error).toBeUndefined()
    expect(value).toBe('ok')
  })

  it('handles rejected promises', async () => {
    const [error, value] = await tryCatch(() => Promise.reject(new Error('nope')))

    expect(error?.message).toBe('nope')
    expect(value).toBeUndefined()
  })
})

describe('coalesce', () => {
  it('runs a burst of triggers once', async () => {
    let runs = 0
    const trigger = coalesce(async () => {
      runs++
    }, 5, noop)

    trigger()
    trigger()
    trigger()
    await Bun.sleep(20)

    expect(runs).toBe(1)
  })

  it('never overlaps a run, and runs once more for whatever came in during it', async () => {
    let running = 0
    let overlapped = false
    let runs = 0
    const trigger = coalesce(async () => {
      overlapped ||= running > 0
      running++
      runs++
      await Bun.sleep(20)
      running--
    }, 1, noop)

    trigger()
    await Bun.sleep(5)
    trigger()
    trigger()
    await Bun.sleep(60)

    expect(overlapped).toBe(false)
    expect(runs).toBe(2)
  })

  it('hands a failure over and runs again on the next trigger', async () => {
    const errors: unknown[] = []
    let runs = 0
    const trigger = coalesce(async () => {
      runs++

      throw new Error('boom')
    }, 1, error => errors.push(error))

    trigger()
    await Bun.sleep(10)
    trigger()
    await Bun.sleep(10)

    expect(runs).toBe(2)
    expect(errors).toHaveLength(2)
  })
})

describe('createRateLimiter', () => {
  const flush = async () => {
    for (let i = 0; i < 5; i++)
      await Promise.resolve()
  }

  it('spaces concurrent calls by the interval, in call order', async () => {
    jest.useFakeTimers()

    try {
      const wait = createRateLimiter(30)
      const start = Date.now()
      const times: number[] = []
      const calls = [0, 1, 2].map(async () => {
        await wait()
        times.push(Date.now() - start)
      })

      await flush()
      expect(times).toEqual([0])

      jest.advanceTimersByTime(30)
      await flush()
      expect(times).toEqual([0, 30])

      jest.advanceTimersByTime(30)
      await Promise.all(calls)
      expect(times).toEqual([0, 30, 60])
    }
    finally {
      jest.useRealTimers()
    }
  })

  it('lets the callers after an aborted wait resolve, the aborted slot staying taken', async () => {
    jest.useFakeTimers()

    try {
      const wait = createRateLimiter(30)
      const controller = new AbortController()
      const start = Date.now()

      await wait()

      const aborted = wait({ signal: controller.signal })
      let after: number | undefined
      const next = (async () => {
        await wait()
        after = Date.now() - start
      })()

      controller.abort(new Error('stop'))
      await expect(aborted).rejects.toThrow('stop')

      jest.advanceTimersByTime(30)
      await flush()
      expect(after).toBeUndefined()

      jest.advanceTimersByTime(30)
      await next
      expect(after).toBe(60)
    }
    finally {
      jest.useRealTimers()
    }
  })

  it('rejects an aborted wait with the signal reason', async () => {
    const wait = createRateLimiter(1000)
    const controller = new AbortController()

    await wait()

    const waiting = wait({ signal: controller.signal })

    controller.abort(new Error('stop'))
    await expect(waiting).rejects.toThrow('stop')
  })
})

describe('createMutex', () => {
  it('runs the tasks one after another, in call order, each answering its own call', async () => {
    const run = createMutex()
    const order: string[] = []
    let running = 0
    let overlapped = false
    const task = (name: string, ms: number) => async () => {
      overlapped ||= running > 0
      running++
      order.push(`${name} start`)
      await Bun.sleep(ms)
      order.push(`${name} end`)
      running--

      return name
    }

    const answers = await Promise.all([run(task('slow', 20)), run(task('fast', 1)), run(task('last', 1))])

    expect(answers).toEqual(['slow', 'fast', 'last'])
    expect(overlapped).toBe(false)
    expect(order).toEqual(['slow start', 'slow end', 'fast start', 'fast end', 'last start', 'last end'])
  })

  it('rejects only the call that failed and goes on with the next', async () => {
    const run = createMutex()
    const failed = run(async () => {
      throw new Error('boom')
    })
    const next = run(async () => 'next')

    await expect(failed).rejects.toThrow('boom')
    expect(await next).toBe('next')
  })
})

describe('debounce', () => {
  it('runs once with the last arguments after calls stop', async () => {
    const calls: number[] = []
    const run = debounce((n: number) => calls.push(n), 20)

    run(1)
    run(2)
    run(3)
    await Bun.sleep(40)

    expect(calls).toEqual([3])
  })

  it('runs on the leading edge only when trailing is off', async () => {
    const calls: number[] = []
    const run = debounce((n: number) => calls.push(n), 20, { leading: true, trailing: false })

    run(1)
    run(2)
    await Bun.sleep(40)
    run(3)

    expect(calls).toEqual([1, 3])
  })

  it('still runs under constant calls with maxWait', async () => {
    let runs = 0
    const run = debounce(() => runs++, 30, { maxWait: 40 })

    for (let i = 0; i < 10; i++) {
      run()
      await Bun.sleep(10)
    }

    expect(runs).toBeGreaterThanOrEqual(1)
  })

  it('drops the pending call on cancel and runs it now on flush', async () => {
    const calls: number[] = []
    const run = debounce((n: number) => calls.push(n), 20)

    run(1)
    run.cancel()
    run(2)
    run.flush()
    expect(calls).toEqual([2])

    run.flush()
    await Bun.sleep(40)
    expect(calls).toEqual([2])
  })
})

describe('throttle', () => {
  it('runs the first call of each window and drops the rest by default', async () => {
    const calls: number[] = []
    const run = throttle((n: number) => calls.push(n), 20)

    run(1)
    run(2)
    await Bun.sleep(40)
    run(3)
    run(4)

    expect(calls).toEqual([1, 3])
  })

  it('also runs the last call of a window with trailing', async () => {
    const calls: number[] = []
    const run = throttle((n: number) => calls.push(n), 20, { trailing: true })

    run(1)
    run(2)
    run(3)
    await Bun.sleep(40)

    expect(calls).toEqual([1, 3])
  })
})

describe('coalesce options', () => {
  it('takes an options object and reports failures to console.error by default', async () => {
    const original = console.error
    const logged: unknown[] = []

    console.error = (error: unknown) => logged.push(error)

    try {
      const trigger = coalesce(async () => {
        throw new Error('boom')
      }, { delay: 1 })

      trigger()
      await Bun.sleep(10)
    }
    finally {
      console.error = original
    }

    expect(logged).toHaveLength(1)
  })

  it('runs within delay of the first trigger even when retriggered constantly', async () => {
    let runs = 0
    const trigger = coalesce(async () => {
      runs++
    }, { delay: 20, onError: noop })

    for (let i = 0; i < 5; i++) {
      trigger()
      await Bun.sleep(8)
    }

    expect(runs).toBeGreaterThanOrEqual(1)
  })
})
