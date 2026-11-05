import { afterEach, describe, expect, test as it, spyOn } from 'bun:test'
import { declareCustomLogger, declareLogger, stringifyLogMessage } from '../src/builders'

afterEach(() => {
  for (const method of ['log', 'warn', 'error'] as const)
    (console[method] as unknown as { mockRestore?: () => void }).mockRestore?.()
})

describe('declareLogger', () => {
  it('sends errors to console.error and warnings to console.warn', () => {
    const error = spyOn(console, 'error').mockImplementation(() => undefined)
    const warn = spyOn(console, 'warn').mockImplementation(() => undefined)
    const log = spyOn(console, 'log').mockImplementation(() => undefined)
    const logger = declareLogger()

    logger('error', 'boom')
    logger('warn', 'careful')
    logger('info', 'fyi')

    expect(error).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledTimes(1)
  })

  it('merges partial logTypes over the defaults', () => {
    const seen: unknown[][] = []
    const logger = declareLogger({ logTypes: { info: { char: 'i', log: (...args) => void seen.push(args) } } })

    logger('info', 'hello')

    expect(seen).toEqual([[expect.stringContaining('i'), 'hello']])
  })

  it('writes the default onLog line with objects as JSON', () => {
    spyOn(console, 'log').mockImplementation(() => undefined)
    const lines: string[] = []
    const logger = declareLogger({ onLog: line => void lines.push(line) })

    logger('info', 'user', { id: 1 })

    expect(lines[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d:.]+Z\] INFO \? user \{"id":1\}\n$/)
  })
})

describe('declareCustomLogger', () => {
  it('formats onLog lines with format', () => {
    const lines: string[] = []
    const logger = declareCustomLogger({
      logTypes: { info: { char: '?', log: () => undefined } },
      onLog: line => void lines.push(line),
      format: ({ level, messages }) => `${level}: ${messages.join(',')}`,
    })

    logger('info', 'a', 'b')

    expect(lines).toEqual(['info: a,b'])
  })

  it('hands filtered-out entries to onLog unless filterOnLog is set', () => {
    const lines: string[] = []
    const logTypes = { debug: { char: 'd', level: 5, log: () => undefined } }

    declareCustomLogger({ logTypes, logLevel: 1, onLog: line => void lines.push(line) })('debug', 'kept')
    declareCustomLogger({ logTypes, logLevel: 1, filterOnLog: true, onLog: line => void lines.push(line) })('debug', 'dropped')

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('kept')
  })
})

describe('stringifyLogMessage', () => {
  it('keeps strings, prints errors by stack and survives circular objects', () => {
    const circular: Record<string, unknown> = {}

    circular.self = circular

    expect(stringifyLogMessage('x')).toBe('x')
    expect(stringifyLogMessage(new Error('boom'))).toContain('boom')
    expect(stringifyLogMessage(circular)).toBe('[object Object]')
    expect(stringifyLogMessage(undefined)).toBe('undefined')
  })
})
