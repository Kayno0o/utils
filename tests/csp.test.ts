import { describe, expect, test as it } from 'bun:test'
import { cspBuilder } from '../src/builders/csp'

describe('cspBuilder function', () => {
  it('should generate default CSP for a given domain', () => {
    const domain = 'example.com'
    const result = cspBuilder(domain)

    expect(result).toContain('default-src \'self\' *.example.com')
    expect(result).toContain('script-src \'self\' https://*.example.com')
    expect(result).toContain('connect-src \'self\' https://*.example.com wss://*.example.com')
    expect(result).toContain('base-uri \'self\'')
    expect(result).toContain('form-action \'self\'')
  })

  it('should handle domain with protocol and path', () => {
    const domain = 'https://sub.example.com/api'
    const result = cspBuilder(domain)

    // logic extracts 'sub.example.com'
    expect(result).toContain('default-src \'self\' *.sub.example.com')
    expect(result).toContain('script-src \'self\' https://*.sub.example.com')
  })

  it('should merge custom siteCsp', () => {
    const domain = 'example.com'
    const customCsp = {
      'script-src': ['https://analytics.google.com'],
      'img-src': ['https://cdn.example.com'],
    }
    const result = cspBuilder(domain, customCsp)

    // Check merging
    expect(result).toContain('script-src \'self\' https://*.example.com https://analytics.google.com')
    // Check appending/creating
    expect(result).toContain('img-src \'self\' data: https://*.example.com https://cdn.example.com')
  })

  it('should sync script-src-elem and style-src-elem if not provided', () => {
    const domain = 'example.com'
    const result = cspBuilder(domain)

    expect(result).toContain('script-src-elem \'self\' https://*.example.com')
    expect(result).toContain('style-src-elem \'self\' https://*.example.com')
  })
})
