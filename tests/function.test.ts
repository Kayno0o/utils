import { describe, expect, test as it } from 'bun:test'
import { coalesce, compose, createMutex, curry, identity, negate, noop, partial, pipe, tap, tryCatch } from '../src'

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
