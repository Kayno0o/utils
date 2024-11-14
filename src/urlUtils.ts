import { notEmpty } from './arrayUtils'

/**
 * @deprecated use this function instead:
 * ```ts
 * buildUrlQuery(query?: object | null)
 * ```
 */
export const buildQuery = buildUrlQuery

export function buildUrlQuery(query?: object | null) {
  const output = query
    ? Object.entries(query).reduce((acc, curr) => {
      if (notEmpty(curr[1]))
        acc.push(`${curr[0]}=${curr[1]}`)
      return acc
    }, [] as string[]).join('&')
    : ''
  return output ? `?${output}` : ''
}
