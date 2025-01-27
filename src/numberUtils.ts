const arr32 = new Uint32Array(1)

export function randomInt(min: number, max: number, isCrypto?: boolean): number
export function randomInt(max: number, isCrypto?: boolean): number

export function randomInt(minOrMax: number, max?: number | boolean, isCrypto?: boolean) {
  if (typeof max === 'boolean')
    isCrypto = max
  isCrypto ??= false

  const getRandomValue = isCrypto
    ? () => crypto.getRandomValues(arr32)[0]! / 2 ** 32
    : Math.random

  const min = (typeof max !== 'number') ? 0 : minOrMax
  const range = (typeof max !== 'number') ? minOrMax : max - minOrMax

  return Math.floor(getRandomValue() * range) + min
}

/** @see https://processing.org/reference/map_.html */
export function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
}

/**
 * Format bytes as human-readable text.
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @author https://stackoverflow.com/users/65387/mpen
 * @see https://stackoverflow.com/a/14919494
 */
export function formatFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024

  if (Math.abs(bytes) < thresh)
    return `${bytes} B`

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let u = -1
  const r = 10 ** dp

  do {
    bytes /= thresh
    ++u
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

  return `${bytes.toFixed(dp)} ${units[u]}`
}

export function round(nb: number, precision = 2) {
  return Math.round(nb * (10 ** precision)) / (10 ** precision)
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    currency: 'EUR',
    style: 'currency',
  }).format(amount)
}

export function formatUnit(num: number): string {
  if (num < 1000)
    return num.toString()
  const units = ['k', 'M', 'B', 'T']
  let unitIndex = -1
  let scaledNum = num
  while (scaledNum >= 1000 && unitIndex < units.length - 1) {
    scaledNum /= 1000
    unitIndex++
  }
  return `${scaledNum.toFixed(1)}${units[unitIndex]}`
}

export function range(minOrMax: number, max?: number): number[] {
  if (max === undefined) {
    max = minOrMax
    minOrMax = 0
  }

  return Array.from({ length: max - minOrMax }, (_, i) => i + minOrMax)
}
