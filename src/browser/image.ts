import type { CanvasFormat, CropRect } from './canvas'
import { base64DecodeBytes } from '../text'

const REMOTE_URL = /^(?:https?:)?\/\//i

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(new Error('Failed to read file')))
    reader.readAsDataURL(file)
  })
}

/** Loads `src`, a remote (http(s) or protocol-relative) one with `crossOrigin = 'anonymous'` so drawing it does not taint a canvas. */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    if (REMOTE_URL.test(src))
      img.crossOrigin = 'anonymous'

    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

/** Loads `imageUrl`, scales it down to `maxWidth` / `maxHeight` and re-encodes it as a data URL (webp by default); rejects with an `Error` when the image cannot load. */
export async function convertImage(imageUrl: string, options?: {
  format?: CanvasFormat
  maxHeight?: number
  maxWidth?: number
  quality?: number
}): Promise<string> {
  const img = await loadImageElement(imageUrl)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx)
    throw new Error('Context not found')

  let width = img.width
  let height = img.height

  if (options?.maxWidth && width > options.maxWidth) {
    height *= options.maxWidth / width
    width = options.maxWidth
  }

  if (options?.maxHeight && height > options.maxHeight) {
    width *= options.maxHeight / height
    height = options.maxHeight
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL(options?.format ?? 'image/webp', options?.quality ?? 0.8)
}

export interface LoadedImage { src: string, width: number, height: number }
export interface ImageTransform { rotate: 0 | 90 | 180 | 270, flipH: boolean, flipV: boolean }

/** Reads a File into a base64 data URL and resolves its natural dimensions. Throws for non-image files. */
export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/'))
    throw new Error('File is not an image')

  return loadImageDimensions(await readAsDataUrl(file))
}

/** Resolves natural dimensions of an image URL (data URL or remote). */
export async function loadImageDimensions(src: string): Promise<LoadedImage> {
  const img = await loadImageElement(src)

  return { src, width: img.naturalWidth, height: img.naturalHeight }
}

export interface CropImageOptions {
  format?: CanvasFormat
  quality?: number
  /** Output width in pixels. Defaults to the crop's own width, or to whatever keeps `height` at the crop ratio. */
  width?: number
  /** Output height in pixels. Defaults to the crop's own height, or to whatever keeps `width` at the crop ratio. */
  height?: number
  /** Off draws nearest-neighbour, which is what keeps pixel art square at another size. Defaults to on. */
  smoothing?: boolean
}

/** Renders `crop` - in natural image pixels, as `ImageCropper` emits it - to a new data URL. */
export async function cropImage(src: string, crop: CropRect, options: CropImageOptions = {}): Promise<LoadedImage> {
  const img = await loadImageElement(src)
  const width = Math.round(options.width ?? (options.height ? (options.height * crop.w) / crop.h : crop.w))
  const height = Math.round(options.height ?? (options.width ? (options.width * crop.h) / crop.w : crop.h))
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx)
    throw new Error('Could not get canvas context')

  ctx.imageSmoothingEnabled = options.smoothing ?? true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height)

  return { src: canvas.toDataURL(options.format ?? 'image/png', options.quality), width, height }
}

/**
 * Applies rotate / flip transforms to an image and returns a new data URL.
 * Uses an intermediate canvas; rotation is in clockwise degrees.
 */
export async function transformImage(src: string, transform: ImageTransform, options: Pick<CropImageOptions, 'format' | 'quality'> = {}): Promise<LoadedImage> {
  const el = await loadImageElement(src)
  const img = { width: el.naturalWidth, height: el.naturalHeight }
  const isSideways = transform.rotate === 90 || transform.rotate === 270
  const width = isSideways ? img.height : img.width
  const height = isSideways ? img.width : img.height
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx)
    throw new Error('Could not get canvas context')

  ctx.translate(width / 2, height / 2)

  if (transform.flipH)
    ctx.scale(-1, 1)

  if (transform.flipV)
    ctx.scale(1, -1)

  ctx.rotate((transform.rotate * Math.PI) / 180)
  ctx.drawImage(el, -img.width / 2, -img.height / 2)

  return { src: canvas.toDataURL(options.format ?? 'image/png', options.quality), width, height }
}

/** Decodes a base64 data URL into a Blob, for sending bytes where a long base64 string would go. */
export function dataUrlToBlob(src: string): Blob {
  const comma = src.indexOf(',')
  const head = comma < 0 ? src : src.slice(0, comma)
  const bytes = base64DecodeBytes(comma < 0 ? '' : src.slice(comma + 1))

  const mime = head.slice(head.indexOf(':') + 1)
  const semicolon = mime.indexOf(';')

  return new Blob([bytes], { type: (semicolon < 0 ? mime : mime.slice(0, semicolon)) || 'application/octet-stream' })
}

/** Reads a File into a data URL; resolves `null` for a missing file and rejects with an `Error` when the read fails. */
export async function readFileAsDataUrl(file?: File | null): Promise<string | null> {
  return file ? readAsDataUrl(file) : null
}

/** Fetch a remote image URL and return it as a base64 data URL (null on failure). */
export async function resolveImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)

    if (!res.ok)
      return null

    const blob = await res.blob()

    return await readFileAsDataUrl(new File([blob], 'image', { type: blob.type }))
  }
  catch {
    return null
  }
}

/** Extracts the first image File from a ClipboardEvent, or `null` if the paste holds none. */
export function readPastedImage(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items

  if (!items)
    return null

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()

      if (file)
        return file
    }
  }

  return null
}
