import { describe, expect, test as it } from 'bun:test'
import { base64Decode, base64Encode, closestMatch, editDistance, mergeSpans, parseCsv, removeComments, stringifyCsv } from '../src'

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
