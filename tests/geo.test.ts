import { describe, expect, test as it } from 'bun:test'
import { euclideanDistance, haversineDistance, indexToCoords, manhattanDistance } from '../src/geo'

describe('haversineDistance', () => {
  it('gives the rounded kilometres between two points', () => {
    expect(haversineDistance(48.8566, 2.3522, 51.5074, -0.1278)).toBe(344)
    expect(haversineDistance(1, 1, 1, 1)).toBe(0)
  })
})

describe('grid helpers', () => {
  it('maps an index to coordinates and measures distances', () => {
    expect(indexToCoords(7, 3)).toEqual([1, 2])
    expect(manhattanDistance([0, 0], [3, 4])).toBe(7)
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5)
  })
})
