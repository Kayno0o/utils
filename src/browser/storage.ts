/** @deprecated use `getStorage` */
export const storageGet = getStorage
export function getStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)

    return raw === null ? fallback : JSON.parse(raw) as T
  }
  catch {
    return fallback
  }
}

/** @deprecated use `setStorage` */
export const storageSet = setStorage
export function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** @deprecated use `removeStorage` */
export const storageRemove = removeStorage
export function removeStorage(key: string): void {
  localStorage.removeItem(key)
}

/** JSON-serializing wrapper bound to a single `Storage` (e.g. `localStorage`, `sessionStorage`). */
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

  remove(key: string): void {
    this.storage.removeItem(key)
  }

  has(key: string): boolean {
    return this.storage.getItem(key) !== null
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

  /** Read-modify-write: applies `fn` to the current value (or `fallback`) and stores the result. */
  update<T>(key: string, fn: (prev: T) => T, fallback: T): void {
    this.set(key, fn(this.get(key, fallback)))
  }
}

/** Lazily-resolved singleton so the `Storage` global is only touched on first use (SSR/worker-safe). */
function lazyJsonStorage(getStorage: () => Storage): JsonStorage {
  let instance: JsonStorage | undefined
  const resolve = (): JsonStorage => instance ??= new JsonStorage(getStorage())

  return new Proxy({} as JsonStorage, {
    get(_target, prop) {
      const value = resolve()[prop as keyof JsonStorage]

      return typeof value === 'function' ? value.bind(resolve()) : value
    },
  })
}

export const jsonLocalStorage = lazyJsonStorage(() => localStorage)
export const jsonSessionStorage = lazyJsonStorage(() => sessionStorage)

/** Reads a resolved CSS custom property from the document root (e.g. `--color-accent`). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
