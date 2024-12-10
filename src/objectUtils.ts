import type { Key } from './types'

export function getObjectValue(object: any, key: Key): any {
  if (typeof object !== 'object')
    return object

  if (object[key])
    return object[key]

  return String(key).split('.').reduce((acc, key) => acc?.[key], object)
}
