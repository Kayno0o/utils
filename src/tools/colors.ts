import type { FunctionKeys, NonFunctionKeys } from '../types'

type ColorStyle = [start: number | string, end: number | string]
type StyleMap = typeof styleMap

type ColorsType
  = ((value: string) => string)
    & { [K in NonFunctionKeys<StyleMap>]: ColorsType }
    & { [K in FunctionKeys<StyleMap>]: StyleMap[K] extends (...args: infer A) => ColorStyle ? (...args: A) => ColorsType : never }

type Appearance = 'fg' | 'bg'

interface ColorStream { isTTY?: boolean }

export interface ColorsOptions {
  /** Stream whose TTY state decides whether escapes are written, `process.stdout` by default. */
  stream?: ColorStream
  /** Environment read for FORCE_COLOR, NO_COLOR, NODE_DISABLE_COLORS and TERM, `process.env` at call time by default. */
  env?: Record<string, string | undefined>
}

const FG = 39
const BG = 49
const ANSI = '\u001B['

const MAX_CACHED = 64
const HEX_DIGITS = /^[a-f0-9]+$/i

// Reads hex as `Color.from('hex', ...)` does (3, 4, 6 or 8 digits, the alpha dropped, non-hex text black), without loading the converter for it.
function parseHex(hex: string): [number, number, number] {
  const digits = hex.startsWith('#') ? hex.slice(1) : hex

  if (!HEX_DIGITS.test(digits))
    return [0, 0, 0]

  if (digits.length === 3 || digits.length === 4)
    return [Number.parseInt(digits[0]! + digits[0]!, 16), Number.parseInt(digits[1]! + digits[1]!, 16), Number.parseInt(digits[2]! + digits[2]!, 16)]

  if (digits.length !== 6 && digits.length !== 8)
    throw new Error(`Invalid hex color length: ${digits.length}`)

  return [Number.parseInt(digits.slice(0, 2), 16), Number.parseInt(digits.slice(2, 4), 16), Number.parseInt(digits.slice(4, 6), 16)]
}

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
    const [r, g, b] = parseHex(hex)

    return [`${type === 'fg' ? 38 : 48};2;${r};${g};${b}`, type === 'fg' ? FG : BG] as ColorStyle
  },

  ansi256: (code: number, type: Appearance = 'fg') => [`${type === 'fg' ? 38 : 48};5;${code}`, type === 'fg' ? FG : BG],
} satisfies Record<string, ColorStyle | ((...args: any) => ColorStyle)>

const FORCE_COLOR_ON = new Set(['', '1', '2', '3', 'true'])

// Same rules as node:util styleText: FORCE_COLOR wins, then NO_COLOR, NODE_DISABLE_COLORS and TERM=dumb, then the stream's TTY state.
function shouldColorize(stream: ColorStream | undefined, env: Record<string, string | undefined> = globalThis.process?.env ?? {}): boolean {
  if (env.FORCE_COLOR !== undefined)
    return FORCE_COLOR_ON.has(env.FORCE_COLOR)

  if (env.NO_COLOR !== undefined || env.NODE_DISABLE_COLORS !== undefined || env.TERM === 'dumb')
    return false

  return stream?.isTTY === true
}

function makeProxy(options: ColorsOptions, styles: ColorStyle[] = []): ColorsType {
  let open = ''
  let close = ''

  for (let i = 0, len = styles.length; i < len; i++) {
    open += `${ANSI}${styles[i]![0]}m`
    close = `${ANSI}${styles[i]![1]}m${close}`
  }

  const fn = (val: string) => shouldColorize(options.stream ?? globalThis.process?.stdout, options.env) ? open + val + close : val
  // `colors.bold` is the same chain every time, so it is built once.
  const children = new Map<string, ColorsType>()

  return new Proxy(fn, {
    get(_, prop: keyof ColorsType) {
      const val = styleMap[prop as keyof typeof styleMap]

      if (Array.isArray(val)) {
        let child = children.get(prop)

        if (child === undefined) {
          child = makeProxy(options, [...styles, val as ColorStyle])
          children.set(prop, child)
        }

        return child
      }

      if (typeof val === 'function') {
        return (...args: any) => {
          const key = `${prop}:${args.join(',')}`
          let child = children.get(key)

          if (child === undefined) {
            // A loop over many colours would grow this without end, so it starts over past a few.
            if (children.size >= MAX_CACHED)
              children.clear()

            child = makeProxy(options, [...styles, (val as any)(...args) as ColorStyle])
            children.set(key, child)
          }

          return child
        }
      }

      throw new Error(`Unknown style: ${String(prop)}`)
    },
  }) as ColorsType
}

// Styles that write escapes only when `stream` is a TTY, e.g. `createColors({ stream: process.stderr }).red('failed')`.
export function createColors(options: ColorsOptions = {}): ColorsType {
  return makeProxy(options)
}

export const colors = createColors()
