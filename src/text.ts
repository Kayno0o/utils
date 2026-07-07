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
