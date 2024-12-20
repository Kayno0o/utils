import type { LogLevel } from '../index'
import chalk from 'chalk'
import { declareLogger } from '../index'

const log = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: chalk.bold.yellow,
  rcon: chalk.bold.blue,
  sqlite: chalk.bold.magenta,
} })

log('error', 'rcon', 'type', 'messages')

const logWithoutService = declareLogger({})
logWithoutService('success', 'type', 'messages')

const loggerWithoutType = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: chalk.bold.yellow,
  rcon: chalk.bold.blue,
  sqlite: chalk.bold.magenta,
} })

loggerWithoutType('warning', 'rcon', 'not type', 'messages')
