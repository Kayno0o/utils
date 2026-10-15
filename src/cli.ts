import { existsSync } from 'node:fs'
import { notNullish, toArray } from './array'
import { colors } from './tools/colors'

export interface SpawnResult { stdout: string, stderr: string, exitCode: number }

export interface SpawnOptions {
  /** Written to the process and closed; without it the process reads nothing. */
  stdin?: ArrayBuffer | Uint8Array | string
  /** Kills the process past this deadline, which then counts as a failed exit. */
  timeoutMs?: number
}

class SpawnError extends Error {
  constructor(argv: string[], code: number, stderr: string) {
    super(`Command failed (exit ${code}): ${argv.join(' ')}\n${stderr.trim()}`)
    this.name = 'SpawnError'
  }
}

/** The `(cmd, args)` form predates the argv array, so both resolve to one argv and its options. */
function resolveArgs(argvOrCmd: string[] | string, optsOrArgs?: SpawnOptions | string[]): [string[], SpawnOptions] {
  if (typeof argvOrCmd === 'string')
    return [[argvOrCmd, ...(optsOrArgs as string[] | undefined ?? [])], {}]

  return [argvOrCmd, optsOrArgs as SpawnOptions | undefined ?? {}]
}

async function feed(sink: Bun.FileSink | number | undefined, input: SpawnOptions['stdin']): Promise<void> {
  if (input === undefined || typeof sink !== 'object')
    return

  sink.write(input)
  await sink.end()
}

// stdin feeds while stdout and stderr drain: a process filling a pipe nobody reads would block forever.
async function run<T>(argv: string[], opts: SpawnOptions, read: (stdout: ReadableStream<Uint8Array>) => Promise<T>): Promise<{ out: T, err: string, code: number }> {
  const proc = Bun.spawn(argv, { stdout: 'pipe', stderr: 'pipe', stdin: opts.stdin === undefined ? 'ignore' : 'pipe' })

  const timer = opts.timeoutMs === undefined ? undefined : setTimeout(() => proc.kill(), opts.timeoutMs)

  try {
    const [out, err, code] = await Promise.all([read(proc.stdout), new Response(proc.stderr).text(), proc.exited, feed(proc.stdin, opts.stdin)])

    return { out, err, code }
  }
  finally {
    clearTimeout(timer)
  }
}

/** Runs `argv` and resolves with trimmed stdout. Throws on non-zero exit, stderr in the message. */
export async function spawnText(argv: string[], opts?: SpawnOptions): Promise<string>
/** @deprecated pass the command and its args as one array: `spawnText([cmd, ...args])` */
export async function spawnText(cmd: string, args?: string[]): Promise<string>
export async function spawnText(argvOrCmd: string[] | string, optsOrArgs?: SpawnOptions | string[]): Promise<string> {
  const [argv, opts] = resolveArgs(argvOrCmd, optsOrArgs)
  const { out, err, code } = await run(argv, opts, async stdout => new Response(stdout).text())

  if (code !== 0)
    throw new SpawnError(argv, code, err)

  return out.trim()
}

/** Runs `argv` and resolves with raw stdout bytes. Throws on non-zero exit, stderr in the message. */
export async function spawnBytes(argv: string[], opts?: SpawnOptions): Promise<Uint8Array>
/** @deprecated pass the command and its args as one array: `spawnBytes([cmd, ...args])` */
export async function spawnBytes(cmd: string, args?: string[]): Promise<Uint8Array>
export async function spawnBytes(argvOrCmd: string[] | string, optsOrArgs?: SpawnOptions | string[]): Promise<Uint8Array> {
  const [argv, opts] = resolveArgs(argvOrCmd, optsOrArgs)
  const { out, err, code } = await run(argv, opts, async stdout => new Response(stdout).arrayBuffer())

  if (code !== 0)
    throw new SpawnError(argv, code, err)

  return new Uint8Array(out)
}

/** Runs `argv` and resolves with the exit code, never throws. */
export async function spawnExit(argv: string[], opts?: SpawnOptions): Promise<number>
/** @deprecated pass the command and its args as one array: `spawnExit([cmd, ...args])` */
export async function spawnExit(cmd: string, args?: string[]): Promise<number>
export async function spawnExit(argvOrCmd: string[] | string, optsOrArgs?: SpawnOptions | string[]): Promise<number> {
  const [argv, opts] = resolveArgs(argvOrCmd, optsOrArgs)
  const { code } = await run(argv, opts, async stdout => new Response(stdout).arrayBuffer())

  return code
}

type NumberOptionType = 'number' | 'int' | 'float'
type StringOptionType = 'string' | 'date' | 'path'
type OptionType = 'boolean' | StringOptionType | NumberOptionType
type AlphabetChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'

type OptionValueType<T extends OptionType>
  = T extends 'boolean' ? boolean
    : T extends NumberOptionType ? number
      : T extends 'date' ? Date
        : string

interface BaseOptionDefinition<FormatType> {
  alias?: string | string[]
  short?: AlphabetChar
  required?: boolean
  description?: string
  default?: FormatType
  rawDefault?: string
  example?: string | string[]
  validate?: (value: FormatType) => true | string
}

interface TypedOptionDefinition<T extends OptionType, FormatType> extends BaseOptionDefinition<FormatType> {
  type: T
  format?: (value: string) => FormatType
}

interface FormatOnlyOptionDefinition<FormatType> extends BaseOptionDefinition<FormatType> {
  type?: never
  format: (value: string) => FormatType
}

type OptionDefinition
  = | TypedOptionDefinition<'boolean', boolean>
    | TypedOptionDefinition<'string' | 'path' | 'date', string>
    | TypedOptionDefinition<NumberOptionType, number>
    | FormatOnlyOptionDefinition<unknown>

type ParseArgsConfig<T extends Record<string, OptionDefinition>> = T

type ParsedValues<T extends Record<string, OptionDefinition>> = {
  [K in keyof T]: T[K]['required'] extends true
    ? T[K]['format'] extends (value: string) => infer R
      ? R
      : T[K]['type'] extends OptionType
        ? OptionValueType<T[K]['type']>
        : never
    : T[K]['default'] extends NonNullable<unknown>
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

function parseBoolOption(option: TypedOptionDefinition<'boolean', boolean>, value: string | boolean | undefined): boolean {
  if (value === true || value === 'true' || value === '1' || value === undefined)
    return true

  if (value === false || value === 'false' || value === '0')
    return false

  throw new OptionFormatError(option, String(value))
}

function parseFloatOption(option: TypedOptionDefinition<NumberOptionType, number>, value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined

  if (typeof value === 'number')
    return value

  if (typeof value === 'string' && !(/^\d+(?:\.\d+)?$/).test(value))
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

  if (typeof value === 'string' && !(/^\d+$/).test(value))
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

  if (typeof value === 'string' && !(/^\d+(?:\.\d+)?$/).test(value))
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

  if (Number.isNaN(date.getTime()))
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
  if (option.format) {
    return value === undefined ? undefined : option.format(value)
  }

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

  if (name)
    output += block('name', [name, shortDescription && ` - ${shortDescription}`], keywords)

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
    const arg = config.args[i]!

    const match = arg.match(argRegexp)

    if (!match)
      continue

    let [, name, content] = match as [string, string, string?]

    if (content === undefined && i + 1 < config.args.length) {
      const nextArg = config.args[i + 1]!

      if (!argRegexp.test(nextArg))
        content = nextArg
    }

    const option = options.find(o => o.name === name || toArray(o.alias ?? []).includes(name) || o.short === name)

    if (!option)
      continue

    if (content !== undefined) {
      result[option.name!] = parseOption(option, content)

      continue
    }

    if (option.type === 'boolean') {
      result[option.name!] = true

      continue
    }

    if (option.rawDefault !== undefined) {
      result[option.name!] = parseOption(option, option.rawDefault)

      continue
    }

    result[option.name!] = option.default
  }

  for (const option of options) {
    if (result[option.name] !== undefined)
      continue

    if (option.default !== undefined) {
      result[option.name] = option.default

      continue
    }

    if (option.rawDefault !== undefined) {
      result[option.name] = parseOption(option, option.rawDefault)

      continue
    }
  }

  if (result.help && config.help)
    help(config.help, options)

  const missingRequired = options.filter(o => o.required && result[o.name] === undefined)

  if (missingRequired.length)
    throw new Error(`Some required options were not found: ${missingRequired.map(o => o.name).join(', ')}`)

  return result as ParsedValues<T>
}
