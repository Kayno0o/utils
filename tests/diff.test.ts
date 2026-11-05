import { describe, expect, test as it } from 'bun:test'
import { diffLines, diffTokens, diffWords, tokenizeLines, tokenizeWords } from '../src'

function apply(source: string, edits: { offset: number, length: number, replacement: string }[]): string {
  let out = source

  for (const edit of [...edits].sort((a, b) => b.offset - a.offset))
    out = out.slice(0, edit.offset) + edit.replacement + out.slice(edit.offset + edit.length)

  return out
}

describe('tokenizeWords', () => {
  it('records where every word starts', () => {
    expect(tokenizeWords('a bc  def')).toEqual([
      { text: 'a', offset: 0 },
      { text: 'bc', offset: 2 },
      { text: 'def', offset: 6 },
    ])
  })

  it('returns nothing for whitespace', () => {
    expect(tokenizeWords('   ')).toEqual([])
  })
})

describe('tokenizeLines', () => {
  it('records where every line starts, blank ones included', () => {
    expect(tokenizeLines('a\n\nbc')).toEqual([
      { text: 'a', offset: 0 },
      { text: '', offset: 2 },
      { text: 'bc', offset: 3 },
    ])
  })

  it('reads a trailing newline as the end of the last line', () => {
    expect(tokenizeLines('a\nb\n')).toEqual([
      { text: 'a', offset: 0 },
      { text: 'b', offset: 2 },
    ])
  })

  it('returns nothing for an empty string', () => {
    expect(tokenizeLines('')).toEqual([])
  })
})

describe('diffLines', () => {
  it('finds nothing in identical text', () => {
    expect(diffLines('one\ntwo', 'one\ntwo')).toEqual([])
  })

  it('reports the changed lines only', () => {
    expect(diffLines('a\nx\nd', 'a\np\nd')).toEqual([{ aStart: 1, aEnd: 2, bStart: 1, bEnd: 2 }])
  })

  it('reports an appended line', () => {
    expect(diffLines('a\nb', 'a\nb\nc')).toEqual([{ aStart: 2, aEnd: 2, bStart: 2, bEnd: 3 }])
  })

  it('reads writing into an empty body as a pure insert', () => {
    expect(diffLines('', 'first\nsecond')).toEqual([{ aStart: 0, aEnd: 0, bStart: 0, bEnd: 2 }])
  })
})

describe('tokenizeLines with mixed endings', () => {
  it('leaves the \\r of a \\r\\n ending out of the line and keeps offsets over the raw text', () => {
    expect(tokenizeLines('a\r\nb\nc\r\n')).toEqual([
      { text: 'a', offset: 0 },
      { text: 'b', offset: 3 },
      { text: 'c', offset: 5 },
    ])
  })

  it('keeps a lone \\r that is not part of a \\r\\n ending', () => {
    expect(tokenizeLines('a\rb\nc\r').map(span => span.text)).toEqual(['a\rb', 'c\r'])
  })

  it('diffLines finds no change between CRLF and LF text', () => {
    expect(diffLines('a\r\nb\r\nc', 'a\nb\nc')).toEqual([])
    expect(diffLines('a\r\nb\nc\r\n', 'a\nB\nc\n')).toEqual([{ aStart: 1, aEnd: 2, bStart: 1, bEnd: 2 }])
  })
})

describe('diffTokens size guard', () => {
  it('throws a RangeError past maxCells, counting the table including its border row and column', () => {
    const a = tokenizeWords('a b c')
    const b = tokenizeWords('a b d')

    expect(() => diffTokens(a, b, { maxCells: 15 })).toThrow(RangeError)
    expect(diffTokens(a, b, { maxCells: 16 })).toEqual([{ aStart: 2, aEnd: 3, bStart: 2, bEnd: 3 }])
  })

  it('guards diffLines too, and allows ordinary text under the default limit', () => {
    expect(() => diffLines('a\nb', 'a\nc', { maxCells: 1 })).toThrow(RangeError)

    const text = Array.from({ length: 1000 }, (_, i) => `line ${i}`).join('\n')

    expect(diffLines(text, text)).toEqual([])
  })

  it('refuses a table over the default limit before allocating it', () => {
    const big = Array.from({ length: 6000 }, (_, i) => ({ text: String(i), offset: i }))

    expect(() => diffTokens(big, big)).toThrow(RangeError)
  })
})

describe('diffTokens', () => {
  it('finds nothing in identical sequences', () => {
    expect(diffTokens(tokenizeWords('one two three'), tokenizeWords('one two three'))).toEqual([])
  })

  it('groups consecutive changes into one hunk', () => {
    expect(diffTokens(tokenizeWords('a x y d'), tokenizeWords('a p q d'))).toEqual([{ aStart: 1, aEnd: 3, bStart: 1, bEnd: 3 }])
  })

  it('reports a pure append', () => {
    expect(diffTokens(tokenizeWords('a b'), tokenizeWords('a b c'))).toEqual([{ aStart: 2, aEnd: 2, bStart: 2, bEnd: 3 }])
  })
})

describe('diffWords', () => {
  const cases: [string, string, string][] = [
    ['substitution', 'Their is a problem.', 'There is a problem.'],
    ['two separate spans', 'Their is to many bugs.', 'There are too many bugs.'],
    ['accent only', 'Ou est-ce que tu as mis les cles ?', 'Où est-ce que tu as mis les clés ?'],
    ['deletion', 'this is more better now', 'this is better now'],
    ['insertion', 'je crois pas', 'je ne crois pas'],
    ['leading insertion', 'crois pas du tout', 'je crois pas du tout'],
    ['trailing insertion', 'one two', 'one two three'],
    ['multi-word replacement', 'I should of checked it', 'I should have checked it'],
    ['no change', 'nothing to fix here', 'nothing to fix here'],
    ['everything replaced', 'aaa bbb', 'ccc ddd'],
    ['empty source', '', 'now it has words'],
    ['emptied', 'some words here', ''],
  ]

  for (const [name, source, corrected] of cases) {
    it(`round-trips a ${name}`, () => {
      expect(apply(source, diffWords(source, corrected))).toBe(corrected)
    })
  }

  it('never emits a zero-length edit while the source has a word to anchor on', () => {
    for (const [, source, corrected] of cases) {
      if (!source.trim())
        continue

      for (const edit of diffWords(source, corrected))
        expect(edit.length).toBeGreaterThan(0)
    }
  })

  it('covers the whole source when there is no word to anchor on', () => {
    expect(diffWords('', 'now it has words')).toEqual([{ offset: 0, length: 0, replacement: 'now it has words' }])
    expect(diffWords('   ', 'hi')).toEqual([{ offset: 0, length: 3, replacement: 'hi' }])
    expect(diffWords('   ', '   ')).toEqual([])
  })

  it('keeps every edit inside the source', () => {
    for (const [, source, corrected] of cases) {
      for (const edit of diffWords(source, corrected)) {
        expect(edit.offset).toBeGreaterThanOrEqual(0)
        expect(edit.offset + edit.length).toBeLessThanOrEqual(source.length)
      }
    }
  })

  it('points an edit at the word it replaces', () => {
    const source = 'Their is a problem.'
    const edit = diffWords(source, 'There is a problem.')[0]!

    expect(source.slice(edit.offset, edit.offset + edit.length)).toBe('Their')
    expect(edit.replacement).toBe('There')
  })

  it('swallows the space before a deletion', () => {
    const source = 'this is more better now'
    const edit = diffWords(source, 'this is better now')[0]!

    expect(source.slice(edit.offset, edit.offset + edit.length)).toBe(' more')
    expect(edit.replacement).toBe('')
  })
})
