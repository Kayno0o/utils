type Style = [start: number, end: number]

const styleMap = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  blackBright: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39],

  bgBlackBright: [100, 49],
  bgRedBright: [101, 49],
  bgGreenBright: [102, 49],
  bgYellowBright: [103, 49],
  bgBlueBright: [104, 49],
  bgMagentaBright: [105, 49],
  bgCyanBright: [106, 49],
  bgWhiteBright: [107, 49],
} satisfies Record<string, Style>

type StyleKeys = keyof typeof styleMap
type ColorsType = ((value: string) => string) & { [K in StyleKeys]: ColorsType }

class ColorBuilder {
  constructor(private styles: Style[] = []) {}

  public apply = (value: string): string => {
    const open = this.styles.map(style => `\u001B[${style[0]}m`).join('')
    const close = [...this.styles].reverse().map(style => `\u001B[${style[1]}m`).join('')
    return `${open}${value}${close}`
  }

  public addStyle(style: Style): ColorBuilder {
    return new ColorBuilder([...this.styles, style])
  }
}

function makeProxy(builder: ColorBuilder): ColorsType {
  const fn = (value: string) => builder.apply(value)
  const proxy = new Proxy(fn, {
    get(_, prop: string) {
      if (prop in styleMap) {
        return makeProxy(builder.addStyle(styleMap[prop as StyleKeys]))
      }
      throw new Error(`Unknown style: ${prop}`)
    },
  })
  return proxy as ColorsType
}

export const colors = makeProxy(new ColorBuilder())
