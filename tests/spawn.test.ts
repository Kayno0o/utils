import { describe, expect, it } from 'bun:test'
import { spawnBytes, spawnExit, spawnText } from '../src/cli'

describe('spawnText', () => {
  it('returns trimmed stdout', async () => {
    expect(await spawnText(['echo', 'hello'])).toBe('hello')
  })

  it('throws on non-zero exit', async () => {
    await expect(spawnText(['false'])).rejects.toThrow('exit 1')
  })

  it('includes stderr in error message', async () => {
    await expect(spawnText(['sh', '-c', 'echo oops >&2; exit 1'])).rejects.toThrow('oops')
  })

  it('writes stdin to the process and closes it', async () => {
    expect(await spawnText(['cat'], { stdin: 'piped in' })).toBe('piped in')
    expect(await spawnText(['cat'], { stdin: new TextEncoder().encode('bytes in') })).toBe('bytes in')
  })

  it('gives the process nothing to read without stdin', async () => {
    expect(await spawnText(['sh', '-c', 'cat; echo done'])).toBe('done')
  })

  it('kills the process past the deadline and fails', async () => {
    const started = Date.now()

    await expect(spawnText(['sleep', '5'], { timeoutMs: 100 })).rejects.toThrow('exit 143')
    expect(Date.now() - started).toBeLessThan(2000)
  })

  it('finishes when stderr outgrows the pipe buffer', async () => {
    expect(await spawnText(['sh', '-c', 'head -c 200000 /dev/zero >&2; echo ok'], { timeoutMs: 5000 })).toBe('ok')
  })

  it('still takes the deprecated command and args form', async () => {
    expect(await spawnText('echo', ['legacy'])).toBe('legacy')
    expect(await spawnText('true')).toBe('')
  })
})

describe('spawnBytes', () => {
  it('returns Uint8Array', async () => {
    const bytes = await spawnBytes(['echo', 'hi'])

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(bytes).trim()).toBe('hi')
  })

  it('round-trips binary stdin', async () => {
    const input = new Uint8Array([0, 255, 10, 128])

    expect(await spawnBytes(['cat'], { stdin: input })).toEqual(input)
  })

  it('throws on non-zero exit', async () => {
    await expect(spawnBytes(['false'])).rejects.toThrow('exit 1')
  })
})

describe('spawnExit', () => {
  it('resolves 0 for successful command', async () => {
    expect(await spawnExit(['true'])).toBe(0)
  })

  it('resolves non-zero without throwing', async () => {
    expect(await spawnExit(['false'])).toBe(1)
    expect(await spawnExit(['sleep', '5'], { timeoutMs: 100 })).toBe(143)
  })

  it('still takes the deprecated command and args form', async () => {
    expect(await spawnExit('sh', ['-c', 'exit 3'])).toBe(3)
  })
})
