import type { LocaleOrOptions } from '../intlCache'
import { getNumberFormat, resolveLocale } from '../intlCache'

/** `iec` is 1024 with KiB/MiB labels, `si` is 1000 with kB/MB labels, and `binary` is the mix interfaces usually mean by "GB": 1024 steps under the shorter labels. */
export type FileSizeUnits = 'iec' | 'si' | 'binary'

export interface FormatFileSizeOptions {
  /** The unit system, `'iec'` by default. */
  units?: FileSizeUnits
  /** Digits after the decimal point. Defaults to `1`. */
  dp?: number
  /** Writes the number with this locale's separators, e.g. `1,5 MB`. Defaults to a plain `.`. */
  locale?: string | string[] | undefined
}

/**
 * Bytes as human-readable text.
 *
 * @author https://stackoverflow.com/users/65387/mpen
 * @see https://stackoverflow.com/a/14919494
 */
export function formatFileSize(bytes: number, { units: unitSystem = 'iec', dp = 1, locale }: FormatFileSizeOptions = {}): string {
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

  return `${locale ? getNumberFormat(locale, { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(bytes) : bytes.toFixed(dp)} ${units[u]}`
}

export interface FormatUnitOptions {
  /** Writes the number with this locale's separators, e.g. `1,5k`. Defaults to a plain `.`. */
  locale?: string | string[] | undefined
}

/** A count shortened to one decimal and a k, M, B or T suffix, rounding up to the next unit when it would print 1000. */
export function formatUnit(num: number, { locale }: FormatUnitOptions = {}): string {
  if (num < 0)
    return `-${formatUnit(-num, { locale })}`

  if (num < 1000)
    return locale ? getNumberFormat(locale, { maximumFractionDigits: 20 }).format(num) : num.toString()

  const units = ['k', 'M', 'B', 'T']
  let unitIndex = -1
  let scaledNum = num

  while (Math.round(scaledNum * 10) / 10 >= 1000 && unitIndex < units.length - 1) {
    scaledNum /= 1000
    unitIndex++
  }

  return `${locale ? getNumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(scaledNum) : scaledNum.toFixed(1)}${units[unitIndex]}`
}

/** Euros in French notation by default; takes a locale or `{ locale, ...Intl.NumberFormatOptions }`, so `currency` can be overridden too. */
export function formatEuro(amount: number, localeOrOptions?: LocaleOrOptions<Intl.NumberFormatOptions>): string {
  const [locale, options] = resolveLocale(localeOrOptions, 'fr-FR')

  return getNumberFormat(locale, {
    currency: 'EUR',
    style: 'currency',
    ...options,
  }).format(amount)
}

const NON_DIGIT_REGEX = /\D/g

export function formatSiret(value: string): string {
  const digits = value.replace(NON_DIGIT_REGEX, '')
  const limited = digits.slice(0, 14)

  return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)} ${limited.slice(9)}`.trim()
}
