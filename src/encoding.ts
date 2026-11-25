import { utf8Encoder, utf8StrictDecoder } from './internal'

const BASE64_CHUNK = 0x2000
const BASE64URL_CHARS = /[-_]/g
const TRAILING_PADDING = /=+$/
const PLUS = /\+/g
const SLASH = /\//g
const WHITESPACE_GLOBAL_REGEX = /\s+/g

function asBytes(input: string | BufferSource): Uint8Array {
  if (typeof input === 'string')
    return utf8Encoder.encode(input)

  return ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : new Uint8Array(input)
}

/** The parts joined in order into one array. */
export function concatBytes(parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0))
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
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
