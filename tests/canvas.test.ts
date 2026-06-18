import { describe, expect, it } from 'bun:test'
import {
  canvasExtension,
  canvasMimeType,
  createCenteredCrop,
  fitCropToImage,
  moveCrop,
  pointerToNatural,
  resizeCrop,
  wrapTextForWidth,
} from '../src/browser/canvas'

// minimal canvas context stub for text wrapping
function makeCtx(charWidth = 10): CanvasRenderingContext2D {
  return {
    font: '',
    measureText: (text: string) => ({ width: text.length * charWidth }),
  } as unknown as CanvasRenderingContext2D
}

describe('fitCropToImage', () => {
  it('keeps valid crop unchanged', () => {
    expect(fitCropToImage({ x: 10, y: 10, w: 50, h: 50 }, 100, 100)).toEqual({ x: 10, y: 10, w: 50, h: 50 })
  })

  it('clamps width to image width', () => {
    const r = fitCropToImage({ x: 0, y: 0, w: 200, h: 50 }, 100, 100)

    expect(r.w).toBe(100)
  })

  it('prevents x going out of bounds', () => {
    const r = fitCropToImage({ x: 80, y: 0, w: 50, h: 50 }, 100, 100)

    expect(r.x + r.w).toBeLessThanOrEqual(100)
  })

  it('enforces minSize', () => {
    const r = fitCropToImage({ x: 0, y: 0, w: 0, h: 0 }, 100, 100, 5)

    expect(r.w).toBe(5)
    expect(r.h).toBe(5)
  })
})

describe('createCenteredCrop', () => {
  it('produces centered square for 1:1 ratio on square image', () => {
    const r = createCenteredCrop(100, 100, 1)

    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(0)
    expect(r.w).toBeCloseTo(100)
    expect(r.h).toBeCloseTo(100)
  })

  it('fits wide ratio into landscape image', () => {
    const r = createCenteredCrop(200, 100, 2)

    expect(r.w / r.h).toBeCloseTo(2, 2)
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(0)
  })

  it('letterboxes tall ratio on wide image', () => {
    const r = createCenteredCrop(200, 100, 0.5)

    expect(r.w / r.h).toBeCloseTo(0.5, 2)
    expect(r.x).toBeGreaterThan(0)
  })
})

describe('moveCrop', () => {
  it('translates by dx/dy', () => {
    const r = moveCrop({ x: 10, y: 10, w: 50, h: 50 }, 5, 5, 100, 100)

    expect(r.x).toBe(15)
    expect(r.y).toBe(15)
  })

  it('clamps to image bounds', () => {
    const r = moveCrop({ x: 60, y: 60, w: 50, h: 50 }, 100, 100, 100, 100)

    expect(r.x + r.w).toBeLessThanOrEqual(100)
    expect(r.y + r.h).toBeLessThanOrEqual(100)
  })
})

describe('resizeCrop', () => {
  it('grows from se handle while preserving ratio', () => {
    const start = { x: 0, y: 0, w: 50, h: 50 }
    const r = resizeCrop(start, 10, 1, 'se', 200, 200)

    expect(r.w / r.h).toBeCloseTo(1, 2)
    expect(r.w).toBeGreaterThan(50)
  })

  it('anchors opposite corner when using sw handle', () => {
    const start = { x: 50, y: 0, w: 50, h: 50 }
    const r = resizeCrop(start, -10, 1, 'sw', 200, 200)

    expect(r.x + r.w).toBeCloseTo(100)
  })
})

describe('pointerToNatural', () => {
  it('maps client coords to natural coords', () => {
    const rect = { left: 100, top: 50, width: 200, height: 100 } as DOMRect
    const p = pointerToNatural(200, 100, rect, 400)

    expect(p.x).toBeCloseTo(200)
    expect(p.y).toBeCloseTo(100)
  })
})

describe('wrapTextForWidth', () => {
  it('does not wrap short text', () => {
    const ctx = makeCtx(5)
    const lines = wrapTextForWidth(ctx, 'Hello world', 200)

    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('Hello world')
  })

  it('wraps at word boundary', () => {
    // charWidth = 10, maxWidth = 60 → "Hello world" = 110px → wraps
    const ctx = makeCtx(10)
    const lines = wrapTextForWidth(ctx, 'Hello world', 60)

    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('Hello')
    expect(lines[1]).toBe('world')
  })

  it('respects hard newlines', () => {
    const ctx = makeCtx(5)
    const lines = wrapTextForWidth(ctx, 'Line one\nLine two', 200)

    expect(lines).toHaveLength(2)
  })
})

describe('canvasMimeType / canvasExtension', () => {
  it('maps formats to mime types', () => {
    expect(canvasMimeType('png')).toBe('image/png')
    expect(canvasMimeType('jpeg')).toBe('image/jpeg')
    expect(canvasMimeType('webp')).toBe('image/webp')
  })

  it('uses jpg extension for jpeg', () => {
    expect(canvasExtension('jpeg')).toBe('jpg')
    expect(canvasExtension('png')).toBe('png')
    expect(canvasExtension('webp')).toBe('webp')
  })
})
