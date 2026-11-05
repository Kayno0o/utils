import { colors } from '../tools/colors'

interface LogType { char: string, color?: (str: string) => string, level?: number, log?: (...args: any[]) => void | Promise<void> }

export interface LogEntry<Level extends string = string> {
  date: Date
  level: Level
  char: string
  messages: unknown[]
}

interface LoggerOptions<Level extends string> {
  logTypes: Record<Level, LogType>
  /** @default info */
  logLevel?: number
  onLog?: (log: string) => void | Promise<void>
  /** Builds the line handed to `onLog`. Defaults to `[iso] LEVEL char message`. */
  format?: (entry: LogEntry<Level>) => string
  /** When true, `onLog` only gets the entries that pass `logLevel`. Defaults to false, every entry. */
  filterOnLog?: boolean
}

/** Strings as is, errors by their stack, anything else as JSON where it can be. */
export function stringifyLogMessage(message: unknown): string {
  if (typeof message === 'string')
    return message

  if (message instanceof Error)
    return message.stack ?? `${message.name}: ${message.message}`

  if (typeof message !== 'object' || message === null)
    return String(message)

  try {
    return JSON.stringify(message)
  }
  catch {
    return String(message)
  }
}

function formatLogEntry({ date, level, char, messages }: LogEntry): string {
  return `[${date.toISOString()}] ${level.toUpperCase()} ${char} ${messages.map(stringifyLogMessage).join(' ')}\n`
}

/**
 * will only log if logTypes.[type].level <= option.logLevel
 */
export function declareCustomLogger<
  Level extends string,
>({ logTypes, logLevel, onLog, format = formatLogEntry, filterOnLog = false }: LoggerOptions<Level>) {
  const log = (level: Level, ...messages: any[]) => {
    const logType = logTypes[level]

    const envLogLevel = Number.isNaN(Number(logLevel))
      ? (logType.level ?? 0)
      : Number(logLevel)

    const shown = (logType.level ?? 0) <= envLogLevel

    if (shown)
      (logType.log ?? console.log)(logType.color ? logType.color(logType.char) : logType.char, ...messages)

    if (onLog && (shown || !filterOnLog))
      onLog(format({ date: new Date(), level, char: logType.char, messages }))
  }

  return log
}

const DEFAULT_LOG_TYPES = {
  error: {
    char: 'X',
    color: colors.red,
    level: 0,
    log: (...args: unknown[]) => console.error(...args),
  },
  warn: {
    char: '!',
    color: colors.yellow,
    level: 1,
    log: (...args: unknown[]) => console.warn(...args),
  },
  success: {
    char: '+',
    color: colors.green,
    level: 2,
  },
  info: {
    char: '?',
    color: colors.cyan,
    level: 3,
  },
} satisfies Record<string, LogType>

export type DefaultLogLevel = keyof typeof DEFAULT_LOG_TYPES

/**
 * `error: 0, warn: 1, success: 2, info: 3`
 * will only log if level <= option.logLevel
 */
export function declareLogger({ logTypes, ...options }: Omit<LoggerOptions<DefaultLogLevel>, 'logTypes'> & { logTypes?: Partial<Record<DefaultLogLevel, Partial<LogType>>> } = {}) {
  const merged = {} as Record<DefaultLogLevel, LogType>

  for (const level of Object.keys(DEFAULT_LOG_TYPES) as DefaultLogLevel[])
    merged[level] = { ...DEFAULT_LOG_TYPES[level], ...logTypes?.[level] }

  return declareCustomLogger({ ...options, logTypes: merged })
}
