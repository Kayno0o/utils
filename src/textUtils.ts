import { getRandomElement } from './arrayUtils'
import { randomInt } from './numberUtils'

const wordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number, charset = wordChars, isCrypto = false): string {
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
export function slugify(str: string, options?: {
  deduplicate?: boolean
  lower?: boolean
  replace?: string
  trim?: boolean
}): string {
  const replace = options?.replace ?? '-'
  const regexReplace = escapeRegExp(replace)

  let result = normalizeAccents(str)
    .replace(/[^A-Z0-9-]/gi, replace)

  if (options?.deduplicate ?? true)
    result = result.replace(new RegExp(`${regexReplace}+`, 'g'), replace)

  if (options?.lower ?? true)
    result = result.toLowerCase()

  if (options?.trim ?? true)
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

export const LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'proin', 'ultricies', 'sed', 'dui', 'scelerisque', 'donec', 'pellentesque', 'diam', 'vel', 'ligula', 'efficitur']

export interface LoremOptionType {
  isCrypto?: boolean
  length?: number
  type?: 'word' | 'sentence' | 'paragraph'
}

export function randomText({ isCrypto = false, length = 5, type = 'paragraph' }: LoremOptionType = {}, words = LOREM_WORDS): string {
  length = Math.max(1, length)

  const rWord = () => getRandomElement(words, isCrypto)
  const rSentence = () => {
    const count = randomInt(5, 15, isCrypto)
    let sentence = rWord()
    for (let i = 1; i < count; i++)
      sentence += (i < count - 1 && Math.random() < 0.1) ? ` ${rWord()},` : ` ${rWord()}`

    sentence += '.'
    return firstUpper(sentence)
  }
  const rParagraph = () => {
    const count = randomInt(3, 7, isCrypto)
    let paragraph = rSentence()
    for (let i = 1; i < count; i++)
      paragraph += ` ${rSentence()}`
    return paragraph
  }

  return Array.from({ length }, () => {
    switch (type) {
      case 'word': return rWord()
      case 'sentence': return rSentence()
      case 'paragraph': default: return rParagraph()
    }
  }).join(type === 'word' ? ' ' : '\n')
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
      case '"': return '&quot;'
      default: return char
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

export function getUuidFromIri(iri: string): string | null {
  const match = iri.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return match ? match[0] : null
}

const uuidV4Template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'

export function uuidV4(isCrypto = false): string {
  return uuidV4Template.replace(/[xy]/g, (c) => {
    const r = randomInt(0, 16, isCrypto)
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
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
