const A_CODE = 65
const LOWER_A_CODE = 97
const ALPHABET_LENGTH = 26
const WHITESPACE_CHAR_REGEX = /\s/

/** Shifts a Latin letter by `shift` places, any sign, keeping its case; anything else is returned as is. */
function shiftLetter(c: string, shift: number): string {
  const x = c.charCodeAt(0)
  const base = x >= A_CODE && x < A_CODE + ALPHABET_LENGTH ? A_CODE : x >= LOWER_A_CODE && x < LOWER_A_CODE + ALPHABET_LENGTH ? LOWER_A_CODE : undefined

  if (base === undefined)
    return c

  return String.fromCharCode(base + ((((x - base + shift) % ALPHABET_LENGTH) + ALPHABET_LENGTH) % ALPHABET_LENGTH))
}

function isLetter(c: string): boolean {
  return shiftLetter(c, 1) !== c
}

export function decryptCaesar(input: string, shift: number) {
  return Array.from(input, c => shiftLetter(c, shift)).join('')
}

export function decryptVigenere(input: string, key: string, shift = 0) {
  const keyShifts = Array.from(key.toUpperCase(), c => c.charCodeAt(0) - A_CODE).filter(n => n >= 0 && n < ALPHABET_LENGTH)

  if (!keyShifts.length)
    throw new RangeError('decryptVigenere needs a key holding at least one letter')

  let output = ''
  let keyIndex = 0

  for (const c of input) {
    if (isLetter(c)) {
      output += shiftLetter(c, keyShifts[keyIndex % keyShifts.length]! + shift)
      keyIndex++
    }
    else {
      output += c
    }
  }

  return output
}

export function decryptMonoalphabet(input: string, alphabet: Record<string, string>): string {
  let output = ''

  for (const c of input) {
    if (WHITESPACE_CHAR_REGEX.test(c)) {
      output += c

      continue
    }

    if (!(c in alphabet)) {
      output += c

      continue
    }

    output += alphabet[c]
  }

  return output
}
