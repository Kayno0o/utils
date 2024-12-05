import type { LogLevel } from '../index'
import path from 'node:path'
import chalk from 'chalk'
import { declareLogger } from '../index'

const { log } = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logFilePath: path.resolve('latest.log'), logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: chalk.bold.yellow,
  rcon: chalk.bold.blue,
  sqlite: chalk.bold.magenta,
} })

log('error', 'rcon', 'type', 'messages')

const { log: logWithoutService } = declareLogger({})
logWithoutService('success', 'type', 'messages')

const { log: loggerWithoutType } = declareLogger<'discord' | 'sqlite' | 'rcon'>({ logFilePath: path.resolve('latest.log'), logLevel: import.meta.env.LOG_LEVEL as LogLevel | undefined, serviceColor: {
  discord: chalk.bold.yellow,
  rcon: chalk.bold.blue,
  sqlite: chalk.bold.magenta,
} })

loggerWithoutType('warning', 'rcon', 'not type', 'messages')
