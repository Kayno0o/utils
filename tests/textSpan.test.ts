import { describe, expect, test as it } from 'bun:test'
import { excerptAround, mergeSpans, splitSentences, trimSpan } from '../src'

describe('splitSentences', () => {
  it('records where each sentence starts', () => {
    expect(splitSentences('Hi team. I finished it.')).toEqual([
      { text: 'Hi team. ', offset: 0 },
      { text: 'I finished it.', offset: 9 },
    ])
  })

  it('splits by the locale rules', () => {
    const sentences = splitSentences('Bonjour. Ça marche ? Oui !', 'fr')

    expect(sentences.map(s => s.text.trim())).toEqual(['Bonjour.', 'Ça marche ?', 'Oui !'])
  })

  it('covers the whole input', () => {
    const text = 'One. Two. Three.'

    expect(splitSentences(text).map(s => s.text).join('')).toBe(text)
  })
})

describe('mergeSpans', () => {
  it('joins spans until each reaches the minimum', () => {
    const merged = mergeSpans(splitSentences('One. Two. Three. Four.'), 12)

    expect(merged).toEqual([
      { text: 'One. Two. Three. ', offset: 0 },
      { text: 'Four.', offset: 17 },
    ])
  })

  it('leaves spans that are already long enough', () => {
    const spans = [{ text: 'a'.repeat(20), offset: 0 }, { text: 'b'.repeat(20), offset: 20 }]

    expect(mergeSpans(spans, 5)).toEqual(spans)
  })

  it('does not mutate the input', () => {
    const spans = [{ text: 'a', offset: 0 }, { text: 'b', offset: 1 }]

    mergeSpans(spans, 10)

    expect(spans).toEqual([{ text: 'a', offset: 0 }, { text: 'b', offset: 1 }])
  })

  it('handles an empty list', () => {
    expect(mergeSpans([], 10)).toEqual([])
  })
})

describe('trimSpan', () => {
  it('excludes the surrounding whitespace', () => {
    expect(trimSpan({ text: 'One. ', offset: 0 })).toEqual([0, 4])
    expect(trimSpan({ text: '  hi  ', offset: 10 })).toEqual([12, 14])
  })

  it('returns null for a span holding only whitespace', () => {
    expect(trimSpan({ text: '   ', offset: 5 })).toBeNull()
  })
})

describe('excerptAround', () => {
  it('returns the whole text when it fits', () => {
    const excerpt = excerptAround('Their is a problem.', 0, 5)

    expect(excerpt.text).toBe('Their is a problem.')
    expect(excerpt.offset).toBe(0)
  })

  it('offsets into the excerpt, counting the ellipsis', () => {
    const text = `${'padding word '.repeat(10)}Their is a problem.`
    const at = text.indexOf('Their')
    const excerpt = excerptAround(text, at, 5)

    expect(excerpt.text.slice(excerpt.offset, excerpt.offset + excerpt.length)).toBe('Their')
    expect(excerpt.text.startsWith('...')).toBe(true)
  })

  it('honours the radius', () => {
    const text = `${'x'.repeat(100)}ERR${'y'.repeat(100)}`
    const excerpt = excerptAround(text, 100, 3, { radius: 5 })

    expect(excerpt.text).toBe('...xxxxxERRyyyyy...')
    expect(excerpt.text.slice(excerpt.offset, excerpt.offset + excerpt.length)).toBe('ERR')
  })

  it('takes a custom ellipsis', () => {
    const text = `${'x'.repeat(50)}ERR`
    const excerpt = excerptAround(text, 50, 3, { radius: 5, ellipsis: '…' })

    expect(excerpt.text).toBe('…xxxxxERR')
    expect(excerpt.text.slice(excerpt.offset, excerpt.offset + excerpt.length)).toBe('ERR')
  })
})
