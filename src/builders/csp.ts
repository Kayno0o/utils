export type CspName
  = | 'default-src' | 'script-src' | 'worker-src' | 'style-src'
    | 'img-src' | 'connect-src' | 'font-src' | 'object-src'
    | 'frame-ancestors' | 'base-uri' | 'form-action'
    | 'upgrade-insecure-requests' | 'media-src' | 'frame-src'
    | 'script-src-elem' | 'style-src-elem' | 'manifest-src'

export type CspType = Partial<Record<CspName, string[]>>

function normalizeDomain(domainName: string): string {
  const domain = String(domainName.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0])

  if (!(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i).test(domain))
    throw new Error(`Domain is invalid: ${domain}`)

  return domain
}

/** Pass several domains to cover every apex a site is served on; each directive lists them in the given order. */
export function cspBuilder(domainName: string | string[], siteCsp?: CspType): string {
  const domains = (Array.isArray(domainName) ? domainName : [domainName]).map(normalizeDomain)

  if (!domains.length)
    throw new Error('At least one domain is required')

  const bare = domains.map(domain => `*.${domain}`)
  const https = domains.map(domain => `https://*.${domain}`)
  const wss = domains.map(domain => `wss://*.${domain}`)

  const csp: CspType = {
    'base-uri': ['\'self\''],
    'connect-src': ['\'self\'', ...https, ...wss],
    'default-src': ['\'self\'', ...bare],
    'font-src': ['\'self\'', 'data:', 'https://fonts.gstatic.com'],
    'form-action': ['\'self\''],
    'frame-ancestors': ['\'self\'', ...https],
    'img-src': ['\'self\'', 'data:', ...https],
    'manifest-src': ['\'self\'', ...https],
    'media-src': ['\'self\'', 'blob:', ...bare],
    'object-src': ['\'self\'', ...https],
    'script-src': ['\'self\'', ...https],
    'style-src': ['\'self\'', ...https, 'https://fonts.googleapis.com', '\'unsafe-inline\''],
    'upgrade-insecure-requests': [],
    'worker-src': ['\'self\'', 'blob:', 'data:', ...https],
  }

  if (siteCsp) {
    // append and merge new values to existing directives or create new ones
    for (const [key, value] of Object.entries(siteCsp) as [CspName, string[]][])
      csp[key] = csp[key] ? [...(csp[key] as string[]), ...value] : value
  }

  // sync element-specific directives with their shorthand counterparts
  csp['script-src-elem'] ??= csp['script-src']
  csp['style-src-elem'] ??= csp['style-src']

  return Object.entries(csp)
    .map(([key, value]) => {
      const directiveValues = Array.isArray(value) ? value.join(' ') : value

      return `${key}${directiveValues ? ` ${directiveValues}` : ''}`
    })
    .join('; ')
}
