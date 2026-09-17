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

/** Writes the text's UTF-8 bytes in the dictionary's base, every byte as `width` symbols. */
export function encodeCipher(text: string, { symbols, width }: Alphabet): string {
  if (width === 0)
    return ''

  let result = ''

  for (let byte of new TextEncoder().encode(text)) {
    const chunk: string[] = []

    for (let digit = 0; digit < width; digit++) {
      chunk.unshift(symbols[byte % symbols.length] ?? '')
      byte = Math.floor(byte / symbols.length)
    }

    result += chunk.join('')
  }

  return result
}

/** Reads text written by `encodeCipher` back, throwing with what is wrong when it was not. */
export function decodeCipher(encoded: string, { symbols, width }: Alphabet): string {
  if (width === 0)
    throw new Error('The dictionary needs at least two characters.')

  const chars = [...encoded]

  if (chars.length % width !== 0)
    throw new Error(`Its length is not a multiple of ${width}, so a character is missing or extra.`)

  const indexes = new Map(symbols.map((symbol, index) => [symbol, index]))
  const bytes = new Uint8Array(chars.length / width)

  for (let start = 0; start < chars.length; start += width) {
    let value = 0

    for (const char of chars.slice(start, start + width)) {
      const index = indexes.get(char)

      if (index === undefined)
        throw new Error(`"${char}" is not in this dictionary.`)

      value = value * symbols.length + index
    }

    if (value > 255)
      throw new Error('It holds a value no byte has, so it was written with another dictionary.')

    bytes[start / width] = value
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  catch {
    throw new Error('It decodes to bytes that are not text, so it was written with another dictionary.')
  }
}
