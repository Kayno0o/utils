const arr32 = new Uint32Array(1)

const randomUnit = (isCrypto: boolean) => isCrypto ? crypto.getRandomValues(arr32)[0]! / 2 ** 32 : Math.random()

export function randomInt(min: number, max: number, isCrypto?: boolean): number
export function randomInt(max: number, isCrypto?: boolean): number

export function randomInt(minOrMax: number, max?: number | boolean, isCrypto?: boolean) {
  if (typeof max === 'boolean')
    isCrypto = max

  isCrypto ??= false

  const min = (typeof max !== 'number') ? 0 : minOrMax
  const range = (typeof max !== 'number') ? minOrMax : max - minOrMax

  return Math.floor(randomUnit(isCrypto) * range) + min
}

export function randomFloat(min: number, max: number, isCrypto?: boolean): number
export function randomFloat(max: number, isCrypto?: boolean): number

export function randomFloat(minOrMax: number, max?: number | boolean, isCrypto?: boolean) {
  if (typeof max === 'boolean')
    isCrypto = max

  isCrypto ??= false

  const min = (typeof max !== 'number') ? 0 : minOrMax
  const range = (typeof max !== 'number') ? minOrMax : max - minOrMax

  return randomUnit(isCrypto) * range + min
}

/** Random boolean, `true` with the given `probability` (0-1, default 0.5). */
export function randomBool(probability = 0.5, isCrypto = false): boolean {
  return randomUnit(isCrypto) < probability
}

/** @see https://processing.org/reference/map_.html */
export function map(
  value: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number,
): number {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
}

export function round(nb: number, precision = 2) {
  return Math.round(nb * (10 ** precision)) / (10 ** precision)
}

export function range(minOrMax: number, max?: number): number[] {
  if (max === undefined) {
    max = minOrMax
    minOrMax = 0
  }

  return Array.from({ length: max - minOrMax }, (_, i) => i + minOrMax)
}

export function clamp(value: number, min: number, max: number, modulo = false): number {
  if (modulo) {
    const range = max - min

    return ((value - min) % range + range) % range + min
  }

  return Math.min(Math.max(value, min), max)
}

/** @deprecated use `map(hashStr(str), 0, 1, min, max)` instead */
export const numberFromString = (nb: number, min: number, max: number) => map(nb, 0, 1, min, max)

/** Format a number with locale grouping separators, e.g. `1234567` -> `"1,234,567"`. */
export function formatNumber(value: number, locale?: string | string[], options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/** Percentage of `value` relative to `total` (0-100), rounded to `precision`. Returns `0` when `total` is `0`. */
export function percentage(value: number, total: number, precision = 2): number {
  return total === 0 ? 0 : round((value / total) * 100, precision)
}

/** English ordinal suffix form of an integer, e.g. `1` -> `"1st"`, `22` -> `"22nd"`. */
export function ordinal(n: number): string {
  const abs = Math.abs(n) % 100
  const suffix = abs >= 11 && abs <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][abs % 10] ?? 'th')

  return `${n}${suffix}`
}

/** Greatest common divisor of two integers (always non-negative). */
export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)

  while (b) {
    [a, b] = [b, a % b]
  }

  return a
}

/** Lowest common multiple of two integers (always non-negative). Returns `0` when either is `0`. */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0)
    return 0

  return Math.abs(a / gcd(a, b) * b)
}

/** Whether `n` is a prime number. */
export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2)
    return false

  if (n % 2 === 0)
    return n === 2

  if (n % 3 === 0)
    return n === 3

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0)
      return false
  }

  return true
}

export const degToRad = (degrees: number): number => degrees * Math.PI / 180
export const radToDeg = (radians: number): number => radians * 180 / Math.PI
