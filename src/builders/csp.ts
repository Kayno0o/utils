export type CspName
  = | 'default-src' | 'script-src' | 'worker-src' | 'style-src'
    | 'img-src' | 'connect-src' | 'font-src' | 'object-src'
    | 'frame-ancestors' | 'base-uri' | 'form-action'
    | 'upgrade-insecure-requests' | 'media-src' | 'frame-src'
    | 'script-src-elem' | 'style-src-elem' | 'manifest-src'

export type CspType = Partial<Record<CspName, string[]>>

export function cspBuilder(domainName: string, siteCsp?: CspType): string {
  domainName = String(domainName.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0])

  if (!domainName.includes(''))
    throw new Error(`Domain is invalid: ${domainName}`)

  const csp: CspType = {
    'base-uri': ['\'self\''],
    'connect-src': ['\'self\'', `https://*.${domainName}`, `wss://*.${domainName}`],
    'default-src': ['\'self\'', `*.${domainName}`],
    'font-src': ['\'self\'', 'data:', 'https://fonts.gstatic.com'],
    'form-action': ['\'self\''],
    'frame-ancestors': ['\'self\'', `https://*.${domainName}`],
    'img-src': ['\'self\'', 'data:', `https://*.${domainName}`],
    'manifest-src': ['\'self\'', `https://*.${domainName}`],
    'media-src': ['\'self\'', 'blob:', `*.${domainName}`],
    'object-src': ['\'self\'', `https://*.${domainName}`],
    'script-src': ['\'self\'', `https://*.${domainName}`],
    'style-src': ['\'self\'', `https://*.${domainName}`, 'https://fonts.googleapis.com', '\'unsafe-inline\''],
    'upgrade-insecure-requests': [],
    'worker-src': ['\'self\'', 'blob:', 'data:', `https://*.${domainName}`],
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
