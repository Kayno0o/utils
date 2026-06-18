import { join, normalize, relative } from 'node:path'

/** Returns `true` when `filePath` resolves inside `allowedDir` (prevents path traversal). */
export function isPathSafe(filePath: string, allowedDir: string): boolean {
  const rel = relative(normalize(allowedDir), normalize(join(allowedDir, filePath)))

  return !rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\')
}

/** Returns the resolved absolute path if safe, or `null` for traversal attempts. */
export function getSafeFilePath(filePath: string, allowedDir: string): string | null {
  return isPathSafe(filePath, allowedDir) ? join(allowedDir, filePath) : null
}
