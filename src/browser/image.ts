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

    img.crossOrigin = 'anonymous' // enable CORS if needed
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
      ctx.drawImage(
        img,
        0,
        0,
        width,
        height,
      )

      resolve(canvas.toDataURL(options?.format ?? 'image/webp', options?.quality ?? 0.8))
    }

    img.onerror = reject
  })
}
