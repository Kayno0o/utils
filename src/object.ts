import type { Key, RecursivePartial } from './types'
import { mapRange } from './number'

/** `object[key]` when the key exists, a falsy value included, else the value at its dotted path; a non-object, `null` included, is returned as is. */
export function getObjectValue(object: any, key: Key): any {
  if (typeof object !== 'object' || object === null)
    return object

  return key in object ? object[key] : String(key).split('.').reduce((acc, key) => acc?.[key], object)
}

/** True for `{}` literals and `Object.create(null)`, false for arrays, class instances and `null`. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null)
    return false

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

export interface MergeObjectsOptions {
  /** Which object's value is kept when both set a key. Defaults to `first`. */
  priority?: 'first' | 'second'
  /** `merge` merges arrays index by index, `replace` keeps the winning array, `concat` joins first then second. Defaults to `merge`. */
  arrays?: 'merge' | 'replace' | 'concat'
}

/** Deep-merges two objects into a new one; a key left `undefined` on the winning side takes the other side's value. */
export function mergeObjects<T extends object>(obj1: T | RecursivePartial<T>, obj2: T | RecursivePartial<T>, { priority = 'first', arrays = 'merge' }: MergeObjectsOptions = {}): T {
  return mergeValues(obj1, obj2, { priority, arrays }) as T
}

function mergeValues(first: unknown, second: unknown, options: Required<MergeObjectsOptions>): unknown {
  const [winner, loser] = options.priority === 'first' ? [first, second] : [second, first]

  if (winner === undefined)
    return cloneValue(loser)

  if (Array.isArray(first) && Array.isArray(second)) {
    if (options.arrays === 'concat')
      return cloneValue([...first, ...second])

    if (options.arrays === 'replace')
      return cloneValue(winner)

    return Array.from({ length: Math.max(first.length, second.length) }, (_, i) => mergeValues(first[i], second[i], options))
  }

  if (isPlainObject(first) && isPlainObject(second)) {
    const merged: Record<string, unknown> = {}

    for (const key of new Set([...Object.keys(first), ...Object.keys(second)])) {
      if (key !== '__proto__')
        merged[key] = mergeValues(first[key], second[key], options)
    }

    return merged
  }

  return cloneValue(winner)
}

/** Copies arrays, plain objects and Dates so the merge never aliases its inputs; anything else is kept by reference. */
function cloneValue(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map(cloneValue)

  if (value instanceof Date)
    return new Date(value)

  if (!isPlainObject(value))
    return value

  const copy: Record<string, unknown> = {}

  for (const [key, item] of Object.entries(value)) {
    if (key !== '__proto__')
      copy[key] = cloneValue(item)
  }

  return copy
}

/** `framesNb + 1` frames from `start` to `end`, numbers and number arrays eased linearly; zero frames gives `end` alone. */
export function interpolate<T extends number>(start: T, end: T, framesNb: number): T[]
export function interpolate<T extends object>(start: RecursivePartial<T>, end: RecursivePartial<T>, framesNb: number): T[]
export function interpolate<T extends object | number>(start: RecursivePartial<T>, end: RecursivePartial<T>, framesNb: number): T[] {
  const frames: any[] = []
  // A missing start value holds at the end value.
  const step = (i: number, from: number | undefined, to: number): number => framesNb === 0 || typeof from !== 'number' ? to : mapRange(i, 0, framesNb, from, to)

  if (typeof start === 'number' && typeof end === 'number') {
    for (let i = 0; i <= framesNb; i++)
      frames.push(step(i, start, end))

    return frames
  }

  if (typeof start === 'object' && typeof end === 'object') {
    for (let i = 0; i <= framesNb; i++) {
      const interpolatedFrame: T = {} as T

      for (const key in end) {
        if (Object.hasOwn(end, key)) {
          if (typeof end[key] === 'number' && typeof start[key] === 'number') {
            interpolatedFrame[key] = step(i, start[key], end[key]) as any
          }
          else if (Array.isArray(end[key]) && Array.isArray(start[key])) {
            const from = start[key] as unknown[]

            interpolatedFrame[key] = (end[key] as unknown[]).map((to, index) => typeof to === 'number' ? step(i, from[index] as number | undefined, to) : to) as any
          }
          else {
            interpolatedFrame[key] = end[key] as any
          }
        }
      }

      for (const key in start) {
        if (Object.hasOwn(start, key) && !Object.hasOwn(end, key))
          interpolatedFrame[key] = start[key] as any
      }

      frames.push(interpolatedFrame)
    }

    return frames
  }

  throw new TypeError('start and end must both be numbers or objects')
}

export function toJSONWithGetters(obj: object) {
  const jsonObj = Object.assign({}, obj)

  const addGetters = (obj: any, target: any) => {
    if (obj === Object.prototype)
      return

    const props = Object.getOwnPropertyNames(obj)

    for (const key of props) {
      const desc = Object.getOwnPropertyDescriptor(obj, key)
      const hasGetter = desc && typeof desc.get === 'function'

      if (hasGetter)
        target[key] = obj[key]
    }
    addGetters(Object.getPrototypeOf(obj), target)
  }

  addGetters(Object.getPrototypeOf(obj), jsonObj)

  return jsonObj
}

export function pick<T extends object, K extends keyof T>(object: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    if (key in object)
      result[key] = object[key]
  }

  return result
}

export function omit<T extends object, K extends keyof T>(object: T, keys: K[]): Omit<T, K> {
  const result = { ...object }

  for (const key of keys)
    delete (result as Record<PropertyKey, unknown>)[key]

  return result
}

export function resolveValue<T>(c: T | (() => T)): T {
  return typeof c === 'function' ? (c as () => T)() : c
}

// `Object.keys/values/entries` only enumerate own string-keyed properties:
// symbol keys are skipped and numeric keys are coerced to strings. These types
// mirror that runtime behaviour rather than blindly reusing `keyof Obj`.
type EnumerableKey<Obj> = Extract<keyof Obj, string | number>

export function typedObjectEntries<Obj extends object>(record: Obj): { [K in EnumerableKey<Obj>]: [`${K}`, Obj[K]] }[EnumerableKey<Obj>][] {
  return Object.entries(record) as { [K in EnumerableKey<Obj>]: [`${K}`, Obj[K]] }[EnumerableKey<Obj>][]
}

export function typedObjectKeys<Obj extends object>(record: Obj): `${EnumerableKey<Obj>}`[] {
  return Object.keys(record) as `${EnumerableKey<Obj>}`[]
}

export function typedObjectValues<Obj extends object>(record: Obj): Obj[EnumerableKey<Obj>][] {
  return Object.values(record) as Obj[EnumerableKey<Obj>][]
}
