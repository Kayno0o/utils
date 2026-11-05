/** Reads `key` as JSON from `storage` (`localStorage` by default), or `fallback` when it is missing, unreadable or storage is unavailable; never throws. */
export function getStorage<T>(key: string, fallback: T, storage?: Storage): T {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(key)

    return raw === null ? fallback : JSON.parse(raw) as T
  }
  catch {
    return fallback
  }
}

/** Stores `value` as JSON under `key` (`localStorage` by default); returns `false` when the write fails (quota, private mode, SSR, disabled storage), never throws. */
export function setStorage<T>(key: string, value: T, storage?: Storage): boolean {
  try {
    (storage ?? globalThis.localStorage).setItem(key, JSON.stringify(value))

    return true
  }
  catch {
    return false
  }
}

/** Removes `key` (from `localStorage` by default); returns `false` when storage is unavailable, never throws. */
export function removeStorage(key: string, storage?: Storage): boolean {
  try {
    (storage ?? globalThis.localStorage).removeItem(key)

    return true
  }
  catch {
    return false
  }
}

/** JSON-serializing wrapper bound to a single `Storage` (e.g. `localStorage`, `sessionStorage`); no method throws. */
export class JsonStorage {
  constructor(private readonly storage: Storage) {}

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage.getItem(key)

      return raw === null ? fallback : JSON.parse(raw) as T
    }
    catch {
      return fallback
    }
  }

  /** Stores the value; returns `false` if the write fails (e.g. quota exceeded, private mode). */
  set<T>(key: string, value: T): boolean {
    try {
      this.storage.setItem(key, JSON.stringify(value))

      return true
    }
    catch {
      return false
    }
  }

  /** Removes the value; returns `false` if storage is unavailable. */
  remove(key: string): boolean {
    try {
      this.storage.removeItem(key)

      return true
    }
    catch {
      return false
    }
  }

  /** Whether `key` holds a value; `false` if storage is unavailable. */
  has(key: string): boolean {
    try {
      return this.storage.getItem(key) !== null
    }
    catch {
      return false
    }
  }

  /** Reads the value; if absent or unparseable, computes it via `factory`, stores it, and returns it. */
  getOrSet<T>(key: string, factory: () => T): T {
    try {
      const raw = this.storage.getItem(key)

      if (raw !== null)
        return JSON.parse(raw) as T
    }
    catch { /* fall through to factory */ }

    const value = factory()

    this.set(key, value)

    return value
  }

  /** Reads then removes the value (one-shot handoff). */
  consume<T>(key: string): T | null {
    const value = this.get<T | null>(key, null)

    this.remove(key)

    return value
  }

  /** Read-modify-write: applies `fn` to the current value (or `fallback`) and stores the result; returns `false` if the write fails. */
  update<T>(key: string, fn: (prev: T) => T, fallback: T): boolean {
    return this.set(key, fn(this.get(key, fallback)))
  }
}

/** Resolves the `Storage` global on use, keeping the instance only once it exists, so one installed after import (SSR, polyfill) is picked up. */
function lazyJsonStorage(resolveStorage: () => Storage | undefined): JsonStorage {
  let instance: JsonStorage | undefined

  const resolve = (): JsonStorage => {
    if (instance)
      return instance

    const storage = resolveStorage()

    if (!storage)
      return new JsonStorage(storage as unknown as Storage) // every method catches the missing storage

    return instance = new JsonStorage(storage)
  }

  return new Proxy({} as JsonStorage, {
    get(_target, prop) {
      const json = resolve()
      const value = json[prop as keyof JsonStorage]

      return typeof value === 'function' ? value.bind(json) : value
    },
  })
}

export const jsonLocalStorage = lazyJsonStorage(() => globalThis.localStorage)
export const jsonSessionStorage = lazyJsonStorage(() => globalThis.sessionStorage)
