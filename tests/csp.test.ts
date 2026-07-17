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

  it('should keep an explicit script-src-elem rather than syncing it', () => {
    const result = cspBuilder('example.com', { 'script-src-elem': ['\'unsafe-inline\''] })

    expect(result).toContain('script-src-elem \'unsafe-inline\'')
  })

  it('should emit valueless directives without a trailing space', () => {
    expect(cspBuilder('example.com')).toContain('upgrade-insecure-requests;')
  })

  it('should throw for an invalid domain', () => {
    expect(() => cspBuilder('not a domain')).toThrow('Domain is invalid: not a domain')
  })
})

describe('cspBuilder function with several domains', () => {
  it('should cover every domain in each directive', () => {
    const result = cspBuilder(['example.com', 'example.org'])

    expect(result).toContain('default-src \'self\' *.example.com *.example.org')
    expect(result).toContain('script-src \'self\' https://*.example.com https://*.example.org')
    expect(result).toContain('frame-ancestors \'self\' https://*.example.com https://*.example.org')
    expect(result).toContain('media-src \'self\' blob: *.example.com *.example.org')
    expect(result).toContain('worker-src \'self\' blob: data: https://*.example.com https://*.example.org')
  })

  it('should group connect-src by scheme across domains', () => {
    expect(cspBuilder(['example.com', 'example.org'])).toContain('connect-src \'self\' https://*.example.com https://*.example.org wss://*.example.com wss://*.example.org')
  })

  it('should preserve the given domain order', () => {
    expect(cspBuilder(['example.org', 'example.com'])).toContain('default-src \'self\' *.example.org *.example.com')
  })

  it('should match the single-domain form for a one-element list', () => {
    expect(cspBuilder(['example.com'])).toBe(cspBuilder('example.com'))
  })

  it('should normalize every domain in the list', () => {
    expect(cspBuilder(['https://example.com/api', 'example.org/'])).toContain('default-src \'self\' *.example.com *.example.org')
  })

  it('should merge siteCsp on top of the multi-domain defaults', () => {
    const result = cspBuilder(['example.com', 'example.org'], { 'img-src': ['blob:'] })

    expect(result).toContain('img-src \'self\' data: https://*.example.com https://*.example.org blob:')
  })

  it('should sync the element directives across every domain', () => {
    const result = cspBuilder(['example.com', 'example.org'])

    expect(result).toContain('script-src-elem \'self\' https://*.example.com https://*.example.org')
    expect(result).toContain('style-src-elem \'self\' https://*.example.com https://*.example.org https://fonts.googleapis.com \'unsafe-inline\'')
  })

  it('should throw when any domain in the list is invalid', () => {
    expect(() => cspBuilder(['example.com', 'nope'])).toThrow('Domain is invalid: nope')
  })

  it('should throw when the list is empty', () => {
    expect(() => cspBuilder([])).toThrow('At least one domain is required')
  })
})
