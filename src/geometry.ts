/**
 * Converts axial hex coordinates `(q, r)` to pixel offsets using pointy-top orientation.
 * `size` is the circumradius (center-to-corner distance).
 */
export function hexToPixel(q: number, r: number, size: number): { x: number, y: number } {
  return {
    x: size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r),
    y: size * 1.5 * r,
  }
}

/** SVG polygon `points` string for a pointy-top hex centered at `(cx, cy)` with circumradius `size`. */
export function hexCorners(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)

    return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`
  }).join(' ')
}
