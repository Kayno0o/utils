import { afterAll, beforeAll, describe, expect, test as it } from 'bun:test'
import { getStorage, JsonStorage, removeStorage, setStorage } from '../src/browser/storage'

class MemoryStorage implements Storage {
  #items = new Map<string, string>()

  get length() {
    return this.#items.size
  }

  clear() {
    this.#items.clear()
  }

  getItem(key: string) {
    return this.#items.get(key) ?? null
  }

  key(index: number) {
    return [...this.#items.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.#items.delete(key)
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value)
  }
}

describe('storage helpers', () => {
  const local = new MemoryStorage()
  const originalLocalStorage = globalThis.localStorage

  beforeAll(() => {
    globalThis.localStorage = local
  })

  afterAll(() => {
    globalThis.localStorage = originalLocalStorage
  })

  it('use localStorage by default', () => {
    setStorage('theme', { dark: true })

    expect(local.getItem('theme')).toBe('{"dark":true}')
    expect(getStorage<{ dark: boolean } | null>('theme', null)).toEqual({ dark: true })

    removeStorage('theme')
    expect(getStorage('theme', 'none')).toBe('none')
  })

  it('target the given storage', () => {
    const session = new MemoryStorage()

    setStorage('step', 2, session)

    expect(local.getItem('step')).toBeNull()
    expect(getStorage('step', 0, session)).toBe(2)
    expect(new JsonStorage(session).get('step', 0)).toBe(2)

    removeStorage('step', session)
    expect(getStorage('step', 0, session)).toBe(0)
  })

  it('getStorage returns the fallback for unparsable values', () => {
    const session = new MemoryStorage()

    session.setItem('broken', '{')
    expect(getStorage('broken', 'fallback', session)).toBe('fallback')
  })
})
