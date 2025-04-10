import { colors } from './colors'

export type LogLevel = 'info' | 'success' | 'warning' | 'error'
interface LogType { char: string, color: (str: string) => string, level: number }

const baseLogTypes: Record<LogLevel, LogType> = {
  error: {
    char: 'X',
    color: colors.red,
    level: 0,
  },
  info: {
    char: '?',
    color: colors.cyan,
    level: 3,
  },
  success: {
    char: '+',
    color: colors.green,
    level: 2,
  },
  warning: {
    char: '!',
    color: colors.yellow,
    level: 1,
  },
}

type LoggerOptions<Services extends string | undefined> = {
  logTypes?: Record<LogLevel, LogType>
  /** @default info */
  logLevel?: LogLevel
  onLog?: (log: string) => void | Promise<void>
} & (Services extends string
  ? { serviceColor: Record<Services, (value: string) => string> }
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
  logLevel = 'info',
  serviceColor,
  onLog,
}: LoggerOptions<Services>) {
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

    if (onLog)
      onLog(`[${new Date().toISOString()}] ${level.toUpperCase()} ${prepend} ${actualMessages.join(' ')}\n`)
  }

  return log
}
