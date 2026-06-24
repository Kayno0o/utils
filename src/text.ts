import type { ExtractParams } from '~/types'
import { randomInt } from './number'
import { ObjectEntries } from './object'
import { STRICT_UUID_REGEX, UUID_REGEX } from './regex'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number, charset?: string, isCrypto = false): string {
  charset ||= wordChars

  if (isCrypto) {
    let id = ''
    const vals = crypto.getRandomValues(new Uint8Array(length))

    for (let i = 0; i < length; i++) id += charset[vals[i]! % charset.length]

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

/**
 * remove JavaScript/TypeScript/JSONC comments from code
 * handles single-line (//) and multi-line (/* *\/) comments while preserving string literals
 */
export function removeComments(content: string): string {
  let result = ''
  let i = 0

  while (i < content.length) {
    // skip strings to avoid removing // or /* inside them
    if (content[i] === '"' || content[i] === '\'' || content[i] === '`') {
      const quote = content[i]
      const start = i++

      while (i < content.length && (content[i] !== quote || content[i - 1] === '\\')) {
        i++
      }

      result += content.slice(start, ++i)

      continue
    }

    // multi-line comment
    if (content[i] === '/' && content[i + 1] === '*') {
      i += 2

      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
        i++
      }

      i += 2

      continue
    }

    // single-line comment
    if (content[i] === '/' && content[i + 1] === '/') {
      while (i < content.length && content[i] !== '\n') {
        i++
      }

      continue
    }

    result += content[i++]
  }

  return result
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

  if ((/[",\n]/).test(stringValue))
    stringValue = `"${stringValue}"`

  return stringValue
}

export function matchLength(str1: string, str2: string): number {
  let length = 0
  const minLength = Math.min(str1.length, str2.length)

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i])
      break

    length++
  }

  return length
}

export function matchingSubstring(str1: string, str2: string): string {
  const length = matchLength(str1, str2)

  return str1.substring(0, length)
}

export function getUuidFromIri(iri: string): string | null {
  const match = UUID_REGEX.exec(iri)

  return match ? match[0] : null
}

export function progressBar(value: number, min: number, max: number, { emptyChar = ' ', endChar = ']', fillChar = '=', startChar = '[', tipChar = '', totalChars = 40 } = {}) {
  if (min === max)
    return value >= max ? startChar + fillChar.repeat(totalChars) + endChar : startChar + emptyChar.repeat(totalChars) + endChar

  const progress = Math.max(min, Math.min(max, value))
  const fillLength = Math.round((progress - min) / (max - min) * totalChars)
  const emptyLength = totalChars - fillLength

  let fillBar = fillChar.repeat(fillLength)

  if (fillLength > 0 && fillLength < totalChars && tipChar)
    fillBar = fillBar.slice(0, -1) + tipChar

  return startChar + fillBar + emptyChar.repeat(emptyLength) + endChar
}

/** handle common pluralization rules */
export function plural(singular: string, count?: number): string {
  if (count === 1 || count === 0)
    return singular

  if (singular.endsWith('y') && !(/[aeiou]y$/).test(singular))
    return `${singular.slice(0, -1)}ies`

  if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || singular.endsWith('ch') || singular.endsWith('sh'))
    return `${singular}es`

  if (singular.endsWith('f'))
    return `${singular.slice(0, -1)}ves`

  if (singular.endsWith('fe'))
    return `${singular.slice(0, -2)}ves`

  return `${singular}s`
}

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

export function toCamel(input: string | string[]) {
  return toCase(input).map((w, i) => i === 0 ? w : firstUpper(w)).join('')
}

export function toKebab(input: string | string[]) {
  return toCase(input).join('-')
}

export function toSnake(input: string | string[]) {
  return toCase(input).join('_')
}

export function toPascal(input: string | string[]) {
  return toCase(input).map(firstUpper).join('')
}

export function toConstant(input: string | string[]) {
  return toCase(input).map(w => w.toUpperCase()).join('_')
}

export function toTitle(input: string | string[]) {
  return toCase(input).map(firstUpper).join(' ')
}

export function frRankLabel(rank: string) {
  if (rank === '1')
    return 'er'

  if (rank === '2')
    return 'nd'

  return 'ème'
}

export function truncate(str: string, len: number, suffix = '...'): string {
  if (str.length > len)
    return str.substring(0, len) + suffix

  return str
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, '')
}

export function strTemplate<T extends string>(str: T, variables: ExtractParams<T>): string {
  for (const [key, value] of ObjectEntries(variables)) {
    str = str.replaceAll(`{${key}}`, value) as T
  }

  return str
}

export type MaskKey = 'creditCard' | 'custom' | 'email' | 'iban' | 'ip' | 'phone' | 'token' | 'url'

export interface MaskCustomRule {
  pattern: RegExp
  replacer: (match: string) => string
}

export interface MaskRange {
  end: number
  key: MaskKey
  original: string
  start: number
}

export interface MaskOptions {
  creditCard?: boolean
  custom?: MaskCustomRule[]
  email?: boolean
  iban?: boolean
  ip?: boolean
  mode?: 'mask' | 'redact'
  phone?: boolean
  replace?: string
  token?: boolean
  url?: boolean
}

export interface MaskResult {
  hits: Record<MaskKey, number>
  ranges: MaskRange[]
  result: string
}

const EMAIL_RE = /[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
// ponytail: matches French-style 10-digit phones; extend regex for other formats
const PHONE_RE = /\b(?:\+\d{1,3}\s?)?0\d(?:[\s\-.]?\d{2}){4}\b/g
const IP_RE = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g
const CREDIT_CARD_RE = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g
const BEARER_RE = /\bBearer\s+\S+/gi
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g
const URL_QUERY_RE = /([?&][^=&#\s]+)=([^&#\s]+)/g

function maskEmail(m: string, char: string): string {
  const [local, domain] = m.split('@')

  if (!local || !domain)
    return m

  const dot = domain.lastIndexOf('.')

  return `${local[0]}${char.repeat(3)}@${domain[0]}${char.repeat(3)}${domain.slice(dot)}`
}

function maskPhone(m: string, char: string): string {
  const d = m.replace(/\D/g, '')
  const groups = Math.max(0, Math.floor((d.length - 4) / 2))

  return `${d.slice(0, 2)} ${`${char}${char} `.repeat(groups).trim()} ${d.slice(-2)}`
}

function maskIp(m: string, char: string): string {
  const [a, b] = m.split('.')

  return `${a}.${b}.${char}.${char}`
}

function maskIban(m: string, char: string): string {
  const clean = m.replace(/\s/g, '')
  const end = clean.length - 4
  let idx = 0

  return [...m].map(c => c === ' ' ? c : (i => i >= 4 && i < end ? char : c)(idx++)).join('')
}

function maskCreditCard(m: string, char: string): string {
  const digits = m.replace(/\D/g, '')
  const masked = digits[0] + char.repeat(digits.length - 5) + digits.slice(-4)
  let i = 0

  return m.replace(/\d/g, () => masked[i++]!)
}

function maskJwt(m: string, char: string): string {
  const dot = m.indexOf('.')

  return `${m.slice(0, dot)}.${char.repeat(3)}.${char.repeat(3)}`
}

function maskBearer(m: string, char: string): string {
  const token = m.slice(m.search(/\s/) + 1).trim()

  return `Bearer ${token.startsWith('eyJ') ? maskJwt(token, char) : char.repeat(3)}`
}

function maskUrlParam(m: string, char: string): string {
  return `${m.slice(0, m.indexOf('=') + 1)}${char.repeat(3)}`
}

// offset tracks cumulative length shift from prior replacements so ranges map to result positions
function applyMask(str: string, re: RegExp, fn: (m: string) => string, key: MaskKey, ranges: MaskRange[]): [string, number] {
  let count = 0
  let offset = 0

  const result = str.replace(re, (m, ...args) => {
    const replacement = fn(m)
    const start = (args[args.length - 2] as number) + offset

    ranges.push({ end: start + replacement.length, key, original: m, start })
    offset += replacement.length - m.length
    count++

    return replacement
  })

  return [result, count]
}

export function mask(str: string, {
  creditCard = true,
  custom,
  email = true,
  iban = true,
  ip = true,
  mode = 'mask',
  phone = true,
  replace: char = '*',
  token = true,
  url = true,
}: MaskOptions = {}): MaskResult {
  const hits: Record<MaskKey, number> = { creditCard: 0, custom: 0, email: 0, iban: 0, ip: 0, phone: 0, token: 0, url: 0 }
  const ranges: MaskRange[] = []

  const wrap = (masker: (m: string, char: string) => string) =>
    mode === 'redact' ? () => '[REDACTED]' : (m: string) => masker(m, char)

  if (email)
    [str, hits.email] = applyMask(str, EMAIL_RE, wrap(maskEmail), 'email', ranges)

  if (phone)
    [str, hits.phone] = applyMask(str, PHONE_RE, wrap(maskPhone), 'phone', ranges)

  if (ip)
    [str, hits.ip] = applyMask(str, IP_RE, wrap(maskIp), 'ip', ranges)

  if (iban)
    [str, hits.iban] = applyMask(str, IBAN_RE, wrap(maskIban), 'iban', ranges)

  if (creditCard)
    [str, hits.creditCard] = applyMask(str, CREDIT_CARD_RE, wrap(maskCreditCard), 'creditCard', ranges)

  if (token) {
    [str, hits.token] = applyMask(str, BEARER_RE, wrap(maskBearer), 'token', ranges)
    const [s, c] = applyMask(str, JWT_RE, wrap(maskJwt), 'token', ranges)

    str = s
    hits.token += c
  }

  if (url)
    [str, hits.url] = applyMask(str, URL_QUERY_RE, wrap(maskUrlParam), 'url', ranges)

  if (custom) {
    for (const { pattern, replacer } of custom) {
      const [newStr, count] = applyMask(str, pattern, replacer, 'custom', ranges)

      str = newStr
      hits.custom += count
    }
  }

  return { hits, ranges, result: str }
}
