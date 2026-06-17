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
