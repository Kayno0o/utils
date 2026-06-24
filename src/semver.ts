const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/

export function validateSemver(version: string): boolean {
  return SEMVER_RE.test(version)
}

export function parseSemver(version: string): { major: number, minor: number, patch: number } {
  const m = SEMVER_RE.exec(version)

  if (!m)
    throw new Error(`Invalid semver: "${version}"`)

  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

export function bumpPatch(version: string): string {
  const { major, minor, patch } = parseSemver(version)

  return `${major}.${minor}.${patch + 1}`
}

export function bumpMinor(version: string): string {
  const { major, minor } = parseSemver(version)

  return `${major}.${minor + 1}.0`
}

export function bumpMajor(version: string): string {
  const { major } = parseSemver(version)

  return `${major + 1}.0.0`
}
