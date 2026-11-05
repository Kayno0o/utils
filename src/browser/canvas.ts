import { clamp } from '../number'
import { clickBlobAnchor } from './anchor'

export interface CropRect { x: number, y: number, w: number, h: number }
export type CropHandle = 'nw' | 'ne' | 'sw' | 'se'
export interface Point { x: number, y: number }
export interface WrappedText { lines: string[], fontSize: number }
/** An image MIME type a canvas can encode to (what `toBlob` and `toDataURL` take). */
export type CanvasFormat = 'image/png' | 'image/jpeg' | 'image/webp'

/** Clamps crop dimensions and position to stay within image bounds. */
export function fitCropToImage(crop: CropRect, imgW: number, imgH: number, minSize = 1): CropRect {
  const w = clamp(crop.w, minSize, imgW)
  const h = clamp(crop.h, minSize, imgH)

  return { x: clamp(crop.x, 0, imgW - w), y: clamp(crop.y, 0, imgH - h), w, h }
}

/** Centered crop rect that fills the image while preserving `ratio` (w/h). */
export function createCenteredCrop(imgW: number, imgH: number, ratio: number): CropRect {
  let w: number
  let h: number

  if (imgW / imgH > ratio) {
    h = imgH
    w = h * ratio
  }
  else {
    w = imgW
    h = w / ratio
  }

  w = Math.min(w, imgW)
  h = Math.min(h, imgH)

  if (w / h > ratio)
    w = h * ratio
  else if (w / h < ratio)
    h = w / ratio

  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h }
}

/** Translates a crop by `(dx, dy)` while keeping it within the image. */
export function moveCrop(start: CropRect, dx: number, dy: number, imgW: number, imgH: number): CropRect {
  return fitCropToImage({ x: start.x + dx, y: start.y + dy, w: start.w, h: start.h }, imgW, imgH)
}

/** Resizes a crop from a corner handle, maintaining the given aspect ratio. */
export function resizeCrop(
  start: CropRect,
  dx: number,
  ratio: number,
  handle: CropHandle,
  imgW: number,
  imgH: number,
  minSize = 1,
): CropRect {
  let { w, h, x, y } = start

  if (handle === 'se') {
    w = Math.max(minSize, start.w + dx)
    h = w / ratio
  }
  else if (handle === 'sw') {
    w = Math.max(minSize, start.w - dx)
    h = w / ratio
    x = start.x + start.w - w
  }
  else if (handle === 'ne') {
    w = Math.max(minSize, start.w + dx)
    h = w / ratio
    y = start.y + start.h - h
  }
  else {
    w = Math.max(minSize, start.w - dx)
    h = w / ratio
    x = start.x + start.w - w
    y = start.y + start.h - h
  }

  if (w > imgW) {
    w = imgW
    h = w / ratio
  }

  if (h > imgH) {
    h = imgH
    w = h * ratio
  }

  if (x < 0) {
    w += x
    x = 0
  }

  if (y < 0) {
    h += y
    y = 0
  }

  if (x + w > imgW)
    w = imgW - x

  if (y + h > imgH)
    h = imgH - y

  if (w / h > ratio)
    w = h * ratio
  else if (w / h < ratio)
    h = w / ratio

  return fitCropToImage({ x, y, w, h }, imgW, imgH, minSize)
}

/** Maps pointer client coords to natural image coordinates given an element's bounding rect. */
export function pointerToNatural(clientX: number, clientY: number, rect: DOMRect, imageWidth: number): Point {
  const scale = rect.width / imageWidth

  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale }
}

/** Wraps text to lines that fit within `maxWidth`, respecting hard newlines. */
export function wrapTextForWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = []

  for (const hard of text.split('\n')) {
    const words = hard.split(' ')
    let line = words[0]!

    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`

      if (ctx.measureText(test).width > maxWidth) {
        result.push(line)
        line = words[i]!
      }
      else {
        line = test
      }
    }

    result.push(line)
  }

  return result
}

/**
 * Binary-searches for the largest font size in `[baseFontSize * 0.35, baseFontSize]`
 * such that the wrapped text fits within `maxWidth × maxHeight`.
 */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number,
  font: string,
  fontWeight: number | string = 'normal',
): WrappedText {
  const minFontSize = baseFontSize * 0.35

  // Seed best result at minimum size
  ctx.font = `${fontWeight} ${minFontSize}px ${font}`
  let best: WrappedText = { lines: wrapTextForWidth(ctx, text, maxWidth), fontSize: minFontSize }

  let lo = minFontSize
  let hi = baseFontSize

  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2

    ctx.font = `${fontWeight} ${mid}px ${font}`

    const lines = wrapTextForWidth(ctx, text, maxWidth)
    const totalHeight = lines.length * mid * 1.1

    if (totalHeight <= maxHeight || lines.length === 1) {
      best = { lines, fontSize: mid }
      lo = mid
    }
    else {
      hi = mid
    }
  }

  return best
}

export interface LowQualityOptions {
  /** Contrast boost factor in [0, 1]. Default 0.35. */
  contrast?: number
  /** Number of posterize levels. Default 6. */
  levels?: number
  /** Per-channel noise amplitude. Default 28. */
  noise?: number
}

/** Applies posterization + noise for a retro/low-quality aesthetic; throws a RangeError for `levels` below 2 or non-finite (one level has no step), clamps `contrast` to [0, 1], and treats a non-finite `noise` as 0. */
export function applyLowQuality(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: LowQualityOptions = {},
): void {
  const { levels = 6 } = options

  if (!Number.isFinite(levels) || levels < 2)
    throw new RangeError('applyLowQuality levels must be a finite number of at least 2')

  const contrast = clamp(Number.isFinite(options.contrast) ? options.contrast! : 0.35, 0, 1)
  const noise = Number.isFinite(options.noise ?? 28) ? options.noise ?? 28 : 0
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
  const step = 255 / (levels - 1)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  // contrast and posterize depend on the channel value alone, so they are tabulated once
  const levelOf = Float64Array.from({ length: 256 }, (_, v) => Math.round((factor * (v - 128) + 128) / step) * step)

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++)
      data[i + c] = clamp(levelOf[data[i + c]!]! + (Math.random() - 0.5) * noise, 0, 255)
  }

  ctx.putImageData(imageData, 0, 0)
}

export function canvasExtension(format: CanvasFormat): string {
  return format === 'image/jpeg' ? 'jpg' : format.slice('image/'.length)
}

/** Downloads the canvas as a file. */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: CanvasFormat = 'image/png', quality?: number): void {
  canvas.toBlob((blob) => {
    if (blob)
      clickBlobAnchor(blob, filename)
  }, format, quality)
}

/** Copies the canvas to the clipboard as an image. */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement, format: CanvasFormat = 'image/png', quality?: number): Promise<void> {
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, format, quality))

  if (!blob || !navigator.clipboard?.write)
    throw new Error('Clipboard API not available')

  await navigator.clipboard.write([new ClipboardItem({ [format]: blob })])
}
