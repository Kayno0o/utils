import { randomInt } from '~/number'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number, charset?: string, isCrypto = false): string {
  charset ??= wordChars

  if (isCrypto) {
    let id = ''
    const vals = crypto.getRandomValues(new Uint8Array(length))
    for (let i = 0; i < length; i++) id += charset[vals[i] % charset.length]
    return id
  }

  let result = ''
  for (let i = 0; i < length; i++)
    result += charset[randomInt(0, charset.length)]

  return result
}

/** remove accents and diacritics */
export function normalizeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * converts a string into a slug
 * @param {string} str
 * @param {object} [options]
 * @param {string} [options.replace] the string to replace non-alphanumeric characters with (default='-').
 * @param {boolean} [options.lower] convert the string to lowercase (default=true).
 * @param {boolean} [options.trim] trim leading/trailing whitespace (default=true).
 * @param {boolean} [options.deduplicate] deduplicate successives `replace` char (default=true)
 */
export function slugify(str: string, {
  deduplicate = true,
  lower = true,
  replace = '-',
  trim = true,
}: {
  deduplicate?: boolean
  lower?: boolean
  replace?: string
  trim?: boolean
} = {}): string {
  const regexReplace = escapeRegExp(replace)

  let result = normalizeAccents(str)
    .replace(/[^A-Z0-9-]/gi, replace)

  if (deduplicate)
    result = result.replace(new RegExp(`${regexReplace}+`, 'g'), replace)

  if (lower)
    result = result.toLowerCase()

  if (trim)
    result = result.replace(new RegExp(`^${regexReplace}*|${regexReplace}*$`, 'g'), '')

  return result
}

/** Get the initials of the given words, max 3 characters */
export function getInitials(...words: string[]): string {
  return words.join(' ').split(' ').map(name => name[0]).join('').slice(0, 3).toLocaleUpperCase()
}

export function firstUpper(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function searchOne(query: string, ...values: string[]): boolean {
  query = normalizeAccents(query).toLowerCase()
  return values.some(value => normalizeAccents(value).toLowerCase().includes(query))
}

export function searchAll(query: string, ...values: string[]): boolean {
  query = normalizeAccents(query).toLowerCase()
  return values.every(value => normalizeAccents(value).toLowerCase().includes(query))
}

export function removeComments(content: string): string {
  return content.replace(/\/\/.+|\/\*\*?[^*]*\*\//g, '')
}

export function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': default: return '&quot;'
    }
  })
}

export function escapeCSV(value: string | number): string {
  let stringValue = String(value)

  stringValue = stringValue.replace(/"/g, '""')

  if (/[",\n]/.test(stringValue)) {
    stringValue = `"${stringValue}"`
  }

  return stringValue
}

export function matchLength(str1: string, str2: string): number {
  let length = 0
  const minLength = Math.min(str1.length, str2.length)

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i]) {
      break
    }
    length++
  }

  return length
}

export function matchingSubstring(str1: string, str2: string): string {
  const length = matchLength(str1, str2)
  return str1.substring(0, length)
}

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function getUuidFromIri(iri: string): string | null {
  const match = UUID_REGEX.exec(iri)
  return match ? match[0] : null
}

export function progressBar(value: number, min: number, max: number, { emptyChar = ' ', endChar = ']', fillChar = '=', startChar = '[', tipChar = '', totalChars = 40 } = {}) {
  if (min === max) {
    return value >= max ? startChar + fillChar.repeat(totalChars) + endChar : startChar + emptyChar.repeat(totalChars) + endChar
  }

  const progress = Math.max(min, Math.min(max, value))
  const fillLength = Math.round((progress - min) / (max - min) * totalChars)
  const emptyLength = totalChars - fillLength

  let fillBar = fillChar.repeat(fillLength)
  if (fillLength > 0 && fillLength < totalChars && tipChar) {
    fillBar = fillBar.slice(0, -1) + tipChar
  }

  return startChar + fillBar + emptyChar.repeat(emptyLength) + endChar
}

/** handle common pluralization rules */
export function plural(singular: string): string {
  if (singular.endsWith('y') && !/[aeiou]y$/.test(singular))
    return `${singular.slice(0, -1)}ies`

  if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || singular.endsWith('ch') || singular.endsWith('sh'))
    return `${singular}es`

  if (singular.endsWith('f'))
    return `${singular.slice(0, -1)}ves`

  if (singular.endsWith('fe'))
    return `${singular.slice(0, -2)}ves`

  return `${singular}s`
}

const STRICT_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MINIFIED_REGEX = /^[\w-]+$/

export function minifyUUID(uuid: string): string {
  if (!STRICT_UUID_REGEX.test(uuid))
    throw new Error('Invalid UUID format')

  const hex = uuid.replace(/-/g, '')
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => Number.parseInt(byte, 16)))
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function expandUUID(minified: string): string {
  if (!MINIFIED_REGEX.test(minified))
    throw new Error('Invalid minified format')

  const base64 = minified.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const hex = Array.from(binary, char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('')

  if (hex.length !== 32)
    throw new Error('Invalid minified format')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function toCase(str: string | string[]): string[] {
  if (Array.isArray(str))
    return str.map(s => s.toLowerCase())

  // Replace separators with space, then match all word segments
  const normalized = str
    .replace(/[_-]+/g, ' ') // snake_case / kebab-case -> space
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim()

  const words = normalized.match(/[a-z0-9]+/gi)
  return words ? words.map(w => w.toLowerCase()) : []
}

export type CaseType = 'kebab' | 'snake' | 'camel' | 'pascal' | 'constant' | 'title'

export const toCamel = (input: string | string[]) => toCase(input).map((w, i) => i === 0 ? w : firstUpper(w)).join('')
export const toKebab = (input: string | string[]) => toCase(input).join('-')
export const toSnake = (input: string | string[]) => toCase(input).join('_')
export const toPascal = (input: string | string[]) => toCase(input).map(firstUpper).join('')
export const toConstant = (input: string | string[]) => toCase(input).map(w => w.toUpperCase()).join('_')
export const toTitle = (input: string | string[]) => toCase(input).map(firstUpper).join(' ')

export function frRankLabel(rank: string) {
  if (rank === '1')
    return 'er'
  if (rank === '2')
    return 'nd'
  return 'ème'
}
