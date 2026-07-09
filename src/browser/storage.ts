export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)

    return raw === null ? fallback : JSON.parse(raw) as T
  }
  catch {
    return fallback
  }
}

export function storageSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function storageRemove(key: string): void {
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

  set<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value))
  }

  remove(key: string): void {
    this.storage.removeItem(key)
  }

  has(key: string): boolean {
    return this.storage.getItem(key) !== null
  }

  /** Reads the value; if absent, computes it via `factory`, stores it, and returns it. */
  getOrSet<T>(key: string, factory: () => T): T {
    if (this.has(key))
      return this.get(key, undefined as T)

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

export const jsonLocalStorage = new JsonStorage(localStorage)
export const jsonSessionStorage = new JsonStorage(sessionStorage)

/** Reads a resolved CSS custom property from the document root (e.g. `--color-accent`). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
