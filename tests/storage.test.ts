import { afterAll, afterEach, beforeAll, describe, expect, test as it } from 'bun:test'
import { getStorage, jsonLocalStorage, JsonStorage, removeStorage, setStorage } from '../src/browser/storage'

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

describe('storage that fails', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const broken = new Proxy({} as Storage, { get: () => () => {
    throw new DOMException('denied', 'SecurityError')
  } })

  afterEach(() => {
    if (originalLocalStorage)
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage)
    else
      delete (globalThis as { localStorage?: Storage }).localStorage
  })

  it('setStorage and removeStorage report failure instead of throwing', () => {
    expect(setStorage('k', 1, broken)).toBe(false)
    expect(removeStorage('k', broken)).toBe(false)
    expect(getStorage('k', 'fallback', broken)).toBe('fallback')
  })

  it('setStorage and removeStorage report success', () => {
    const session = new MemoryStorage()

    expect(setStorage('k', 1, session)).toBe(true)
    expect(removeStorage('k', session)).toBe(true)
  })

  it('no JsonStorage method throws', () => {
    const json = new JsonStorage(broken)

    expect(json.get('k', 0)).toBe(0)
    expect(json.set('k', 1)).toBe(false)
    expect(json.remove('k')).toBe(false)
    expect(json.has('k')).toBe(false)
    expect(json.update('k', (n: number) => n + 1, 0)).toBe(false)
    expect(json.consume('k')).toBeNull()
    expect(json.getOrSet('k', () => 5)).toBe(5)
  })

  it('the default storage is resolved at call time and missing under SSR', () => {
    delete (globalThis as { localStorage?: Storage }).localStorage

    expect(getStorage('k', 'fallback')).toBe('fallback')
    expect(setStorage('k', 1)).toBe(false)
    expect(removeStorage('k')).toBe(false)
    expect(jsonLocalStorage.get('k', 'fallback')).toBe('fallback')
    expect(jsonLocalStorage.set('k', 1)).toBe(false)
    expect(jsonLocalStorage.has('k')).toBe(false)
  })

  it('the default storage follows a localStorage installed after import', () => {
    const late = new MemoryStorage()

    Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: late })

    expect(setStorage('k', 1)).toBe(true)
    expect(late.getItem('k')).toBe('1')
  })
})
