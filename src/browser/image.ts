export async function convertImage(imageUrl: string, options?: {
  format?: 'image/webp' | 'image/png' | 'image/jpeg'
  maxHeight?: number
  maxWidth?: number
  quality?: number
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx)
      return reject(new Error('Context not found'))

    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    img.onload = () => {
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

      resolve(canvas.toDataURL(options?.format ?? 'image/webp', options?.quality ?? 0.8))
    }

    img.onerror = reject
  })
}

export interface LoadedImage { src: string, width: number, height: number }
export interface ImageTransform { rotate: 0 | 90 | 180 | 270, flipH: boolean, flipV: boolean }

/** Reads a File into a base64 data URL and resolves its natural dimensions. Throws for non-image files. */
export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/'))
    throw new Error('File is not an image')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async () => {
      try {
        resolve(await loadImageDimensions(reader.result as string))
      }
      catch (e) {
        reject(e)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/** Resolves natural dimensions of an image URL (data URL or remote). */
export function loadImageDimensions(src: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

/**
 * Applies rotate / flip transforms to an image and returns a new data URL.
 * Uses an intermediate canvas; rotation is in clockwise degrees.
 */
export async function transformImage(src: string, transform: ImageTransform): Promise<LoadedImage> {
  const img = await loadImageDimensions(src)
  const isSideways = transform.rotate === 90 || transform.rotate === 270
  const width = isSideways ? img.height : img.width
  const height = isSideways ? img.width : img.height
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx)
    throw new Error('Could not get canvas context')

  const el = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()

    i.onload = () => res(i)
    i.onerror = () => rej(new Error('Could not load image'))
    i.src = src
  })

  ctx.translate(width / 2, height / 2)

  if (transform.flipH)
    ctx.scale(-1, 1)

  if (transform.flipV)
    ctx.scale(1, -1)

  ctx.rotate((transform.rotate * Math.PI) / 180)
  ctx.drawImage(el, -img.width / 2, -img.height / 2)

  return { src: canvas.toDataURL('image/png'), width, height }
}

/** Extracts the first image File from a ClipboardEvent, or `undefined` if none. */
export function readPastedImage(e: ClipboardEvent): File | undefined {
  const items = e.clipboardData?.items

  if (!items)
    return undefined

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()

      if (file)
        return file
    }
  }

  return undefined
}
