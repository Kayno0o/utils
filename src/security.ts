import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, normalize, relative, sep } from 'node:path'

/** Resolves symlinks for the deepest existing ancestor, keeping the non-existent suffix intact. */
function resolveReal(path: string): string {
  let current = normalize(path)
  const suffix: string[] = []

  while (!existsSync(current)) {
    const parent = dirname(current)

    if (parent === current)
      return join(current, ...suffix)

    suffix.unshift(basename(current))
    current = parent
  }

  return suffix.length ? join(realpathSync(current), ...suffix) : realpathSync(current)
}

/** Returns `true` when `filePath` resolves inside `allowedDir` (prevents path traversal, incl. via symlinks). */
export function isPathSafe(filePath: string, allowedDir: string): boolean {
  const base = resolveReal(allowedDir)
  const target = resolveReal(join(base, filePath))
  const rel = relative(base, target)

  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

/** Returns the resolved absolute path if safe, or `null` for traversal attempts. */
export function getSafeFilePath(filePath: string, allowedDir: string): string | null {
  return isPathSafe(filePath, allowedDir) ? join(allowedDir, filePath) : null
}
