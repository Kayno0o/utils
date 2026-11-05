import { describe, expect, test as it } from 'bun:test'
import { decodePath, encodePath } from '../src/polyline'

describe('encodePath / decodePath', () => {
  it('round-trips integer paths, negative steps included', () => {
    const path: [number, number][] = [[3850000, -12020000], [4070000, -12095000], [4325200, -12645300]]

    expect(decodePath(encodePath(path))).toEqual(path)
    expect(encodePath([[3850000, -12020000]])).toBe('_p~iF~ps|U')
  })

  it('throws on a truncated or invalid string instead of looping', () => {
    expect(() => decodePath('_p~iF~ps|')).toThrow('Truncated polyline')
    expect(() => decodePath(' ')).toThrow('Invalid polyline character')
  })
})
