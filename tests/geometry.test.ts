import { describe, expect, it } from 'bun:test'
import { hexCorners, hexToPixel } from '../src/geometry'

describe('hexToPixel', () => {
  it('maps origin hex to origin pixel', () => {
    const p = hexToPixel(0, 0, 10)

    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(0)
  })

  it('maps (1, 0) correctly for pointy-top', () => {
    const p = hexToPixel(1, 0, 10)

    expect(p.x).toBeCloseTo(10 * Math.sqrt(3))
    expect(p.y).toBeCloseTo(0)
  })

  it('maps (0, 1) correctly for pointy-top', () => {
    const p = hexToPixel(0, 1, 10)

    expect(p.x).toBeCloseTo(10 * Math.sqrt(3) / 2)
    expect(p.y).toBeCloseTo(15)
  })

  it('scales with size', () => {
    const a = hexToPixel(1, 1, 10)
    const b = hexToPixel(1, 1, 20)

    expect(b.x).toBeCloseTo(a.x * 2)
    expect(b.y).toBeCloseTo(a.y * 2)
  })
})

describe('hexCorners', () => {
  it('returns 6 corner pairs', () => {
    const corners = hexCorners(0, 0, 10).split(' ')

    expect(corners).toHaveLength(6)
  })

  it('all corners are at distance `size` from center', () => {
    const cx = 50
    const cy = 50
    const size = 10
    const corners = hexCorners(cx, cy, size).split(' ')

    for (const c of corners) {
      const [x, y] = c.split(',').map(Number) as [number, number]
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)

      expect(dist).toBeCloseTo(size, 4)
    }
  })
})
