import { notNullish } from './array'
import { ObjectEntries } from './object'

export function buildUrlQuery(query?: object | null) {
  const output = query
    ? Object.entries(query).reduce((acc, curr) => {
      if (notNullish(curr[1]))
        acc.push(`${curr[0]}=${curr[1]}`)

      return acc
    }, [] as string[]).join('&')
    : ''

  return output ? `?${output}` : ''
}

export function queryToObject(query: Record<string, string>): Record<string, any> {
  const queryObj: Record<string, any> = {}

  for (let [key, value] of ObjectEntries(query)) {
    if (!key.includes('[') || !key.includes(']')) {
      queryObj[key] = value

      continue
    }

    const matches = key.matchAll(/\[([^\]]+)\]/g).toArray()

    key = key.split('[')[0]

    queryObj[key] = {}
    let currentObj = queryObj[key]

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const [,newKey] = match

      if (i === matches.length - 1) {
        currentObj[newKey] = value

        continue
      }

      currentObj[newKey] = {}
      currentObj = currentObj[newKey]
    }
  }

  return queryObj
}
