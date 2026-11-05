import { describe, expect, test as it } from 'bun:test'
import { getObjectValue, interpolate, isPlainObject, mergeObjects, omit, pick } from '../src'

describe('interpolate function', () => {
  it('keeps keys only present in start', () => {
    expect(interpolate<{ a: number, b: number }>({ a: 0, b: 5 }, { a: 10 }, 2)).toEqual([{ a: 0, b: 5 }, { a: 5, b: 5 }, { a: 10, b: 5 }])
  })

  it('gives the end alone for zero frames', () => {
    expect(interpolate(0, 10, 0)).toEqual([10])
    expect(interpolate<{ a: number }>({ a: 0 }, { a: 10 }, 0)).toEqual([{ a: 10 }])
  })

  it('eases arrays index by index, holding an index start lacks at its end value', () => {
    expect(interpolate<{ p: number[] }>({ p: [0] }, { p: [10, 4] }, 2)).toEqual([{ p: [0, 4] }, { p: [5, 4] }, { p: [10, 4] }])
  })
})

describe('getObjectValue', () => {
  it('reads an own key, a falsy value included, else a dotted path', () => {
    expect(getObjectValue({ a: 0 }, 'a')).toBe(0)
    expect(getObjectValue({ 'a': { b: '' }, 'a.b': undefined }, 'a.b')).toBeUndefined()
    expect(getObjectValue({ a: { b: 'x' } }, 'a.b')).toBe('x')
  })

  it('returns a non-object, null included, as is', () => {
    expect(getObjectValue(null, 'a')).toBeNull()
    expect(getObjectValue(5, 'a')).toBe(5)
  })
})

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

describe('mergeObjects', () => {
  it('fills missing keys deeply, the first object winning by default', () => {
    expect(mergeObjects<any>({ a: 1, nested: { x: 1 } }, { a: 2, b: 3, nested: { x: 2, y: 2 } })).toEqual({ a: 1, nested: { x: 1, y: 2 }, b: 3 })
  })

  it('lets the second object win with priority', () => {
    expect(mergeObjects<any>({ a: 1, nested: { x: 1 } }, { a: 2, nested: { y: 2 } }, { priority: 'second' })).toEqual({ a: 2, nested: { x: 1, y: 2 } })
  })

  it('merges, replaces or concatenates arrays', () => {
    const first = { list: [1, 2] }
    const second = { list: [3, 4, 5] }

    expect(mergeObjects<any>(first, second).list).toEqual([1, 2, 5])
    expect(mergeObjects<any>(first, second, { arrays: 'replace' }).list).toEqual([1, 2])
    expect(mergeObjects<any>(first, second, { arrays: 'replace', priority: 'second' }).list).toEqual([3, 4, 5])
    expect(mergeObjects<any>(first, second, { arrays: 'concat' }).list).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps Dates, functions and undefined, and copies rather than aliases', () => {
    const date = new Date('2024-01-01')
    const fn = () => 1
    const first = { date, nested: { deep: [1] } }
    const merged = mergeObjects<any>(first, { fn, missing: undefined })

    expect(merged.date).toBeInstanceOf(Date)
    expect(merged.date.getTime()).toBe(date.getTime())
    expect(merged.date).not.toBe(date)
    expect(merged.fn).toBe(fn)
    expect('missing' in merged).toBe(true)
    expect(merged.nested.deep).not.toBe(first.nested.deep)
  })

  it('takes the other side where the winner is undefined, and keeps a winning null', () => {
    expect(mergeObjects<any>({ a: undefined, b: null }, { a: 1, b: { c: 1 } })).toEqual({ a: 1, b: null })
    expect(mergeObjects<any>({ b: { c: 1 } }, { b: null })).toEqual({ b: { c: 1 } })
  })

  it('never touches a prototype through __proto__ keys', () => {
    const merged = mergeObjects<any>({}, JSON.parse('{"__proto__": {"polluted": true}}'))

    expect(merged.polluted).toBeUndefined()
    expect(({} as any).polluted).toBeUndefined()
  })
})

describe('isPlainObject', () => {
  it('accepts literals and null-prototype objects only', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(null)).toBe(false)
  })
})
