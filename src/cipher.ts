export interface Alphabet {
  /** The dictionary's characters in index order, one entry per code point so emoji count as one. */
  symbols: string[]
  /** How many symbols stand for one byte. */
  width: number
}

/** A dictionary's characters with repeats dropped, since a repeated symbol could not be decoded. */
export function uniqueSymbols(chars: string): string {
  return [...new Set(chars)].join('')
}

export function alphabetOf(chars: string): Alphabet {
  const symbols = [...uniqueSymbols(chars)]

  return { symbols, width: symbols.length < 2 ? 0 : Math.ceil(Math.log(256) / Math.log(symbols.length)) }
}

const utf8Encoder = new TextEncoder()
const utf8StrictDecoder = new TextDecoder('utf-8', { fatal: true })

const byteSymbols = new WeakMap<Alphabet, string[]>()
const symbolIndexes = new WeakMap<Alphabet, Map<number, number>>()

/** Every byte's `width` symbols, built once per alphabet. */
function symbolsOfBytes(alphabet: Alphabet): string[] {
  let table = byteSymbols.get(alphabet)

  if (table)
    return table

  const { symbols, width } = alphabet

  table = Array.from({ length: 256 }, (_, byte) => {
    let chunk = ''

    for (let digit = 0; digit < width; digit++) {
      chunk = (symbols[byte % symbols.length] ?? '') + chunk
      byte = Math.floor(byte / symbols.length)
    }

    return chunk
  })

  byteSymbols.set(alphabet, table)

  return table
}

/** Writes the text's UTF-8 bytes in the dictionary's base, every byte as `width` symbols. */
export function encodeCipher(text: string, alphabet: Alphabet): string {
  if (alphabet.width === 0)
    return ''

  const table = symbolsOfBytes(alphabet)

  let result = ''

  for (const byte of utf8Encoder.encode(text))
    result += table[byte]!

  return result
}

/** Reads text written by `encodeCipher` back, throwing with what is wrong when it was not. */
export function decodeCipher(encoded: string, alphabet: Alphabet): string {
  const { symbols, width } = alphabet

  if (width === 0)
    throw new Error('The dictionary needs at least two characters.')

  let length = 0

  for (let i = 0; i < encoded.length; i += encoded.codePointAt(i)! > 0xFFFF ? 2 : 1)
    length++

  if (length % width !== 0)
    throw new Error(`Its length is not a multiple of ${width}, so a character is missing or extra.`)

  let indexes = symbolIndexes.get(alphabet)

  if (!indexes) {
    indexes = new Map(symbols.map((symbol, index) => [symbol.codePointAt(0)!, index]))
    symbolIndexes.set(alphabet, indexes)
  }

  const bytes = new Uint8Array(length / width)

  let position = 0

  for (let byte = 0; byte < bytes.length; byte++) {
    let value = 0

    for (let digit = 0; digit < width; digit++) {
      const codePoint = encoded.codePointAt(position)!
      const index = indexes.get(codePoint)

      if (index === undefined)
        throw new Error(`"${String.fromCodePoint(codePoint)}" is not in this dictionary.`)

      position += codePoint > 0xFFFF ? 2 : 1
      value = value * symbols.length + index
    }

    if (value > 255)
      throw new Error('It holds a value no byte has, so it was written with another dictionary.')

    bytes[byte] = value
  }

  try {
    return utf8StrictDecoder.decode(bytes)
  }
  catch {
    throw new Error('It decodes to bytes that are not text, so it was written with another dictionary.')
  }
}
