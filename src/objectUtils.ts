import type { Key, RecursivePartial } from './types'
import { map } from './numberUtils'

export function getObjectValue(object: any, key: Key): any {
  if (typeof object !== 'object')
    return object

  if (object[key])
    return object[key]

  return String(key).split('.').reduce((acc, key) => acc?.[key], object)
}

export function mergeObjects<T extends object>(obj1: T | RecursivePartial<T>, obj2: T | RecursivePartial<T>): T {
  const merged: T = JSON.parse(JSON.stringify(obj1)) as T

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      // add from obj2 if undefined in merged object
      if (!Object.prototype.hasOwnProperty.call(merged, key))
        merged[key] = obj2[key] as any
      else if (typeof merged[key] === 'object' && typeof obj2[key] === 'object')
        merged[key] = mergeObjects(merged[key] as any, obj2[key])
    }
  }

  return merged
}

export function interpolate<T extends number>(start: T, end: T, framesNb: number): T[]
export function interpolate<T extends object>(start: RecursivePartial<T>, end: RecursivePartial<T>, framesNb: number): T[]

export function interpolate<T extends object | number>(
  start: RecursivePartial<T>,
  end: RecursivePartial<T>,
  framesNb: number,
): T[] {
  const frames: any[] = []

  if (typeof start === 'number' && typeof end === 'number') {
    for (let i = 0; i <= framesNb; i++)
      frames.push(map(i, 0, framesNb, start, end))

    return frames
  }

  if (typeof start === 'object' && typeof end === 'object') {
    mergeObjects(end, start)

    for (let i = 0; i <= framesNb; i++) {
      const interpolatedFrame: T = {} as T

      for (const key in end) {
        if (Object.prototype.hasOwnProperty.call(end, key)) {
          if (typeof end[key] === 'number' && typeof start[key] === 'number')
            interpolatedFrame[key] = map(i, 0, framesNb, start[key], end[key]) as any
          else if (Array.isArray(end[key]) && Array.isArray(start[key]))
            interpolatedFrame[key] = end[key].map((_: any, index: number) => map(i, 0, framesNb, (start[key] as any)[index], (end[key] as any)[index])) as any
          else
            interpolatedFrame[key] = end[key] as any
        }
      }

      frames.push(interpolatedFrame)
    }

    return frames
  }

  throw new TypeError('start and end must both be numbers or objects')
}
