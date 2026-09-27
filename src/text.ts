import type { ExtractParams } from './types'
import { randomInt } from './number'
import { typedObjectEntries } from './object'
import { STRICT_UUID_REGEX, UUID_REGEX } from './regex'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number, charset?: string, isCrypto = false): string {
  charset ||= wordChars

  if (isCrypto) {
    let id = ''
    // rejection sampling: discard bytes in the biased tail so every char is equiprobable
    const limit = Math.floor(256 / charset.length) * charset.length

    while (id.length < length) {
      for (const byte of crypto.getRandomValues(new Uint8Array(length - id.length))) {
        if (byte < limit)
          id += charset[byte % charset.length]
      }
    }

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

/**
 * Initials of a name, for avatars and monograms. Words are split by {@link toCase}, so
 * separators, camelCase and non-Latin scripts all work. Accents are kept - an initial is the
 * name as written, not a slug of it; reach for {@link slugify} when you want it folded to ASCII.
 * @param {string|string[]} name one string (`'Ada Lovelace'`) or its parts (`['Ada', 'Lovelace']`)
 * @param {object} [options]
 * @param {number} [options.max] how many characters to return (default=2).
 * @param {boolean} [options.pad] top a single-word name up to `max` from its own letters, so
 * `'ada'` reads as `AD` rather than a lone `A` (default=true).
 * @example getInitials('Ada Lovelace') // 'AL'
 * @example getInitials('ada-lovelace') // 'AL'
 * @example getInitials('José Álvarez') // 'JÁ'
 * @example getInitials('kaynooo') // 'KA'
 * @example getInitials('kaynooo', { pad: false }) // 'K'
 * @example getInitials('International Business Machines', { max: 3 }) // 'IBM'
 */
export function getInitials(name: string | string[], {
  max = 2,
  pad = true,
}: {
  max?: number
  pad?: boolean
} = {}): string {
  // Joined, not handed to toCase as an array: its array branch lowercases parts without splitting them.
  const words = toCase(Array.isArray(name) ? name.join(' ') : name)

  if (!words.length || max < 1)
    return ''

  // Spread, not `[0]`: indexing a string cuts astral characters in half and yields a lone surrogate.
  const letters = words.slice(0, max).map(word => [...word][0]!)

  if (pad && words.length === 1)
    letters.push(...[...words[0]!].slice(1, max))

  // Re-slice by code point: uppercasing can lengthen a letter (`ß` -> `SS`) past `max`.
  return [...letters.join('').toLocaleUpperCase()].slice(0, max).join('')
}

/** @deprecated use `capitalize` */
export const firstUpper = capitalize
export function capitalize(str: string): string {
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

/** whether the needle's characters appear in the value in order, contiguous or not */
function isSubsequence(needle: string, value: string): boolean {
  const wanted = [...needle]
  let at = 0

  for (const char of value) {
    if (char === wanted[at])
      at++

    if (at === wanted.length)
      return true
  }

  return at === wanted.length
}

/** whether every whitespace-separated term of the query is spread through one of the values, in order */
export function searchFuzzy(query: string, ...values: string[]): boolean {
  const terms = normalizeAccents(query).toLowerCase().split(/\s+/).filter(Boolean)

  if (!terms.length)
    return true

  const haystacks = values.map(value => normalizeAccents(value).toLowerCase())

  return terms.every(term => haystacks.some(value => isSubsequence(term, value)))
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

const HTML_CHARS = /[&<>"'`]/g
const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;', '`': '&#96;' }

/** Escapes what HTML treats specially, the backtick included since IE once read one as an attribute delimiter. Use `escapeXml` for XML, which spells the apostrophe `&apos;`. */
export function escapeHtml(text: string): string {
  return text.replace(HTML_CHARS, char => HTML_ENTITIES[char] ?? char)
}

const BASE64URL_CHARS = /[-_]/g
const WHITESPACE = /\s+/g
const TRAILING_PADDING = /=+$/
const PLUS = /\+/g
const SLASH = /\//g

/** Base64 of the text's UTF-8 bytes, so any character encodes where `btoa` throws past Latin-1; `url` gives the url-safe alphabet without padding. */
export function base64Encode(text: string, url = false): string {
  let binary = ''

  for (const byte of new TextEncoder().encode(text))
    binary += String.fromCharCode(byte)

  const encoded = btoa(binary)

  return url ? encoded.replace(PLUS, '-').replace(SLASH, '_').replace(TRAILING_PADDING, '') : encoded
}

/** The UTF-8 text behind base64, in either alphabet, with or without padding; throws when it is not base64 or not UTF-8. */
export function base64Decode(encoded: string): string {
  const normal = encoded.replace(WHITESPACE, '').replace(BASE64URL_CHARS, char => (char === '-' ? '+' : '/'))
  const binary = atob(normal.padEnd(Math.ceil(normal.length / 4) * 4, '='))

  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

export function escapeCSV(value: string | number): string {
  let stringValue = String(value)

  stringValue = stringValue.replace(/"/g, '""')

  if ((/[",\n]/).test(stringValue))
    stringValue = `"${stringValue}"`

  return stringValue
}

/** @deprecated use `commonPrefixLength` */
export const matchLength = commonPrefixLength
export function commonPrefixLength(str1: string, str2: string): number {
  let length = 0
  const minLength = Math.min(str1.length, str2.length)

  for (let i = 0; i < minLength; i++) {
    if (str1[i] !== str2[i])
      break

    length++
  }

  return length
}

/** @deprecated use `commonPrefix` */
export const matchingSubstring = commonPrefix
export function commonPrefix(str1: string, str2: string): string {
  const length = commonPrefixLength(str1, str2)

  return str1.substring(0, length)
}

/** edits turning one string into the other, a swap of two neighbours counting as one edit like an insertion, deletion or substitution */
export function editDistance(str1: string, str2: string): number {
  // Spread so an astral character counts as one edit, not two halves.
  const a = [...str1]
  const b = [...str2]
  let beforePrevious: number[] = []
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)

  for (let i = 1; i <= a.length; i++) {
    const current = [i]

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost)

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        current[j] = Math.min(current[j]!, beforePrevious[j - 2]! + 1)
    }

    beforePrevious = previous
    previous = current
  }

  return previous[b.length]!
}

/** the candidate nearest the query, for a "did you mean", or undefined when none is within `maxDistance` edits (a third of the query by default) */
export function closestMatch(query: string, candidates: Iterable<string>, maxDistance = Math.max(1, Math.floor([...query].length / 3))): string | undefined {
  let best: string | undefined
  let bestDistance = maxDistance + 1

  for (const candidate of candidates) {
    const distance = editDistance(query, candidate)

    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }

  return best
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

/** `1 rule`, `3 rules`: a count and the word it agrees with */
export function counted(count: number, singular: string): string {
  // `plural` reads zero as singular; a count written in front of the word wants `0 rules`.
  return `${count} ${count === 1 ? singular : plural(singular, 2)}`
}

/** `base`, then `base_2`, `base_3`: the first name nothing in `taken` already holds */
export function uniqueName(base: string, taken: ReadonlySet<string> | readonly string[], { separator = '_', start = 2 } = {}): string {
  const has = taken instanceof Set ? (name: string) => taken.has(name) : (name: string) => (taken as readonly string[]).includes(name)

  if (!has(base))
    return base

  for (let n = start; ; n++) {
    const name = `${base}${separator}${n}`

    if (!has(name))
      return name
  }
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

  // Replace separators with space, then match all word segments. Unicode-aware throughout:
  // matching ASCII only would drop `Ünal` to `nal`, silently changing which letter starts the word.
  const normalized = str
    .replace(/[_-]+/g, ' ') // snake_case / kebab-case -> space
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2') // camelCase -> camel Case
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim()

  const words = normalized.match(/[\p{L}\p{N}]+/gu)

  return words ? words.map(w => w.toLocaleLowerCase()) : []
}

export type CaseType = 'kebab' | 'snake' | 'camel' | 'pascal' | 'constant' | 'title'

export function toCamel(input: string | string[]) {
  return toCase(input).map((w, i) => i === 0 ? w : capitalize(w)).join('')
}

export function toKebab(input: string | string[]) {
  return toCase(input).join('-')
}

export function toSnake(input: string | string[]) {
  return toCase(input).join('_')
}

export function toPascal(input: string | string[]) {
  return toCase(input).map(capitalize).join('')
}

export function toConstant(input: string | string[]) {
  return toCase(input).map(w => w.toUpperCase()).join('_')
}

export function toTitle(input: string | string[]) {
  return toCase(input).map(capitalize).join(' ')
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

/** @deprecated use `renderTemplate` */
export const strTemplate = renderTemplate
export function renderTemplate<T extends string>(str: T, variables: ExtractParams<T>): string {
  for (const [key, value] of typedObjectEntries(variables)) {
    str = str.replaceAll(`{${key}}`, value) as T
  }

  return str
}

export type MaskKey = 'creditCard' | 'custom' | 'dbUrl' | 'email' | 'gitToken' | 'iban' | 'ip' | 'mac' | 'pem' | 'phone' | 'token' | 'url'

export interface MaskCustomRule {
  pattern: RegExp
  replacer: (match: string) => string
}

export interface MaskRange {
  end: number
  key: MaskKey
  /** only present when `keepOriginals: true` */
  original?: string
  start: number
}

export interface MaskOptions {
  creditCard?: boolean
  custom?: MaskCustomRule[]
  dbUrl?: boolean
  email?: boolean
  gitToken?: boolean
  iban?: boolean
  ip?: boolean
  /**
   * keep the original matched text in `ranges[].original`.
   * defaults to `false` because the masked result should not carry the raw secrets.
   */
  keepOriginals?: boolean
  mac?: boolean
  mode?: 'mask' | 'redact'
  pem?: boolean
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
const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g
// anything colon-dense that could be an IPv6 address (≥2 colons, optional IPv4 tail, optional zone)
const IPV6_RE = /(?<![\w.:])(?=[0-9a-f:]*:[0-9a-f:]*:)[0-9a-f:]{2,45}(?:(?:\d{1,3}\.){3}\d{1,3})?(?:%[0-9a-z]+)?(?![\w.:])/gi
const IPV4_TAIL_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/
const IBAN_RE = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g
const CREDIT_CARD_RE = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g
const BEARER_RE = /\bBearer\s+\S+/gi
const JWT_RE = /\beyJ[\w-]+\.[\w-]+\.[\w-]*/g
// only mask query parameters that commonly carry secrets
const URL_QUERY_RE = /([?&](?:token|key|api[_-]?key|secret|password|auth|code|session)[^=&#\s]*)=([^&#\s]+)/gi
const GIT_TOKEN_RE = /\b(?:gh[pousr]_\w{36}|github_pat_\w+|glpat-[\w-]{20,})\b/gi
const MAC_RE = /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi
const PEM_RE = /-----BEGIN [A-Z0-9 ]+-----[A-Za-z0-9+/=\s]+-----END [A-Z0-9 ]+-----/g
const DB_URL_RE = /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|sqlite|mssql|oracle):\/\/\S+/gi

function maskEmail(m: string, char: string): string {
  const [local, domain] = m.split('@')

  if (!local || !domain)
    return m

  const dot = domain.lastIndexOf('.')
  const maskedLocal = local.length <= 1 ? char.repeat(4) : `${local[0]}${char.repeat(3)}`

  return `${maskedLocal}@${domain[0]}${char.repeat(3)}${domain.slice(dot)}`
}

function maskPhone(m: string, char: string): string {
  const prefixMatch = m.match(/^\+\d{1,3}/)
  const prefix = prefixMatch ? prefixMatch[0] : ''
  const body = prefix ? m.slice(prefix.length) : m
  const d = body.replace(/\D/g, '')
  const groups = Math.max(0, Math.floor((d.length - 4) / 2))
  const masked = `${d.slice(0, 2)} ${`${char}${char} `.repeat(groups).trim()} ${d.slice(-2)}`

  return prefix ? `${prefix} ${masked}` : masked
}

function maskIp(m: string, char: string): string {
  if (m.includes(':')) {
    const segments = m.split(':')
    const first = segments.find(Boolean) ?? ''
    const last = [...segments].reverse().find(Boolean) ?? ''

    return `${first}:${char}:${last}`
  }

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
  const eq = m.indexOf('=')

  return `${m.slice(0, eq + 1)}${char.repeat(3)}`
}

function maskGitToken(m: string, char: string): string {
  const prefix = m.match(/^(?:gh[pousr]_|github_pat_|glpat-|gldt-)/)?.[0] ?? m.slice(0, 7)

  return `${prefix}${char.repeat(3)}`
}

function maskMac(m: string, char: string): string {
  const groups = m.split(/[:-]/)

  return `${groups[0]}${char.repeat(2)} ${groups[2]}${char.repeat(2)} ${groups[4]}${char.repeat(2)}`
}

function maskPem(m: string, char: string): string {
  const lines = m.split('\n')

  return lines.map((line, i) => {
    if (i === 0 || i === lines.length - 1 || line.trim() === '')
      return line

    return char.repeat(line.length)
  }).join('\n')
}

function maskDbUrl(m: string, char: string): string {
  const at = m.indexOf('@')

  if (at === -1)
    return m

  const prefix = m.slice(0, at)
  const colon = prefix.lastIndexOf(':')

  if (colon === -1)
    return m

  return `${prefix.slice(0, colon + 1)}${char.repeat(3)}${m.slice(at)}`
}

/** Luhn checksum for 13-19 digit identifiers (credit cards, etc.) */
function luhnCheck(digits: string): boolean {
  let sum = 0
  let alternate = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number.parseInt(digits[i]!, 10)

    if (alternate) {
      n *= 2

      if (n > 9)
        n -= 9
    }

    sum += n
    alternate = !alternate
  }

  return sum % 10 === 0
}

function isValidIpv6(s: string): boolean {
  const [addr] = s.split('%')
  const halves = addr!.split('::')

  if (halves.length > 2)
    return false // more than one "::"

  const toGroups = (side: string) => side === '' ? [] : side.split(':')
  const groups = [...toGroups(halves[0]!), ...toGroups(halves[1] ?? '')]
  let count = 0

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]!

    if (g.includes('.')) {
      if (i !== groups.length - 1 || !IPV4_TAIL_RE.test(g))
        return false

      count += 2 // embedded IPv4 = two 16-bit groups
    }
    else {
      if (!(/^[0-9a-f]{1,4}$/i).test(g))
        return false

      count += 1
    }
  }

  return halves.length === 2 ? count < 8 : count === 8
}

/** ISO 13616 mod-97 IBAN validation */
function ibanCheck(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = [...rearranged].map((c) => {
    const code = c.toUpperCase().charCodeAt(0)

    return code >= 65 && code <= 90 ? String(code - 55) : c
  }).join('')
  let remainder = numeric

  while (remainder.length > 2) {
    const block = remainder.slice(0, 9)

    remainder = (Number.parseInt(block, 10) % 97) + remainder.slice(9)
  }

  return Number.parseInt(remainder, 10) % 97 === 1
}

interface MaskMatch {
  end: number
  key: MaskKey
  original: string
  priority: number
  replacement: string
  start: number
}

/**
 * collect all matches for a detector against the original string.
 * returning `null` from the replacer drops the match (used for checksum validation).
 */
function collect(str: string, re: RegExp, replacer: (match: string) => string | null, key: MaskKey, priority: number): MaskMatch[] {
  return [...str.matchAll(re)]
    .map((m) => {
      const replacement = replacer(m[0])

      if (replacement === null)
        return null

      return {
        start: m.index!,
        end: m.index! + m[0].length,
        key,
        original: m[0],
        priority,
        replacement,
      }
    })
    .filter((m): m is MaskMatch => m !== null)
}

/** drop overlapping matches; higher priority wins, first wins on ties */
function resolveOverlaps(matches: MaskMatch[]): MaskMatch[] {
  matches.sort((a, b) => a.start - b.start)

  const kept: MaskMatch[] = []

  for (const m of matches) {
    const overlaps = kept.filter(k => k.start < m.end && k.end > m.start)

    if (overlaps.some(k => k.priority >= m.priority))
      continue

    kept.splice(0, kept.length, ...kept.filter(k => !overlaps.includes(k)))
    kept.push(m)
  }

  return kept
}

export function mask(str: string, {
  creditCard = true,
  custom,
  dbUrl = true,
  email = true,
  gitToken = true,
  iban = true,
  ip = true,
  keepOriginals = false,
  mac = true,
  mode = 'mask',
  pem = true,
  phone = true,
  replace: char = '*',
  token = true,
  url = true,
}: MaskOptions = {}): MaskResult {
  if (custom) {
    for (const { pattern } of custom) {
      if (!pattern.global) {
        throw new TypeError(
          `custom pattern ${pattern} must use the 'g' flag`,
        )
      }
    }
  }

  const hits: Record<MaskKey, number> = { creditCard: 0, custom: 0, dbUrl: 0, email: 0, gitToken: 0, iban: 0, ip: 0, mac: 0, pem: 0, phone: 0, token: 0, url: 0 }

  const applyMode = (fn: (m: string) => string | null) =>
    mode === 'redact' ? () => '[REDACTED]' : fn

  const matches: MaskMatch[] = []

  if (email)
    matches.push(...collect(str, EMAIL_RE, applyMode(m => maskEmail(m, char)), 'email', 10))

  if (phone)
    matches.push(...collect(str, PHONE_RE, applyMode(m => maskPhone(m, char)), 'phone', 20))

  if (ip) {
    matches.push(...collect(str, IPV4_RE, applyMode(m => maskIp(m, char)), 'ip', 30))
    matches.push(...collect(str, IPV6_RE, applyMode(m => isValidIpv6(m) ? maskIp(m, char) : null), 'ip', 31))
  }

  if (mac)
    matches.push(...collect(str, MAC_RE, applyMode(m => maskMac(m, char)), 'mac', 35))

  if (iban) {
    matches.push(...collect(str, IBAN_RE, applyMode((m) => {
      return ibanCheck(m.replace(/\s/g, '')) ? maskIban(m, char) : null
    }), 'iban', 40))
  }

  if (creditCard) {
    matches.push(...collect(str, CREDIT_CARD_RE, applyMode((m) => {
      return luhnCheck(m.replace(/\D/g, '')) ? maskCreditCard(m, char) : null
    }), 'creditCard', 50))
  }

  if (gitToken)
    matches.push(...collect(str, GIT_TOKEN_RE, applyMode(m => maskGitToken(m, char)), 'gitToken', 55))

  if (token) {
    matches.push(...collect(str, JWT_RE, applyMode(m => maskJwt(m, char)), 'token', 60))
    matches.push(...collect(str, BEARER_RE, applyMode(m => maskBearer(m, char)), 'token', 70))
  }

  if (url)
    matches.push(...collect(str, URL_QUERY_RE, applyMode(m => maskUrlParam(m, char)), 'url', 80))

  if (dbUrl)
    matches.push(...collect(str, DB_URL_RE, applyMode(m => maskDbUrl(m, char)), 'dbUrl', 82))

  if (pem)
    matches.push(...collect(str, PEM_RE, applyMode(m => maskPem(m, char)), 'pem', 85))

  if (custom) {
    for (const { pattern, replacer } of custom) {
      matches.push(...collect(str, pattern, applyMode(m => replacer(m)), 'custom', 90))
    }
  }

  const kept = resolveOverlaps(matches)

  let result = ''
  let pos = 0
  const ranges: MaskRange[] = []

  for (const m of kept) {
    result += str.slice(pos, m.start)

    const start = result.length

    result += m.replacement

    ranges.push({
      start,
      end: result.length,
      key: m.key,
      ...(keepOriginals ? { original: m.original } : {}),
    })

    pos = m.end
    hits[m.key]++
  }

  result += str.slice(pos)

  return { hits, ranges, result }
}

export interface MaskEnvOptions extends MaskOptions {
  /** mask each value with `mask` instead of dropping it, so the file keeps its shape */
  maskValues?: boolean
}

export interface MaskEnvResult {
  keys: string[]
  result: string
}

const ENV_ASSIGN_RE = /^(\s*(?:export\s+)?)([A-Za-z_][\w.-]*)[ \t]*=(.*)$/
const ENV_COMMENT_RE = /^\s*#+/
const ENV_BLANK_RE = /^\s*$/

function envQuote(value: string): string {
  const first = value[0]

  return first === '"' || first === '\'' || first === '`' ? first : ''
}

/** the line a quoted value closes on, or -1 when it never closes and the value is the one line after all */
function envValueEnd(lines: string[], at: number, value: string, quote: string): number {
  if (value.includes(quote, 1))
    return at

  for (let next = at + 1; next < lines.length; next++) {
    if (lines[next]!.includes(quote))
      return next
  }

  return -1
}

/** a value `mask` recognises keeps its shape; anything else is a secret we know nothing about, so all of it goes */
function maskEnvValue(raw: string, options: MaskOptions, char: string): string {
  const quote = envQuote(raw)
  const quoted = Boolean(quote) && raw.length > 1 && raw.endsWith(quote)
  const inner = quoted ? raw.slice(1, -1) : raw

  if (!inner)
    return raw

  const { ranges, result } = mask(inner, options)
  const value = ranges.length ? result : options.mode === 'redact' ? '[REDACTED]' : char.repeat(inner.length)

  return quoted ? `${quote}${value}${quote}` : value
}

/**
 * strips a `.env` down to the keys it declares, keeping blank lines, comments and `export` prefixes.
 * `maskValues` keeps the values instead, run through `mask`. A commented-out assignment loses its value
 * like a live one, and a line that declares nothing at all is dropped rather than passed through.
 */
export function maskEnv(str: string, { maskValues = false, ...options }: MaskEnvOptions = {}): MaskEnvResult {
  const eol = str.includes('\r\n') ? '\r\n' : '\n'
  const lines = str.split(/\r?\n/)
  const char = options.replace ?? '*'
  const keys: string[] = []
  const out: string[] = []

  const declare = (found: RegExpExecArray, value: string) =>
    `${found[1]!}${found[2]!}=${maskValues ? maskEnvValue(value, options, char) : ''}`

  for (let at = 0; at < lines.length; at++) {
    const line = lines[at]!

    if (ENV_BLANK_RE.test(line)) {
      out.push(line)

      continue
    }

    const hashes = ENV_COMMENT_RE.exec(line)

    if (hashes) {
      const commented = ENV_ASSIGN_RE.exec(line.slice(hashes[0].length))

      out.push(commented ? `${hashes[0]}${declare(commented, commented[3]!.trimStart())}` : line)

      continue
    }

    const found = ENV_ASSIGN_RE.exec(line)

    // a line declaring nothing is malformed env, and echoing it would hand back whatever it holds
    if (!found)
      continue

    let value = found[3]!.trimStart()
    const quote = envQuote(value)
    const end = quote ? envValueEnd(lines, at, value, quote) : at

    // a quoted value runs to its closing quote, which for a PEM key or a JSON blob is lines further down
    if (end > at) {
      value = [value, ...lines.slice(at + 1, end + 1)].join(eol)
      at = end
    }

    keys.push(found[2]!)
    out.push(declare(found, value))
  }

  return { keys, result: out.join(eol) }
}

/** what cp1252 spells in 0x80-0x9F, the range latin-1 leaves undefined */
const CP1252 = new Map(['€', '', '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ', '', 'Ž', '', '', '‘', '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ', '', 'ž', 'Ÿ']
  .map((char, at) => [char, 0x80 + at] as const)
  .filter(([char]) => char))

const UTF8 = new TextDecoder('utf-8', { fatal: true })

/**
 * repairs text whose utf-8 bytes were read as cp1252 and written back: `Ã†bleflÃ¦sk` -> `Æbleflæsk`.
 * all or nothing, so a string that is not mojibake all the way through comes back untouched.
 */
export function repairMojibake(str: string): string {
  // A file read wrong and written back twice is a real shape, and four passes is the ceiling.
  for (let pass = 0; pass < 4; pass++) {
    const bytes = new Uint8Array(str.length)
    let at = 0
    let high = false

    for (const char of str) {
      const code = char.codePointAt(0)!
      const byte = code < 0x100 ? code : CP1252.get(char)

      if (byte === undefined)
        return str

      high ||= byte >= 0x80
      bytes[at++] = byte
    }

    if (!high)
      return str

    try {
      str = UTF8.decode(bytes.subarray(0, at))
    }
    catch {
      return str
    }
  }

  return str
}

export interface TextSpan {
  text: string
  offset: number
}

const WORD_RE = /\S+/g

/** Every run of non-whitespace, with where it starts in `text`. */
export function tokenizeWords(text: string): TextSpan[] {
  return [...text.matchAll(WORD_RE)].map(match => ({ text: match[0], offset: match.index }))
}

/** Every line, blank ones included, with where it starts in `text`. A trailing newline ends the last line rather than starting an empty one. */
export function tokenizeLines(text: string): TextSpan[] {
  if (text === '')
    return []

  const spans: TextSpan[] = []
  let offset = 0

  for (const line of text.split('\n')) {
    spans.push({ text: line, offset })
    offset += line.length + 1
  }

  if (spans.length > 1 && spans.at(-1)!.text === '')
    spans.pop()

  return spans
}

/** Sentences with where each starts, split by the locale's own rules rather than by punctuation. */
export function splitSentences(text: string, locale = 'en'): TextSpan[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' })

  return [...segmenter.segment(text)].map(segment => ({ text: segment.segment, offset: segment.index }))
}

/**
 * Joins adjacent spans until each carries at least `minLength` non-whitespace characters.
 *
 * Spans must be contiguous, the way [splitSentences] returns them: merging concatenates their text
 * and keeps the first offset, so a gap between two spans would be lost.
 */
export function mergeSpans(spans: TextSpan[], minLength: number): TextSpan[] {
  const merged: TextSpan[] = []

  for (const span of spans) {
    const last = merged.at(-1)

    if (last && last.text.trim().length < minLength)
      last.text += span.text
    else
      merged.push({ ...span })
  }

  return merged
}

/** A span's bounds with its surrounding whitespace excluded, or null when it holds none. */
export function trimSpan(span: TextSpan): [number, number] | null {
  const from = span.offset + (span.text.length - span.text.trimStart().length)
  const to = span.offset + span.text.trimEnd().length

  return to > from ? [from, to] : null
}

export interface Excerpt {
  text: string
  offset: number
  length: number
}

/**
 * A window of `text` around one span, for showing an error in context.
 *
 * `offset` indexes the excerpt rather than the source, and counts the ellipsis when one was added,
 * so `excerpt.text.slice(offset, offset + length)` is always the span itself.
 */
export function excerptAround(text: string, offset: number, length: number, { radius = 40, ellipsis = '...' } = {}): Excerpt {
  const start = Math.max(0, offset - radius)
  const end = Math.min(text.length, offset + length + radius)
  const prefix = start > 0 ? ellipsis : ''

  return {
    text: `${prefix}${text.slice(start, end)}${end < text.length ? ellipsis : ''}`,
    offset: prefix.length + (offset - start),
    length,
  }
}
