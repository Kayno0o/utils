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
  // placehold.co reads a literal `\n` as a line break; buildUrlQuery encodes the rest, a `+` or `&` in the text included.
  const queryString = buildUrlQuery({
    font: props.font,
    text: props.text?.replaceAll('\n', '\\n'),
  })

  // The text color is the second path segment, so it needs a background before it: placehold.co's own grey.
  const colors = props.color ? [props.backgroundColor || 'DDDDDD', props.color] : [props.backgroundColor]
  const path = [...colors, props.format].filter(Boolean).join('/')

  return `https://placehold.co/${props.width ?? 100}x${props.height ?? 100}${path ? `/${path}` : ''}${queryString}`
}
