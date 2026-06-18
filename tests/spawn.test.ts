import { describe, expect, it } from 'bun:test'
import { spawnBytes, spawnExit, spawnText } from '../src/cli'

describe('spawnText', () => {
  it('returns trimmed stdout', async () => {
    const out = await spawnText('echo', ['hello'])

    expect(out).toBe('hello')
  })

  it('throws on non-zero exit', async () => {
    await expect(spawnText('false')).rejects.toThrow('exit 1')
  })

  it('includes stderr in error message', async () => {
    await expect(spawnText('sh', ['-c', 'echo oops >&2; exit 1'])).rejects.toThrow('oops')
  })
})

describe('spawnBytes', () => {
  it('returns Uint8Array', async () => {
    const bytes = await spawnBytes('echo', ['hi'])

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(bytes).trim()).toBe('hi')
  })

  it('throws on non-zero exit', async () => {
    await expect(spawnBytes('false')).rejects.toThrow('exit 1')
  })
})

describe('spawnExit', () => {
  it('resolves 0 for successful command', async () => {
    expect(await spawnExit('true')).toBe(0)
  })

  it('resolves non-zero without throwing', async () => {
    expect(await spawnExit('false')).toBe(1)
  })
})
