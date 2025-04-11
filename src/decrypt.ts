const A_CODE = 65
const ALPHABET_LENGTH = 26

export function decryptCaesar(input: string, shift: number) {
  return input.split('').map((c) => {
    const x = c.charCodeAt(0)
    return (x >= A_CODE && x < A_CODE + ALPHABET_LENGTH)
      ? String.fromCharCode(A_CODE + (x - A_CODE + shift) % ALPHABET_LENGTH)
      : c
  }).join('')
}

export function decryptVigenere(input: string, key: string, shift = 0) {
  let output = ''
  let keyIndex = 0

  for (const c of input) {
    const x = c.charCodeAt(0)

    if (x >= A_CODE && x < A_CODE + ALPHABET_LENGTH) {
      const keyChar = key[keyIndex % key.length]
      const keyShift = keyChar.charCodeAt(0) - A_CODE
      const shifted = (x - A_CODE + keyShift + shift) % ALPHABET_LENGTH
      output += String.fromCharCode(A_CODE + shifted)
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
    if (/\s/.test(c)) {
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
