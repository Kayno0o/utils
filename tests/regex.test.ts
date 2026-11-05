import { describe, expect, test as it } from 'bun:test'
import { STRICT_HEX_COLOR_REGEX, STRICT_IPV4_REGEX, STRICT_UUID_REGEX } from '../src/regex'

describe('STRICT_HEX_COLOR_REGEX', () => {
  it('takes 3, 4, 6 and 8 hex digits, with or without #', () => {
    for (const color of ['#fff', 'FFFF', '#a1b2c3', '#A1B2C3D4'])
      expect(STRICT_HEX_COLOR_REGEX.test(color)).toBe(true)
  })

  it('refuses letters past f and other lengths', () => {
    for (const color of ['#zzz', '#ggg000', '#12345', 'fffffffff'])
      expect(STRICT_HEX_COLOR_REGEX.test(color)).toBe(false)
  })
})

describe('STRICT_IPV4_REGEX', () => {
  it('takes four octets up to 255 and refuses the rest', () => {
    expect(['192.168.1.1', '255.255.255.255', '0.0.0.0'].every(ip => STRICT_IPV4_REGEX.test(ip))).toBe(true)
    expect(['256.1.1.1', '1.2.3', '01.2.3.4', '1.2.3.4.'].some(ip => STRICT_IPV4_REGEX.test(ip))).toBe(false)
  })
})

describe('STRICT_UUID_REGEX', () => {
  it('matches a whole UUID only', () => {
    expect(STRICT_UUID_REGEX.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(STRICT_UUID_REGEX.test('x123e4567-e89b-12d3-a456-426614174000')).toBe(false)
  })
})
