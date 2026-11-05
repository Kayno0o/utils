import type { RandomSource } from './number'
import type { ExtractParams } from './types'
import { utf8Encoder, utf8StrictDecoder } from './internal'
import { randomInt } from './number'
import { STRICT_UUID_REGEX, UUID_REGEX } from './regex'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** `length` characters of `charset` read by code point, each drawn from `random`; pass `cryptoRandom` for secrets, whose 53 bits keep the bias below charset size / 2^53. */
export function randomString(length: number, charset?: string, random: RandomSource = Math.random): string {
  const chars = Array.from(charset || wordChars)
  let result = ''

  for (let i = 0; i < length; i++)
    result += chars[randomInt(0, chars.length, random)]

  return result
}

const ASCII_ONLY = /^\p{ASCII}*$/u
const COMBINING_MARKS_REGEX = /[\u0300-\u036F]/g
const REGEX_SPECIALS_REGEX = /[.*+?^${}()|[\]\\]/g
const XML_UNSAFE_REGEX = /[<>&'"]/g
const VOWEL_Y_ENDING_REGEX = /[aeiou]y$/
const SEPARATORS_REGEX = /[_-]+/g
const CAMEL_BOUNDARY_REGEX = /(\p{Ll})(\p{Lu})/gu
const WHITESPACE_GLOBAL_REGEX = /\s+/g
const WHITESPACE_CHAR_GLOBAL_REGEX = /\s/g
const WORDS_REGEX = /[\p{L}\p{N}]+/gu
const HTML_TAG_REGEX = /<[^>]+>/g
const PHONE_PREFIX_REGEX = /^\+\d{1,3}/
const NON_DIGIT_GLOBAL_REGEX = /\D/g
const DIGIT_GLOBAL_REGEX = /\d/g
const TOKEN_PREFIX_REGEX = /^(?:gh[pousr]_|github_pat_|glpat-|gldt-)/
const COLON_DASH_REGEX = /[:-]/
const HEX_GROUP_REGEX = /^[0-9a-f]{1,4}$/i
const NEWLINE_REGEX = /\r?\n/

/** remove accents and diacritics */
export function normalizeAccents(str: string): string {
  return ASCII_ONLY.test(str) ? str : str.normalize('NFD').replace(COMBINING_MARKS_REGEX, '')
}

export function escapeRegExp(str: string) {
  return str.replace(REGEX_SPECIALS_REGEX, '\\$&')
}

const SLUG_INVALID_RE = /[^A-Z0-9-]/gi
const slugRegexes = new Map<string, { deduplicate: RegExp, trim: RegExp }>()

function getSlugRegexes(replace: string) {
  let cached = slugRegexes.get(replace)

  if (!cached) {
    const escaped = escapeRegExp(replace)

    cached = { deduplicate: new RegExp(`${escaped}+`, 'g'), trim: new RegExp(`^${escaped}*|${escaped}*$`, 'g') }
    slugRegexes.set(replace, cached)
  }

  return cached
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
  const regexes = getSlugRegexes(replace)

  let result = normalizeAccents(str)
    .replace(SLUG_INVALID_RE, replace)

  if (deduplicate)
    result = result.replace(regexes.deduplicate, replace)

  if (lower)
    result = result.toLowerCase()

  if (trim)
    result = result.replace(regexes.trim, '')

  return result
}

/**
 * Initials of a name, for avatars and monograms. Words are split by {@link splitWords}, so
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
  // Joined, not handed to splitWords as an array: its array branch lowercases parts without splitting them.
  const words = splitWords(Array.isArray(name) ? name.join(' ') : name)

  if (!words.length || max < 1)
    return ''

  // Spread, not `[0]`: indexing a string cuts astral characters in half and yields a lone surrogate.
  const letters = words.slice(0, max).map(word => [...word][0]!)

  if (pad && words.length === 1)
    letters.push(...[...words[0]!].slice(1, max))

  // Re-slice by code point: uppercasing can lengthen a letter (`ß` -> `SS`) past `max`.
  return [...letters.join('').toLocaleUpperCase()].slice(0, max).join('')
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Splits on `separator`, trimming each item and dropping the empty ones: `' a, ,b '` gives `['a', 'b']`. */
export function splitList(text: string, separator: string | RegExp = ','): string[] {
  return text.split(separator).map(item => item.trim()).filter(Boolean)
}

export interface SearchOptions {
  /** Tells `A` from `a`. Defaults to false. */
  caseSensitive?: boolean
  /** Tells `é` from `e`. Defaults to false. */
  accentSensitive?: boolean
}

type SearchArgs = string[] | [values: string[], options?: SearchOptions | undefined]

/** Splits the variadic form from the `(values, options)` one. */
function readSearchArgs(args: SearchArgs): { values: string[], fold: (str: string) => string } {
  const [first, options = {}] = args
  const values = Array.isArray(first) ? first : args as string[]
  const { caseSensitive = false, accentSensitive = false } = Array.isArray(first) ? options as SearchOptions : {}

  return {
    values,
    fold: (str) => {
      const folded = accentSensitive ? str : normalizeAccents(str)

      return caseSensitive ? folded : folded.toLowerCase()
    },
  }
}

/** Whether any value contains the query, case and accents folded unless `options` say otherwise. */
export function searchOne(query: string, ...values: string[]): boolean
export function searchOne(query: string, values: string[], options?: SearchOptions): boolean
export function searchOne(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const needle = fold(query)

  return values.some(value => fold(value).includes(needle))
}

/** Whether every value contains the query, case and accents folded unless `options` say otherwise. */
export function searchAll(query: string, ...values: string[]): boolean
export function searchAll(query: string, values: string[], options?: SearchOptions): boolean
export function searchAll(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const needle = fold(query)

  return values.every(value => fold(value).includes(needle))
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

const WHITESPACE_RUN_REGEX = /\s+/

/** whether every whitespace-separated term of the query is spread through one of the values, in order */
export function searchFuzzy(query: string, ...values: string[]): boolean
export function searchFuzzy(query: string, values: string[], options?: SearchOptions): boolean
export function searchFuzzy(query: string, ...args: SearchArgs): boolean {
  const { values, fold } = readSearchArgs(args)
  const terms = fold(query).split(WHITESPACE_RUN_REGEX).filter(Boolean)

  if (!terms.length)
    return true

  const haystacks = values.map(fold)

  return terms.every(term => haystacks.some(value => isSubsequence(term, value)))
}

/**
 * remove JavaScript/TypeScript/JSONC comments from code
 * handles single-line (//) and multi-line (/* *\/) comments while preserving string literals
 */
export function removeComments(content: string): string {
  const kept: string[] = []
  let runStart = 0
  let i = 0

  // a run of plain code is sliced whole when a comment starts or the input ends
  const endRun = () => kept.push(content.slice(runStart, i))

  while (i < content.length) {
    // skip strings to avoid removing // or /* inside them
    if (content[i] === '"' || content[i] === '\'' || content[i] === '`') {
      const quote = content[i]

      i++

      while (i < content.length && (content[i] !== quote || content[i - 1] === '\\')) {
        i++
      }

      i++

      continue
    }

    // multi-line comment
    if (content[i] === '/' && content[i + 1] === '*') {
      endRun()
      i += 2

      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
        i++
      }

      i += 2
      runStart = i

      continue
    }

    // single-line comment
    if (content[i] === '/' && content[i + 1] === '/') {
      endRun()

      while (i < content.length && content[i] !== '\n') {
        i++
      }

      runStart = i

      continue
    }

    i++
  }

  i = Math.min(i, content.length)
  endRun()

  return kept.join('')
}

export function escapeXml(unsafe: string): string {
  return unsafe.replace(XML_UNSAFE_REGEX, (char) => {
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

const BASE64_CHUNK = 0x2000
const BASE64URL_CHARS = /[-_]/g
const TRAILING_PADDING = /=+$/
const PLUS = /\+/g
const SLASH = /\//g

function asBytes(input: string | BufferSource): Uint8Array {
  if (typeof input === 'string')
    return utf8Encoder.encode(input)

  return ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : new Uint8Array(input)
}

/** Base64 of text's UTF-8 bytes, so any character encodes where `btoa` throws past Latin-1, or of bytes as they are; `url` gives the url-safe alphabet without padding. */
export function base64Encode(input: string | BufferSource, url = false): string {
  const bytes = asBytes(input)
  let binary = ''

  for (let i = 0; i < bytes.length; i += BASE64_CHUNK)
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))

  const encoded = btoa(binary)

  return url ? encoded.replace(PLUS, '-').replace(SLASH, '_').replace(TRAILING_PADDING, '') : encoded
}

/** The bytes behind base64, in either alphabet, with or without padding; throws when it is not base64. */
export function base64DecodeBytes(encoded: string): Uint8Array<ArrayBuffer> {
  const normal = encoded.replace(WHITESPACE_GLOBAL_REGEX, '').replace(BASE64URL_CHARS, char => (char === '-' ? '+' : '/'))
  const binary = atob(normal.padEnd(Math.ceil(normal.length / 4) * 4, '='))

  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i)

  return bytes
}

/** The UTF-8 text behind base64, in either alphabet, with or without padding; throws when it is not base64 or not UTF-8. */
export function base64Decode(encoded: string): string {
  return utf8StrictDecoder.decode(base64DecodeBytes(encoded))
}

/** Quotes a CSV field holding a quote, the delimiter or a line break, doubling its quotes. */
export function escapeCSV(value: string | number, delimiter = ','): string {
  const stringValue = String(value)

  if (!stringValue.includes('"') && !stringValue.includes(delimiter) && !stringValue.includes('\n') && !stringValue.includes('\r'))
    return stringValue

  return `"${stringValue.replaceAll('"', '""')}"`
}

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

export function commonPrefix(str1: string, str2: string): string {
  const length = commonPrefixLength(str1, str2)

  return str1.substring(0, length)
}

/** edits turning one string into the other, a swap of two neighbours counting as one edit like an insertion, deletion or substitution */
export function editDistance(str1: string, str2: string): number {
  // Spread so an astral character counts as one edit, not two halves.
  return distanceBetween([...str1], [...str2])
}

function distanceBetween(a: ArrayLike<string>, b: ArrayLike<string>): number {
  let beforePrevious = new Int32Array(b.length + 1)
  let previous = new Int32Array(b.length + 1)
  let current = new Int32Array(b.length + 1)

  for (let j = 0; j <= b.length; j++)
    previous[j] = j

  for (let i = 1; i <= a.length; i++) {
    current[0] = i

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1

      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost)

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        current[j] = Math.min(current[j]!, beforePrevious[j - 2]! + 1)
    }

    const recycled = beforePrevious

    beforePrevious = previous
    previous = current
    current = recycled
  }

  return previous[b.length]!
}

const SURROGATE_RE = /[\uD800-\uDFFF]/

/** the string itself when each UTF-16 unit is one character, else its code points */
function toComparable(str: string): ArrayLike<string> {
  return SURROGATE_RE.test(str) ? [...str] : str
}

export interface ClosestMatchOptions {
  /** Most edits a match may be away. Defaults to a third of the query, at least 1. */
  maxDistance?: number
  /** Tells `A` from `a`. Defaults to false, like `searchOne`. */
  caseSensitive?: boolean
}

/** the candidate nearest the query, for a "did you mean", or undefined when none is within `maxDistance` edits (a third of the query by default) */
export function closestMatch(query: string, candidates: Iterable<string>, maxDistanceOrOptions: number | ClosestMatchOptions = {}): string | undefined {
  const { maxDistance = Math.max(1, Math.floor([...query].length / 3)), caseSensitive = false } = typeof maxDistanceOrOptions === 'number' ? { maxDistance: maxDistanceOrOptions } : maxDistanceOrOptions
  const queryChars = toComparable(caseSensitive ? query : query.toLowerCase())

  let best: string | undefined
  let bestDistance = maxDistance + 1

  for (const original of candidates) {
    const candidate = caseSensitive ? original : original.toLowerCase()

    // the distance is at least the length difference, so a candidate that far off cannot win
    if (Math.abs(queryChars.length - candidate.length) >= bestDistance && !SURROGATE_RE.test(candidate))
      continue

    const distance = distanceBetween(queryChars, toComparable(candidate))

    if (distance < bestDistance) {
      best = original
      bestDistance = distance
    }
  }

  return best
}

export function getUUIDFromIri(iri: string): string | null {
  const match = UUID_REGEX.exec(iri)

  return match ? match[0] : null
}

/** A text progress bar; throws a RangeError for a NaN value, a non-finite bound or a `totalChars` that is not a non-negative integer, and clamps an infinite `value` into the range. */
export function renderProgressBar(value: number, min: number, max: number, { emptyChar = ' ', endChar = ']', fillChar = '=', startChar = '[', tipChar = '', totalChars = 40 } = {}) {
  if (Number.isNaN(value) || !Number.isFinite(min) || !Number.isFinite(max))
    throw new RangeError('renderProgressBar needs a numeric value and finite min and max')

  if (!Number.isInteger(totalChars) || totalChars < 0)
    throw new RangeError('renderProgressBar totalChars must be a non-negative integer')

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

// the -f and -fe words that do turn into -ves: `roof`, `chef` and `safe` take a plain -s
const F_TO_VES_REGEX = /(?:leaf|loaf|thief|wolf|half|calf|elf|sheaf|scarf|dwarf|hoof|wharf)$/
const FE_TO_VES_REGEX = /(?:knife|life|wife)$/

export interface PluralOptions {
  /** The plural form for a word the rules get wrong, like `children`. */
  plural?: string
  /** Whether a count of zero reads singular (`0 rule`, French style) or plural (`0 rules`). */
  zero?: 'singular' | 'plural'
}

/** handle common pluralization rules; zero reads singular unless `zero: 'plural'` */
export function plural(singular: string, count?: number, { plural: pluralForm, zero = 'singular' }: PluralOptions = {}): string {
  if (count === 1 || (count === 0 && zero === 'singular'))
    return singular

  if (pluralForm !== undefined)
    return pluralForm

  if (singular.endsWith('y') && !VOWEL_Y_ENDING_REGEX.test(singular))
    return `${singular.slice(0, -1)}ies`

  if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || singular.endsWith('ch') || singular.endsWith('sh'))
    return `${singular}es`

  if (F_TO_VES_REGEX.test(singular))
    return `${singular.slice(0, -1)}ves`

  return FE_TO_VES_REGEX.test(singular) ? `${singular.slice(0, -2)}ves` : `${singular}s`
}

/** `1 rule`, `3 rules`: a count and the word it agrees with; zero reads plural unless `zero: 'singular'` */
export function counted(count: number, singular: string, { zero = 'plural', ...options }: PluralOptions = {}): string {
  return `${count} ${plural(singular, count, { ...options, zero })}`
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
const HEX_PAIR_REGEX = /.{1,2}/g

export function minifyUUID(uuid: string): string {
  if (!STRICT_UUID_REGEX.test(uuid))
    throw new Error('Invalid UUID format')

  const hex = uuid.replaceAll('-', '')
  const bytes = new Uint8Array(hex.match(HEX_PAIR_REGEX)!.map(byte => Number.parseInt(byte, 16)))

  return base64Encode(bytes, true)
}

export function expandUUID(minified: string): string {
  if (!MINIFIED_REGEX.test(minified))
    throw new Error('Invalid minified format')

  const hex = Array.from(base64DecodeBytes(minified), byte => byte.toString(16).padStart(2, '0')).join('')

  if (hex.length !== 32)
    throw new Error('Invalid minified format')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function splitWords(str: string | string[]): string[] {
  if (Array.isArray(str))
    return str.map(s => s.toLowerCase())

  // Replace separators with space, then match all word segments. Unicode-aware throughout:
  // matching ASCII only would drop `Ünal` to `nal`, silently changing which letter starts the word.
  const normalized = str
    .replace(SEPARATORS_REGEX, ' ') // snake_case / kebab-case -> space
    .replace(CAMEL_BOUNDARY_REGEX, '$1 $2') // camelCase -> camel Case
    .replace(WHITESPACE_GLOBAL_REGEX, ' ') // collapse multiple spaces
    .trim()

  const words = normalized.match(WORDS_REGEX)

  return words ? words.map(w => w.toLocaleLowerCase()) : []
}

export type CaseType = 'kebab' | 'snake' | 'camel' | 'pascal' | 'constant' | 'title'

export function toCamel(input: string | string[]) {
  return splitWords(input).map((w, i) => i === 0 ? w : capitalize(w)).join('')
}

export function toKebab(input: string | string[]) {
  return splitWords(input).join('-')
}

export function toSnake(input: string | string[]) {
  return splitWords(input).join('_')
}

export function toPascal(input: string | string[]) {
  return splitWords(input).map(capitalize).join('')
}

export function toConstant(input: string | string[]) {
  return splitWords(input).map(w => w.toUpperCase()).join('_')
}

export function toTitle(input: string | string[]) {
  return splitWords(input).map(capitalize).join(' ')
}

export function getFrenchOrdinalSuffix(rank: string) {
  if (rank === '1')
    return 'er'

  return rank === '2' ? 'nd' : 'ème'
}

export interface TruncateOptions {
  /** Defaults to `...`. */
  suffix?: string
  /** Counts the suffix within `len`, so the result never exceeds it. Defaults to false. */
  includeSuffix?: boolean
  /** Cuts at the last whitespace before the limit, when there is one. Defaults to false. */
  wordBoundary?: boolean
}

const LAST_WHITESPACE_REGEX = /\s+\S*$/
const WHITESPACE_CHAR_REGEX = /\s/

/** Cuts `str` past `len` characters and appends the suffix; with `includeSuffix` the result never exceeds `len`, even when the suffix alone would. */
export function truncate(str: string, len: number, suffixOrOptions: string | TruncateOptions = '...'): string {
  const { suffix = '...', includeSuffix = false, wordBoundary = false } = typeof suffixOrOptions === 'string' ? { suffix: suffixOrOptions } : suffixOrOptions

  if (str.length <= len)
    return str

  const limit = Math.max(0, len)
  let cut = str.substring(0, Math.max(0, includeSuffix ? limit - suffix.length : limit))

  // A cut already followed by whitespace ends on a word; a single word longer than the limit is cut mid-word rather than emptied.
  if (wordBoundary && !WHITESPACE_CHAR_REGEX.test(str[cut.length] ?? ' '))
    cut = cut.replace(LAST_WHITESPACE_REGEX, '') || cut

  if (wordBoundary)
    cut = cut.trimEnd()

  return includeSuffix ? (cut + suffix).slice(0, limit) : cut + suffix
}

export function stripHtml(str: string): string {
  return str.replace(HTML_TAG_REGEX, '')
}

const TEMPLATE_VARIABLE_REGEX = /\{([^{}]+)\}/g

/** Replaces each `{key}` in one pass, so a value is inserted as is: its `$&` or `{other}` text is never read as a pattern or a variable. */
export function renderTemplate<T extends string>(str: T, variables: ExtractParams<T>): string {
  const values: Record<string, unknown> = variables

  return str.replace(TEMPLATE_VARIABLE_REGEX, (match, key: string) => Object.hasOwn(values, key) ? String(values[key]) : match)
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
  const prefixMatch = m.match(PHONE_PREFIX_REGEX)
  const prefix = prefixMatch ? prefixMatch[0] : ''
  const body = prefix ? m.slice(prefix.length) : m
  const d = body.replace(NON_DIGIT_GLOBAL_REGEX, '')
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
  const clean = m.replace(WHITESPACE_CHAR_GLOBAL_REGEX, '')
  const end = clean.length - 4
  let idx = 0

  return [...m].map(c => c === ' ' ? c : (i => i >= 4 && i < end ? char : c)(idx++)).join('')
}

function maskCreditCard(m: string, char: string): string {
  const digits = m.replace(NON_DIGIT_GLOBAL_REGEX, '')
  const masked = digits[0] + char.repeat(digits.length - 5) + digits.slice(-4)
  let i = 0

  return m.replace(DIGIT_GLOBAL_REGEX, () => masked[i++]!)
}

function maskJwt(m: string, char: string): string {
  const dot = m.indexOf('.')

  return `${m.slice(0, dot)}.${char.repeat(3)}.${char.repeat(3)}`
}

function maskBearer(m: string, char: string): string {
  const token = m.slice(m.search(WHITESPACE_CHAR_REGEX) + 1).trim()

  return `Bearer ${token.startsWith('eyJ') ? maskJwt(token, char) : char.repeat(3)}`
}

function maskUrlParam(m: string, char: string): string {
  const eq = m.indexOf('=')

  return `${m.slice(0, eq + 1)}${char.repeat(3)}`
}

function maskGitToken(m: string, char: string): string {
  const prefix = m.match(TOKEN_PREFIX_REGEX)?.[0] ?? m.slice(0, 7)

  return `${prefix}${char.repeat(3)}`
}

function maskMac(m: string, char: string): string {
  const groups = m.split(COLON_DASH_REGEX)

  return `${groups[0]}${char.repeat(2)} ${groups[2]}${char.repeat(2)} ${groups[4]}${char.repeat(2)}`
}

function maskPem(m: string, char: string): string {
  const lines = m.split('\n')

  return lines.map((line, i) => {
    return i === 0 || i === lines.length - 1 || line.trim() === '' ? line : char.repeat(line.length)
  }).join('\n')
}

function maskDbUrl(m: string, char: string): string {
  const at = m.indexOf('@')

  if (at === -1)
    return m

  const prefix = m.slice(0, at)
  const colon = prefix.lastIndexOf(':')

  return colon === -1 ? m : `${prefix.slice(0, colon + 1)}${char.repeat(3)}${m.slice(at)}`
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
      if (!HEX_GROUP_REGEX.test(g))
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
 * push all matches for a detector against the original string onto `out`.
 * returning `null` from the replacer drops the match (used for checksum validation).
 */
function collect(out: MaskMatch[], str: string, re: RegExp, replacer: (match: string) => string | null, key: MaskKey, priority: number): void {
  for (const m of str.matchAll(re)) {
    const replacement = replacer(m[0])

    if (replacement === null)
      continue

    out.push({
      start: m.index!,
      end: m.index! + m[0].length,
      key,
      original: m[0],
      priority,
      replacement,
    })
  }
}

/** drop overlapping matches; higher priority wins, first wins on ties */
function resolveOverlaps(matches: MaskMatch[]): MaskMatch[] {
  matches.sort((a, b) => a.start - b.start)

  const kept: MaskMatch[] = []

  for (const m of matches) {
    // kept is sorted and disjoint, so only its tail can reach back over m
    let tailStart = kept.length

    while (tailStart > 0 && kept[tailStart - 1]!.end > m.start)
      tailStart--

    let blocked = false

    for (let i = tailStart; i < kept.length; i++) {
      const k = kept[i]!

      if (k.start < m.end && k.priority >= m.priority) {
        blocked = true

        break
      }
    }

    if (blocked)
      continue

    let write = tailStart

    for (let i = tailStart; i < kept.length; i++) {
      const k = kept[i]!

      if (k.start >= m.end)
        kept[write++] = k
    }

    kept.length = write
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
    collect(matches, str, EMAIL_RE, applyMode(m => maskEmail(m, char)), 'email', 10)

  if (phone)
    collect(matches, str, PHONE_RE, applyMode(m => maskPhone(m, char)), 'phone', 20)

  if (ip) {
    collect(matches, str, IPV4_RE, applyMode(m => maskIp(m, char)), 'ip', 30)
    collect(matches, str, IPV6_RE, applyMode(m => isValidIpv6(m) ? maskIp(m, char) : null), 'ip', 31)
  }

  if (mac)
    collect(matches, str, MAC_RE, applyMode(m => maskMac(m, char)), 'mac', 35)

  if (iban) {
    collect(matches, str, IBAN_RE, applyMode((m) => {
      return ibanCheck(m.replace(WHITESPACE_CHAR_GLOBAL_REGEX, '')) ? maskIban(m, char) : null
    }), 'iban', 40)
  }

  if (creditCard) {
    collect(matches, str, CREDIT_CARD_RE, applyMode((m) => {
      return luhnCheck(m.replace(NON_DIGIT_GLOBAL_REGEX, '')) ? maskCreditCard(m, char) : null
    }), 'creditCard', 50)
  }

  if (gitToken)
    collect(matches, str, GIT_TOKEN_RE, applyMode(m => maskGitToken(m, char)), 'gitToken', 55)

  if (token) {
    collect(matches, str, JWT_RE, applyMode(m => maskJwt(m, char)), 'token', 60)
    collect(matches, str, BEARER_RE, applyMode(m => maskBearer(m, char)), 'token', 70)
  }

  if (url)
    collect(matches, str, URL_QUERY_RE, applyMode(m => maskUrlParam(m, char)), 'url', 80)

  if (dbUrl)
    collect(matches, str, DB_URL_RE, applyMode(m => maskDbUrl(m, char)), 'dbUrl', 82)

  if (pem)
    collect(matches, str, PEM_RE, applyMode(m => maskPem(m, char)), 'pem', 85)

  if (custom) {
    for (const { pattern, replacer } of custom) {
      collect(matches, str, pattern, applyMode(m => replacer(m)), 'custom', 90)
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
  const fallback = options.mode === 'redact' ? '[REDACTED]' : char.repeat(inner.length)
  const value = ranges.length ? result : fallback

  return quoted ? `${quote}${value}${quote}` : value
}

/**
 * strips a `.env` down to the keys it declares, keeping blank lines, comments and `export` prefixes.
 * `maskValues` keeps the values instead, run through `mask`. A commented-out assignment loses its value
 * like a live one, and a line that declares nothing at all is dropped rather than passed through.
 */
export function maskEnv(str: string, { maskValues = false, ...options }: MaskEnvOptions = {}): MaskEnvResult {
  const eol = str.includes('\r\n') ? '\r\n' : '\n'
  const lines = str.split(NEWLINE_REGEX)
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
      str = utf8StrictDecoder.decode(bytes.subarray(0, at))
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

/** Every line, blank ones included, with where it starts in `text`; the `\r` of a `\r\n` ending is left out of the line. A trailing newline ends the last line rather than starting an empty one. */
export function tokenizeLines(text: string): TextSpan[] {
  if (text === '')
    return []

  const spans: TextSpan[] = []
  let offset = 0

  const lines = text.split('\n')

  for (const [index, line] of lines.entries()) {
    // a \r right before a \n belongs to the line ending, so mixed endings compare equal
    spans.push({ text: index < lines.length - 1 && line.endsWith('\r') ? line.slice(0, -1) : line, offset })
    offset += line.length + 1
  }

  if (spans.length > 1 && spans.at(-1)!.text === '')
    spans.pop()

  return spans
}

const sentenceSegmenters = new Map<string, Intl.Segmenter>()

/** Sentences with where each starts, split by the locale's own rules rather than by punctuation. */
export function splitSentences(text: string, locale = 'en'): TextSpan[] {
  let segmenter = sentenceSegmenters.get(locale)

  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' })
    sentenceSegmenters.set(locale, segmenter)
  }

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
  const parts: string[][] = []
  // trimmed length and trailing whitespace of the last merged span, kept as spans join so its text is never re-trimmed
  let trimmed = 0
  let trailing = 0

  const flush = () => {
    if (merged.length)
      merged.at(-1)!.text = parts.at(-1)!.join('')
  }

  for (const span of spans) {
    const core = span.text.trimEnd().length
    const spanTrimmed = span.text.trim().length

    if (merged.length && trimmed < minLength) {
      parts.at(-1)!.push(span.text)

      if (spanTrimmed > 0) {
        // the previous trailing whitespace and this span's leading whitespace are now interior
        trimmed = trimmed > 0 ? trimmed + trailing + core : spanTrimmed
        trailing = span.text.length - core
      }
      else {
        trailing += span.text.length
      }

      continue
    }

    flush()
    merged.push({ ...span })
    parts.push([span.text])
    trimmed = spanTrimmed
    trailing = spanTrimmed > 0 ? span.text.length - core : span.text.length
  }

  flush()

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
