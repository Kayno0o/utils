import type { LogLevel } from '../index'
import colors from 'ansi-colors'
import { declareLogger } from '../index'

const log = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: colors.bold.yellow,
  rcon: colors.bold.blue,
  sqlite: colors.bold.magenta,
} })

log('error', 'sqlite', 'type', 'messages')

const logWithoutService = declareLogger({})
logWithoutService('success', 'type', 'messages')

const loggerWithoutType = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: colors.bold.yellow,
  rcon: colors.bold.blue,
  sqlite: colors.bold.magenta,
} })

loggerWithoutType('warning', 'rcon', 'not type', 'messages')
loggerWithoutType('info', 'rcon', 'info')
