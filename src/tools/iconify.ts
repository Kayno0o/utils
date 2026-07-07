export interface IconifyIcon {
  body: string
  width?: number
  height?: number
  left?: number
  top?: number
}

export interface IconifyJSON {
  icons: Record<string, IconifyIcon>
  width?: number
  height?: number
}

export interface IconData {
  svg: string
  viewBox: string
}

export type IconType<T extends Record<string, IconifyJSON>> = {
  [P in keyof T & string]: `${P}:${keyof T[P]['icons'] & string}`
}[keyof T & string]

export function createIconify<const T extends Record<string, IconifyJSON>>(libs: T) {
  function getIconData(name: IconType<T>): IconData | null {
    const [prefix, iconName] = name.split(':') as [string, string]

    const library = libs[prefix]

    if (!library || !(iconName in library.icons))
      return null

    const icon = library.icons[iconName]

    if (!icon)
      return null

    const width = icon.width ?? library.width ?? 24
    const height = icon.height ?? library.height ?? 24
    const left = icon.left ?? 0
    const top = icon.top ?? 0

    return { svg: icon.body, viewBox: `${left} ${top} ${width} ${height}` }
  }

  return { getIconData }
}
