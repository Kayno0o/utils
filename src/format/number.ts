/**
 * `iec` is 1024 with KiB/MiB labels, `si` is 1000 with kB/MB labels, and `binary` is the mix
 * interfaces usually mean by "GB": 1024 steps under the shorter labels.
 */
export type FileSizeUnits = 'iec' | 'si' | 'binary'

/**
 * Bytes as human-readable text. The boolean form is the original one, `si` choosing metric over
 * binary; the options form additionally reaches `binary`.
 *
 * @author https://stackoverflow.com/users/65387/mpen
 * @see https://stackoverflow.com/a/14919494
 */
export function formatFileSize(bytes: number, si?: boolean, dp?: number): string
export function formatFileSize(bytes: number, options: { units?: FileSizeUnits, dp?: number }): string

export function formatFileSize(bytes: number, siOrOptions: boolean | { units?: FileSizeUnits, dp?: number } = false, dpArg = 1) {
  const options = typeof siOrOptions === 'object' ? siOrOptions : { units: siOrOptions ? 'si' as const : 'iec' as const, dp: dpArg }
  const { units: unitSystem = 'iec', dp = 1 } = options
  const thresh = unitSystem === 'si' ? 1000 : 1024

  if (Math.abs(bytes) < thresh)
    return `${bytes} B`

  const units = unitSystem === 'iec'
    ? ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let u = -1
  const r = 10 ** dp

  do {
    bytes /= thresh
    ++u
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

  return `${bytes.toFixed(dp)} ${units[u]}`
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

export function formatEuro(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    currency: 'EUR',
    style: 'currency',
  }).format(amount)
}

export function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, '')
  const limited = digits.slice(0, 14)

  return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`.trim()
}
