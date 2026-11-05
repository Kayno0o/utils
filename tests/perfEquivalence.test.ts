import { describe, expect, test as it } from 'bun:test'
import { alphabetOf, base64Decode, base64Encode, closestMatch, decodeCipher, editDistance, encodeCipher, isHoliday, mask, median, mergeSpans, parseCsv, percentile, percentiles, removeComments, stringifyCsv } from '../src'

describe('mergeSpans trimmed length bookkeeping', () => {
  const naive = (spans: { text: string, offset: number }[], min: number) => {
    const merged: { text: string, offset: number }[] = []

    for (const span of spans) {
      const last = merged.at(-1)

      if (last && last.text.trim().length < min)
        last.text += span.text
      else
        merged.push({ ...span })
    }

    return merged
  }

  it('matches a re-trimming merge on whitespace-heavy spans', () => {
    const pieces = ['  ', 'ab', ' cd ', '\n', 'e', '   ', 'fgh. ', ' ', 'i']
    const spans = pieces.map((text, i) => ({ text, offset: i * 10 }))

    for (const min of [0, 1, 2, 3, 5, 8, 100])
      expect(mergeSpans(spans, min)).toEqual(naive(spans, min))
  })
})

describe('base64 round trip', () => {
  it('handles large and multi-byte text', () => {
    const text = `héllo wörld ✓ 😀 ${'x'.repeat(50000)}`

    expect(base64Decode(base64Encode(text))).toBe(text)
    expect(base64Decode(base64Encode(text, true))).toBe(text)
    expect(base64Encode('hi')).toBe('aGk=')
  })
})

describe('removeComments', () => {
  it('keeps strings and drops comments, including unterminated ones', () => {
    expect(removeComments('a // x\nb /* y */ c "// k" `/* m */`')).toBe('a \nb  c "// k" `/* m */`')
    expect(removeComments('a /* open')).toBe('a ')
    expect(removeComments('a "open')).toBe('a "open')
  })
})

describe('closestMatch and editDistance', () => {
  it('finds the nearest candidate and counts a swap as one edit', () => {
    expect(editDistance('ab', 'ba')).toBe(1)
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(closestMatch('colr', ['color', 'cloud', 'zzzz'])).toBe('color')
  })
})

describe('csv quoting and separators', () => {
  it('parses quoted fields, escaped quotes, CRLF and multi-char separators', () => {
    expect(parseCsv('a,b\r\n"x,1","he said ""hi"""\r\n')).toEqual([{ a: 'x,1', b: 'he said "hi"' }])
    expect(parseCsv('a::b\n1::2', { separator: '::' })).toEqual([{ a: '1', b: '2' }])
    expect(parseCsv('a,b\n"multi\nline",2')).toEqual([{ a: 'multi\nline', b: '2' }])
  })

  it('round trips through stringifyCsv', () => {
    const rows = [{ a: 'x,1', b: 'say "hi"' }, { a: 'plain', b: 'two\nlines' }]

    expect(parseCsv(stringifyCsv(rows))).toEqual(rows)
  })
})

describe('closestMatch astral and length cutoff', () => {
  it('compares code points and skips candidates too far in length', () => {
    expect(closestMatch('😀a', ['😀b', 'zzzzzz', '😀a😀😀😀'])).toBe('😀b')
    expect(closestMatch('abc', ['abcdefghij', 'xyz'])).toBeUndefined()
    expect(closestMatch('kitten', ['sitting', 'kitchen', 'mitten'])).toBe('mitten')
  })
})

describe('cipher round trip', () => {
  it('survives emoji and hex alphabets and multi-byte text', () => {
    const text = 'héllo ✓ 😀'

    for (const chars of ['0123456789abcdef', '😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗', 'ab']) {
      const alphabet = alphabetOf(chars)

      expect(decodeCipher(encodeCipher(text, alphabet), alphabet)).toBe(text)
    }

    expect(() => decodeCipher('zz', alphabetOf('0123456789abcdef'))).toThrow('"z" is not in this dictionary.')
    expect(() => decodeCipher('abc', alphabetOf('0123456789abcdef'))).toThrow('multiple of 2')
  })
})

describe('holidays and percentiles', () => {
  it('flags the same days and keeps the same ranks', () => {
    expect(isHoliday('2024-04-01')).toBe(true)
    expect(isHoliday('2024-04-02')).toBe(false)
    expect(isHoliday(new Date(2025, 11, 25))).toBe(true)
    expect(median([5, 1, 3, 2])).toBe(2.5)
    expect(percentile([4, 1, 3, 2], 50)).toBe(2.5)
    expect(percentiles([10, -2, 7], [0, 100])).toEqual([-2, 10])
  })
})

describe('mask overlap resolution', () => {
  it('keeps the higher priority match over an overlapping one', () => {
    const result = mask('mail jean@example.com and https://x.io/?token=abcdef1234567890 end')

    expect(result.result).not.toContain('jean@')
    expect(result.result).not.toContain('abcdef1234567890')
  })
})
