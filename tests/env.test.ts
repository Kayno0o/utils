import { describe, expect, test as it } from 'bun:test'
import { isBrowser, isBun, isNode, isWorker } from '../src'

describe('environment detection', () => {
  it('isBun returns true in Bun runtime', () => {
    expect(isBun()).toBe(true)
  })

  it('isBrowser returns false in Bun/Node', () => {
    expect(isBrowser()).toBe(false)
  })

  it('isNode returns true in Bun (Bun exposes process.versions.node)', () => {
    expect(isNode()).toBe(true)
  })

  it('isWorker returns false outside a worker context', () => {
    expect(isWorker()).toBe(false)
  })
})
