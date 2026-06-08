import { describe, expect, test as it } from 'bun:test'
import { omit, pick } from '../src'

describe('pick function', () => {
  it('keeps only the requested keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('ignores keys that are absent', () => {
    expect(pick({ a: 1 } as { a: number, b?: number }, ['a', 'b'])).toEqual({ a: 1 })
  })

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 }

    pick(source, ['a'])
    expect(source).toEqual({ a: 1, b: 2 })
  })
})

describe('omit function', () => {
  it('removes the requested keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
  })

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 }

    omit(source, ['b'])
    expect(source).toEqual({ a: 1, b: 2 })
  })
})
