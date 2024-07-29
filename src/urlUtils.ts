export function buildQuery(query?: object | null) {
  const output = query ? Object.entries(query).filter(e => e[1] !== undefined && e[1] !== null).map(e => `${e[0]}=${e[1]}`).join('&') : ''
  return output ? `?${output}` : ''
}
