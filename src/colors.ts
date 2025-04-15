import type { FunctionKeys, NonFunctionKeys } from '../types'
import { ColorConverter } from './color'

type ColorStyle = [start: number | string, end: number | string]
type StyleMap = typeof styleMap

type ColorsType =
  ((value: string) => string) &
  { [K in NonFunctionKeys<StyleMap>]: ColorsType } &
  { [K in FunctionKeys<StyleMap>]: StyleMap[K] extends (...args: infer A) => ColorStyle ? (...args: A) => ColorsType : never }

type Appearance = 'fg' | 'bg'

const FG = 39
const BG = 49
const ANSI = '\u001B['

const styleMap = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, FG],
  red: [31, FG],
  green: [32, FG],
  yellow: [33, FG],
  blue: [34, FG],
  magenta: [35, FG],
  cyan: [36, FG],
  white: [37, FG],
  gray: [90, FG],
  grey: [90, FG],

  blackBright: [90, FG],
  redBright: [91, FG],
  greenBright: [92, FG],
  yellowBright: [93, FG],
  blueBright: [94, FG],
  magentaBright: [95, FG],
  cyanBright: [96, FG],
  whiteBright: [97, FG],

  bgBlack: [40, BG],
  bgRed: [41, BG],
  bgGreen: [42, BG],
  bgYellow: [43, BG],
  bgBlue: [44, BG],
  bgMagenta: [45, BG],
  bgCyan: [46, BG],
  bgWhite: [47, BG],

  bgBlackBright: [100, BG],
  bgRedBright: [101, BG],
  bgGreenBright: [102, BG],
  bgYellowBright: [103, BG],
  bgBlueBright: [104, BG],
  bgMagentaBright: [105, BG],
  bgCyanBright: [106, BG],
  bgWhiteBright: [107, BG],

  rgb: (r: number, g: number, b: number, type: Appearance = 'fg') => [`${type === 'fg' ? 38 : 48};2;${r};${g};${b}`, type === 'fg' ? FG : BG] as ColorStyle,
  hex: (hex: string, type: Appearance = 'fg') => {
    const [r, g, b] = ColorConverter.from('hex', hex).to('rgb')
    return [`${type === 'fg' ? 38 : 48};2;${r};${g};${b}`, type === 'fg' ? FG : BG] as ColorStyle
  },

  ansi256: (code: number, type: Appearance = 'fg') => [`${type === 'fg' ? 38 : 48};5;${code}`, type === 'fg' ? FG : BG],
} satisfies Record<string, ColorStyle | ((...args: any) => ColorStyle)>

function applyStyles(styles: ColorStyle[], value: string): string {
  let open = ''
  let close = ''

  for (let i = 0, len = styles.length; i < len; i++) {
    const [start, end] = styles[i]
    open += `${ANSI}${start}m`
    close = `${ANSI}${end}m${close}`
  }

  return open + value + close
}

function makeProxy(styles: ColorStyle[] = []): ColorsType {
  const fn = (val: string) => applyStyles(styles, val)

  return new Proxy(fn, {
    get(_, prop: keyof ColorsType) {
      const val = styleMap[prop as keyof typeof styleMap]

      if (Array.isArray(val))
        return makeProxy([...styles, val as ColorStyle])

      if (typeof val === 'function')
        return (...args: any) => makeProxy([...styles, (val as any)(...args) as ColorStyle])

      throw new Error(`Unknown style: ${String(prop)}`)
    },
  }) as ColorsType
}

export const colors = makeProxy()
