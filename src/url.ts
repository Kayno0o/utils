import { notNullish } from './array'

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
