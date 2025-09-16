import { existsSync } from 'node:fs'
import { notNullish, toArray } from './array'
import { colors } from './tools/colors'

type NumberOptionType = 'number' | 'int' | 'float'
type StringOptionType = 'string' | 'date' | 'path'
type OptionType = 'boolean' | StringOptionType | NumberOptionType
type AlphabetChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'

type OptionValueType<T extends OptionType> =
T extends 'boolean' ? boolean
  : T extends NumberOptionType ? number
    : string

interface TypedOptionDefinition<T extends OptionType, Type, FormatType = Type> {
  alias?: string | string[]
  type: T
  short?: AlphabetChar
  required?: boolean
  description?: string
  default?: FormatType
  example?: string | string[]
  format?: (value: string) => FormatType
  validate?: (value: FormatType) => true | string
}

interface FormatOnlyOptionDefinition<FormatType> {
  alias?: string | string[]
  type?: never
  short?: AlphabetChar
  required?: boolean
  description?: string
  default?: FormatType
  example?: string | string[]
  format: (value: string) => FormatType
  validate?: (value: FormatType) => true | string
}

type OptionDefinition =
  | TypedOptionDefinition<'boolean', boolean, any>
  | TypedOptionDefinition<'string' | 'path' | 'date', string, any>
  | TypedOptionDefinition<NumberOptionType, number, any>
  | FormatOnlyOptionDefinition<any>

type ParseArgsConfig<T extends Record<string, OptionDefinition>> = T

type ParsedValues<T extends Record<string, OptionDefinition>> = {
  [K in keyof T]: T[K]['required'] extends true
    ? T[K]['format'] extends (value: string) => infer R
      ? R
      : T[K]['type'] extends OptionType
        ? OptionValueType<T[K]['type']>
        : never
    : T[K]['format'] extends (value: string) => infer R
      ? R | undefined
      : T[K]['type'] extends OptionType
        ? OptionValueType<T[K]['type']> | undefined
        : never
}

interface ArgsHelpConfig {
  name?: string
  shortDescription?: string
  usage?: string | string[]
  keywords?: string[]
  description?: string
  footerBlocks?: { title: string, content: string | string[] }[]
}

interface ArgsConfig<T extends Record<string, OptionDefinition>> {
  args: string[]
  help?: ArgsHelpConfig
  options: ParseArgsConfig<T>
}

class OptionFormatError extends Error {
  constructor(option: TypedOptionDefinition<any, any>, value: string | undefined) {
    super(`Invalid value: ${value}\nExpected value of type: ${option.type}`)
  }
}

function parseBoolOption(option: TypedOptionDefinition<'boolean', boolean>, value: string | undefined): boolean {
  if (value === 'true' || value === '1' || value === undefined)
    return true

  if (value === 'false' || value === '0')
    return false

  throw new OptionFormatError(option, value)
}

function parseFloatOption(option: TypedOptionDefinition<NumberOptionType, number>, value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined

  if (typeof value === 'number')
    return value

  if (typeof value === 'string' && !value.match(/^\d+(?:\.\d+)?$/))
    throw new OptionFormatError(option, value)

  const nb = Number.parseFloat(value)

  if (Number.isNaN(nb))
    throw new OptionFormatError(option, value)

  return nb
}

function parseIntOption(option: TypedOptionDefinition<NumberOptionType, number>, value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined

  if (typeof value === 'number')
    return value

  if (typeof value === 'string' && !value.match(/^\d+$/))
    throw new OptionFormatError(option, value)

  const nb = Number.parseInt(value)

  if (Number.isNaN(nb))
    throw new OptionFormatError(option, value)

  return nb
}

function parseNumberOption(option: TypedOptionDefinition<NumberOptionType, number>, value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined

  if (typeof value === 'number')
    return value

  if (typeof value === 'string' && !value.match(/^\d+(?:\.\d+)?$/))
    throw new OptionFormatError(option, value)

  const nb = Number(value)

  if (Number.isNaN(nb))
    throw new OptionFormatError(option, value)

  return nb
}

function parseDateOption(option: TypedOptionDefinition<StringOptionType, string>, value: string | undefined): Date | undefined {
  if (value === undefined)
    return undefined

  const date = new Date(value)

  if (!(date instanceof Date) || Number.isNaN(date))
    throw new OptionFormatError(option, value)

  return date
}

function parsePathOption(option: TypedOptionDefinition<StringOptionType, string>, value: string | undefined): string | undefined {
  if (value === undefined)
    return undefined

  if (!existsSync(value))
    throw new OptionFormatError(option, value)

  return value
}

function parseOption(option: OptionDefinition & { name: string }, value: string | undefined): any {
  if (option.format && value !== undefined)
    return option.format(value)

  if (!option.type)
    throw new Error(`Option ${option.name} must have either a 'type' or 'format' function`)

  if (option.type === 'boolean')
    return parseBoolOption(option, value)

  if (option.type === 'float')
    return parseFloatOption(option, value)

  if (option.type === 'int')
    return parseIntOption(option, value)

  if (option.type === 'number')
    return parseNumberOption(option, value)

  if (option.type === 'string')
    return value

  if (option.type === 'date')
    return parseDateOption(option, value)

  if (option.type === 'path')
    return parsePathOption(option, value)

  throw new OptionFormatError(option, value)
}

function block(name: string, content: string | (string | undefined)[], keywords: string[] = []): string {
  let filteredContent = toArray(content).filter(notNullish)

  if (keywords.length) {
    const regexp = new RegExp(`\\b${keywords.join('\\b|\\b')}\\b`, 'g')
    filteredContent = filteredContent.map(c => c.replace(regexp, colors.underline))
  }

  return `${colors.bold(name.toLocaleUpperCase())}\n  ${filteredContent.join('\n  ')}\n\n`
}

function help(config: ArgsHelpConfig, options: (OptionDefinition & { name: string })[]) {
  const { name, shortDescription, usage, footerBlocks, keywords } = config

  let output = ''
  if (name) {
    output += block('name', [name, shortDescription && ` - ${shortDescription}`], keywords)
  }

  if (usage || name)
    output += block('usage', usage || [`${colors.bold(name!)} [option ...] command`], keywords)

  const optionsContent: string[] = []
  for (const option of options) {
    let command = colors.bold([
      option.short && `-${option.short}`,
      `--${option.name}`,
      ...toArray(option.alias ?? []).map(a => `--${a}`),
    ].filter(notNullish).join(', '))

    if (option.default !== undefined)
      command += `[=${colors.underline(String(option.default))}]`

    command += ` (${option.type || 'custom'})`

    optionsContent.push(command)

    if (option.description)
      optionsContent.push(`  ${option.description}`)

    optionsContent.push('')
  }
  output += block('options', optionsContent)

  if (footerBlocks)
    output += footerBlocks.map(b => block(b.title, b.content, keywords ?? []))

  console.log(output)
  process.exit()
}

const argRegexp = /^--?([\w-]+)(?:=(.*))?/

export function parseArgs<
  T extends Record<string, OptionDefinition>,
>(config: ArgsConfig<T>): ParsedValues<T> {
  const options = Object.keys(config.options).map(option => ({
    name: option,
    ...config.options[option],
  }) as OptionDefinition & { name: string })

  if (config.help && !config.options.help) {
    options.push({
      name: 'help',
      short: 'h',
      type: 'boolean',
    })
  }

  const result: any = {}

  for (let i = 0; i < config.args.length; i++) {
    const arg = config.args[i]

    const match = arg.match(argRegexp)

    if (!match)
      continue

    let [, name, content] = match as [string, string, string?]

    if (content === undefined && i + 1 < config.args.length) {
      const nextArg = config.args[i + 1]
      if (!nextArg.match(argRegexp))
        content = nextArg
    }

    const option = options.find(o => o.name === name || toArray(o.alias ?? []).includes(name) || o.short === name)
    if (!option)
      continue

    result[option.name!] = parseOption(option, content ?? option.default)
  }

  for (const option of options) {
    if (option.default === undefined)
      continue

    if (result[option.name] !== undefined)
      continue

    result[option.name] = parseOption(option, option.default)
  }

  if (result.help && config.help)
    help(config.help, options)

  const missingRequired = options.filter(o => o.required && result[o.name] === undefined)
  if (missingRequired.length)
    throw new Error(`Some required options were not found: ${missingRequired.map(o => o.name).join(', ')}`)

  return result as ParsedValues<T>
}

if (import.meta.main) {
  const result = parseArgs({
    args: process.argv.splice(2),
    help: {
      name: 'cli',
      shortDescription: 'Parse cli arguments',
      footerBlocks: [{ title: 'Credits', content: ['Author: Kayno0o', 'License: MIT'] }],
      keywords: ['command', 'option'],
    },
    options: {
      ts: {
        type: 'boolean',
        required: true,
        description: 'Set language to TypeScript',
        alias: 'typescript',
      },
      file: {
        type: 'path',
        default: './.env',
        short: 'f',
        description: 'Path of file to read',
      },
      day: {
        type: 'date',
        default: (new Date()).toLocaleDateString(),
        short: 'd',
      },
      nb: {
        format: (value: string | undefined) => String(Number(value) + 10),
        required: true,
        default: 123,
        alias: 'number-dir',
      },
    },
  })

  console.log(result)
}
