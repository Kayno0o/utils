import { buildUrlQuery } from './url'

/** Build an url from placehold.co */
export function getPlaceholderUrl(props: {
  backgroundColor?: string
  color?: string
  font?: 'lato' | 'lora' | 'montserrat' | 'open sans' | 'oswald' | 'playfair display' | 'pt sans' | 'raleway' | 'roboto' | 'source sans pro'
  format?: 'png' | 'svg' | 'jpg' | 'webp' | 'jpeg' | 'mp4'
  height?: number
  text?: string
  width?: number
}): string {
  const queryString = buildUrlQuery({
    font: props.font ? encodeURI(props.font) : undefined,
    text: props.text ? encodeURI(props.text.replaceAll(' ', '+').replaceAll('\n', '\\n')) : undefined,
  })

  const path = [props.backgroundColor, props.color, props.format].filter(v => Boolean(v)).join('/')

  return `https://placehold.co/${props.width ?? 100}x${props.height ?? 100}${path ? `/${path}` : ''}${queryString}`
}

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
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL(options?.format ?? 'image/webp', options?.quality ?? 0.8))
    }

    img.onerror = reject
  })
}
