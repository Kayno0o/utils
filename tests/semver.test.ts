import { describe, expect, it } from 'bun:test'
import { bumpMajor, bumpMinor, bumpPatch, isSemver, parseSemver } from '../src'

describe('isSemver', () => {
  it('accepts valid semver', () => {
    expect(isSemver('1.2.3')).toBe(true)
    expect(isSemver('0.0.0')).toBe(true)
    expect(isSemver('10.20.30')).toBe(true)
  })

  it('rejects invalid semver', () => {
    expect(isSemver('1.2')).toBe(false)
    expect(isSemver('1.2.3-rc.1')).toBe(false)
    expect(isSemver('v1.2.3')).toBe(false)
    expect(isSemver('foo')).toBe(false)
  })
})

describe('parseSemver', () => {
  it('extracts major, minor, patch', () => {
    expect(parseSemver('3.14.15')).toEqual({ major: 3, minor: 14, patch: 15 })
  })

  it('throws on invalid input', () => {
    expect(() => parseSemver('bad')).toThrow()
  })
})

describe('bumpPatch', () => {
  it('increments patch', () => expect(bumpPatch('1.2.3')).toBe('1.2.4'))
  it('throws on invalid', () => expect(() => bumpPatch('v1.2.3')).toThrow())
})

describe('bumpMinor', () => {
  it('increments minor and resets patch', () => expect(bumpMinor('1.2.3')).toBe('1.3.0'))
  it('throws on invalid', () => expect(() => bumpMinor('bad')).toThrow())
})

describe('bumpMajor', () => {
  it('increments major and resets minor+patch', () => expect(bumpMajor('1.2.3')).toBe('2.0.0'))
  it('throws on invalid', () => expect(() => bumpMajor('bad')).toThrow())
})
