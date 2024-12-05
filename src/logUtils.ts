import fs from 'node:fs'
import chalk from 'chalk'

export type LogLevel = 'info' | 'success' | 'warning' | 'error'

const logLevels: Record<LogLevel, number> = {
  error: 0,
  info: 3,
  success: 2,
  warning: 1,
}

const baseActionColors: Record<LogLevel, chalk.Chalk> = {
  error: chalk.red,
  info: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
}

type LoggerOptions<
  Services extends string | undefined,
  IncludeType extends boolean = true,
> = {
  /** @default { error: chalk.red, warning: chalk.yellow, success: chalk.green, info: chalk.cyan } */
  actionColors?: Record<LogLevel, chalk.Chalk>
  /** @default true */
  clear?: boolean
  includeType?: IncludeType
  logFilePath?: string
  /** @default info */
  logLevel?: LogLevel
} & (Services extends string
  ? { serviceColor: Record<Services, chalk.Chalk> }
  : { serviceColor?: undefined })

type LogFnArgs<
  Services extends string | undefined,
  IncludeType extends boolean = true,
> = Services extends string
  ? IncludeType extends true
    ? [level: LogLevel, service: Services, type: string, ...messages: any[]]
    : [level: LogLevel, service: Services, ...messages: any[]]
  : IncludeType extends true
    ? [level: LogLevel, type: string, ...messages: any[]]
    : [level: LogLevel, ...messages: any[]]

export function declareLogger<
  Services extends string | undefined = undefined,
  IncludeType extends boolean = true,
>({
  actionColors = baseActionColors,
  clear = true,
  includeType,
  logFilePath,
  logLevel = 'info',
  serviceColor,
}: LoggerOptions<Services, IncludeType>) {
  const clearLogs = () => {
    if (!logFilePath)
      return

    fs.writeFileSync(logFilePath, '')
  }

  if (clear)
    clearLogs()

  const log = (...args: LogFnArgs<Services, IncludeType>) => {
    const [level, serviceOrType, typeOrMessages, ...messages] = args
    const service = serviceColor ? (serviceOrType as Services) : undefined

    // default to true if undefined
    includeType ??= true as IncludeType

    const type = includeType
      ? (serviceColor ? typeOrMessages : serviceOrType)
      : undefined

    const actualMessages = (serviceColor && includeType)
      ? messages
      : [typeOrMessages, ...messages].filter(Boolean) // Ensure no undefined values are included in the messages

    const envLogLevel = Number.isNaN(Number(logLevel))
      ? logLevels[logLevel as keyof typeof logLevels]
      : Number(logLevel)

    const actionLevel = logLevels[level]

    const prepend
      = serviceColor && service
        ? (includeType && type
            ? `[${serviceColor[service](service.toLocaleUpperCase())}:${type}]`
            : `[${serviceColor[service](service.toLocaleUpperCase())}]`)
        : (includeType && type
            ? `[${type}]`
            : '')

    if (actionLevel <= envLogLevel) {
      console.log(
        actionColors[level](prepend),
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
