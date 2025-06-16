import { colors } from '~/tools/colors'

interface LogType { char: string, color?: (str: string) => string, level?: number, log?: (...args: any[]) => void | Promise<void> }

export const baseLogTypes = {
  error: {
    char: 'X',
    color: colors.red,
    level: 0,
  },
  warning: {
    char: '!',
    color: colors.yellow,
    level: 1,
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

interface LoggerOptions<Level extends string> {
  logTypes: Record<Level, LogType>
  /** @default info */
  logLevel?: number
  onLog?: (log: string) => void | Promise<void>
}

/**
 * will only log if logTypes.[type].level <= option.logLevel
 */
export function declareCustomLogger<
  Level extends string,
>({ logTypes, logLevel, onLog }: LoggerOptions<Level>) {
  const log = (level: Level, ...messages: any[]) => {
    const logType = logTypes[level]

    const envLogLevel = Number.isNaN(Number(logLevel))
      ? (logType.level ?? 0)
      : Number(logLevel)

    if ((logType.level ?? 0) <= envLogLevel) {
      (logType.log ?? console.log)(
        logType.color ? logType.color(logType.char) : logType.char,
        ...messages,
      )
    }

    if (onLog)
      onLog(`[${new Date().toISOString()}] ${level.toUpperCase()} ${logType.char} ${messages.join(' ')}\n`)
  }

  return log
}

/**
 * `error: 0, warning: 1, success: 2, info: 3`
 * will only log if level <= option.logLevel
 */
export function declareLogger(options?: { logLevel?: number, onLog?: (log: string) => void | Promise<void> }) {
  return declareCustomLogger({
    logTypes: baseLogTypes,
    ...options,
  })
}
