import fs from 'node:fs'
import chalk from 'chalk'

export type LogLevel = 'info' | 'success' | 'warning' | 'error'
interface LogType { char: string, color: chalk.Chalk, level: number }

const baseLogTypes: Record<LogLevel, LogType> = {
  error: {
    char: '⛔',
    color: chalk.red,
    level: 0,
  },
  info: {
    char: '❔',
    color: chalk.cyan,
    level: 3,
  },
  success: {
    char: '✅',
    color: chalk.green,
    level: 2,
  },
  warning: {
    char: '⚡',
    color: chalk.yellow,
    level: 1,
  },
}

type LoggerOptions<Services extends string | undefined> = {
  logTypes?: Record<LogLevel, LogType>
  /** @default true */
  clear?: boolean
  logFilePath?: string
  /** @default info */
  logLevel?: LogLevel
} & (Services extends string
  ? { serviceColor: Record<Services, chalk.Chalk> }
  : { serviceColor?: undefined })

type LogFnArgs<
  Services extends string | undefined,
> = Services extends string
  ? [level: LogLevel, service: Services, ...messages: any[]]
  : [level: LogLevel, ...messages: any[]]

export function declareLogger<
  Services extends string | undefined = undefined,
>({
  logTypes = baseLogTypes,
  clear = true,
  logFilePath,
  logLevel = 'info',
  serviceColor,
}: LoggerOptions<Services>) {
  const clearLogs = () => {
    if (!logFilePath)
      return

    fs.writeFileSync(logFilePath, '')
  }

  if (clear)
    clearLogs()

  const log = (...args: LogFnArgs<Services>) => {
    const [level, serviceOrMessages, ...messages] = args
    const service = serviceColor ? (serviceOrMessages as Services) : undefined

    const logType = logTypes[level]

    const actualMessages = serviceColor
      ? messages
      : [serviceOrMessages, ...messages].filter(Boolean) // Ensure no undefined values are included in the messages

    const envLogLevel = Number.isNaN(Number(logLevel))
      ? logType.level
      : Number(logLevel)

    const prepend
      = serviceColor && service
        ? `${logType.char} ${serviceColor[service](service.toLocaleUpperCase())}`
        : logType.char

    if (logType.level <= envLogLevel) {
      console.log(
        logType.color(prepend),
        ...actualMessages,
      )
    }

    if (!logFilePath)
      return

    const logEntry = `[${new Date().toISOString()}] ${level.toUpperCase()} ${prepend} ${actualMessages.join(' ')}\n`
    fs.appendFileSync(logFilePath, logEntry)
  }

  return {
    clearLogs,
    log,
  }
}
