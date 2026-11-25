import type { RandomSource } from './number'
import type { ExtractParams } from './types'
import { base64DecodeBytes, base64Encode } from './encoding'
import { getOrCreateCapped, stripAccents } from './internal'
import { randomInt } from './number'
import { STRICT_UUID_REGEX, UUID_REGEX } from './regex'

export * from './encoding'
export * from './mask'
export * from './search'
export * from './spans'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** `length` characters of `charset` read by code point, each drawn from `random`; pass `cryptoRandom` for secrets, whose 53 bits keep the bias below charset size / 2^53. */
export function randomString(length: number, charset?: string, random: RandomSource = Math.random): string {
  const chars = Array.from(charset || wordChars)
  let result = ''

  for (let i = 0; i < length; i++)
    result += chars[randomInt(0, chars.length, random)]

  return result
}

const REGEX_SPECIALS_REGEX = /[.*+?^${}()|[\]\\]/g
const XML_UNSAFE_REGEX = /[<>&'"]/g
const VOWEL_Y_ENDING_REGEX = /[aeiou]y$/
const SEPARATORS_REGEX = /[_-]+/g
const CAMEL_BOUNDARY_REGEX = /(\p{Ll})(\p{Lu})/gu
const WHITESPACE_GLOBAL_REGEX = /\s+/g
const WORDS_REGEX = /[\p{L}\p{N}]+/gu
const HTML_TAG_REGEX = /<[^>]+>/g

/** remove accents and diacritics */
export function normalizeAccents(str: string): string {
  return stripAccents(str)
}

/** Lowercased with accents stripped, so `Élodie` and `elodie` compare equal in a search. */
export function foldText(str: string): string {
  return normalizeAccents(str.toLowerCase())
}

/** Every run of whitespace turned into one space, the ends trimmed. */
export function collapseWhitespace(str: string): string {
  return str.replace(WHITESPACE_GLOBAL_REGEX, ' ').trim()
}

export function escapeRegExp(str: string) {
  return str.replace(REGEX_SPECIALS_REGEX, '\\$&')
}

const SLUG_INVALID_RE = /[^A-Z0-9-]/gi
const slugRegexes = new Map<string, { deduplicate: RegExp, trim: RegExp }>()

function getSlugRegexes(replace: string) {
  return getOrCreateCapped(slugRegexes, replace, () => {
    const escaped = escapeRegExp(replace)

    return { deduplicate: new RegExp(`${escaped}+`, 'g'), trim: new RegExp(`^${escaped}*|${escaped}*$`, 'g') }
  })
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

/** Quotes a CSV field holding a quote, the delimiter or a line break, doubling its quotes. */
export function escapeCSV(value: string | number, delimiter = ','): string {
  const stringValue = String(value)

  if (!stringValue.includes('"') && !stringValue.includes(delimiter) && !stringValue.includes('\n') && !stringValue.includes('\r'))
    return stringValue

  return `"${stringValue.replaceAll('"', '""')}"`
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
