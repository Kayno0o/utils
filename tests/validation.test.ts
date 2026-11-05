import { describe, expect, test as it } from 'bun:test'
import { noop } from '../src/function'
import { isArray, isDate, isFunction, isIP, isNumber, isObject, isPromise, isString, isUUID } from '../src/validation'

describe('isIP', () => {
  it('checks IPv4 by default', () => {
    expect(isIP('192.168.0.1')).toBe(true)
    expect(isIP('::1')).toBe(false)
  })

  it('checks the version it is given', () => {
    expect(isIP('::1', { version: 6 })).toBe(true)
    expect(isIP('192.168.0.1', { version: 6 })).toBe(false)
    expect(isIP('192.168.0.1', { version: 4 })).toBe(true)
  })
})

describe('isUUID', () => {
  it('accepts a canonical UUID in either case', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isUUID('')).toBe(false)
    expect(isUUID('123e4567e89b12d3a456426614174000')).toBe(false)
    expect(isUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false)
    expect(isUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false)
    expect(isUUID(' 123e4567-e89b-12d3-a456-426614174000')).toBe(false)
  })
})

describe('type guards', () => {
  const values = ['a', 1, Number.NaN, null, undefined, {}, [], noop, new Date(0), Promise.resolve(), { then: noop }]

  it.each([
    ['isString', isString, [0]],
    ['isNumber', isNumber, [1, 2]],
    ['isObject', isObject, [5, 6, 8, 9, 10]],
    ['isFunction', isFunction, [7]],
    ['isArray', isArray, [6]],
    ['isDate', isDate, [8]],
    ['isPromise', isPromise, [9, 10]],
  ] as const)('%s accepts only its own type, never null', (_name, guard, accepted) => {
    expect(values.flatMap((value, index) => guard(value) ? [index] : [])).toEqual([...accepted])
  })
})
