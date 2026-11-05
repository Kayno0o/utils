import { afterEach, describe, expect, it } from 'bun:test'
import { colors, createColors } from '../src/tools/colors'

const COLOR_ENV = ['FORCE_COLOR', 'NO_COLOR', 'NODE_DISABLE_COLORS', 'TERM'] as const
const saved = Object.fromEntries(COLOR_ENV.map(key => [key, process.env[key]]))

function setEnv(env: Partial<Record<typeof COLOR_ENV[number], string>>) {
  for (const key of COLOR_ENV)
    delete process.env[key]

  Object.assign(process.env, env)
}

const tty = { isTTY: true }
const pipe = { isTTY: false }

afterEach(() => {
  for (const key of COLOR_ENV) {
    if (saved[key] === undefined)
      delete process.env[key]
    else
      process.env[key] = saved[key]
  }
})

describe('colors', () => {
  it('writes escapes to a TTY', () => {
    setEnv({})

    expect(createColors({ stream: tty }).bold.green('x')).toBe('\u001B[1m\u001B[32mx\u001B[39m\u001B[22m')
    expect(createColors({ stream: tty }).hex('#ff0000', 'bg')('x')).toBe('\u001B[48;2;255;0;0mx\u001B[49m')
  })

  it('writes plain text to a stream that is not a TTY', () => {
    setEnv({})

    expect(createColors({ stream: pipe }).bold.green('x')).toBe('x')
  })

  it('checks the stream it was given, not stdout', () => {
    setEnv({})

    expect(createColors({ stream: tty }).red('x')).not.toBe('x')
    expect(createColors({ stream: pipe }).red('x')).toBe('x')
  })

  it('turns colours off with NO_COLOR, NODE_DISABLE_COLORS or TERM=dumb', () => {
    for (const env of [{ NO_COLOR: '' }, { NO_COLOR: '1' }, { NODE_DISABLE_COLORS: '1' }, { TERM: 'dumb' }]) {
      setEnv(env)

      expect(createColors({ stream: tty }).red('x')).toBe('x')
    }
  })

  it('turns colours on with FORCE_COLOR, over NO_COLOR and a pipe', () => {
    for (const value of ['', '1', '2', '3', 'true']) {
      setEnv({ FORCE_COLOR: value, NO_COLOR: '1' })

      expect(createColors({ stream: pipe }).red('x')).toBe('\u001B[31mx\u001B[39m')
    }
  })

  it('turns colours off with FORCE_COLOR=0', () => {
    setEnv({ FORCE_COLOR: '0' })

    expect(createColors({ stream: tty }).red('x')).toBe('x')
  })

  it('reads the environment at call time', () => {
    const red = createColors({ stream: pipe }).red

    setEnv({})
    expect(red('x')).toBe('x')

    setEnv({ FORCE_COLOR: '1' })
    expect(red('x')).toBe('\u001B[31mx\u001B[39m')
  })

  it('reads the environment it was given instead of process.env', () => {
    setEnv({ NO_COLOR: '1' })
    expect(createColors({ stream: tty, env: {} }).red('x')).toBe('\u001B[31mx\u001B[39m')

    setEnv({})
    expect(createColors({ stream: tty, env: { NO_COLOR: '1' } }).red('x')).toBe('x')
    expect(createColors({ stream: pipe, env: { FORCE_COLOR: '1' } }).red('x')).toBe('\u001B[31mx\u001B[39m')
  })

  it('throws on an unknown style', () => {
    expect(() => (colors as any).nope).toThrow('Unknown style: nope')
  })
})

describe('colors through a pipe', () => {
  const script = `import { colors } from '${import.meta.dir}/../src/tools/colors'; console.log(colors.red('x'))`

  async function run(env: Record<string, string>) {
    const proc = Bun.spawn([process.execPath, '-e', script], { env: { PATH: process.env.PATH ?? '', ...env }, stdout: 'pipe' })

    return (await new Response(proc.stdout).text()).trim()
  }

  it('prints plain text', async () => {
    expect(await run({})).toBe('x')
  })

  it('prints escapes with FORCE_COLOR=1', async () => {
    expect(await run({ FORCE_COLOR: '1' })).toBe('\u001B[31mx\u001B[39m')
  })
})

describe('cached chains', () => {
  const tty = { isTTY: true }

  it('hands back the same chain for the same style, so a call allocates nothing', () => {
    const colors = createColors({ stream: tty, env: {} })

    expect(colors.bold).toBe(colors.bold)
    expect(colors.bold.red).toBe(colors.bold.red)
    expect(colors.hex('#ff8800')).toBe(colors.hex('#ff8800'))
    expect(colors.hex('#ff8800')).not.toBe(colors.hex('#ff8801'))
  })

  it('keeps working after many different colours', () => {
    const colors = createColors({ stream: tty, env: {} })

    for (let value = 0; value < 200; value++)
      expect(colors.rgb(value, 0, 0)('x')).toBe(`\u001B[38;2;${value};0;0mx\u001B[39m`)
  })

  it('reads hex of every length the converter does', () => {
    const colors = createColors({ stream: tty, env: {} })

    expect(colors.hex('#f80')('x')).toBe('\u001B[38;2;255;136;0mx\u001B[39m')
    expect(colors.hex('ff8800aa')('x')).toBe('\u001B[38;2;255;136;0mx\u001B[39m')
    expect(colors.hex('nope')('x')).toBe('\u001B[38;2;0;0;0mx\u001B[39m')
    expect(() => colors.hex('#ff88')('x')).not.toThrow()
    expect(() => colors.hex('#ff880')).toThrow('Invalid hex color length')
  })
})
