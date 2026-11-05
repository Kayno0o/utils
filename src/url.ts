import { notNullish } from './array'
import { typedObjectEntries } from './object'

const BRACKET_KEY_REGEX = /\[([^\]]+)\]/g

export interface BuildUrlQueryOptions {
  /** URL-encode keys and values. Defaults to true; `false` writes them raw. */
  encode?: boolean
  /** `comma` writes `tags=a,b`, `repeat` writes `tags=a&tags=b` like `fetchJson`'s `query`. */
  arrayFormat?: 'comma' | 'repeat'
}

export function buildUrlQuery(query?: object | null, { encode = true, arrayFormat = 'comma' }: BuildUrlQueryOptions = {}) {
  const format = encode ? encodeURIComponent : String
  const pairs: string[] = []

  for (const [key, value] of Object.entries(query ?? {})) {
    if (!notNullish(value))
      continue

    if (Array.isArray(value) && arrayFormat === 'repeat') {
      for (const item of value.filter(notNullish))
        pairs.push(`${format(key)}=${format(item)}`)
    }
    else {
      // nullish items stay empty, as `Array.prototype.toString` writes them
      pairs.push(`${format(key)}=${Array.isArray(value) ? value.map(item => notNullish(item) ? format(item) : '').join(',') : format(value)}`)
    }
  }

  return pairs.length ? `?${pairs.join('&')}` : ''
}

export function queryToNestedObject(query: Record<string, string>): Record<string, any> {
  const queryObj: Record<string, any> = {}

  for (let [key, value] of typedObjectEntries(query)) {
    if (!key.includes('[') || !key.includes(']')) {
      queryObj[key] ??= value

      continue
    }

    const matches = key.matchAll(BRACKET_KEY_REGEX).toArray()

    key = key.split('[')[0]!

    queryObj[key] ??= {}
    let currentObj = queryObj[key]

    if (typeof queryObj[key] !== 'object')
      continue

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]!
      const newKey = match[1]!

      if (i === matches.length - 1) {
        if (typeof currentObj[newKey] === 'object')
          break

        currentObj[newKey] ??= value

        continue
      }

      currentObj[newKey] ??= {}

      if (typeof currentObj[newKey] !== 'object')
        break

      currentObj = currentObj[newKey]
    }
  }

  return queryObj
}
