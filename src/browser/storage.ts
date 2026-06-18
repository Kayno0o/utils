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

/** Reads a resolved CSS custom property from the document root (e.g. `--color-accent`). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
